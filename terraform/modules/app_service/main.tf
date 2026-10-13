terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 6.0"
    }
  }
}

locals {
  service_name = "${var.name}-${var.env}" # portfolio-analytics-dev, portfolio-analytics-prod
}

resource "google_service_account" "runtime" {
  project      = var.project_id
  account_id   = "${var.name}-${var.env}-run"
  display_name = "Runtime ${local.service_name}"
}

resource "google_project_iam_member" "runtime_roles" {
  for_each = toset(var.runtime_project_roles)
  project  = var.project_id
  role     = each.value
  member   = "serviceAccount:${google_service_account.runtime.email}"
}

resource "google_cloud_run_v2_service" "this" {
  project  = var.project_id
  name     = local.service_name
  location = var.region

  # Público, sem IAP (decisão do autor — o billing-platform usa IAP restrito a
  # @dp6.com.br, que não existe numa conta pessoal).
  ingress = "INGRESS_TRAFFIC_ALL"

  labels = {
    app         = "portfolio-analytics"
    environment = var.env
    managed-by  = "terraform"
  }

  template {
    service_account = google_service_account.runtime.email
    scaling {
      min_instance_count = var.min_instances
      max_instance_count = var.max_instances
    }
    containers {
      image = var.image
      ports { container_port = 8080 }
      dynamic "env" {
        for_each = var.env_vars
        content {
          name  = env.key
          value = env.value
        }
      }
      resources {
        limits   = { cpu = "1", memory = "512Mi" }
        cpu_idle = true # only-on-request
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].containers[0].image] # imagem atualizada pelo deploy do CI
  }
}

resource "google_cloud_run_v2_service_iam_member" "public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.this.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}
