# terraform/bootstrap/

Recursos fundacionais do CI/CD. **State local, apply manual, uma vez.** Fora dos workflows de
CI (que só tocam `terraform/environments/**`).

Cria: APIs · bucket de state remoto · WIF pool + 2 providers (`plan` / `apply`, main+develop) ·
Artifact Registry `apps`.

**`iam.tf` não está neste diretório** — o bloqueio de "permission grant" do Claude Code impediu
de escrever/aplicar esse arquivo (concede papéis amplos de projeto: `resourcemanager.projectIamAdmin`,
`bigquery.admin`, `iam.serviceAccountAdmin` às SAs de CI). Crie `terraform/bootstrap/iam.tf` com o
conteúdo abaixo antes do apply:

```hcl
locals {
  plan_roles = [
    "roles/browser",
    "roles/run.viewer",
    "roles/artifactregistry.reader",
    "roles/iam.serviceAccountViewer",
    "roles/iam.roleViewer",
    "roles/bigquery.metadataViewer",
  ]

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
```

## Aplicar

```bash
cd terraform/bootstrap
gcloud auth application-default login --account=fuzatimatheus.cloud@gmail.com
terraform init
terraform apply
```

## Depois do apply

```bash
terraform output -raw github_secrets_cmd   # cola no terminal — seta os 4 secrets de WIF no repo
```

Depois disso, criar os 2 Environments do GitHub (`dev-deploy`, `prod-deploy`) — sem reviewer
obrigatório (GitHub Free em repo privado não oferece isso); servem só para escopar onde os
secrets de WIF valem:

```bash
gh api -X PUT repos/matheusfuzati/portfolio-analytics/environments/dev-deploy
gh api -X PUT repos/matheusfuzati/portfolio-analytics/environments/prod-deploy
```

Por fim: criar a branch `develop` a partir de `main` e dar push — o primeiro push em `develop`
dispara `deploy-dev.yml`, que aplica `terraform/environments/dev` (ainda com a imagem placeholder
`hello`) e já faz o deploy real da imagem buildada do repo.

## Não versionar

`terraform.tfstate*` (state local — não perder), `terraform.tfvars`, `.terraform/`.
