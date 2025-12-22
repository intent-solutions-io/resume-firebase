---
name: beads-expert
description: Manage distributed graph-based issue tracking with bd (beads). Track multi-session work with dependencies, hierarchies, and persistent memory across conversation compactions. Use when managing complex tasks spanning multiple sessions, organizing epics with subtasks, or needing dependency tracking. Trigger with "create beads issue", "bd commands", "track task with beads", "organize work dependencies".
allowed-tools: "Bash(bd:*),Bash(git:*),Read,Write,Grep,Glob"
version: "1.0.0"
author: "Jeremy Longshore <jeremy@intentsolutions.io>"
license: "MIT"
tags: ["task-management", "issue-tracking", "dependencies", "workflow", "git-backed"]
---

# Beads Expert Skill

Distributed, git-backed graph issue tracker optimized for AI agents with persistent memory across sessions.

## Overview

Beads (bd) is a task management system that:
- **Survives compaction**: Issues persist when conversation history is summarized
- **Dependency graphs**: Block/unblock work based on prerequisites
- **Git-backed**: JSONL storage in `.beads/` (versioned like code)
- **Hash-based IDs**: Collision-free identifiers (e.g., `bd-a1b2c3`)
- **Agent-optimized**: JSON output, automatic sync, session workflows

**Official Repository**: https://github.com/steveyegge/beads

## When to Use

- ✅ **bd**: Tasks spanning multiple sessions, complex dependencies, fuzzy boundaries
- ❌ **TodoWrite**: Single-session work, simple step-by-step execution

**Rule**: "If resuming after 2 weeks would be difficult without bd, use bd."

## Prerequisites

- `bd` CLI installed globally
- Git repository initialized
- Git hooks installed: `bd hooks install`

## Core Workflow

### Session Start
```bash
bd ready --json                      # Show unblocked work
bd list --status in_progress --json # Resume in-progress
bd show <issue-id> --json           # Read detailed context
```

### Create Issues
```bash
bd create "Title" -p 1 -t task -d "Description" --json
bd create "Title" --labels critical,demo-prep --json
bd create "Title" --parent epic-id --json  # Child task
```

### Update Progress
```bash
bd update <id> --status in_progress --json
bd update <id> --notes "COMPLETED: X. IN_PROGRESS: Y. NEXT: Z." --json
bd update <id> --design "Architecture approach" --json
```

### Dependencies
```bash
bd dep add <child> <parent> --type blocks       # Hard blocker
bd dep add <id> <source> --type discovered-from # Provenance
bd dep tree <id>                                # Visualize
```

### Close Work
```bash
bd close <id> --reason "Implemented in PR #42" --json
bd close <id1> <id2> <id3> --reason "Batch" --json
```

### Sync & Push
```bash
bd sync  # Force export/commit/push (bypass 30s debounce)
```

## Dependency Types

| Type | Purpose | Affects `bd ready`? |
|------|---------|---------------------|
| **blocks** | Hard sequential blocker | ✅ YES |
| **parent-child** | Epic/subtask hierarchy | ❌ NO |
| **related** | Informational link | ❌ NO |
| **discovered-from** | Provenance tracking | ❌ NO |

**Only `blocks` affects work readiness!**

## Issue Metadata Fields

| Field | Update Frequency | Purpose |
|-------|------------------|---------|
| `description` | Never (immutable) | Problem statement |
| `design` | Rarely (evolves) | Implementation approach |
| `acceptance` | Mark items complete | Success criteria checklist |
| `notes` | Every session/milestone | Handoff context |
| `status` | Phase transitions | Workflow state |

## Compaction Survival (CRITICAL)

**After compaction, bd is your ONLY persistent memory!**

Write notes assuming **zero conversation context**:

```markdown
COMPLETED:
- Implemented PDF export using Puppeteer
- Created IntakeCompletePage component

IN_PROGRESS:
- Fixing "Generate Resume" button validation
- File: frontend/src/pages/IntakeCompletePage.tsx:120

NEXT:
- Add error messages for API failures
- Test full candidate flow locally

BLOCKERS:
- None

KEY DECISIONS:
- Using fetchCandidateDocuments() from adminData.ts
- Validation checks document count before enabling button
```

