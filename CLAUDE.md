## Task Tracking (Beads / bd)
- Use `bd` for ALL tasks/issues (no markdown TODO lists).
- Start of session: `bd ready`
- Create work: `bd create "Title" -p 1 --description "Context + acceptance criteria"`
- Update status: `bd update <id> --status in_progress`
- Finish: `bd close <id> --reason "Done"`
- End of session: `bd sync` (flush/import/export + git sync)
- Manual testing safety:
  - Prefer `BEADS_DIR` to isolate a workspace if needed. (`BEADS_DB` exists but is deprecated.)


# CLAUDE.md - Resume Generator Project

## Docs Folder Rule (STRICT)

- **Keep `000-docs/` strictly flat (no subfolders).**
- Both NNN and 6767 files live directly in `000-docs/`.
- After every phase, create an AAR in `000-docs/` as:
  `NNN-AA-AACR-phase-<n>-short-description.md`

---

## Where Things Go (Quick Reference)

| Document Type | Location |
|---------------|----------|
| NNN project docs (001-, 002-, etc.) | `000-docs/` |
| NNN After Action Reviews | `000-docs/` (e.g., `010-AA-AACR-phase-1-review.md`) |
| 6767 canonical standards | `000-docs/` (same folder, flat) |

---

## Filename Patterns

### Project Docs
```
NNN-CC-ABCD-short-description.md
```
Example: `001-PP-PROD-mvp-requirements.md`

### Canonical Standards
```
6767-[TOPIC-]CC-ABCD-short-description.md
```
Example: `6767-DR-STND-document-filing-system-standard-v4.md`

**Important:** No numeric IDs after `6767-` in filenames (v3+ rule). Document IDs like `6767-120` may appear in headers only.

---

## Reference
See full standard: `000-docs/6767-DR-STND-document-filing-system-standard-v4.md`
