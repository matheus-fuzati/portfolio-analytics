# ---- SAs de CI ----
resource "google_service_account" "gh_plan" {
  account_id   = "gh-plan-portfolio"
  display_name = "GitHub Actions - terraform plan (read-only)"
}

resource "google_service_account" "gh_apply" {
  account_id   = "gh-apply-portfolio"
  display_name = "GitHub Actions - terraform apply (main/develop)"
}

# ---- quem pode impersonar via WIF ----
resource "google_service_account_iam_member" "plan_wif" {
  service_account_id = google_service_account.gh_plan.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.gh.name}/attribute.repository/${var.github_repo}"
}

resource "google_service_account_iam_member" "apply_wif" {
  service_account_id = google_service_account.gh_apply.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/${google_iam_workload_identity_pool.gh.name}/attribute.repository/${var.github_repo}"
}
