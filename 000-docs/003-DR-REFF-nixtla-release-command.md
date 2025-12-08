# Nixtla Release Command Reference

**Document Type:** Reference Guide (DR-REFF)
**Created:** 2025-12-07
**Status:** Active
**Command:** `/nixtla-release`

---

## Command Metadata

```yaml
name: nixtla-release
description: Production release engineer for nixtla baseline lab - analyzes changes, determines version bumps, and prepares all release artifacts with impeccable audit trails
model: opus
```

---

## Overview

This command executes **Release Engineer + Build Captain** workflow for the `nixtla` (claude-code-plugins-nixtla) repository.

### Context

- Experimental private collaboration between Intent Solutions and Nixtla
- Demonstrates production-ready Claude Code plugin patterns for Nixtla's forecasting ecosystem
- Flagship baseline lab plugin implementation
- Requires impeccable release audit trail as reference implementation

---

## Versioning Scheme

**Format:** `MAJOR.MINOR.PATCH` (e.g., `0.6.0`, `0.7.0`, `1.0.0`)

### Semantics

- **MAJOR** = Breaking changes, major architectural shifts (0 → 1 for production-ready)
- **MINOR** = New features, additive changes, significant improvements
- **PATCH** = Bug fixes, internal refactors, docs-only, CI tweaks

### Pre-1.0.0 Conventions

- `0.x.y` indicates plugin is in development/experimental
- Moving to `1.0.0` signals production-ready, stable API

### Canonical Sources

Priority order for version truth:
1. `plugins/nixtla-baseline-lab/.claude-plugin/plugin.json` → `version` field
2. Git tags (e.g., `v0.6.0`)
3. `CHANGELOG.md`
4. Documentation files

If disagreement exists:
- Treat `plugin.json` + tags as authoritative
- Propose corrections to `CHANGELOG.md` and other files

---

## Release Decision Logic

### Step 1: Collect Context

```bash
# List commits since last release
git log ${last_release_tag}..HEAD --oneline

# Check uncommitted changes
git status

# Review completed phase AARs
ls -la 000-docs/ | grep "AA-AACR-phase"
```

### Step 2: Classify Changes by Impact

| Change Type | Bump Level | Examples |
|-------------|------------|----------|
| `feat(...)` or new capabilities | MINOR | New plugin skills, phase completion |
| `fix(...)`, `docs(...)`, `ci(...)`, `chore(...)` | PATCH | Bug fixes, documentation, CI tweaks |
| `BREAKING CHANGE` or API incompatibilities | MAJOR | API changes, architectural shifts |
| No meaningful changes | SKIP | Pure noise, mechanical chores |

### Step 3: Decide Bump

```python
def determine_bump(commits, phases):
    # No changes → no release
    if not commits or only_trivial_noise(commits):
        return "SKIP", "No meaningful changes"

    # Breaking changes → major
    if has_breaking_changes(commits):
        return "MAJOR", "Breaking API changes detected"

    # New features or phase completion → minor
    if has_features(commits) or phase_completed(phases):
        return "MINOR", "New features/phase completion"

    # Only patches → patch
    if only_patches(commits):
        return "PATCH", "Bug fixes and improvements"
```

### Step 4: Compute Next Version

```python
# Example: 0.6.0 → 0.7.0 (minor bump)
if bump == "MAJOR":
    next_version = f"{major + 1}.0.0"
elif bump == "MINOR":
    next_version = f"{major}.{minor + 1}.0"
elif bump == "PATCH":
    next_version = f"{major}.{minor}.{patch + 1}"
```

---

## Release Artifacts & Chores

### A. Plugin Version File

**File:** `plugins/nixtla-baseline-lab/.claude-plugin/plugin.json`

```json
{
  "version": "0.7.0"
}
```

### B. CHANGELOG.md

**Location:** Repo root

```markdown
## v0.7.0 – 2025-12-07

### Summary
- Phase 8 complete: TimeGPT integration
- Enhanced golden task harness

### Changes
- Added:
  - TimeGPT forecasting integration
  - Enhanced test coverage
- Fixed:
  - API response parsing edge cases
- Docs / CI:
  - Updated product overview
  - Improved CI validation

### Phase AARs
- Key AARs in `000-docs/`:
  - `022-AA-AACR-phase-8-timegpt-integration`
- Product overview: `6767-OD-OVRV-nixtla-baseline-lab-product-overview.md`
- Test coverage: `023-QA-TEST-nixtla-baseline-lab-test-coverage.md`

### Links
- Plugin README: `plugins/nixtla-baseline-lab/README.md`
- Architecture: `000-docs/6767-OD-ARCH-nixtla-claude-plugin-poc-baseline-lab.md`
```

