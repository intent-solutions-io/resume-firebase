# Cloud Tasks Module
# Task queues for async processing

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

# Processing queue for resume generation tasks
resource "google_cloud_tasks_queue" "processing_queue" {
  project  = var.project_id
  name     = "resume-processing-${var.environment}"
  location = var.region

  rate_limits {
    max_concurrent_dispatches = var.environment == "prod" ? 10 : 3
    max_dispatches_per_second = var.environment == "prod" ? 5 : 1
  }

  retry_config {
    max_attempts       = 5
    min_backoff        = "10s"
    max_backoff        = "300s"
    max_doublings      = 4
    max_retry_duration = "3600s" # 1 hour max retry window
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

# Artifact generation queue (PDF generation, etc.)
resource "google_cloud_tasks_queue" "artifact_queue" {
  project  = var.project_id
  name     = "artifact-generation-${var.environment}"
  location = var.region

  rate_limits {
    max_concurrent_dispatches = var.environment == "prod" ? 5 : 2
    max_dispatches_per_second = var.environment == "prod" ? 2 : 1
  }

  retry_config {
    max_attempts       = 3
    min_backoff        = "30s"
    max_backoff        = "600s"
    max_doublings      = 3
    max_retry_duration = "1800s" # 30 min max retry window
  }

  stackdriver_logging_config {
    sampling_ratio = 1.0
  }
}

output "processing_queue_name" {
  description = "Processing queue name"
  value       = google_cloud_tasks_queue.processing_queue.name
}

output "processing_queue_id" {
  description = "Processing queue ID"
  value       = google_cloud_tasks_queue.processing_queue.id
}

output "artifact_queue_name" {
  description = "Artifact queue name"
  value       = google_cloud_tasks_queue.artifact_queue.name
}

output "artifact_queue_id" {
  description = "Artifact queue ID"
  value       = google_cloud_tasks_queue.artifact_queue.id
}
