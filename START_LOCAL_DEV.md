# 🚀 Quick Start Guide - Operation Hired Local Development

## 🔴 **CRITICAL FIX APPLIED**

**The upload issue has been identified and fixed!**

The frontend was **missing critical Firebase configuration files** that prevented it from connecting to the database and storage. These files have now been created:

- ✅ [frontend/src/lib/firebase.ts](frontend/src/lib/firebase.ts)
- ✅ [frontend/src/lib/firestore.ts](frontend/src/lib/firestore.ts)
- ✅ [frontend/.env.local](frontend/.env.local) (template created)
- ✅ [services/worker/.env](services/worker/.env) (template created)

---

## 📋 Prerequisites

Before starting, ensure you have:

- ✅ **Node.js** 20+ (you have 22.21.1 ✓)
- ✅ **npm** 10+ (you have 10.9.4 ✓)
- ⚠️ **Chromium browser** (for PDF generation) - *install if missing*
- ⚠️ **Google Cloud authentication** - *setup required*

---

## 🔧 One-Time Setup

### Step 1: Install Dependencies

**IMPORTANT**: If you get network timeout errors, run this first:

```bash
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 200000
npm config set fetch-retry-maxtimeout 1200000
npm cache clean --force
```

Then install dependencies:

```bash
# From project root: /home/kali/Documents/intentsolutions/resume-firebase

# 1. Install and build shared package (MUST DO THIS FIRST)
cd packages/shared
npm install
npm run build

# 2. Install frontend dependencies
cd ../../frontend
npm install

# 3. Install worker dependencies
cd ../services/worker
npm install
```

### Step 2: Configure Firebase Credentials

**You MUST get Firebase config from Firebase Console:**

1. Go to: https://console.firebase.google.com/project/resume-gen-intent-dev/settings/general
2. Scroll to "Your apps" → Find the Web App (</> icon)
3. Click "Config" to see the Firebase configuration
4. Edit `frontend/.env.local` and replace placeholder values:

```bash
VITE_FIREBASE_API_KEY=<paste-from-console>
VITE_FIREBASE_MESSAGING_SENDER_ID=<paste-from-console>
VITE_FIREBASE_APP_ID=<paste-from-console>
```

**Without correct Firebase config, the app WILL NOT WORK!**

### Step 3: Authenticate with Google Cloud

The worker service needs access to GCP services (Firestore, Storage, Vertex AI):

```bash
# Login to Google Cloud
gcloud auth application-default login --project resume-gen-intent-dev

# Verify authentication
gcloud auth list
```

### Step 4: Install Chromium (for PDF generation)

```bash
# On Kali Linux / Debian / Ubuntu
sudo apt-get update
sudo apt-get install chromium chromium-browser

# Verify installation
which chromium
```

---

## 🏃 Running the Application

### Option 1: Full Local Setup (Frontend + Worker)

**Terminal 1 - Start Worker Service:**

```bash
cd /home/kali/Documents/intentsolutions/resume-firebase/services/worker
npm run dev
```

Expected output:
```
Worker service started on port 8080
Vertex AI initialized: gemini-1.5-flash in us-central1
```

**Terminal 2 - Start Frontend:**

```bash
cd /home/kali/Documents/intentsolutions/resume-firebase/frontend
npm run dev
```

Expected output:
```
VITE v5.x.x ready in xxx ms
➜  Local:   http://localhost:3000/
```

**Then open browser:** http://localhost:3000

### Option 2: Frontend Only (Use Production Worker)

If you don't want to run the worker locally, you can use the production worker:

1. Edit `frontend/.env.local`:
   ```bash
   VITE_WORKER_URL=https://resume-worker-dev-96171099570.us-central1.run.app
   ```

2. Start frontend:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🧪 Testing the Fix

### Test the Complete Flow:

1. **Open app**: http://localhost:3000
2. **Fill intake form**:
   - Name: Test Veteran
   - Email: test@example.com
   - Branch: Army
   - Rank: E-5
   - MOS: 11B
3. **Click "Continue"** → Should navigate to document upload page
4. **Upload a document** (any PDF, DOCX, or TXT file)
5. **Click "Generate My Resume"**
6. **Watch for**:
   - ✅ Upload progress bar appears
   - ✅ Status changes to "Processing"
   - ✅ AI generation starts
   - ✅ Resume ready after ~30 seconds
   - ✅ Download buttons appear

### What to Check:

