locals {
  env = "dev"
}

module "api" {
  source = "../../modules/app_service"

  project_id = var.project_id
  region     = var.region
  env        = local.env

  name  = "portfolio-analytics"
  image = var.image

  # a app só precisa rodar query no BigQuery — leitura do dataset específico vem
  # do binding abaixo (dataset-scoped), não de um papel de projeto.
  runtime_project_roles = ["roles/bigquery.jobUser"]

  env_vars = {
    PORTFOLIO_ANALYTICS_GCP_PROJECT      = var.project_id
    PORTFOLIO_ANALYTICS_DATAFORM_DATASET = var.dataform_dataset
  }
}

# leitura escopada no dataset (não no projeto inteiro) — só isso que a SA de runtime precisa.
resource "google_bigquery_dataset_iam_member" "runtime_reads_dataform_dataset" {
  project    = var.project_id
  dataset_id = var.dataform_dataset
  role       = "roles/bigquery.dataViewer"
  member     = "serviceAccount:${module.api.runtime_sa_email}"
}
