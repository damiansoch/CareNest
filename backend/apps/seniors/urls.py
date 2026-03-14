from django.urls import path
from .views import SeniorDetailView, SeniorListCreateView

urlpatterns = [
    path("", SeniorListCreateView.as_view(), name="senior-list"),
    path("<uuid:pk>/", SeniorDetailView.as_view(), name="senior-detail"),
]
