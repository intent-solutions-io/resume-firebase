# Operation Hired - Veteran Flow Test Script

**Tester:** Ope
**Date:** _______________
**Environment:** Production / Staging (circle one)
**URL:** _______________

---

## Instructions for Ope

1. Follow each step exactly as written
2. Mark each step: ✅ Pass | ❌ Fail | ⏭️ Skipped
3. If FAIL: Create a GitHub Issue with:
   - Step number that failed
   - What you expected
   - What actually happened
   - Screenshot if possible
4. Mubeen will convert issues to PRs for Jeremy's review

---

## FLOW 1: Home Page

### Page: Home (`/`)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 1.1 | Open the website URL | Home page loads, no errors | ⬜ | |
| 1.2 | Look at the page | See hero section with Operation Hired branding | ⬜ | |
| 1.3 | Look for trust badges | See "Secure & Private", "Veteran-Owned", "100% Free" | ⬜ | |
| 1.4 | Find the main button | See "Get Started" button (or similar CTA) | ⬜ | |
| 1.5 | Click "Get Started" | Page navigates to intake form (`/intake`) | ⬜ | |

---

## FLOW 2: Intake Form (Your Info)

### Page: Intake (`/intake`)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 2.1 | Page loads | See step indicator showing "Step 1 of 3" or "Your Info" | ⬜ | |
| 2.2 | Look at form fields | See: Full Name, Email, Branch of Service, Rank, MOS fields | ⬜ | |
| 2.3 | Click Submit with ALL fields empty | Shows error - Name is required | ⬜ | |
| 2.4 | Enter only Name, click Submit | Shows error - Email is required | ⬜ | |
| 2.5 | Enter Name + fake email "notreal", Submit | Shows error - invalid email format | ⬜ | |
| 2.6 | Enter Name + valid email, Submit | Shows error - Branch is required | ⬜ | |
| 2.7 | Click Branch dropdown | See all 6 options: Army, Navy, Air Force, Marines, Coast Guard, Space Force | ⬜ | |
| 2.8 | Select "Army" from dropdown | Dropdown shows "Army" selected | ⬜ | |
| 2.9 | Leave Rank empty | (Should be optional - no error) | ⬜ | |
| 2.10 | Leave MOS empty | (Should be optional - no error) | ⬜ | |
| 2.11 | Fill in Rank field | Text appears in field | ⬜ | |
| 2.12 | Fill in MOS field | Text appears in field | ⬜ | |
| 2.13 | Click Submit/Continue with valid data | Page navigates to document upload | ⬜ | |
| 2.14 | Check URL | URL should be `/intake/{some-id}/documents` | ⬜ | |

**Test Data to Use:**
- Name: `Test Veteran Ope`
- Email: `ope.test@operationhired.com`
- Branch: `Army`
- Rank: `SSG`
- MOS: `11B`

---

## FLOW 3: Document Upload

### Page: Documents (`/intake/{id}/documents`)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.1 | Page loads | See step indicator "Step 2 of 3" or "Documents" | ⬜ | |
| 3.2 | See upload area | See drag-and-drop zone with instructions | ⬜ | |
| 3.3 | See document type info | Instructions mention DD-214, ERB, evaluations, etc. | ⬜ | |

### Upload via Click

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.4 | Click the upload zone | File picker opens | ⬜ | |
| 3.5 | Select a PDF file (under 10MB) | File appears in list below upload zone | ⬜ | |
| 3.6 | Check file status | Shows "Pending" or similar status | ⬜ | |

### Upload via Drag & Drop

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.7 | Drag a file from desktop to upload zone | Zone highlights/changes color | ⬜ | |
| 3.8 | Drop the file | File appears in list | ⬜ | |

### Document Classification

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.9 | Find dropdown next to uploaded file | See document type dropdown | ⬜ | |
| 3.10 | Click the dropdown | See options: DD-214, ERB/ORB, Evaluation, Award, Training, Existing Resume, Other | ⬜ | |
| 3.11 | Select "DD-214" | Dropdown shows DD-214 selected | ⬜ | |

### File Management

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.12 | Find remove/X button on file row | See X or trash icon | ⬜ | |
| 3.13 | Click remove on one file | File removed from list | ⬜ | |
| 3.14 | Add file back | File reappears in list | ⬜ | |

### Multiple Files

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.15 | Add 3 different files | All 3 appear in list | ⬜ | |
| 3.16 | Set different types for each | Each shows its selected type | ⬜ | |

### File Validation (Negative Tests)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.17 | Try to upload a .exe file | Rejected with error message | ⬜ | |
| 3.18 | Try to upload file larger than 10MB | Rejected with error message | ⬜ | |
| 3.19 | Try to upload .txt file | Rejected (only PDF, DOC, DOCX, images allowed) | ⬜ | |

### Upload Execution

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.20 | Click "Upload" or "Upload All" button | Upload starts | ⬜ | |
| 3.21 | Watch file statuses | Status changes: Pending → Uploading → Success | ⬜ | |
| 3.22 | Wait for all uploads | All files show Success/checkmark | ⬜ | |

