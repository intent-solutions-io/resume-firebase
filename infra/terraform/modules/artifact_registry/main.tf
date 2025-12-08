# Artifact Registry Module
# Container registry for Cloud Run services

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP Region"
  type        = string
  default     = "us-central1"
}

variable "repository_id" {
  description = "Artifact Registry repository ID"
  type        = string
  default     = "resume-generator"
}

resource "google_artifact_registry_repository" "container_repo" {
  project       = var.project_id
  location      = var.region
  repository_id = var.repository_id
  description   = "Container images for resume generator services"
  format        = "DOCKER"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  cleanup_policies {
    id     = "delete-old-untagged"
    action = "DELETE"
    condition {
      tag_state  = "UNTAGGED"
      older_than = "604800s" # 7 days
    }
  }
}

output "repository_name" {
  description = "Full repository name"
  value       = google_artifact_registry_repository.container_repo.name
}

output "repository_url" {
  description = "Repository URL for docker push/pull"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.repository_id}"
}
