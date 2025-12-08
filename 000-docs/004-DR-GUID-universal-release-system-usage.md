# Universal Release System - Usage Guide

**Document Type:** User Guide (DR-GUID)
**Created:** 2025-12-07
**Status:** Production Ready
**System Version:** 1.0

---

## Overview

The Universal Release System provides production-grade release automation via three slash commands:
- `/release` - Universal config-driven system
- `/bob-release` - Bob's Brain profile (padded versioning + Vertex AI)
- `/nixtla-release` - Nixtla profile (semver + plugin-specific)

All commands follow identical 7-phase structure with stop conditions and rollback procedures.

---

## Quick Start

### For bobs-brain Repository

```bash
# 1. Navigate to bobs-brain repo
cd /path/to/bobs-brain

# 2. Copy config template
cp .release.yml.example.bobs-brain .release.yml

# 3. Edit configuration (optional - defaults work)
vim .release.yml

# 4. Run release command
claude-code  # Then type: /bob-release
```

### For nixtla Repository

```bash
# 1. Navigate to nixtla repo
cd /path/to/nixtla

# 2. Copy config template
cp .release.yml.example.nixtla .release.yml

# 3. Edit configuration (optional - defaults work)
vim .release.yml

# 4. Run release command
claude-code  # Then type: /nixtla-release
```

### For Any Repository (Universal)

```bash
# 1. Navigate to your repo
cd /path/to/your-repo

# 2. Create .release.yml from scratch or use template
# See config examples: .release.yml.example.*

# 3. Run universal release command
claude-code  # Then type: /release
```

---

## Command Comparison

| Feature | /release | /bob-release | /nixtla-release |
|---------|----------|--------------|-----------------|
| **Versioning** | Config-driven | Padded (XXX.YYY.ZZZ) | Semver (MAJOR.MINOR.PATCH) |
| **Repo Support** | Any (via config) | bobs-brain only | nixtla only |
| **Deployment** | Optional | Vertex AI canary | None (plugin) |
| **Performance Benchmarks** | Optional | ✅ Included | ❌ N/A |
| **Contributor Recognition** | Optional | ✅ Included | ❌ N/A |
| **Phase Tracking** | Optional | ❌ N/A | ✅ Included |
| **Plugin Validation** | N/A | ❌ N/A | ✅ Included |
| **Scope Guardrails** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Rollback Procedures** | ✅ Yes | ✅ Yes | ✅ Yes |

---

## Usage Checklist: bobs-brain

**Pre-Release:**
- [ ] All changes committed and pushed
- [ ] On `main` branch
- [ ] CI passing
- [ ] `.release.yml` configured
- [ ] GPG key configured: `export GPG_KEY_ID=your_key_id`
- [ ] GCP project configured: `export PROJECT_ID=your_project`
- [ ] Tools installed: `npm`, `gh`, `gcloud`, `docker`, `gpg`, `jq`, `yq`

**Run Release:**
```bash
cd /path/to/bobs-brain
claude-code
# Type: /bob-release
```

**Follow Prompts:**
1. **PREFLIGHT** - Review scope and environment checks
   - ❌ If any check fails → STOP, fix issue, retry
   - ✅ All checks pass → Continue

2. **ANALYSIS** - Review current version and commits
   - Note current version
   - Review commit breakdown

3. **DECISION** - Review release recommendation
   - If SKIP → No release needed
   - If WAIT → Accumulate more changes
   - If RELEASE → Proceed

4. **PLAN** - Review proposed file changes
   - Verify file update matrix
   - Review CHANGELOG entry preview
   - Check release report path

5. **APPLY** - Approve execution
   - Type `yes` to proceed
   - Type `no` to abort

6. **VERIFY** - Review verification results
   - Check version propagation
   - Verify git state
   - Confirm artifacts created

7. **REPORT** - Note release report location
   - Check `000-docs/{NNN}-AA-REPT-*.md`

