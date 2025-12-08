# Phase 0 Checklist - WIF and Infrastructure Bootstrap

**Document Type:** Project Management (PM-TASK)
**Project:** Resume Generator
**Phase:** 0 - Foundation
**Created:** 2025-12-07 19:40 CST

---

## Pre-requisites

- [ ] GCP Project created (display name: "resume generator")
- [ ] Firebase project linked
- [ ] Billing enabled
- [ ] User has Owner/Editor role

## Terraform Setup

### Module Creation
- [x] `project_apis` module
- [x] `wif_ci` module
- [x] `artifact_registry` module
- [x] `storage` module
- [x] `firestore` module
- [x] `cloud_tasks` module
- [x] `cloud_run` module
- [x] `secrets` module
- [x] `iam` module

### Environment Configuration
- [x] `envs/dev/main.tf`
- [x] `envs/dev/terraform.tfvars.example`
- [x] `envs/prod/main.tf`
- [x] `envs/prod/terraform.tfvars.example`

### Terraform State Backend
- [ ] Create GCS bucket for state: `resume-generator-terraform-state`
- [ ] Enable versioning on bucket
- [ ] Uncomment backend config in main.tf files

## WIF Configuration

- [x] Workload Identity Pool created
- [x] OIDC Provider configured
- [x] CI Service Account created
- [x] Service Account binding to WIF
- [x] `bootstrap_wif_outputs.sh` script

### GitHub Secrets Required
- [ ] `GCP_WIF_PROVIDER` - Workload Identity Provider path
- [ ] `GCP_CI_SA_EMAIL` - CI Service Account email
- [ ] `GCP_PROJECT_ID` - GCP Project ID

## GitHub Actions

- [x] `ci.yml` workflow created
- [x] `deploy.yml` workflow created
- [ ] Workflows tested on PR
- [ ] Workflows tested on main push

## Firebase Configuration

- [x] `firebase.json` created
- [x] `firestore.rules` created
- [x] `firestore.indexes.json` created
- [x] `storage.rules` created
- [x] Frontend scaffold created

## Validation Commands

```bash
# Terraform validation
cd infra/terraform
terraform fmt -check -recursive
cd envs/dev && terraform init -backend=false && terraform validate

# Firebase validation
firebase --version
firebase projects:list

# GitHub CLI
gh auth status
gh secret list
```

## Next Steps After Phase 0

1. Run `terraform apply` to create infrastructure
2. Run `bootstrap_wif_outputs.sh` to get GitHub secrets
3. Add secrets to GitHub repository
4. Push to trigger first CI run
5. Verify all workflows pass
6. Proceed to Phase 1

---

**Generated:** 2025-12-07 19:40 CST (America/Chicago)

intent solutions io — confidential IP
Contact: jeremy@intentsolutions.io
