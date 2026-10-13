# Repositório novo (diferente do billing-platform, que reaproveita um já existente no
# projeto compartilhado do hub) — projeto próprio, nada pra reaproveitar ainda.
resource "google_artifact_registry_repository" "apps" {
  location      = var.region
  repository_id = "apps"
  format        = "DOCKER"
  description   = "Imagens do painel de analytics (dev/prod)"

  depends_on = [google_project_service.this]
}