### C. Release AAR (000-docs)

**Pattern:** `000-docs/NNN-AA-REPT-nixtla-baseline-lab-release-vX-Y-Z.md`

Contents:
- Executive summary
- Context & scope (phases completed)
- Design/decisions (why this bump level)
- Implementation details
- Testing & verification
- Issues/risks/follow-ups
- Release checklist
- Links to related docs

### D. README Updates

**Root README.md:**
- Update "Nixtla Baseline Lab" section version
- Update "Current Status" badge
- Ensure reference links are current

**Plugin README** (`plugins/nixtla-baseline-lab/README.md`):
- Update version references
- Update "What's New" section
- Ensure installation instructions current

### E. Product Overview

**File:** `000-docs/6767-OD-OVRV-nixtla-baseline-lab-product-overview.md`

Updates:
- Version number in metadata
- "Current Status" section
- Phase completion criteria
- New features in capability list
- "Last Updated" date

### F. Git Tags and GitHub Release

**Tag:**
```bash
git tag -a v0.7.0 -m "Phase 8 complete: TimeGPT integration"
```

**GitHub Release Body:**
- Mirror CHANGELOG section
- Highlight key changes
- Link to docs
- List completed phases
- Reference installation instructions

---

## Key Files and Structure

```
nixtla/
├── plugins/nixtla-baseline-lab/          # Plugin location
│   ├── .claude-plugin/plugin.json        # Version source
│   └── README.md                         # Plugin docs
├── 000-docs/                             # Documentation
│   ├── NNN-AA-AACR-phase-XX-...          # Phase AARs
│   ├── 6767-*                            # Canonical docs
│   └── 023-QA-TEST-nixtla-baseline-lab-test-coverage.md
├── .github/workflows/
│   └── nixtla-baseline-lab-ci.yml        # CI workflow
├── CHANGELOG.md                          # Release history
└── README.md                             # Root docs
```

---

## Phase Tracking

- Each development phase has an AAR (After Action Review)
- Phase numbers: 015 through 022 (as of v0.6.0)
- Phase completion typically triggers **minor version bump**

---

## Response Format

When `/nixtla-release` executes, output structure:

### 1. Analysis
- Current version (from plugin.json)
- Last release tag
- Commits since last release (count/types)
- Completed phases (from AARs)
- Summary of changes

### 2. Decision
- Release recommendation (yes/no)
- Bump level (major/minor/patch) with justification
- Proposed `next_version` (MAJOR.MINOR.PATCH)
- 2-3 bullet justification

### 3. Proposed Changes
For each file:
- Path
- Description
- Proposed content excerpts

Files covered:
- `plugins/nixtla-baseline-lab/.claude-plugin/plugin.json`
- `CHANGELOG.md`
- `000-docs/NNN-AA-REPT-nixtla-baseline-lab-release-vX-Y-Z.md`
- `README.md` (root)
- `plugins/nixtla-baseline-lab/README.md`
- `000-docs/6767-OD-OVRV-nixtla-baseline-lab-product-overview.md`

### 4. Suggested Commits
- Conventional commit format: `type(scope): message`
- Grouped by logical changes

### 5. Next Steps
Exact sequence for human execution:
1. Apply diffs
2. Run tests (pytest, golden task harness)
3. Verify CI passes
4. Tag + push
5. Create GitHub Release
6. Notify stakeholders (Max Mergenthaler, Jeremy Longshore)

---

## Stakeholders

- **Max Mergenthaler** - Nixtla CEO
- **Jeremy Longshore** - Intent Solutions

---

## Usage

```bash
/nixtla-release
```

This triggers comprehensive release analysis and proposal workflow including:
1. Analysis of current version, commits, and completed phases
2. Decision on release warrant and version bump
3. Proposed changes for all release artifacts
4. Suggested commits with conventional commit messages
5. Next steps for completing the release

---

**Last Updated:** 2025-12-07
**Command Source:** `/home/jeremy/.claude/commands/nixtla-release-original-backup.md`
