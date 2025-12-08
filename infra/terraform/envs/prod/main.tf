# Prod Environment Configuration
# Resume Generator - Production

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
  }

  # Backend configuration - uncomment after initial setup
  # backend "gcs" {
  #   bucket = "resume-generator-terraform-state"
  #   prefix = "prod"
  # }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_number" {
  description = "GCP Project Number"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "github_org" {
  description = "GitHub organization"
  type        = string
  default     = "intent-solutions-io"
}

variable "github_repo" {
  description = "GitHub repository"
  type        = string
  default     = "resume-generator"
}

locals {
  environment = "prod"
}

# Enable required APIs
module "project_apis" {
  source     = "../../modules/project_apis"
  project_id = var.project_id
}

# Workload Identity Federation for GitHub Actions
module "wif_ci" {
  source         = "../../modules/wif_ci"
  project_id     = var.project_id
  project_number = var.project_number
  github_org     = var.github_org
  github_repo    = var.github_repo

  depends_on = [module.project_apis]
}

# Artifact Registry
module "artifact_registry" {
  source     = "../../modules/artifact_registry"
  project_id = var.project_id
  region     = var.region

  depends_on = [module.project_apis]
}

# Cloud Storage buckets
module "storage" {
  source      = "../../modules/storage"
  project_id  = var.project_id
  region      = var.region
  environment = local.environment

  depends_on = [module.project_apis]
}

# Firestore database
module "firestore" {
  source     = "../../modules/firestore"
  project_id = var.project_id
  region     = var.region

  depends_on = [module.project_apis]
}

# Cloud Tasks queues
module "cloud_tasks" {
  source      = "../../modules/cloud_tasks"
  project_id  = var.project_id
  region      = var.region
  environment = local.environment

  depends_on = [module.project_apis]
}

# Secret Manager
module "secrets" {
  source      = "../../modules/secrets"
  project_id  = var.project_id
  environment = local.environment

  depends_on = [module.project_apis]
}

# IAM roles and service accounts
module "iam" {
  source                   = "../../modules/iam"
  project_id               = var.project_id
  environment              = local.environment
  ci_service_account_email = module.wif_ci.service_account_email

  depends_on = [module.project_apis, module.wif_ci]
}

# Cloud Run services
module "cloud_run" {
  source                       = "../../modules/cloud_run"
  project_id                   = var.project_id
  project_number               = var.project_number
  region                       = var.region
  environment                  = local.environment
  artifact_registry_url        = module.artifact_registry.repository_url
  api_service_account_email    = module.iam.api_service_account_email
  worker_service_account_email = module.iam.worker_service_account_email
  raw_uploads_bucket           = module.storage.raw_uploads_bucket
  artifacts_bucket             = module.storage.artifacts_bucket
  processing_queue_name        = module.cloud_tasks.processing_queue_name

  depends_on = [
    module.project_apis,
    module.artifact_registry,
    module.storage,
    module.cloud_tasks,
    module.iam
  ]
}

# Outputs
output "workload_identity_provider" {
  description = "WIF provider for GitHub Actions"
  value       = module.wif_ci.workload_identity_provider
}

output "ci_service_account_email" {
  description = "CI service account email"
  value       = module.wif_ci.service_account_email
}

output "artifact_registry_url" {
  description = "Container registry URL"
  value       = module.artifact_registry.repository_url
}

output "api_url" {
  description = "API service URL"
  value       = module.cloud_run.api_url
}

output "worker_url" {
  description = "Worker service URL"
  value       = module.cloud_run.worker_url
}

output "raw_uploads_bucket" {
  description = "Raw uploads bucket"
  value       = module.storage.raw_uploads_bucket
}

output "artifacts_bucket" {
  description = "Artifacts bucket"
  value       = module.storage.artifacts_bucket
}

output "processing_queue" {
  description = "Processing queue name"
  value       = module.cloud_tasks.processing_queue_name
}
