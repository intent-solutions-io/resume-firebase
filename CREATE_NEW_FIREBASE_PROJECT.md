# Create Your Own Firebase Project for Local Testing

## ⚠️ IMPORTANT
This creates a NEW Firebase project separate from production. Use this ONLY if:
- You can't get access to `resume-gen-intent-dev` project
- You just want to test locally
- You don't need production data

## Steps to Create New Firebase Project

### 1. Create Firebase Project

1. Go to: https://console.firebase.google.com/
2. Click "Add project" or "Create a project"
3. Project name: `resume-gen-local-test` (or any name you want)
4. Accept terms and click Continue
5. Disable Google Analytics (not needed for testing)
6. Click "Create project"

### 2. Enable Required Services

#### A. Enable Firestore Database

1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in **test mode**" (for local dev)
4. Choose location: `us-central1` (Nam5)
5. Click "Enable"

#### B. Enable Firebase Storage

1. Go to "Storage" in Firebase Console
2. Click "Get started"
3. Select "Start in **test mode**"
4. Choose location: `us-central1`
5. Click "Done"

#### C. Enable Vertex AI (in Google Cloud Console)

1. Go to: https://console.cloud.google.com/vertex-ai
2. Select your new project
3. Click "Enable all recommended APIs"
4. Wait for APIs to enable (~2-3 minutes)

### 3. Get Firebase Web App Config

1. In Firebase Console → Project Settings (gear icon)
2. Scroll to "Your apps"
3. Click the web icon `</>`
4. Register app:
   - App nickname: `operation-hired-web`
   - Don't check Firebase Hosting
   - Click "Register app"
5. Copy the config object that appears

It will look like:
```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abc123"
};
```

### 4. Update Your .env Files

**frontend/.env.local:**
```bash
VITE_WORKER_URL=http://localhost:8080

# Replace these with YOUR values from Firebase Console
VITE_FIREBASE_API_KEY=<your-api-key>
VITE_FIREBASE_AUTH_DOMAIN=<your-project>.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=<your-project-id>
VITE_FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<your-sender-id>
VITE_FIREBASE_APP_ID=<your-app-id>
```

**services/worker/.env:**
```bash
PORT=8080
GCP_PROJECT_ID=<your-project-id>  # ← CHANGE THIS
VERTEX_LOCATION=us-central1
GEMINI_MODEL_NAME=gemini-1.5-flash
FIREBASE_STORAGE_BUCKET=<your-project-id>.appspot.com  # ← CHANGE THIS
APP_BASE_URL=http://localhost:3000
```

### 5. Setup Firestore Security Rules

1. Go to Firestore Database → Rules
2. Replace with these rules (for local testing):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads/writes for local testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

### 6. Setup Storage Security Rules

1. Go to Storage → Rules
2. Replace with these rules (for local testing):

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click "Publish"

### 7. Authenticate with Google Cloud

```bash
# Login with your Google account
gcloud auth application-default login --project <your-project-id>

# Set default project
gcloud config set project <your-project-id>
```

### 8. Test Your Setup

```bash
# Start worker
cd services/worker
npm run dev

# In another terminal, start frontend
cd frontend
npm run dev
```

Open http://localhost:3000 and test the flow!

## ⚠️ Limitations of This Approach

- **Separate from production**: You won't see production data
- **Clean slate**: No existing candidates or resumes
- **Manual setup**: More configuration required
- **Testing only**: Not suitable for production use

## 🎯 Recommended Approach

**Still try to get access to the production project** (`resume-gen-intent-dev`) from your team. This approach is only a workaround for local testing.
