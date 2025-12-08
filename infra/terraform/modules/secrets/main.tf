# Secret Manager Module
# Placeholders for secrets (App Check, reCAPTCHA, etc.)

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

locals {
  secrets = [
    "firebase-app-check-debug-token",
    "recaptcha-site-key",
    "recaptcha-secret-key",
  ]
}

# Create secret placeholders
resource "google_secret_manager_secret" "secrets" {
  for_each = toset(local.secrets)

  project   = var.project_id
  secret_id = "${each.value}-${var.environment}"

  replication {
    auto {}
  }

  labels = {
    environment = var.environment
    managed_by  = "terraform"
  }
}

# Note: Actual secret values must be added manually or via CI
# terraform does not manage secret versions for security

output "secret_ids" {
  description = "Map of secret names to their IDs"
  value       = { for k, v in google_secret_manager_secret.secrets : k => v.id }
}

output "secret_names" {
  description = "Map of secret names to their full resource names"
  value       = { for k, v in google_secret_manager_secret.secrets : k => v.name }
}