### Continue to Resume

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.23 | Find "Continue" button | Button visible after uploads complete | ⬜ | |
| 3.24 | Click Continue | Navigates to resume generation page | ⬜ | |
| 3.25 | Check URL | URL should be `/intake/{id}/complete` | ⬜ | |

### Skip Documents (Alternative Path)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 3.26 | (Start fresh) Go back to documents page with no files | See "Skip for now" option | ⬜ | |
| 3.27 | Click "Skip for now" | Proceeds to next step without documents | ⬜ | |

---

## FLOW 4: Resume Generation & Download

### Page: Complete (`/intake/{id}/complete`)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 4.1 | Page loads | See processing status indicator | ⬜ | |
| 4.2 | Watch status | Status updates automatically (no refresh needed) | ⬜ | |
| 4.3 | See status progression | Shows: Processing → Generating Resume → Resume Ready | ⬜ | |
| 4.4 | Wait for completion | Status shows "Resume Ready" (green) | ⬜ | |

### Resume Preview

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 4.5 | See resume preview section | Shows Summary section | ⬜ | |
| 4.6 | See skills | Shows list of skills extracted | ⬜ | |
| 4.7 | See experience | Shows work/military experience translated to civilian terms | ⬜ | |

### Download Buttons

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 4.8 | Find PDF download button | See green "Download PDF" button | ⬜ | |
| 4.9 | Find DOCX download button | See blue "Download DOCX" button | ⬜ | |
| 4.10 | Click PDF button | Button shows loading spinner | ⬜ | |
| 4.11 | Wait for PDF | PDF opens in new tab or downloads | ⬜ | |
| 4.12 | Open the PDF | PDF contains resume content, looks professional | ⬜ | |
| 4.13 | Click DOCX button | Button shows loading spinner | ⬜ | |
| 4.14 | Wait for DOCX | DOCX file downloads | ⬜ | |
| 4.15 | Open the DOCX | Document opens in Word, content is correct | ⬜ | |

### Return Later (Bookmark Test)

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 4.16 | Copy the current URL | URL copied | ⬜ | |
| 4.17 | Close the browser tab | Tab closed | ⬜ | |
| 4.18 | Open new tab, paste URL | Page loads | ⬜ | |
| 4.19 | Check content | Resume still there, can still download | ⬜ | |

### Canonical URL Test

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 4.20 | Note the candidate ID from URL | ID noted | ⬜ | |
| 4.21 | Navigate to `/candidate/{id}` | Redirects to complete page OR shows resume | ⬜ | |

---

## FLOW 5: Error Handling

### Invalid URLs

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 5.1 | Go to `/intake/fake123/documents` | Shows error or redirects appropriately | ⬜ | |
| 5.2 | Go to `/intake/fake123/complete` | Shows error or redirects appropriately | ⬜ | |
| 5.3 | Go to `/candidate/doesnotexist` | Shows 404 or error message | ⬜ | |

### Network Error Simulation

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 5.4 | Turn off WiFi, try to submit form | Shows network error message | ⬜ | |
| 5.5 | Turn WiFi back on, retry | Works normally | ⬜ | |

---

## FLOW 6: Mobile Testing

### Repeat Key Flows on Phone

| # | Action | Expected Result | Status | Notes |
|---|--------|-----------------|--------|-------|
| 6.1 | Open site on mobile phone | Page loads, layout is responsive | ⬜ | |
| 6.2 | Fill intake form on mobile | All fields accessible, keyboard works | ⬜ | |
| 6.3 | Upload document on mobile | Can select file from phone | ⬜ | |
| 6.4 | Download PDF on mobile | PDF opens or downloads | ⬜ | |
| 6.5 | Check all buttons are tappable | No buttons too small to tap | ⬜ | |

---

## Test Summary

| Flow | Total Tests | Passed | Failed | Skipped |
|------|-------------|--------|--------|---------|
| 1. Home Page | 5 | | | |
| 2. Intake Form | 14 | | | |
| 3. Document Upload | 27 | | | |
| 4. Resume Generation | 21 | | | |
| 5. Error Handling | 5 | | | |
| 6. Mobile Testing | 5 | | | |
| **TOTAL** | **77** | | | |

---

## Issue Template for Failures

When creating a GitHub issue for a failed test:

```
## Test Failure Report

**Test #:** [e.g., 3.17]
**Test Name:** [e.g., Try to upload a .exe file]
**Tester:** Ope
**Date:** [date]
**Environment:** [Production/Staging + URL]

### Expected
[What should have happened]

### Actual
[What actually happened]

### Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [etc.]

### Screenshot
[Attach screenshot if applicable]

### Browser/Device
[e.g., Chrome 120 on Windows 11 / Safari on iPhone 15]
```

---

## Sign-Off

**Tester Name:** _______________
**Date Completed:** _______________
**Overall Result:** PASS / FAIL (circle one)
**Total Issues Created:** _______________

**Notes:**
_________________________________________
_________________________________________
_________________________________________
