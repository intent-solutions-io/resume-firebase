# Phase 2.1: Internal Slack Notifications (New Candidate + Resume Ready)

**Document ID**: 023-AA-REPT
**Phase**: 2.1
**Date**: 2025-12-08 23:00 CST (America/Chicago)
**Author**: Claude Opus 4.5
**Status**: In Progress

---

## Executive Summary

Phase 2.1 adds minimal internal notifications to the `#operation-hired` Slack channel so the team knows when:

1. A **new candidate** submits the intake form (new record with uploaded docs)
2. A candidate's **resume is ready** (AI + export complete, PDF/DOCX available)

This uses Slack Incoming Webhooks. No email/SMS/WhatsApp. Candidate-facing UX unchanged.

## Scope

**In Scope:**
- Slack notifier service module
- New candidate notification on intake
- Resume ready notification after AI/export pipeline
- De-duplication via Firestore fields
- Environment variable for webhook URL

**Out of Scope:**
- Email notifications
- SMS/WhatsApp
- Candidate-facing notifications
- Admin dashboard

## Plan

1. [x] Create Phase 2.1 AAR document
2. [x] Create Slack notifier service module
3. [x] Add Firestore de-duplication fields (firstSlackNotifiedAt, resumeSlackNotifiedAt)
4. [x] Hook new candidate notification into processCandidate (step 2.5)
5. [x] Hook resume ready notification into processCandidate (step 10)
6. [x] Update README with Phase 2.1 documentation
7. [ ] Test notifications (requires deployment with webhook configured)

## Changes Made

| File | Change |
|------|--------|
| `000-docs/023-AA-REPT-phase-2-1-slack-notifications-internal.md` | This AAR |
| `services/worker/src/services/slackNotifier.ts` | Slack notification service (notifyNewCandidate, notifyResumeReady) |
| `services/worker/src/handlers/processCandidateHandler.ts` | Both notifications hooked into processing pipeline |
| `services/worker/src/types/candidate.ts` | Added firstSlackNotifiedAt field to Candidate type |
| `README.md` | Phase 2.1 documentation and SLACK_OPERATION_HIRED_WEBHOOK_URL env var |

## Firestore Schema Updates

### candidates/{candidateId} (additions)

```typescript
{
  // ... existing fields ...
  firstSlackNotifiedAt?: Timestamp;  // Set after "new candidate" notification
}
```

### resumes/{candidateId} (additions)

```typescript
{
  // ... existing fields ...
  resumeSlackNotifiedAt?: Timestamp;  // Set after "resume ready" notification
}
```

## Environment Variables

```bash
SLACK_OPERATION_HIRED_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

Note: Store in Secret Manager and inject as env var in Cloud Run.

## Slack Message Formats

### New Candidate Intake

```
🆕 New Candidate Intake
Name: John Smith
Email: john.smith@email.com
Branch/Rank/MOS: Army / E-6 / 11B
View: https://app.example.com/intake/complete/cand_123
```

### Resume Ready

```
🎖 Resume Ready
Name: John Smith
Branch/Rank/MOS: Army / E-6 / 11B
Downloads available: PDF, DOCX
View: https://app.example.com/intake/complete/cand_123
```

## Risks & Unknowns

1. **Webhook URL security**: Must be stored in Secret Manager, not hardcoded
2. **Rate limiting**: Slack has rate limits; high volume could hit limits
3. **Webhook failures**: Non-blocking; failures logged but don't crash pipeline

## Test Results

| Test | Result | Notes |
|------|--------|-------|
| TypeScript build | PASS | Worker compiles with all Slack notification code |
| New candidate notification | PENDING | Requires deployment with webhook |
| Resume ready notification | PENDING | Requires deployment with webhook |
| De-duplication (no duplicates) | PENDING | Requires deployment |
| Missing webhook URL handling | PASS | Gracefully skips with console.warn if not set |

## Next Actions

- Phase 2.2: Email notifications to candidates
- Phase 2.3: Admin review dashboard
- Phase 2.4: Custom resume templates

---

intent solutions io - confidential IP
Contact: jeremy@intentsolutions.io

---

**Phase 2.1 Started**: 2025-12-08 23:00 CST (America/Chicago)
**Phase 2.1 Code Complete**: 2025-12-09 (continued session)
**Deployment Status**: Ready - requires SLACK_OPERATION_HIRED_WEBHOOK_URL env var in Cloud Run
