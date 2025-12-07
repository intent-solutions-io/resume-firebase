# CLAUDE.md - Resume Generator Project

## Document Filing Rules (HARD RULES)

### 6767 Canonical Standards Storage
- **All 6767 canonical docs MUST live in `000-docs/6767-a/`** (or `6767-b/`, `6767-c/` when overflow occurs)
- **NEVER place 6767-*.md files directly in `000-docs/`** - always use the 6767-a/ subfolder
- Overflow threshold: Create `6767-b/` when `6767-a/` exceeds 50 files

### NNN Project Docs Storage
- **All NNN project docs live at the top level of `000-docs/`**
- **NEVER place NNN docs inside `6767-*` folders**

### After Action Reviews (AARs)
- After every phase of work, create an AAR in `000-docs/` following:
  `NNN-AA-AACR-phase-<n>-short-description.md`

---

## Where Things Go (Quick Reference)

| Document Type | Location |
|---------------|----------|
| NNN project docs (001-, 002-, etc.) | `000-docs/` |
| NNN After Action Reviews | `000-docs/` (e.g., `010-AA-AACR-phase-1-review.md`) |
| 6767 canonical standards | `000-docs/6767-a/` (then `6767-b/`, `6767-c/` as needed) |

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
See full standard: `000-docs/6767-a/6767-DR-STND-document-filing-system-standard-v4.md`
