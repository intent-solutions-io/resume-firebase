# Guardrails Configuration - NO RESOURCE SPRAWL
# This file enforces strict naming and prevents accidental resource creation.
#
# RESOURCE MANIFEST (SOURCE OF TRUTH):
# - Project: resume-gen-intent-dev
# - Region: us-central1
# - Cloud Run services: resume-api-dev, resume-worker-dev (2 total)
# - Buckets: resume-gen-intent-dev-raw-uploads-dev, resume-gen-intent-dev-artifacts-dev (2 total)
# - Queues: resume-processing-dev, artifact-generation-dev (2 total)
# - Artifact Registry: us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator

# =============================================================================
# GUARDRAILS - DO NOT MODIFY WITHOUT EXPLICIT APPROVAL FROM JEREMY
# =============================================================================

locals {
  # Locked resource names - these MUST match deployed resources exactly
  allowed_environments = ["dev"]
  allowed_project_id   = "resume-gen-intent-dev"
  allowed_region       = "us-central1"

  # Expected resource names for dev environment
  expected_cloud_run_services = ["resume-api-dev", "resume-worker-dev"]
  expected_buckets = [
    "resume-gen-intent-dev-raw-uploads-dev",
    "resume-gen-intent-dev-artifacts-dev"
  ]
  expected_queues = ["resume-processing-dev", "artifact-generation-dev"]
}

# Validate environment is locked to allowed values
resource "null_resource" "validate_environment" {
  count = contains(local.allowed_environments, local.environment) ? 0 : 1

  provisioner "local-exec" {
    command = "echo 'ERROR: Environment ${local.environment} is not allowed. Allowed: ${join(", ", local.allowed_environments)}' && exit 1"
  }

  lifecycle {
    precondition {
      condition     = contains(local.allowed_environments, local.environment)
      error_message = "GUARDRAIL VIOLATION: Environment '${local.environment}' is not in allowed list: ${join(", ", local.allowed_environments)}. Contact Jeremy to enable new environments."
    }
  }
}

# Validate project_id matches expected
resource "null_resource" "validate_project" {
  count = var.project_id == local.allowed_project_id ? 0 : 1

  lifecycle {
    precondition {
      condition     = var.project_id == local.allowed_project_id
      error_message = "GUARDRAIL VIOLATION: project_id '${var.project_id}' does not match expected '${local.allowed_project_id}'. This prevents accidental deployment to wrong project."
    }
  }
}

# Validate region matches expected
resource "null_resource" "validate_region" {
  count = var.region == local.allowed_region ? 0 : 1

  lifecycle {
    precondition {
      condition     = var.region == local.allowed_region
      error_message = "GUARDRAIL VIOLATION: region '${var.region}' does not match expected '${local.allowed_region}'. Multi-region is not enabled."
    }
  }
}
