# Operation Hired - Demo Meeting Notes

**Date:** January 7, 2026
**Attendees:** Pablo, Sheridan, Jeremy
**Purpose:** Resume Generator Demo & Business Discussion

---

## Demo Highlights

- Full workflow demonstrated: intake → document upload → 3-PDF generation
- **3 Outputs:** Military resume, Civilian resume, Crosswalk document
- ATS optimization with 85% keyword match target
- Job description integration for tailored resumes
- Firebase secure storage with configurable retention

---

## Key Discussion Points

### 1. Document Retention Policy
- Currently: 90 days default
- Options: 12 hours, 7 days, or custom
- **Decision Needed:** Sheridan to confirm preferred retention period
- Add user disclaimer about retention + redaction responsibility

### 2. ATS Integration (Polaris)
- Sheridan to connect Jeremy with Polaris team
- Need API docs for automatic resume upload
- Goal: Generated resume → directly into their ATS

### 3. Missing Data Handling
- Proposed: Chatbot to prompt users for missing info (dates, etc.)
- Ensures resume completeness before generation

### 4. User Accounts
- Currently: No accounts required (stateless)
- Pro: Simple, no friction
- Con: Must re-upload docs each time
- **Decision:** Beta test first, gather feedback

### 5. Resume Templates
- Sheridan to send additional templates
- Will improve AI output formatting

---

## Business Model Discussion

| Model | Notes |
|-------|-------|
| Revenue Share (50/50) | Discussed but tracking unclear |
| Monthly Subscription | Sheridan mentioned as option |
| Setup + Subscription | Another option mentioned |

**Status:** TBD - follow-up meeting needed

---

## Action Items

| Task | Owner | Status |
|------|-------|--------|
| Connect Jeremy with Polaris ATS team for API docs | Sheridan | Pending |
| Decide document retention period (12hr/7d/90d) | Sheridan | Pending |
| Send resume templates to improve AI output | Sheridan | Pending |
| Review/update privacy policy & ToS | Jeremy | Pending |
| Schedule business model follow-up | Both | Pending |
| Add user disclaimer for doc retention | Jeremy | Pending |
| Implement drag-and-drop upload | Jeremy | Backlog |
| Chatbot for missing data | Jeremy | Backlog |

---

## Technical Notes (from Jeremy)

- Reverted unintended features before demo
- LinkedIn: URL only, no photo upload
- Google Firebase for secure storage
- Privacy policy already in place
- Ready to adapt output format based on ATS requirements

---

## Next Steps

1. **Sheridan:** Polaris API intro + retention decision + templates
2. **Jeremy:** Privacy policy review + prepare integration spec
3. **Both:** Schedule business model discussion

---

*Notes compiled: January 7, 2026*
