# Bob Release Command Reference

**Document Type:** Reference Guide (DR-REFF)
**Created:** 2025-12-07
**Status:** Active
**Command:** `/bob-release`

---

## Command Metadata

```yaml
name: bob-release
description: Precision release engineering for bobs-brain with canonical ADK/Vertex patterns, automated analysis, and impeccable audit trails
model: claude-opus-4-5-20251101
```

---

## Overview

This command executes **Chief Architect + Release Engineer** workflow for the `bobs-brain` repository, the canonical reference implementation for ADK/Vertex agent development.

Every release demonstrates engineering excellence with:
- Precise versioning (XXX.YYY.ZZZ format)
- Complete audit trails
- Automated validation
- Performance benchmarks
- Security verification

---

## Versioning Scheme

**Format:** `XXX.YYY.ZZZ` (leading zeros required)

- **XXX** = Major (breaking changes, architectural shifts)
- **YYY** = Minor (features, capabilities, integrations)
- **ZZZ** = Patch (fixes, optimizations, docs)

### Smart Version Detection

```bash
#!/bin/bash
# Version discovery with fallback chain
get_current_version() {
    # Priority 1: VERSION file
    if [[ -f VERSION ]]; then
        cat VERSION
    # Priority 2: Latest git tag
    elif git describe --tags --match "v[0-9][0-9][0-9].[0-9][0-9][0-9].[0-9][0-9][0-9]" 2>/dev/null; then
        git describe --tags --abbrev=0 | sed 's/^v//'
    # Priority 3: package.json
    elif [[ -f package.json ]]; then
        jq -r '.version' package.json | awk -F. '{printf "%03d.%03d.%03d", $1, $2, $3}'
    # Priority 4: Bootstrap
    else
        echo "000.000.000"
    fi
}

current_version=$(get_current_version)
```

### Automated Commit Analysis

```python
import re
from collections import defaultdict

def analyze_commits(since_tag):
    commits = git_log(since_tag)

    categories = defaultdict(list)
    bump_level = "patch"

    for commit in commits:
        # Parse conventional commits
        match = re.match(r'^(\w+)(?:\(([^)]+)\))?(!)?:\s*(.+)', commit.message)

        if match:
            type, scope, breaking, subject = match.groups()

            if breaking or "BREAKING" in commit.body:
                categories["breaking"].append(commit)
                bump_level = "major"
            elif type == "feat":
                categories["features"].append(commit)
                if bump_level != "major":
                    bump_level = "minor"
            elif type == "fix":
                categories["fixes"].append(commit)
            elif type == "perf":
                categories["performance"].append(commit)
            elif type == "security":
                categories["security"].append(commit)
                if bump_level == "patch":
                    bump_level = "minor"  # Security updates warrant minor bump
            else:
                categories[type].append(commit)

    return categories, bump_level
```

---

## Release Phases

### Phase 1: Intelligent Version Analysis
- Smart version detection from multiple sources
- Automated commit categorization
- Bump level determination

### Phase 2: Contributor Recognition System
- Code contributors (>5 commits) - Featured
- Feature developers (feat: commits) - Highlighted
- Security researchers - Special thanks
- Documentation writers - Acknowledged
- Bug reporters - Mentioned

### Phase 3: Performance & Quality Gates
- Test suite execution and timing
- Code coverage validation (80%+ threshold)
- Build optimization metrics
- Security audit
- Vertex AI Agent validation
- ADK compliance check

### Phase 4: Advanced Changelog Generation
AI-enhanced changelog with:
- Mission statement
- Architecture changes
- Features & enhancements
- Fixes & improvements
- Performance metrics table
- Security updates
- Contributor recognition
- Code metrics
- Migration guide (if breaking changes)

### Phase 5: Release Artifact Generation
- Release notes
- Technical audit
- Deployment package (tar.gz)
- Checksums (SHA256)
- GPG signatures

### Phase 6: Automated Deployment
- Multi-environment deployment
- Canary rollout to Vertex AI
- Smoke tests
- Metrics monitoring
- Production deployment

### Phase 7: GitHub Release with Signatures
- Signed git tag
- GitHub release with artifacts
- Discussion category setup

### Phase 8: Post-Release Verification
- Version propagation checks
- Deployment verification
- Documentation validation
- Performance bounds checking
- Security verification

---

## Decision Matrix

```python
def determine_release_action():
    # Collect all signals
    commits = analyze_commits()
    days_since_last = get_days_since_last_release()
    pending_security = check_security_updates()
    performance_regression = check_performance_regression()

    # Decision tree
    if commits.breaking_changes:
        return "MAJOR", "Breaking changes require major version"

    if pending_security and pending_security.severity >= "HIGH":
        return "MINOR", "Security update (expedited)"

    if performance_regression:
        return "PATCH", "Performance regression fix (expedited)"

    if commits.features:
        if days_since_last < 7 and len(commits.features) < 3:
            return "WAIT", f"Only {len(commits.features)} features - accumulate more"
        return "MINOR", f"{len(commits.features)} new features ready"

    if commits.fixes:
        if days_since_last < 14 and len(commits.fixes) < 5:
            return "WAIT", "Accumulate more fixes"
        return "PATCH", f"{len(commits.fixes)} fixes accumulated"

    if days_since_last > 30:
        return "PATCH", "Monthly maintenance release"

    return "SKIP", "No significant changes"
```

---

## Execution Timeline

When you run `/bob-release`:

1. **Analyze** - Complete git forensics, performance baselines (45s)
2. **Validate** - ADK compliance, security, performance (1m)
3. **Document** - Changelog, audit trail, technical docs (30s)
4. **Package** - Signed artifacts, checksums (20s)
5. **Deploy** - Canary rollout to Vertex AI (3m)
6. **Release** - GitHub release with artifacts (30s)
7. **Verify** - Complete validation suite (1m)

**Total:** ~7 minutes for production release

---

## Deliverables

- Precise XXX.YYY.ZZZ versioning
- Complete audit trail
- Performance benchmarks
- Security verification
- ADK compliance certification
- Signed, reproducible artifacts
- Automated canary deployment
- Comprehensive validation

---

## Performance Metrics Tracked

| Metric | Measurement |
|--------|-------------|
| Cold Start | Time to first response |
| Response Time | Average response latency |
| Memory Usage | Peak memory consumption |
| Token Efficiency | Tokens per operation |

---

## Quality Gates

- ✅ All tests passing
- ✅ Coverage ≥ 80%
- ✅ No high/critical security vulnerabilities
- ✅ ADK compliance: 100%
- ✅ Performance within bounds
- ✅ Vertex AI agent validation passed

---

**Last Updated:** 2025-12-07
**Command Source:** `/home/jeremy/.claude/commands/bob-release.md`
