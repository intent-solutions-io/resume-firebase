# Cloud Storage Module
# Buckets for raw uploads and generated artifacts

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

locals {
  bucket_suffix = var.environment == "prod" ? "" : "-${var.environment}"
}

# Raw uploads bucket (private)
resource "google_storage_bucket" "raw_uploads" {
  project                     = var.project_id
  name                        = "${var.project_id}-raw-uploads${local.bucket_suffix}"
  location                    = var.region
  force_destroy               = var.environment != "prod"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 90 # Delete raw uploads after 90 days
    }
    action {
      type = "Delete"
    }
  }

  lifecycle_rule {
    condition {
      num_newer_versions = 3
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"] # Will be restricted in prod
    method          = ["PUT", "POST"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}

# Artifacts bucket (private, signed URL access)
resource "google_storage_bucket" "artifacts" {
  project                     = var.project_id
  name                        = "${var.project_id}-artifacts${local.bucket_suffix}"
  location                    = var.region
  force_destroy               = var.environment != "prod"
  uniform_bucket_level_access = true
  public_access_prevention    = "enforced"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365 # Keep artifacts for 1 year
    }
    action {
      type = "Delete"
    }
  }

  cors {
    origin          = ["*"] # Will be restricted in prod
    method          = ["GET"]
    response_header = ["Content-Type", "Content-Disposition"]
    max_age_seconds = 3600
  }
}

output "raw_uploads_bucket" {
  description = "Raw uploads bucket name"
  value       = google_storage_bucket.raw_uploads.name
}

output "artifacts_bucket" {
  description = "Artifacts bucket name"
  value       = google_storage_bucket.artifacts.name
}

output "raw_uploads_url" {
  description = "Raw uploads bucket URL"
  value       = google_storage_bucket.raw_uploads.url
}

output "artifacts_url" {
  description = "Artifacts bucket URL"
  value       = google_storage_bucket.artifacts.url
}
