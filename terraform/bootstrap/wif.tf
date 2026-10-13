# Workload Identity Federation para o GitHub Actions do matheusfuzati/portfolio-analytics.
# 1 pool, 2 providers: plan (read-only, qualquer ref) / apply (main + develop — fluxo de
# promoção branch -> deploy dev (develop) -> PR develop->main -> deploy prod (main)).

resource "google_iam_workload_identity_pool" "gh" {
  workload_identity_pool_id = "portfolio-analytics"
  display_name              = "portfolio-analytics GitHub"
  depends_on                = [google_project_service.this]
}

resource "google_iam_workload_identity_pool_provider" "plan" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gh.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-plan"
  display_name                       = "GitHub Actions - plan"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  attribute_condition = "assertion.repository == \"${var.github_repo}\""

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

resource "google_iam_workload_identity_pool_provider" "apply" {
  workload_identity_pool_id          = google_iam_workload_identity_pool.gh.workload_identity_pool_id
  workload_identity_pool_provider_id = "github-apply"
  display_name                       = "GH Actions apply (main+dev)"

  attribute_mapping = {
    "google.subject"       = "assertion.sub"
    "attribute.repository" = "assertion.repository"
    "attribute.ref"        = "assertion.ref"
  }
  # gate de branch vive aqui — um token de branch de PR nem consegue emitir por este
  # provider.
  attribute_condition = "assertion.repository == \"${var.github_repo}\" && (assertion.ref == \"refs/heads/main\" || assertion.ref == \"refs/heads/develop\")"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}
