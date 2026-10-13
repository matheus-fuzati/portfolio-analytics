locals {
  # plan: só leitura, pra rodar `terraform plan`
  plan_roles = [
    "roles/browser",
    "roles/run.viewer",
    "roles/artifactregistry.reader",
    "roles/iam.serviceAccountViewer",
    "roles/iam.roleViewer",
    "roles/bigquery.metadataViewer",
  ]

  # apply: cria a infra dos environments (Cloud Run, IAM, SA de runtime)
  apply_roles = [
    "roles/run.admin",
    "roles/artifactregistry.admin",
    "roles/iam.serviceAccountAdmin",
    "roles/iam.serviceAccountUser",
    "roles/resourcemanager.projectIamAdmin",
    "roles/bigquery.admin",
    "roles/serviceusage.serviceUsageConsumer",
  ]
}

resource "google_project_iam_member" "plan" {
  for_each = toset(local.plan_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.gh_plan.email}"
}

resource "google_project_iam_member" "apply" {
  for_each = toset(local.apply_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.gh_apply.email}"
}

resource "google_storage_bucket_iam_member" "plan_state" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.gh_plan.email}"
}

resource "google_storage_bucket_iam_member" "apply_state" {
  bucket = google_storage_bucket.tfstate.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.gh_apply.email}"
}
