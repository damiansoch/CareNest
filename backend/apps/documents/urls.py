from django.urls import path

from .views import DocumentDetailView, DocumentListCreateView, DocumentPageContentView

urlpatterns = [
    path("", DocumentListCreateView.as_view(), name="document-list-create"),
    path("<uuid:pk>/", DocumentDetailView.as_view(), name="document-detail"),
    path(
        "<uuid:doc_id>/pages/<uuid:page_id>/content/",
        DocumentPageContentView.as_view(),
        name="document-page-content",
    ),
]
