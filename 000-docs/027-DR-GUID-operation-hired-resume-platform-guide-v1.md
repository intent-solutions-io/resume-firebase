# Operation Hired AI Resume Platform
## System Guide & Overview v1.0

**Prepared by**: Intent Solutions IO
**For**: Operation Hired Team
**Date**: December 9, 2025
**Version**: 1.0 (Phase 2.4)

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Candidate Experience](#candidate-experience)
4. [Admin Dashboard](#admin-dashboard)
5. [Understanding Status Codes](#understanding-status-codes)
6. [Integration Notes](#integration-notes)
7. [Technical Reference](#technical-reference)
8. [Support & Contact](#support--contact)

---

## Introduction

Welcome to the Operation Hired AI Resume Platform! This system transforms military service records into polished, civilian-friendly resumes optimized for Applicant Tracking Systems (ATS).

### What This System Does

- **For Veterans**: Upload military documents, receive a professional resume in minutes
- **For Your Team**: Monitor candidates, download resumes, track pipeline status
- **For Employers**: ATS-compatible formats ensure resumes pass automated screening

### Current Status: MVP Testing

This is the **MVP (Minimum Viable Product)** build, ready for testing with real candidates.

**Live URLs:**
- **Main Site**: https://resume-gen-intent-dev.web.app
- **Admin Dashboard**: https://resume-gen-intent-dev.web.app/admin

The system is fully functional. We're using a development frontend with Operation Hired branding during this testing phase. Once we validate the AI processing and resume quality with real candidates, we can discuss next steps for production deployment.

---

## System Overview

### How It Works

```
CANDIDATE JOURNEY
─────────────────────────────────────────────────────────────

Step 1: INTAKE          Step 2: UPLOAD           Step 3: RESUME
────────────────        ────────────────         ────────────────
Candidate enters        Candidate uploads        AI generates
name, email,            military documents       civilian resume
branch, rank, MOS       (DD-214, ERB, etc.)      (PDF & Word)

        │                       │                       │
        ▼                       ▼                       ▼
   [Firestore]            [Cloud Storage]         [Vertex AI]
   Candidate record       Secure document         Gemini processes
   created                storage                 documents

                                                        │
                                                        ▼
                                                  RESUME READY
                                                  ────────────────
                                                  Download PDF/DOCX
                                                  Share link
                                                  ATS-optimized
```

### What Happens Behind the Scenes

1. **Candidate submits info** → Record created in secure database
2. **Documents uploaded** → Stored encrypted in Google Cloud
3. **AI Processing begins** → Google's Vertex AI (Gemini) reads documents
4. **Profile extracted** → Military experience, skills, awards identified
5. **Resume generated** → Civilian-friendly language, ATS formatting
6. **Exports created** → PDF and Word documents generated
7. **Team notified** → Slack notification sent to #operation-hired

---

## Candidate Experience

### Step 1: Start Application

**URL**: https://resume-gen-intent-dev.web.app/intake

Candidates see a welcoming page with the Operation Hired branding and a simple form:

| Field | Description | Example |
|-------|-------------|---------|
| Full Name | Legal name for resume | John Smith |
| Email | Contact email | john.smith@email.com |
| Branch | Military branch served | Army, Navy, Air Force, Marines, Coast Guard, Space Force |
| Rank | Final rank held | E-6, O-3, W-2 |
| MOS/Rate | Military job code | 11B, 0311, IT2 |

After submitting, they're taken to the document upload page.

### Step 2: Upload Documents

Candidates can upload the following document types:

| Document | Description | Importance |
|----------|-------------|------------|
| **DD-214** | Discharge papers | Critical - contains service summary |
| **ERB/ORB** | Enlisted/Officer Record Brief | Important - detailed assignments |
| **Evaluations** | Performance reports (NCOER, OER, FITREP) | Valuable - achievements & leadership |
| **Awards** | Award citations | Good - specific accomplishments |
| **Training** | Certificates, school completions | Helpful - certifications & skills |
| **Existing Resume** | Any current resume | Optional - helps identify gaps |

**Supported formats**: PDF, Word (.doc, .docx), Text files

The system uses drag-and-drop upload with progress indicators.

### Step 3: Resume Generation

After documents are uploaded, candidates can click **"Generate My Resume"** to start processing.

**What they'll see:**
- Processing animation (typically 30-60 seconds)
- Status updates in real-time
- When complete: Download buttons for PDF and Word versions

**Shareable Link**: Each candidate gets a permanent URL they can bookmark:
```
https://resume-gen-intent-dev.web.app/candidate/[their-id]
```

This link always shows their current resume status and download options.

---

## Admin Dashboard

### Accessing the Dashboard

**URL**: https://resume-gen-intent-dev.web.app/admin

> **Current Status**: The admin dashboard is open (no login required) during development. Before production launch, we'll add authentication so only authorized team members can access it.

### Dashboard Home - Candidate List

When you open the admin dashboard, you'll see:

#### Summary Cards (Top)
Four quick-glance statistics:
- **Total Candidates** - Everyone who started the process
- **Resumes Ready** - Completed and downloadable
- **Processing** - Currently being generated
- **Errors** - Need attention

#### Filter Options
Dropdown to filter candidates by status:
- All Statuses
- Created (started but didn't upload docs)
- Documents Uploaded (ready to process)
- Processing (AI working)
- Resume Ready (complete)
- Error (something went wrong)

#### Candidate Table

| Column | What It Shows |
|--------|---------------|
| Name | Candidate's full name |
| Email | Contact email |
| Branch | Military branch |
| Rank | Final rank |
| MOS | Military occupation code |
| Status | Current status (color-coded badge) |
| Created | When they started |
| Actions | "View" button for details |

### Candidate Detail View

Click "View" on any candidate to see their full information:

#### Left Side
**Candidate Information**
- Name, Email, Branch, Rank, MOS
- Current status with color indicator
- Any error messages

**System Information**
- Candidate ID (for support reference)
- Created/Updated timestamps
- Link to their public page

#### Right Side
**Uploaded Documents**
- List of all files they uploaded
- Document type labels (DD-214, ERB, etc.)
- File names

**Resume Preview**
- AI-generated summary
- Extracted skills (top 10 shown)
- Work experience entries
- Download buttons for PDF and Word

**Military Profile** (if available)
- Years of service
- Certifications extracted
- Awards identified

### Downloading Resumes

From the detail page, click:
- **PDF** - Best for printing and formal submissions
- **DOCX** - Best for editing and ATS uploads

Both formats are optimized for:
- ATS (Applicant Tracking System) compatibility
- Clean, professional layout
- Proper heading structure
- Keyword optimization

---

## Understanding Status Codes

| Status | Color | Meaning | Action Needed |
|--------|-------|---------|---------------|
| **Created** | Blue | Candidate started form | Wait for doc upload |
| **Docs Uploaded** | Purple | Documents received | Can manually trigger processing |
| **Processing** | Yellow | AI generating resume | Wait (30-60 seconds) |
| **Resume Ready** | Green | Complete! | Download available |
| **Error** | Red | Something failed | Check error message, contact support |

### Common Error Causes

1. **No text extracted** - Document might be a scanned image without OCR
2. **Processing timeout** - Large files, try splitting documents
3. **Invalid format** - Ensure PDF/DOCX format, not image files

---

## Integration Notes

### Current MVP Status

This is the **Minimum Viable Product (MVP)** build for testing and validation. The system is fully functional and ready for real candidate testing.

**What's Live Now:**
- Complete candidate intake flow
- AI-powered resume generation
- PDF and Word exports
- Admin dashboard for monitoring
- Slack notifications

### Backend Infrastructure

The backend is production-grade and includes:
- Google Cloud infrastructure (secure, scalable)
- Vertex AI processing (Gemini 1.5 Flash)
- Document storage (encrypted)
- Resume generation engine
- PDF/DOCX export
- Slack notifications

### ATS Compatibility

Generated resumes are designed for ATS success:

| Feature | Benefit |
|---------|---------|
| **Simple formatting** | No tables, columns, or graphics that confuse ATS |
| **Standard sections** | Contact, Summary, Experience, Skills, Education |
| **Keyword optimized** | Military terms translated to civilian equivalents |
| **Clean headings** | Proper H1/H2 structure |
| **Standard fonts** | Arial/Helvetica base |
| **PDF/A format** | Archival PDF for maximum compatibility |

### Future Integrations (Roadmap)

The platform can be extended to support:
- Direct job board posting (Indeed, LinkedIn, etc.)
- Employer portal for partner companies
- Email/SMS notifications to candidates
- Interview scheduling integration
- Analytics dashboard

---

## Technical Reference

*For IT administrators and technical team members*

### Architecture

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend | React + TypeScript | User interface |
| Hosting | Firebase Hosting | Web delivery |
| Database | Firestore | Candidate data |
| Storage | Cloud Storage | Document files |
| Processing | Cloud Run | Worker service |
| AI | Vertex AI (Gemini) | Resume generation |
| Exports | Puppeteer + docx | PDF/Word creation |

### Data Collections

| Collection | Contents |
|------------|----------|
| `candidates` | Basic info, status |
| `candidateDocuments` | Upload metadata |
| `candidateProfiles` | AI-extracted military profile |
| `resumes` | Generated resume content & export paths |

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/internal/processCandidate` | POST | Trigger AI processing |
| `/internal/candidateStatus/:id` | GET | Check processing status |
| `/internal/resumeDownload/:id/:format` | GET | Get signed download URL |
| `/health` | GET | Service health check |

### Environment

- **Region**: us-central1 (Iowa)
- **Project**: resume-gen-intent-dev
- **AI Model**: gemini-1.5-flash

---

## Support & Contact

### Getting Help

**Intent Solutions IO**
- Email: jeremy@intentsolutions.io
- Response time: Same business day

### Reporting Issues

When reporting an issue, please include:
1. Candidate ID (from admin detail page)
2. Screenshot of the error
3. Steps to reproduce
4. Time the issue occurred

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 9, 2025 | Initial release with admin dashboard |

---

*This document is confidential and intended for Operation Hired team use.*

**Intent Solutions IO** - Building intelligent solutions for veteran success.

---

*Document ID: 027-DR-GUID*
*Last Updated: December 9, 2025 01:55 CST*
