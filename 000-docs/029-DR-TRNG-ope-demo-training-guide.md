# Operation Hired Resume Platform - Demo & Training Guide

**For**: Ope
**Created**: December 9, 2025
**Author**: Jeremy @ Intent Solutions

---

## What This System Does (30-Second Pitch)

Veterans upload their military documents (DD-214, evaluations, etc.) and our AI automatically creates a professional, ATS-friendly civilian resume in PDF and Word format. The whole process takes about 60 seconds.

**Live Demo URL**: https://resume-gen-intent-dev.web.app

---

## Part 1: Candidate Flow (What Veterans See)

### Step 1: Start the Application

1. Go to: https://resume-gen-intent-dev.web.app/intake
2. Fill out the form:
   - **Full Name**: Enter any test name (e.g., "John Test Smith")
   - **Email**: Use a test email (e.g., "test@example.com")
   - **Branch**: Select from dropdown (Army, Navy, Air Force, Marines, Coast Guard, Space Force)
   - **Rank**: Enter rank (e.g., "E-6", "SGT", "O-3")
   - **MOS/Rate**: Enter military job code (e.g., "11B" for Army Infantry, "0311" for Marine Rifleman)
3. Click **"Continue to Documents"**

### Step 2: Upload Documents

1. You'll land on the document upload page
2. **Drag and drop** or click to upload military documents:
   - DD-214 (discharge papers) - MOST IMPORTANT
   - ERB/ORB (service record)
   - Evaluations (NCOERs, OERs, FITREPs)
   - Awards, training certificates
3. Supported formats: **PDF, Word (.docx), Text files**
4. Click **"Submit Documents"**

### Step 3: Generate Resume

1. You'll see a status page
2. Click **"Generate My Resume"**
3. Watch the progress:
   - Status changes: "Processing..." → "Building Resume..." → "Resume Ready!"
   - Takes about 30-60 seconds
4. When ready, you'll see **Download buttons**:
   - **Download PDF** (green button)
   - **Download Word** (blue button)

### Step 4: Share the Resume

- Each candidate gets a permanent shareable URL: `/candidate/{id}`
- They can bookmark this to return later
- Operations team can share this link with employers

---

## Part 2: Admin Dashboard (What Ops Team Sees)

### Accessing the Dashboard

**URL**: https://resume-gen-intent-dev.web.app/admin

(No login required in dev - will add authentication before production)

### Dashboard Overview

When you open the admin page, you'll see:

**Top Section - Summary Cards**:
- Total Candidates (all submissions)
- Resumes Ready (completed, downloadable)
- Processing (currently generating)
- Errors (need attention)

**Filter Dropdown**:
- Filter by status: All, Created, Docs Uploaded, Processing, Resume Ready, Error

**Candidate Table**:
| Column | What It Shows |
|--------|---------------|
| Name | Candidate's name |
| Email | Contact email |
| Branch | Military branch |
| Rank | Their rank |
| MOS | Job code |
| Status | Color-coded badge |
| Created | When they started |
| Actions | "View" button |

### Viewing a Candidate's Details

1. Click **"View"** on any row
2. You'll see the detail page with:

**Left Side**:
- Candidate info (name, email, branch, rank, MOS)
- Status indicator
- System info (ID, timestamps)
- Link to their public page

**Right Side**:
- List of uploaded documents
- Resume preview (summary, skills, experience)
- **Download buttons** for PDF and DOCX

### Status Colors

| Color | Status | Meaning |
|-------|--------|---------|
| Blue | Created | Started form, waiting for docs |
| Purple | Docs Uploaded | Ready to process |
| Yellow | Processing | AI working (30-60 sec) |
| Green | Resume Ready | Done! Download available |
| Red | Error | Something went wrong |

---

## Part 3: Demo Script (5-Minute Demo)

Use this when showing the system to clients or team members.

### Setup (Before Demo)
- Have the intake URL ready: https://resume-gen-intent-dev.web.app/intake
- Have a sample military document ready (any PDF works for testing)
- Open admin dashboard in another tab: https://resume-gen-intent-dev.web.app/admin

### Demo Flow

**[0:00-0:30] Introduction**
> "This is the Operation Hired Resume Generator. Veterans upload their military documents, and AI creates a professional civilian resume in about 60 seconds."

**[0:30-1:30] Candidate Intake**
- Go to /intake
- Fill in test candidate info
- Show the branch/rank/MOS fields
> "The veteran enters basic info - name, email, their branch, rank, and MOS code."

**[1:30-2:30] Document Upload**
- Upload a test document
- Show drag-and-drop
> "They upload their military documents - DD-214, evaluations, any relevant paperwork. The system accepts PDF, Word, and text files."

**[2:30-3:30] AI Generation**
- Click "Generate My Resume"
- Watch status change
> "Our AI analyzes the documents, extracts their military experience, and translates it into civilian-friendly language. This takes about 30-60 seconds."

**[3:30-4:00] Download Resume**
- Click download buttons
- Open the PDF
> "When ready, they can download in PDF or Word format. These are ATS-optimized, meaning they'll pass through employer screening systems."

**[4:00-5:00] Admin Dashboard**
- Switch to admin tab
- Show the new candidate in list
- Click to view details
> "On the operations side, we have this dashboard to monitor all candidates, filter by status, and download resumes for anyone in the system."

### Demo Tips

1. **If processing takes long**: "The AI is analyzing the documents - normally takes 30-60 seconds"
2. **If error occurs**: "Let me refresh - sometimes the first request takes a moment to warm up"
3. **Highlight key points**:
   - "ATS-optimized" - passes employer screening
   - "60 seconds" - fast turnaround
   - "Professional format" - ready to send to employers

---

## Part 4: Common Questions & Answers

### Technical Questions

**Q: What documents work best?**
A: DD-214 is most important. ERBs and evaluations add detail. The more documents, the better the resume.

**Q: What file formats are supported?**
A: PDF, Word (.docx), and plain text files.

**Q: How long does processing take?**
A: Usually 30-60 seconds. First request of the day might take slightly longer.

**Q: Can candidates edit the resume?**
A: Not yet in the system. They download the Word version and edit locally.

### Business Questions

**Q: Is candidate data secure?**
A: Yes - stored in Google Cloud with encryption. We're adding authentication before production.

**Q: Can we customize the resume template?**
A: Not in MVP. Future feature.

**Q: What if the AI makes a mistake?**
A: Candidates download Word version and can edit. Operations team reviews before sending to employers.

---

## Part 5: Quick Reference

### URLs to Remember

| Page | URL |
|------|-----|
| Intake Form | https://resume-gen-intent-dev.web.app/intake |
| Admin Dashboard | https://resume-gen-intent-dev.web.app/admin |
| Candidate Page | https://resume-gen-intent-dev.web.app/candidate/{id} |

### Who to Contact

- **Technical Issues**: Jeremy @ Intent Solutions (jeremy@intentsolutions.io)
- **Platform Questions**: Jeremy

### What's Coming Next

- **Phase 2.5**: Admin authentication (login required)
- **Phase 2.6**: Edit capabilities in admin
- **Future**: Email notifications, employer portal

---

## Checklist: Before Your First Demo

- [ ] Visited the intake form and understood each step
- [ ] Uploaded a test document and generated a resume
- [ ] Opened the admin dashboard and explored
- [ ] Downloaded both PDF and DOCX versions
- [ ] Practiced the 5-minute demo script once
- [ ] Know how to answer common questions

---

**You're ready to demo!**

If anything goes wrong during a demo, just say "Let me refresh that" and reload the page. The system is stable but sometimes needs a moment on the first request.

Questions? Reach out to Jeremy.
