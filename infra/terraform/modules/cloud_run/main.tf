# Cloud Run Module
# API and Worker services

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

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "artifact_registry_url" {
  description = "Artifact Registry URL"
  type        = string
}

variable "api_service_account_email" {
  description = "API service account email"
  type        = string
}

variable "worker_service_account_email" {
  description = "Worker service account email"
  type        = string
}

variable "raw_uploads_bucket" {
  description = "Raw uploads bucket name"
  type        = string
}

variable "artifacts_bucket" {
  description = "Artifacts bucket name"
  type        = string
}

variable "processing_queue_name" {
  description = "Cloud Tasks processing queue name"
  type        = string
}

locals {
  api_image    = "${var.artifact_registry_url}/api:latest"
  worker_image = "${var.artifact_registry_url}/worker:latest"
}

# API Service (public-facing)
resource "google_cloud_run_v2_service" "api" {
  project  = var.project_id
  name     = "resume-api-${var.environment}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = var.api_service_account_email

    scaling {
      min_instance_count = var.environment == "prod" ? 1 : 0
      max_instance_count = var.environment == "prod" ? 10 : 3
    }

    containers {
      image = local.api_image

      resources {
        limits = {
          cpu    = var.environment == "prod" ? "2" : "1"
          memory = var.environment == "prod" ? "1Gi" : "512Mi"
        }
        cpu_idle = true
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "RAW_UPLOADS_BUCKET"
        value = var.raw_uploads_bucket
      }

      env {
        name  = "ARTIFACTS_BUCKET"
        value = var.artifacts_bucket
      }

      env {
        name  = "PROCESSING_QUEUE"
        value = var.processing_queue_name
      }

      env {
        name  = "WORKER_URL"
        value = google_cloud_run_v2_service.worker.uri
      }

      # Worker service account for Cloud Tasks
      env {
        name  = "WORKER_SERVICE_ACCOUNT"
        value = var.worker_service_account_email
      }

      # App Check bypass for development only
      dynamic "env" {
        for_each = var.environment == "dev" ? [1] : []
        content {
          name  = "APP_CHECK_DEBUG"
          value = "true"
        }
      }

      ports {
        container_port = 8080
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 5
        period_seconds        = 10
        failure_threshold     = 3
      }

      liveness_probe {
        http_get {
          path = "/health"
        }
        period_seconds    = 30
        failure_threshold = 3
      }
    }

    timeout = "60s"
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Worker Service (internal, Cloud Tasks target)
resource "google_cloud_run_v2_service" "worker" {
  project  = var.project_id
  name     = "resume-worker-${var.environment}"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_INTERNAL_ONLY"

  template {
    service_account = var.worker_service_account_email

    scaling {
      min_instance_count = 0
      max_instance_count = var.environment == "prod" ? 20 : 5
    }

    containers {
      image = local.worker_image

      resources {
        limits = {
          cpu    = var.environment == "prod" ? "4" : "2"
          memory = var.environment == "prod" ? "4Gi" : "2Gi"
        }
        cpu_idle = false # Keep CPU allocated for processing
      }

      env {
        name  = "ENVIRONMENT"
        value = var.environment
      }

      env {
        name  = "PROJECT_ID"
        value = var.project_id
      }

      env {
        name  = "RAW_UPLOADS_BUCKET"
        value = var.raw_uploads_bucket
      }

      env {
        name  = "ARTIFACTS_BUCKET"
        value = var.artifacts_bucket
      }

      env {
        name  = "VERTEX_AI_LOCATION"
        value = var.region
      }

      ports {
        container_port = 8080
      }

      startup_probe {
        http_get {
          path = "/health"
        }
        initial_delay_seconds = 10
        period_seconds        = 10
        failure_threshold     = 5
      }
    }

    timeout = "900s" # 15 min for processing
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Allow unauthenticated access to API (App Check handles auth)
resource "google_cloud_run_v2_service_iam_member" "api_public" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.api.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Allow Cloud Tasks to invoke worker (worker SA is used for OIDC auth)
resource "google_cloud_run_v2_service_iam_member" "worker_tasks_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${var.worker_service_account_email}"
}

output "api_url" {
  description = "API service URL"
  value       = google_cloud_run_v2_service.api.uri
}

output "worker_url" {
  description = "Worker service URL"
  value       = google_cloud_run_v2_service.worker.uri
}

output "api_service_name" {
  description = "API service name"
  value       = google_cloud_run_v2_service.api.name
}

output "worker_service_name" {
  description = "Worker service name"
  value       = google_cloud_run_v2_service.worker.name
}
