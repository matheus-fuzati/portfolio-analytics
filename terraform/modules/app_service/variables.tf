variable "project_id" { type = string }
variable "region" {
  type    = string
  default = "us-central1"
}
variable "env" { type = string } # dev | prod

variable "name" { type = string } # "portfolio-analytics"
variable "image" {
  type = string # us-central1-docker.pkg.dev/<project>/apps/<name>:<tag>
}
variable "env_vars" {
  type    = map(string)
  default = {}
}

# papéis de PROJETO para a SA de runtime (acesso a dataset específico vai nos environments)
variable "runtime_project_roles" {
  type    = list(string)
  default = []
}

variable "min_instances" {
  type    = number
  default = 0
}
variable "max_instances" {
  type    = number
  default = 2
}
