# Firestore Module
# Native mode Firestore database

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "Firestore region"
  type        = string
  default     = "us-central1"
}

# Firestore Database (Native mode)
resource "google_firestore_database" "database" {
  project         = var.project_id
  name            = "(default)"
  location_id     = var.region
  type            = "FIRESTORE_NATIVE"
  deletion_policy = "DELETE" # Use "ABANDON" in prod for safety

  # Point-in-time recovery
  point_in_time_recovery_enablement = "POINT_IN_TIME_RECOVERY_ENABLED"
}

# Firestore indexes for common queries
resource "google_firestore_index" "cases_status_created" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "cases"

  fields {
    field_path = "status"
    order      = "ASCENDING"
  }

  fields {
    field_path = "createdAt"
    order      = "DESCENDING"
  }
}

resource "google_firestore_index" "case_documents_case_id" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "case_documents"

  fields {
    field_path = "caseId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "uploadedAt"
    order      = "ASCENDING"
  }
}

resource "google_firestore_index" "case_artifacts_case_id" {
  project    = var.project_id
  database   = google_firestore_database.database.name
  collection = "case_artifacts"

  fields {
    field_path = "caseId"
    order      = "ASCENDING"
  }

  fields {
    field_path = "type"
    order      = "ASCENDING"
  }
}

output "database_name" {
  description = "Firestore database name"
  value       = google_firestore_database.database.name
}

output "database_id" {
  description = "Firestore database ID"
  value       = google_firestore_database.database.id
}