**Browser Console** (F12):
- ❌ **Before fix**: "Firebase is not defined" or similar errors
- ✅ **After fix**: No Firebase errors, successful uploads

**Worker Terminal**:
- Should show: `POST /internal/processCandidate`
- Should show: AI processing steps
- Should show: PDF/DOCX export generation

**Firestore Database**:
- Check: https://console.firebase.google.com/project/resume-gen-intent-dev/firestore
- Should see new `candidates` document created
- Should see `candidateDocuments` entries

**Firebase Storage**:
- Check: https://console.firebase.google.com/project/resume-gen-intent-dev/storage
- Should see uploaded files in `candidates/{id}/uploads/`

---

## 🐛 Troubleshooting

### Problem: "Firebase is not defined" in browser console

**Solution**: You didn't set up Firebase config in `.env.local`
- Follow Step 2 above to get config from Firebase Console
- Restart frontend dev server after editing .env.local

### Problem: Worker fails to start

**Solution 1 - Check Google Cloud auth:**
```bash
gcloud auth application-default login --project resume-gen-intent-dev
```

**Solution 2 - Check environment variables:**
```bash
cat services/worker/.env
# Verify all required vars are set
```

### Problem: PDF generation fails

**Solution**: Install Chromium:
```bash
sudo apt-get install chromium chromium-browser
```

### Problem: "Network timeout" during npm install

**Solution**: Increase npm timeouts:
```bash
npm config set fetch-timeout 600000
npm config set fetch-retry-mintimeout 200000
npm config set fetch-retry-maxtimeout 1200000
npm cache clean --force
```

Then retry installation.

### Problem: Upload still not working after fix

**Check these:**

1. **Browser console** - Look for specific error messages
2. **Network tab** (F12 → Network) - See if API calls are failing
3. **Worker logs** - Check if requests are reaching the worker
4. **Firestore rules** - Verify they allow writes to candidates collection

---

## 🔥 Quick Health Checks

```bash
# Check worker is running
curl http://localhost:8080/health

# Expected: {"status":"healthy","service":"worker",...}

# Check frontend is running
curl http://localhost:3000

# Expected: HTML content (React app)

# Check Firebase config is loaded
# Open browser console at http://localhost:3000
# Run: import.meta.env
# Should show VITE_FIREBASE_* variables
```

---

## 📁 Project Structure Reference

```
resume-firebase/
├── frontend/
│   ├── src/
│   │   ├── lib/               ← ✅ NEWLY CREATED (was missing!)
│   │   │   ├── firebase.ts    ← Firebase initialization
│   │   │   └── firestore.ts   ← Database helpers
│   │   ├── pages/             ← React pages
│   │   ├── components/        ← React components
│   │   └── services/          ← API client
│   ├── .env.local             ← ✅ Firebase config (MUST CONFIGURE!)
│   └── package.json
│
├── services/worker/
│   ├── src/
│   │   ├── handlers/          ← Request handlers
│   │   └── services/          ← AI, PDF, storage services
│   ├── .env                   ← ✅ Worker config (created for you)
│   └── package.json
│
└── packages/shared/           ← Shared types (build first!)
    └── src/
        ├── types/
        └── schemas/
```

---

## 🎯 Next Steps After Setup

Once local environment is running:

1. **Test the full flow** with a real DD-214 or ERB document
2. **Check browser DevTools** for any errors
3. **Monitor worker logs** to see AI processing
4. **Verify exports** are generated (PDF + DOCX)
5. **Report any issues** you find

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console (F12 → Console)
2. Check worker terminal output
3. Check [LOCAL_SETUP_GUIDE.md](LOCAL_SETUP_GUIDE.md) for detailed troubleshooting
4. Verify Firebase config is correct in `.env.local`
5. Ensure Google Cloud authentication is working

---

## ✅ Summary of Fixes Applied

| Issue | Root Cause | Fix Applied |
|-------|-----------|-------------|
| **Upload keeps loading** | Missing Firebase lib files | Created `lib/firebase.ts` and `lib/firestore.ts` |
| **No confirmation** | Frontend couldn't connect to Firestore | Added proper Firebase initialization |
| **Resume not generating** | No storage/database access | Added complete CRUD operations |
| **Missing config** | No .env templates | Created `.env.local` and `.env` templates |

**The app should now work correctly once you:**
1. Install dependencies
2. Configure Firebase credentials in `.env.local`
3. Authenticate with Google Cloud
4. Start both services

Good luck! 🚀
