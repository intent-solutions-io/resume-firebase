#!/bin/bash
# Bootstrap WIF Outputs Script
# Prints Terraform outputs and instructions for GitHub Actions secrets

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

echo "=============================================="
echo "  Resume Generator - WIF Bootstrap Script"
echo "=============================================="
echo ""

# Check if environment is provided
ENV="${1:-dev}"
TF_DIR="$REPO_ROOT/infra/terraform/envs/$ENV"

if [[ ! -d "$TF_DIR" ]]; then
    echo "ERROR: Environment directory not found: $TF_DIR"
    echo "Usage: $0 [dev|prod]"
    exit 1
fi

cd "$TF_DIR"

# Check if terraform has been initialized
if [[ ! -d ".terraform" ]]; then
    echo "ERROR: Terraform not initialized. Run 'terraform init' first."
    exit 1
fi

echo "Environment: $ENV"
echo "Terraform directory: $TF_DIR"
echo ""

# Get outputs
echo "Fetching Terraform outputs..."
echo ""

WIF_PROVIDER=$(terraform output -raw workload_identity_provider 2>/dev/null || echo "NOT_SET")
CI_SA_EMAIL=$(terraform output -raw ci_service_account_email 2>/dev/null || echo "NOT_SET")
ARTIFACT_REGISTRY=$(terraform output -raw artifact_registry_url 2>/dev/null || echo "NOT_SET")

echo "=============================================="
echo "  GitHub Actions Secrets Configuration"
echo "=============================================="
echo ""
echo "Add these secrets to your GitHub repository:"
echo "  Settings → Secrets and variables → Actions → New repository secret"
echo ""
echo "┌─────────────────────────────────────────────────────────────────────┐"
echo "│ Secret Name          │ Value                                        │"
echo "├─────────────────────────────────────────────────────────────────────┤"
printf "│ %-20s │ %-44s │\n" "GCP_WIF_PROVIDER" "$WIF_PROVIDER"
printf "│ %-20s │ %-44s │\n" "GCP_CI_SA_EMAIL" "$CI_SA_EMAIL"
printf "│ %-20s │ %-44s │\n" "GCP_PROJECT_ID" "(your project ID)"
echo "└─────────────────────────────────────────────────────────────────────┘"
echo ""
echo "=============================================="
echo "  Full Output Values"
echo "=============================================="
echo ""
echo "GCP_WIF_PROVIDER:"
echo "  $WIF_PROVIDER"
echo ""
echo "GCP_CI_SA_EMAIL:"
echo "  $CI_SA_EMAIL"
echo ""
echo "ARTIFACT_REGISTRY_URL:"
echo "  $ARTIFACT_REGISTRY"
echo ""
echo "=============================================="
echo "  Verification Commands"
echo "=============================================="
echo ""
echo "# Test WIF authentication locally (requires gcloud):"
echo "gcloud iam workload-identity-pools providers describe \\"
echo "  github-actions-provider \\"
echo "  --project=\$(terraform output -raw project_id) \\"
echo "  --location=global \\"
echo "  --workload-identity-pool=github-actions-pool"
echo ""
echo "# List service account:"
echo "gcloud iam service-accounts describe $CI_SA_EMAIL"
echo ""
echo "=============================================="
echo "  Done!"
echo "=============================================="
