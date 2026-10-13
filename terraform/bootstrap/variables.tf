variable "project_id" {
  type    = string
  default = "portfolio-analytics-fuzati"
}

variable "project_number" {
  type    = string
  default = "458222365712"
}

variable "region" {
  type    = string
  default = "us-central1" # mesma região do pipeline Dataform
}

variable "github_repo" {
  type    = string
  default = "matheus-fuzati/portfolio-analytics"
}

variable "state_bucket" {
  type    = string
  default = "portfolio-analytics-fuzati-tfstate"
}
