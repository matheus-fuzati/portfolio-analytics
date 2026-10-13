terraform {
  backend "gcs" {
    bucket = "portfolio-analytics-fuzati-tfstate"
    prefix = "environments/dev"
  }
}