**Post-Release (Manual):**
```bash
# 1. Push to GitHub
git push origin main
git push origin v{XXX.YYY.ZZZ}

# 2. Create GitHub Release
gh release create v{XXX.YYY.ZZZ} \
    --title "v{XXX.YYY.ZZZ}: {title}" \
    --notes-file <(head -n 30 CHANGELOG.md | tail -n +3) \
    --discussion-category "Releases" \
    .release-artifacts/v{XXX.YYY.ZZZ}/*.tar.gz \
    .release-artifacts/v{XXX.YYY.ZZZ}/SHA256SUMS \
    .release-artifacts/v{XXX.YYY.ZZZ}/SHA256SUMS.asc

# 3. Deploy to Vertex AI (if approved in APPLY phase)
# Commands provided in APPLY output

# 4. Monitor production for 24-48 hours
# - Error rate dashboard
# - Performance metrics
# - ADK agent health endpoints

# 5. Notify stakeholders
# - Post to #releases Slack channel
# - Update documentation site
```

---

## Usage Checklist: nixtla

**Pre-Release:**
- [ ] All changes committed and pushed
- [ ] On `main` branch
- [ ] CI passing
- [ ] `.release.yml` configured
- [ ] Phase AAR completed (if applicable)
- [ ] Tools installed: `python3`, `pytest`, `gh`, `jq`, `yq`
- [ ] Optional: `safety` for dependency scanning

**Run Release:**
```bash
cd /path/to/nixtla
claude-code
# Type: /nixtla-release
```

**Follow Prompts:**
1. **PREFLIGHT** - Review scope and plugin structure
   - ❌ If any check fails → STOP, fix issue, retry
   - ✅ All checks pass → Continue

2. **ANALYSIS** - Review version and phase tracking
   - Note current version
   - Check latest completed phase
   - Review commit breakdown

3. **DECISION** - Review release recommendation
   - If SKIP → No release needed
   - If WAIT → Accumulate more changes
   - If RELEASE → Proceed

4. **PLAN** - Review multi-doc synchronization
   - Verify plugin.json update
   - Check README updates (root + plugin)
   - Review product overview update
   - Check CHANGELOG entry
   - Verify release report path

5. **APPLY** - Approve execution
   - Type `yes` to proceed
   - Type `no` to abort

6. **VERIFY** - Review documentation compliance
   - Check version propagation
   - Verify TQ- (not QA-) category usage
   - Confirm PP-PROD (not OVRV) type usage
   - Verify 6767 letter suffixes
   - Check flat 000-docs/ structure

7. **REPORT** - Note release report location
   - Check `000-docs/{NNN}-AA-REPT-*.md`

**Post-Release (Manual):**
```bash
# 1. Push to GitHub
git push origin main
git push origin v{MAJOR.MINOR.PATCH}

# 2. Create GitHub Release
gh release create v{MAJOR.MINOR.PATCH} \
    --title "v{MAJOR.MINOR.PATCH}: {title}" \
    --notes-file <(head -n 40 CHANGELOG.md | tail -n +3) \
    --discussion-category "Releases"

# 3. Verify release published
gh release view v{MAJOR.MINOR.PATCH}

# 4. Run post-release tests
claude-code plugin install nixtla-baseline-lab@{MAJOR.MINOR.PATCH}
bash scripts/run-golden-tasks.sh

# 5. Notify stakeholders
# - Max Mergenthaler (Nixtla CEO) - Email
# - Jeremy Longshore (Intent Solutions) - Slack
# - Post to collaboration channels

# 6. Monitor for 7 days
# - GitHub download stats
# - Issue reports
# - Community feedback
```

---

## Troubleshooting

### PREFLIGHT Failures

**Git repository not clean:**
```bash
git status
git add -A && git commit -m "chore: prepare for release"
# OR
git stash
```

**Not on release branch:**
```bash
git checkout main
git pull origin main
```

