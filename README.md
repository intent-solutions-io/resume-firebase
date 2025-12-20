# Operation Hired - Resume Generator

AI-powered military-to-civilian resume generator.

---

## For QA Testers (Ope & Mubeen)

### Ope: Testing

1. Open `000-docs/032-QA-TEST-ope-veteran-flow-test-script.md`
2. Follow each step, mark Pass/Fail
3. If something fails → Create GitHub Issue

### Creating an Issue

1. Go to GitHub → Issues → New Issue
2. Pick a template:
   - **QA Bug** - something broke
   - **QA UX** - works but confusing
   - **QA Missing** - feature not there
3. Fill in the blanks, attach screenshot if helpful

### Mubeen: Fixing

1. Check assigned issues
2. Create branch: `fix/issue-NUMBER`
3. Fix the bug
4. Create PR → tag Jeremy for review

---

## Project Structure

```
generator/
├── 000-docs/              # Project documentation (6767 + NNN standards)
├── src/                   # Source code
│   ├── generators/        # Format-specific generators
│   ├── parsers/           # Data parsers
│   ├── templates/         # Template engine
│   └── utils/             # Utility functions
├── templates/             # Resume templates
│   ├── modern/            # Modern template
│   ├── classic/           # Classic template
│   └── minimal/           # Minimal template
├── data/                  # Resume data files
│   ├── examples/          # Example resumes
│   └── schemas/           # JSON schemas
├── output/                # Generated resumes
├── tests/                 # Test suite
├── config/                # Configuration files
└── scripts/               # Automation scripts
```

## Quick Start

### Installation

```bash
pip install -r requirements.txt
```

### Usage

```bash
# Generate resume from data file
python src/main.py --data data/my-resume.json --template modern --format pdf

# Generate all formats
python src/main.py --data data/my-resume.json --all

# Interactive mode
python src/main.py --interactive
```

## Configuration

Edit `config/config.yaml` to customize:
- Default templates
- Output settings
- AI integration
- Styling preferences

## Development

```bash
# Run tests
pytest tests/

# Lint code
flake8 src/

# Format code
black src/
```

## Operation Hired - AI Resume Pipeline

### Phase 1.9: AI Profile & Resume Generation

The AI pipeline processes military documents and generates civilian resumes:

1. **Document Upload**: Candidates upload military documents (DD-214, ERB/ORB, evaluations)
2. **Text Extraction**: Worker extracts text from PDF, TXT, DOCX files
3. **Vertex AI Processing**: Gemini 1.5 Flash generates:
   - `CandidateProfile`: Structured military career data
   - `GeneratedResume`: Civilian-friendly resume content
4. **Firestore Storage**: Results stored in `candidateProfiles/` and `resumes/` collections

### Phase 2.0: Resume Export (PDF/DOCX)

After AI generation, resumes are exported to downloadable formats:

**Storage Path Convention:**
```
candidates/{candidateId}/exports/{timestamp}-resume.pdf
candidates/{candidateId}/exports/{timestamp}-resume.docx
```

**Libraries Used:**
| Format | Library | Notes |
|--------|---------|-------|
| PDF | `puppeteer` | Full HTML/CSS rendering, Cloud Run compatible |
| DOCX | `docx` | Native DOCX generation, no Word required |

**API Endpoints:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/internal/processCandidate` | POST | Process docs + generate resume + export |
| `/internal/candidateStatus/:id` | GET | Check processing status |
| `/internal/resumeDownload/:id/:format` | GET | Get signed download URL |

### Phase 2.1: Internal Slack Notifications

Team notifications to `#operation-hired` Slack channel when:
- **New candidate intake**: When a candidate submits documents and starts processing
- **Resume ready**: When AI generation and PDF/DOCX exports are complete

**De-duplication:** Each notification type uses a Firestore timestamp field to prevent duplicates:
- `candidates/{id}.firstSlackNotifiedAt` - New candidate notification
- `resumes/{id}.resumeSlackNotifiedAt` - Resume ready notification

**Slack Message Format (Block Kit):**
```
🆕 New Candidate Intake
Name: John Smith
Email: john.smith@email.com
Branch/Rank/MOS: Army / E-6 / 11B
[View Candidate] button

🎖 Resume Ready
Name: John Smith
Branch/Rank/MOS: Army / E-6 / 11B
Downloads: PDF, DOCX
[View Resume] button
```

### Phase 2.2: Deployment & End-to-End Verification

Deploys all services and verifies the complete pipeline works in production.

**Deployed Services (Dev):**
| Service | URL |
|---------|-----|
| Frontend | https://resume-gen-intent-dev.web.app |
| Worker | https://resume-worker-dev-96171099570.us-central1.run.app |
| Firestore | `resume-gen-intent-dev` project |
| Storage | `resume-gen-intent-dev.firebasestorage.app` |

### Phase 2.3: UI Theme & Layout

Applies Operation Hired branding to the frontend for a professional, veteran-forward experience.

