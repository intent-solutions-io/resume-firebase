# Local Development Setup Guide - Operation Hired

## 🚨 CRITICAL ISSUE FOUND

**The frontend is missing critical Firebase configuration files!**

The code references:
- `frontend/src/lib/firebase.ts` - MISSING
- `frontend/src/lib/firestore.ts` - MISSING

This is why the document upload functionality isn't working. The frontend cannot connect to Firebase.

## Immediate Action Required

### Step 1: Fix Network Issues (if npm install fails)

```bash
# Clear npm cache
npm cache clean --force

# Increase npm timeouts
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 200000
npm config set fetch-retry-maxtimeout 1200000
```

### Step 2: Install Dependencies

```bash
# From project root: /home/kali/Documents/intentsolutions/resume-firebase

# 1. Install shared package dependencies
cd packages/shared
npm install
npm run build  # IMPORTANT: Must build shared types first

# 2. Install frontend dependencies
cd ../../frontend
npm install

# 3. Install worker dependencies
cd ../services/worker
npm install
```

### Step 3: Create Missing Firebase Configuration Files

**You need to create these files in `frontend/src/lib/`:**

#### Option A: Get from Git History

Check if these files were deleted or never committed:

```bash
git log --all --full-history -- "frontend/src/lib/*"
```

#### Option B: Recreate from Backend Pattern

The worker service has Firebase setup at `services/worker/src/services/firestore.ts`.
You can use that as a reference to create the frontend versions.

### Step 4: Start Local Development Servers

#### Terminal 1: Start Worker Service

```bash
cd services/worker

# Create .env file
cat > .env << 'EOF'
# Worker Environment Variables (Local Development)
PORT=8080
GCP_PROJECT_ID=resume-gen-intent-dev
VERTEX_LOCATION=us-central1
GEMINI_MODEL_NAME=gemini-1.5-flash
FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app
APP_BASE_URL=http://localhost:3000
# SLACK_OPERATION_HIRED_WEBHOOK_URL=<your-webhook-url>  # Optional for local dev
EOF

# Start worker in dev mode (with hot reload)
npm run dev

# Worker will be available at: http://localhost:8080
```

#### Terminal 2: Start Frontend

```bash
cd frontend

# The .env.local file has been created for you already

# Start frontend dev server
npm run dev

# Frontend will be available at: http://localhost:3000
```

## What Each Component Does

### Frontend (Port 3000)
- React SPA with candidate intake flow
- Uploads files to Firebase Storage
- Calls worker service to process documents
- Displays resume download links

### Worker Service (Port 8080)
- Extracts text from uploaded documents
- Calls Vertex AI (Gemini) to generate resume
- Exports PDF and DOCX files
- Sends Slack notifications

### Firebase (Cloud)
- **Firestore**: Database for candidates, profiles, resumes
- **Storage**: File storage for uploads and exports
- **Note**: In local dev, you connect to PRODUCTION Firebase (no emulators)

## Testing the Fix

Once dependencies are installed and files are created:

1. **Start worker**: `cd services/worker && npm run dev`
2. **Start frontend**: `cd frontend && npm run dev`
3. **Open browser**: http://localhost:3000
4. **Test flow**:
   - Fill out intake form
   - Upload a test document
   - Watch browser console and terminal logs for errors

## Expected Behavior

**When working correctly:**
- ✅ Form submission creates Firestore record
- ✅ File upload shows progress bar
- ✅ "Generate Resume" button triggers worker
- ✅ Status updates in real-time
- ✅ PDF/DOCX download buttons appear

**Current broken behavior:**
- ❌ "Keeps loading without upload confirmation"
- ❌ Likely error in browser console about missing Firebase config

## Debugging Tips

### Check Browser Console
```
Open DevTools (F12) → Console tab
Look for errors about Firebase initialization
```

### Check Worker Logs
```
Terminal running worker service will show:
- Incoming requests
- AI processing status
- Export generation
- Errors (if any)
```

### Check Firestore Database
```
https://console.firebase.google.com/project/resume-gen-intent-dev/firestore
See if candidate records are being created
```

### Check Firebase Storage
```
https://console.firebase.google.com/project/resume-gen-intent-dev/storage
See if files are being uploaded
```

## Quick Commands Reference

```bash
# Install everything (after fixing network issues)
npm install && cd packages/shared && npm install && npm run build && cd ../frontend && npm install && cd ../services/worker && npm install && cd ../..

# Start both services (use 2 terminals)
# Terminal 1:
cd services/worker && npm run dev

# Terminal 2:
cd frontend && npm run dev

# Check health
curl http://localhost:8080/health

# View logs
# Just watch the terminal output where services are running
```

## Next Steps

1. **Fix npm network issues** (see Step 1)
2. **Install all dependencies** (see Step 2)
3. **Create missing Firebase files** (see Step 3)
4. **Start services and test** (see Step 4)
5. **Debug with browser console and logs**

## Critical Missing Files to Create

1. `frontend/src/lib/firebase.ts` - Firebase app initialization
2. `frontend/src/lib/firestore.ts` - Firestore helpers for CRUD operations

Reference the worker's implementation:
- `services/worker/src/services/firestore.ts`

The frontend versions will be similar but may have slightly different imports for the web SDK.
