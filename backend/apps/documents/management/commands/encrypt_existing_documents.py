"""
Management command: encrypt_existing_documents

Encrypts any DocumentPage rows that were uploaded before encryption was
introduced (is_encrypted=False).  Safe to re-run; already-encrypted pages
are skipped.

Usage:
    docker compose exec backend python manage.py encrypt_existing_documents
    docker compose exec backend python manage.py encrypt_existing_documents --dry-run
"""

from django.core.management.base import BaseCommand

from apps.documents.encryption import encrypt_bytes
from apps.documents.models import DocumentPage


class Command(BaseCommand):
    help = "Encrypt all existing unencrypted document pages at rest."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Count affected pages without making any changes.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        qs = DocumentPage.objects.filter(is_encrypted=False)
        total = qs.count()

        if total == 0:
            self.stdout.write(self.style.SUCCESS("All pages are already encrypted. Nothing to do."))
            return

        self.stdout.write(f"Found {total} unencrypted page(s).")

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run — no changes made."))
            return

        encrypted_count = 0
        failed_count = 0

        for page in qs.iterator(chunk_size=50):
            try:
                raw = bytes(page.content)
                page.content = encrypt_bytes(raw)
                page.is_encrypted = True
                page.save(update_fields=["content", "is_encrypted"])
                encrypted_count += 1
                if encrypted_count % 50 == 0:
                    self.stdout.write(f"  Encrypted {encrypted_count}/{total}...")
            except Exception as exc:
                failed_count += 1
                self.stderr.write(
                    self.style.ERROR(f"  Failed page {page.pk} (doc {page.document_id}): {exc}")
                )

        self.stdout.write(
            self.style.SUCCESS(
                f"Done. Encrypted: {encrypted_count}  |  Failed: {failed_count}"
            )
        )
