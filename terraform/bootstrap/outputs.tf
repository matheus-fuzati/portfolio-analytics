output "state_bucket" {
  value = google_storage_bucket.tfstate.name
}

output "wif_provider_plan" {
  value = google_iam_workload_identity_pool_provider.plan.name
}

output "wif_provider_apply" {
  value = google_iam_workload_identity_pool_provider.apply.name
}

output "sa_plan" {
  value = google_service_account.gh_plan.email
}

output "sa_apply" {
  value = google_service_account.gh_apply.email
}

output "artifact_registry" {
  value = google_artifact_registry_repository.apps.id
}

# cola no terminal para setar os secrets do GitHub
output "github_secrets_cmd" {
  value = <<-EOT
    gh secret set WIF_PROVIDER_PLAN  --repo ${var.github_repo} --body "${google_iam_workload_identity_pool_provider.plan.name}"
    gh secret set WIF_PROVIDER_APPLY --repo ${var.github_repo} --body "${google_iam_workload_identity_pool_provider.apply.name}"
    gh secret set WIF_SA_PLAN        --repo ${var.github_repo} --body "${google_service_account.gh_plan.email}"
    gh secret set WIF_SA_APPLY       --repo ${var.github_repo} --body "${google_service_account.gh_apply.email}"
  EOT
}
