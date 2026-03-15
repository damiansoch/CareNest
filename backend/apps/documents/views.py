import json

from django.db.models import Count, Sum
from django.http import HttpResponse
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsFamilyMember
from apps.seniors.models import Senior
from .models import Document, DocumentPage
from .serializers import DocumentDetailSerializer, DocumentListSerializer

MAX_PAGE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB per page
MAX_PAGES_PER_DOC = 50


# ── Queryset helpers ──────────────────────────────────────────────────────────

def _annotated_qs(qs):
    """Annotate with page_count and total_size_bytes in a single SQL query."""
    return qs.annotate(
        page_count=Count("pages", distinct=True),
        total_size_bytes=Sum("pages__file_size"),
    )


def _detect_mime(content: bytes) -> str:
    """Detect MIME type from magic bytes (safer than trusting file extensions)."""
    if content[:4] == b"%PDF":
        return "application/pdf"
    if content[:2] in (b"\xff\xd8",) or content[:4] in (b"\xff\xe0\x00\x10", b"\xff\xe1"):
        return "image/jpeg"
    # More robust JPEG check
    if len(content) >= 2 and content[0] == 0xFF and content[1] == 0xD8:
        return "image/jpeg"
    if content[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    return "application/octet-stream"


# ── Views ─────────────────────────────────────────────────────────────────────

class DocumentListCreateView(generics.ListAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = DocumentListSerializer

    def _get_senior(self):
        family = self.request.user.membership.family
        return Senior.objects.get(pk=self.kwargs["senior_id"], family=family)

    def get_queryset(self):
        senior = self._get_senior()
        qs = _annotated_qs(
            Document.objects
            .filter(senior=senior)
            .select_related("uploaded_by")
        )
        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        tags_raw = self.request.query_params.get("tags", "").strip()
        if tags_raw:
            tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
            qs = qs.filter(tags__contains=tags)  # PostgreSQL ArrayField @> operator

        ordering = self.request.query_params.get("ordering", "-created_at")
        allowed = {"-created_at", "created_at", "name", "-name", "category", "-category"}
        if ordering in allowed:
            qs = qs.order_by(ordering)

        return qs

    def post(self, request, *args, **kwargs):
        """Handle multipart document upload with one or more page files."""
        senior = self._get_senior()

        # ── Validate files ──────────────────────────────────────────────────
        files = request.FILES.getlist("pages")
        if not files:
            return Response({"pages": ["At least one page is required."]}, status=400)
        if len(files) > MAX_PAGES_PER_DOC:
            return Response({"pages": [f"Maximum {MAX_PAGES_PER_DOC} pages per document."]}, status=400)

        validated_pages: list[tuple[bytes, str, int]] = []
        for f in files:
            if f.size > MAX_PAGE_SIZE_BYTES:
                return Response(
                    {"pages": [f'File "{f.name}" exceeds the 10 MB per-page limit.']},
                    status=400,
                )
            raw = f.read()
            mime = _detect_mime(raw)
            if mime not in DocumentPage.ALLOWED_MIME_TYPES:
                return Response(
                    {"pages": [f'File "{f.name}" is not a supported format. Use JPEG, PNG, or PDF.']},
                    status=400,
                )
            validated_pages.append((raw, mime, len(raw)))

        # ── Validate metadata ───────────────────────────────────────────────
        name = request.data.get("name", "").strip()
        if not name:
            return Response({"name": ["This field is required."]}, status=400)

        category = request.data.get("category", Document.Category.OTHER)
        valid_categories = {c[0] for c in Document.Category.choices}
        if category not in valid_categories:
            return Response({"category": [f'"{category}" is not a valid category.']}, status=400)

        tags_raw = request.data.get("tags", "[]")
        try:
            tags = json.loads(tags_raw) if isinstance(tags_raw, str) else list(tags_raw)
            if not isinstance(tags, list):
                raise ValueError
            tags = [str(t).strip()[:50] for t in tags if str(t).strip()]
        except (ValueError, TypeError):
            return Response({"tags": ["Must be a JSON array of strings."]}, status=400)

        # ── Create document and pages ───────────────────────────────────────
        doc = Document.objects.create(
            senior=senior,
            name=name,
            category=category,
            tags=tags,
            uploaded_by=request.user,
        )
        for idx, (raw, mime, size) in enumerate(validated_pages, start=1):
            DocumentPage.objects.create(
                document=doc,
                page_number=idx,
                mime_type=mime,
                file_size=size,
                content=raw,
            )

        # ── Send notification ───────────────────────────────────────────────
        from apps.notifications.tasks import dispatch_change_notification
        dispatch_change_notification.delay(
            actor_id=str(request.user.id),
            family_id=str(senior.family_id),
            event_type="document_uploaded",
            subject_name=name,
            senior_name=senior.full_name,
            detail_url=f"/pl/seniors/{senior.id}",
        )

        # Re-fetch with annotations to return accurate page_count / total_size_bytes
        doc_annotated = _annotated_qs(Document.objects.filter(pk=doc.pk)).first()
        return Response(
            DocumentListSerializer(doc_annotated).data,
            status=status.HTTP_201_CREATED,
        )


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsFamilyMember]
    serializer_class = DocumentDetailSerializer

    def _get_senior(self):
        family = self.request.user.membership.family
        return Senior.objects.get(pk=self.kwargs["senior_id"], family=family)

    def get_queryset(self):
        senior = self._get_senior()
        return _annotated_qs(
            Document.objects
            .filter(senior=senior)
            .select_related("uploaded_by")
            .prefetch_related("pages")
        )

    def update(self, request, *args, **kwargs):
        """Allow updating name, category, and tags only. Pages are immutable."""
        instance = self.get_object()
        allowed = {"name", "category", "tags"}
        data = {k: v for k, v in request.data.items() if k in allowed}

        if "tags" in data and isinstance(data["tags"], str):
            try:
                data["tags"] = json.loads(data["tags"])
            except (ValueError, TypeError):
                return Response({"tags": ["Must be a JSON array."]}, status=400)

        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Re-fetch with annotations
        updated = _annotated_qs(
            Document.objects
            .filter(pk=instance.pk)
            .select_related("uploaded_by")
            .prefetch_related("pages")
        ).first()
        return Response(DocumentDetailSerializer(updated).data)


class DocumentPageContentView(APIView):
    """
    Streams the raw binary content of a single document page.

    The binary is NEVER embedded in JSON responses — this dedicated endpoint
    is the only place where page content is read from the database.
    """
    permission_classes = [IsFamilyMember]

    def get(self, request, senior_id, doc_id, page_id):
        family = request.user.membership.family
        try:
            senior = Senior.objects.get(pk=senior_id, family=family)
            doc = Document.objects.get(pk=doc_id, senior=senior)
            page = DocumentPage.objects.get(pk=page_id, document=doc)
        except (Senior.DoesNotExist, Document.DoesNotExist, DocumentPage.DoesNotExist):
            from rest_framework.exceptions import NotFound
            raise NotFound()

        ext_map = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "application/pdf": "pdf",
        }
        ext = ext_map.get(page.mime_type, "bin")

        response = HttpResponse(bytes(page.content), content_type=page.mime_type)
        response["Content-Length"] = page.file_size
        response["Content-Disposition"] = f'inline; filename="page-{page.page_number}.{ext}"'
        response["Cache-Control"] = "private, max-age=3600"
        return response
