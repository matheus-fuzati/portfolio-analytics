variable "project_id" {
  type    = string
  default = "portfolio-analytics-fuzati"
}
variable "region" {
  type    = string
  default = "us-central1"
}
variable "dataform_dataset" {
  type    = string
  default = "portfolio_analytics_dataform"
}

# imagem: no 1o apply usa o hello (placeholder); o CI faz o deploy real e o TF ignora `image`.
variable "image" {
  type    = string
  default = "us-docker.pkg.dev/cloudrun/container/hello"
}