**Remote out of sync:**
```bash
git pull origin main
# OR
git push origin main
```

**CI not passing:**
```bash
gh run list --branch main --limit 1
gh run view {run_id}
# Fix failing tests/builds, then retry
```

**Missing .release.yml:**
```bash
cp .release.yml.example.{repo} .release.yml
vim .release.yml
```

**Missing required tools:**
```bash
# Install missing tools based on error message
# Example for bobs-brain:
npm install -g npm
brew install gh gcloud docker jq yq

# Example for nixtla:
pip3 install pytest pytest-cov safety
brew install gh jq yq
```

### APPLY Failures

**Git commit failed:**
- Check for uncommitted changes blocking commit
- Verify commit message format
- Check for pre-commit hooks

**Tag creation failed:**
- Tag may already exist: `git tag -d v{version}` to remove
- Check GPG configuration if signing required

**Artifact generation failed:**
- Check disk space
- Verify tarball exclusions in config
- Check Docker daemon running (if applicable)

**Deployment failed (bobs-brain):**
- Check GCP credentials: `gcloud auth list`
- Verify PROJECT_ID environment variable set
- Check Vertex AI agent configuration

**Test failures (nixtla):**
- Run tests manually: `pytest plugins/nixtla-baseline-lab/tests/`
- Check coverage: `pytest --cov`
- Review golden task harness output

### Version Conflicts

**Multiple version sources disagree:**
- System will flag in ANALYSIS phase
- First source in config is authoritative
- Other sources updated automatically in APPLY phase
- Review proposed changes in PLAN phase

### Rollback Scenarios

**Need to undo committed release:**
```bash
# If tag not pushed yet:
git tag -d v{version}
git reset --hard HEAD~1

# If tag pushed but no GitHub Release yet:
git push origin --delete v{version}
git tag -d v{version}
git revert HEAD
git push origin main

# If GitHub Release created:
gh release delete v{version} --yes
git push origin --delete v{version}
git tag -d v{version}
git revert HEAD
git push origin main
```

**Deployment failure (bobs-brain):**
```bash
# Revert Vertex AI deployment
gcloud alpha agent-builder agents update bobs-brain-prod \
    --image=us-central1-docker.pkg.dev/${PROJECT_ID}/agents/bobs-brain:v{previous_version}

# Then rollback git (see above)
```

---

## Configuration Reference

### Required Fields (.release.yml)

```yaml
repo:
  name: your-repo-name  # Must match expected profile

version:
  scheme: semver  # or "padded"
  sources:
    - path/to/version/file

release:
  branch: main  # Release branch name
```

### Optional Fields

See full examples:
- `.release.yml.example.bobs-brain` - Complete bobs-brain configuration
- `.release.yml.example.nixtla` - Complete nixtla configuration

### Custom Version Sources

```yaml
version:
  sources:
    - VERSION                    # Plain text file
    - package.json:version       # JSON field
    - pyproject.toml:tool.poetry.version  # TOML field (requires yq)
    - plugin.json:version        # Plugin metadata
```

### Custom Quality Gates

```yaml
quality:
  checks:
    - npm test
    - npm run lint
    - python3 -m pytest
    - bash scripts/custom-validation.sh
```

### Custom File Updates

```yaml
custom_updates:
  - file: docs/version.txt
    type: plain_text
    new_value: '{version}'

  - file: config.yaml
    type: yaml_field
    field: app.version
    new_value: '{version}'

  - file: README.md
    type: regex_replace
    pattern: 'v[0-9]+\.[0-9]+\.[0-9]+'
    replacement: 'v{version}'
```

---

## Best Practices

### 1. Version Bumping Strategy

**MAJOR (breaking changes):**
- API incompatibilities
- Removed functionality
- Architectural rewrites

**MINOR (new features):**
- New capabilities (backwards compatible)
- Phase completions (nixtla)
- Performance improvements
- Security updates