**Quality check**: "Could another developer resume this work without asking questions?"

## Landing the Plane (Session End)

**Mandatory workflow when ending ANY session:**

```bash
# 1. File remaining work
bd create "Follow-up task" -p 2 --json

# 2. Update status
bd update <id> --notes "Session context" --json
bd close <finished-ids> --reason "Done" --json

# 3. MANDATORY: Push to remote
git pull --rebase
bd sync                    # Export + commit
git push                   # MUST succeed
git status                 # Verify "up to date"
```

**CRITICAL**: Work is NOT complete until `git push` succeeds.

## Common Patterns

### Epic Planning
```bash
# 1. Create epic
bd create "Epic: Feature Name" -t epic -p 1 --json
# Returns: project-abc

# 2. Create child tasks
bd create "Task 1" --parent project-abc -p 1 --json
# Returns: project-abc.1

# 3. Create subtasks
bd create "Subtask 1.1" --parent project-abc.1 --json
# Returns: project-abc.1.1

# 4. Add blocking
bd dep add project-abc.1.2 project-abc.1.1 --type blocks
```

### Discovery Workflow
```bash
# Found new work during implementation
bd create "Fix: Validation missing" \
  -p 1 \
  --deps discovered-from:current-task-id \
  -d "Discovered during document display work" \
  --json
```

### Unblocking
```bash
bd blocked --json  # See what's stuck
bd close <blocker-id> --reason "Fixed" --json
bd ready --json    # Shows newly unblocked work
```

## Priority System

| Priority | Label | Use Case |
|----------|-------|----------|
| 0 | P0 / Critical | Production broken |
| 1 | P1 / High | Must complete this sprint |
| 2 | P2 / Medium | Should complete soon (default) |
| 3 | P3 / Low | Nice to have |
| 4 | P4 / Backlog | Someday/maybe |

## Error Handling

### Nothing in `bd ready`
```bash
bd blocked --json  # Identify stuck work
# Work on blockers, then check again
```

### Git worktree issues
```bash
bd --no-daemon <command>
# OR
export BEADS_NO_DAEMON=1
```

### JSONL conflicts
```bash
git checkout --theirs .beads/issues.jsonl
bd import -i .beads/issues.jsonl
```

## Output

This skill produces:
- Issues tracked in `.beads/beads.db` (SQLite)
- Git-committed JSONL in `.beads/issues.jsonl`
- Dependency graphs visualized via `bd dep tree`
- Session context preserved in issue notes

## Resources

- Official Repo: https://github.com/steveyegge/beads
- Workflow guide: {baseDir}/SKILL-BEADS-WORKFLOWS.md
- Architecture: {baseDir}/SKILL-BEADS-ARCHITECTURE.md (if exists)
- Built-in help: `bd quickstart`

## Examples

### Example 1: Demo Prep Epic
```bash
# Create parent epic
bd create "Demo Prep: Fix All Issues" -t epic -p 1 --labels demo-prep --json

# Create tasks
bd create "Fix: Document display" --parent firebase-dbl -p 1 --json
bd create "Fix: Button validation" --parent firebase-dbl -p 1 --json

# Add subtasks
bd create "Add document query" --parent firebase-dbl.1 --estimate 30 --json
bd create "Create UI component" --parent firebase-dbl.1 --estimate 45 --json

# Visualize
bd dep tree firebase-dbl
```

### Example 2: Session Resume
```bash
# After days away
bd stats --json
bd list --status in_progress --json
bd show firebase-dbl.2 --json

# Continue work
bd update firebase-dbl.2 --status in_progress --json
```

### Example 3: Landing the Plane
```bash
bd update firebase-dbl.1 --notes "COMPLETED: Document display. NEXT: Testing" --json
bd close firebase-dbl.1 firebase-dbl.3 --reason "Done" --json
bd sync && git push
git status  # Verify
```
