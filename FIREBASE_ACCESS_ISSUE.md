# 🔴 Firebase Access Issue - How to Resolve

## Problem
You're trying to access the Firebase project at:
https://console.firebase.google.com/project/resume-gen-intent-dev/settings/general

But you get: **"You don't have access or the project doesn't exist"**

## Why This Happens
The `resume-gen-intent-dev` Firebase project was created by someone else (likely a colleague at Intent Solutions), and your Google account (`opeyemiariyo@intentsolutions.io`) hasn't been added as a member.

---

## 🎯 Solution Options (Pick ONE)

### ✅ **Option 1: Get Access from Project Owner (BEST)**

**Who to ask:**
- Your manager
- DevOps team
- Whoever originally set up this project
- Check with other developers at Intent Solutions

**What they need to do:**

1. Go to Firebase Console: https://console.firebase.google.com/project/resume-gen-intent-dev/settings/iam
2. Click "Add member"
3. Add your email: `opeyemiariyo@intentsolutions.io`
4. Assign role: **"Firebase Admin"** or **"Editor"**
5. Click "Add"

**Then you can:**
- Access the Firebase Console
- Get the Firebase config credentials
- Continue with local development

---

### ⚠️ **Option 2: Ask for Firebase Config Only**

If getting full access takes time, ask a colleague to send you just the Firebase config:

**They need to:**
1. Go to: https://console.firebase.google.com/project/resume-gen-intent-dev/settings/general
2. Scroll to "Your apps" → Web app (</> icon)
3. Click "Config" radio button
4. Copy and send you these values:
   - `apiKey`
   - `authDomain`
   - `projectId`
   - `storageBucket`
   - `messagingSenderId`
   - `appId`

**You then paste them into:** `frontend/.env.local`

---

### 🔧 **Option 3: Create Your Own Test Project**

If you can't get access and just want to test:

**Follow the guide:** [CREATE_NEW_FIREBASE_PROJECT.md](CREATE_NEW_FIREBASE_PROJECT.md)

**Pros:**
- ✅ You have full control
- ✅ Can test immediately
- ✅ Won't affect production

**Cons:**
- ❌ Separate from production data
- ❌ More setup work required
- ❌ Won't see real candidates/resumes

---

### 🚀 **Option 4: Use Production Worker (Temporary)**

You can run JUST the frontend locally while using the production worker:

**Steps:**

1. Create a minimal `.env.local` that uses public Firebase config:

```bash
# frontend/.env.local

# Use production worker
VITE_WORKER_URL=https://resume-worker-dev-96171099570.us-central1.run.app

# Firebase config - Try these common values
VITE_FIREBASE_PROJECT_ID=resume-gen-intent-dev
VITE_FIREBASE_AUTH_DOMAIN=resume-gen-intent-dev.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=resume-gen-intent-dev.firebasestorage.app

# You still need these from the team:
VITE_FIREBASE_API_KEY=<ask-team>
VITE_FIREBASE_MESSAGING_SENDER_ID=<ask-team>
VITE_FIREBASE_APP_ID=<ask-team>
```

2. Start only the frontend:
```bash
cd frontend
npm run dev
```

**This lets you test the frontend UI** while using production backend.

**Limitation:** You still need the API key, sender ID, and app ID from the team.

---

## 🔍 Quick Check: Who Has Access?

**Based on git commit history, the project was created by:**
- **Jeremy Longshore** (`jeremy@intentglobal.io` or `jeremylongshore@gmail.com`)

**Contact Jeremy to request access:**

```
"Hi Jeremy, I'm working on the Operation Hired project and need access
to the Firebase project 'resume-gen-intent-dev'. Could you add my account
(opeyemiariyo@intentsolutions.io) to the project? Thanks!"
```

**Other likely people with access:**
- Project manager
- Senior developer
- DevOps engineer

---

## 📧 Email Template to Request Access

```
Subject: Firebase Access Request - resume-gen-intent-dev

Hi [Name],

I'm working on the Operation Hired project locally and need access
to the Firebase project "resume-gen-intent-dev".

Could you please add my Google account to the project?
Email: opeyemiariyo@intentsolutions.io
Role needed: Editor or Firebase Admin

Alternatively, if you could share the Firebase web app config
(apiKey, appId, messagingSenderId), I can use that to test locally.

Thanks!
```

---

## 🏁 Next Steps

1. **First, try Option 1** - Ask for access (best long-term solution)
2. **If urgent, try Option 4** - Use production worker temporarily
3. **If blocked, try Option 3** - Create your own test project

Once you have Firebase config (from any option), you can proceed with local development!

---

## ❓ Questions?

**Q: Can I extract the config from the production site?**
A: No, the config is bundled in compiled JavaScript and not easily readable.

**Q: Is it safe to share the Firebase config?**
A: The API key and project ID are considered public. However, proper Firestore security rules prevent unauthorized access.

**Q: Can I work without Firebase?**
A: No, the app requires Firebase for database and file storage. You need at minimum the config values.

**Q: How long does it take to get access?**
A: Usually minutes if you ask the right person. They just need to add you in Firebase Console.

---

## 🆘 If All Else Fails

Reach out to your team lead or project manager at Intent Solutions. This is a common issue and they should be able to help quickly!