**PATCH (fixes):**
- Bug fixes
- Documentation updates
- CI/CD tweaks
- Internal refactors

### 2. Commit Message Conventions

Use conventional commits for automatic categorization:
```
feat(scope): Add new forecasting model
fix(api): Resolve timeout issue
perf(agent): Optimize cold start time
security(auth): Patch authentication bypass
docs(readme): Update installation instructions
ci(workflow): Add coverage reporting
chore(deps): Update dependencies
refactor(utils): Simplify helper functions
```

### 3. Testing Before Release

**bobs-brain:**
```bash
npm test
npm run lint
npm run coverage  # Must be ≥80%
python3 scripts/validate-adk-patterns.py
npm run benchmark
```

**nixtla:**
```bash
pytest plugins/nixtla-baseline-lab/tests/
pytest --cov --cov-fail-under=75
bash scripts/run-golden-tasks.sh
```

### 4. Release Timing

**Don't release if:**
- Incomplete features (WIP)
- Failing tests
- Unresolved security issues
- Major refactor in progress

**Do release when:**
- Feature set complete
- All tests passing
- Security issues resolved
- Accumulation threshold met (per config)

### 5. Post-Release Monitoring

**First 24 hours:**
- Watch error rates
- Monitor performance metrics
- Track deployment health

**First week:**
- Review issue reports
- Gather user feedback
- Monitor adoption metrics

**After 1 week:**
- Create retrospective AAR (if issues)
- Document lessons learned
- Update runbooks if needed

---

## System Upgrades from Original Commands

### Improvements Applied

**1. Scope Guardrails (NEW):**
- Commands only run in current repo
- No cross-repo targeting
- Explicit context display before execution

**2. Stop Conditions (ENHANCED):**
- Preflight failures stop execution immediately
- Quality gate failures block APPLY phase
- No "proceed anyway" without explicit approval

**3. Rollback Procedures (NEW):**
- Documented for every failure scenario
- Automated rollback where safe
- Manual rollback instructions for edge cases

**4. Version Conflict Resolution (NEW):**
- Detects disagreements across sources
- Policy: First source is authoritative
- Auto-updates stale sources in APPLY

**5. Documentation Compliance (FIXED):**
- No more QA- (changed to TQ-)
- No undefined types (OVRV → PP-PROD)
- Enforced 6767 letter suffixes
- Enforced flat 000-docs/ structure
- CST timestamps required

**6. Unified Output Structure (NEW):**
- 7-phase format (Preflight → Analysis → Decision → Plan → Apply → Verify → Report)
- Identical across all commands
- Predictable, deterministic

**7. Security Enhancements (NEW):**
- Secrets scanning (if tool available)
- Dependency vulnerability checks
- Signing policy configuration

---

## Files Created

**Slash Commands:**
- `/home/jeremy/.claude/commands/release.md` - Universal system
- `/home/jeremy/.claude/commands/bob-release.md` - Upgraded bobs-brain
- `/home/jeremy/.claude/commands/nixtla-release.md` - Upgraded nixtla

**Config Templates (repo root):**
- `.release.yml.example.bobs-brain` - Bob's Brain configuration
- `.release.yml.example.nixtla` - Nixtla configuration

**Documentation (000-docs):**
- `004-DR-GUID-universal-release-system-usage.md` - This guide
- `002-DR-REFF-bob-release-command.md` - Bob release reference
- `003-DR-REFF-nixtla-release-command.md` - Nixtla release reference

**Preserved (archive):**
- `/home/jeremy/.claude/commands/nixtla-release-original-backup.md` - Original nixtla (unchanged)

---

## Support & Contact

**System Author:** Claude Code (Opus)
**System Version:** 1.0
**Last Updated:** 2025-12-07

**Organization:** intent solutions io — confidential IP
**Contact:** jeremy@intentsolutions.io

---

**Generated:** 2025-12-07 18:05 CST (America/Chicago)
**System:** Universal Release Engineering Documentation
