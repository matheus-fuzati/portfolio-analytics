locals {
  apis = [
    "cloudresourcemanager.googleapis.com",
    "serviceusage.googleapis.com",
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "sts.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "bigquery.googleapis.com", # já habilitada (pipeline Dataform), mantida aqui por completude
  ]
}

resource "google_project_service" "this" {
  for_each           = toset(local.apis)
  service            = each.value
  disable_on_destroy = false
}