**Theme & Branding:**
- Primary color: Gold `#C59141` (matches operationhired.com)
- Dark header/footer: `#1a1a1a`
- Typography: Roboto + Roboto Slab fonts
- Layout: Branded nav header and footer with Operation Hired identity

**Frontend Routes:**
| Route | Component | Description |
|-------|-----------|-------------|
| `/intake` | IntakePage | Candidate info form (step 1) |
| `/intake/:id/documents` | IntakeDocumentsPage | Document upload (step 2) |
| `/intake/:id/complete` | IntakeCompletePage | Status and resume download (step 3) |
| `/candidate/:id` | CandidatePage | Canonical shareable resume URL |

**Candidate Resume URL Pattern:** `/candidate/{candidateId}`
- Shareable link for operations team
- Redirects to `/intake/{id}/complete`
- Can be bookmarked by candidates

**UI Components:**
- Step indicator across all pages (3 steps)
- Drag-and-drop file upload
- Real-time status updates
- Download buttons for PDF/DOCX

**Layout Component:** `frontend/src/components/Layout.tsx`
- Navigation: Home, Resume Generator, Admin, Hire Talent, Government Services, Contact
- Footer: Company info, quick links, address
- Mobile-responsive hamburger menu

**Theme Variables:** `frontend/src/index.css`
```css
--primary-gold: #C59141;
--primary-dark: #1a1a1a;
--success-green: #38a169;
--error-red: #e53e3e;
--info-blue: #3182ce;
```

### Phase 2.4: Admin Dashboard (Read-Only v1)

Internal dashboard for Operation Hired team to view candidates and monitor pipeline.

**Admin Routes:**
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | AdminCandidatesPage | Redirect to candidates list |
| `/admin/candidates` | AdminCandidatesPage | List all candidates with filtering |
| `/admin/candidates/:id` | AdminCandidateDetailPage | Candidate detail view |

**Admin Data Sources (Read-Only):**
| Collection | Data |
|------------|------|
| `candidates` | Basic candidate info, status |
| `candidateDocuments` | Uploaded document metadata |
| `candidateProfiles` | AI-generated profile data |
| `resumes` | Generated resume content and export paths |

**Admin Features:**
- Real-time candidate list with status filtering
- Status summary cards (total, ready, processing, errors)
- Candidate detail view with:
  - Candidate info (name, email, branch, rank, MOS)
  - System info (ID, timestamps)
  - Uploaded documents list
  - Resume preview (summary, skills, experience)
  - PDF/DOCX download buttons
  - Link to candidate-facing page

**Security Note:**
Admin pages are publicly accessible in dev. Production deployment should add Firebase Auth.

### Environment Variables

```bash
# GCP
GCP_PROJECT_ID=resume-gen-intent-dev
VERTEX_LOCATION=us-central1
GEMINI_MODEL_NAME=gemini-1.5-flash

# Firebase Storage
FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app

# Frontend
VITE_WORKER_URL=https://resume-worker-dev-96171099570.us-central1.run.app

# Slack Notifications (Phase 2.1)
SLACK_OPERATION_HIRED_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz

# Worker App URL (for Slack links)
APP_BASE_URL=https://resume-gen-intent-dev.web.app
```

### Deployment Commands

**Deploy Worker to Cloud Run:**
```bash
cd services/worker

# Build and push image
gcloud builds submit \
  --tag us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator/worker:latest \
  --project resume-gen-intent-dev \
  ../..

# Deploy to Cloud Run
gcloud run deploy resume-worker-dev \
  --image us-central1-docker.pkg.dev/resume-gen-intent-dev/resume-generator/worker:latest \
  --platform managed \
  --region us-central1 \
  --project resume-gen-intent-dev \
  --allow-unauthenticated \
  --ingress all \
  --memory 2Gi \
  --cpu 2 \
  --timeout 300 \
  --set-env-vars "GCP_PROJECT_ID=resume-gen-intent-dev,VERTEX_LOCATION=us-central1,GEMINI_MODEL_NAME=gemini-1.5-flash,FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app,APP_BASE_URL=https://resume-gen-intent-dev.web.app"
```

**Deploy Frontend to Firebase Hosting:**
```bash
cd frontend

# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting --project resume-gen-intent-dev
```

**Deploy Firestore/Storage Rules:**
```bash
firebase deploy --only firestore:rules,storage --project resume-gen-intent-dev
```

### Cloud Run Deployment Notes

The worker service uses Puppeteer for PDF generation with system Chromium:

```dockerfile
# services/worker/Dockerfile uses node:20-slim with Chromium
FROM node:20-slim AS production

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    ... # (additional dependencies)
    --no-install-recommends

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

**Resource Requirements:**
- Memory: 2Gi (for Chromium headless)
- CPU: 2 (for PDF rendering)
- Timeout: 300s (AI + PDF generation)

### Health Checks

```bash
# Worker health
curl https://resume-worker-dev-96171099570.us-central1.run.app/health

# Expected response:
# {"status":"healthy","service":"worker","timestamp":"...","version":"0.1.0"}
```

## Documentation

See `000-docs/` for complete documentation following the 6767 standard.

## License

MIT
