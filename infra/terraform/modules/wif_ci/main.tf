# Workload Identity Federation for GitHub Actions
# Enables keyless authentication from GitHub Actions to GCP

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_number" {
  description = "GCP Project Number"
  type        = string
}

variable "github_org" {
  description = "GitHub organization name"
  type        = string
  default     = "intent-solutions-io"
}

variable "github_repo" {
  description = "GitHub repository name"
  type        = string
  default     = "resume-generator"
}

variable "pool_id" {
  description = "Workload Identity Pool ID"
  type        = string
  default     = "github-actions-pool"
}

variable "provider_id" {
  description = "Workload Identity Provider ID"
  type        = string
  default     = "github-actions-provider"
}

# Workload Identity Pool
resource "google_iam_workload_identity_pool" "github_pool" {
  project                   = var.project_id
  workload_identity_pool_id = var.pool_id
  display_name              = "GitHub Actions Pool"
  description               = "Workload Identity Pool for GitHub Actions CI/CD"
}

# Workload Identity Provider (GitHub OIDC)
resource "google_iam_workload_identity_pool_provider" "github_provider" {
  project                            = var.project_id
  workload_identity_pool_id          = google_iam_workload_identity_pool.github_pool.workload_identity_pool_id
  workload_identity_pool_provider_id = var.provider_id
  display_name                       = "GitHub Actions Provider"
  description                        = "OIDC provider for GitHub Actions"

  attribute_mapping = {
    "google.subject"             = "assertion.sub"
    "attribute.actor"            = "assertion.actor"
    "attribute.repository"       = "assertion.repository"
    "attribute.repository_owner" = "assertion.repository_owner"
    "attribute.ref"              = "assertion.ref"
    "attribute.ref_type"         = "assertion.ref_type"
  }

  attribute_condition = "assertion.repository_owner == '${var.github_org}'"

  oidc {
    issuer_uri = "https://token.actions.githubusercontent.com"
  }
}

# CI Service Account
resource "google_service_account" "ci_service_account" {
  project      = var.project_id
  account_id   = "github-actions-ci"
  display_name = "GitHub Actions CI Service Account"
  description  = "Service account for GitHub Actions CI/CD pipelines"
}

# Bind WIF to Service Account - restricted to specific repository
resource "google_service_account_iam_member" "workload_identity_user" {
  service_account_id = google_service_account.ci_service_account.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "principalSet://iam.googleapis.com/projects/${var.project_number}/locations/global/workloadIdentityPools/${var.pool_id}/attribute.repository/${var.github_org}/${var.github_repo}"

  depends_on = [google_iam_workload_identity_pool_provider.github_provider]
}

# Outputs for GitHub Actions configuration
output "workload_identity_provider" {
  description = "Full name of the Workload Identity Provider"
  value       = "projects/${var.project_number}/locations/global/workloadIdentityPools/${var.pool_id}/providers/${var.provider_id}"
}

output "service_account_email" {
  description = "CI Service Account email"
  value       = google_service_account.ci_service_account.email
}

output "pool_name" {
  description = "Workload Identity Pool name"
  value       = google_iam_workload_identity_pool.github_pool.name
}
