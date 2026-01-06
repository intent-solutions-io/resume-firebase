# Email Notifications Setup Guide

## Overview
The application now sends resume PDFs to candidates via email using SendGrid.

## SendGrid Setup (5 minutes)

### 1. Create SendGrid Account
1. Go to https://sendgrid.com/
2. Sign up for a free account (100 emails/day free tier)
3. Verify your email address

### 2. Create API Key
1. Log into SendGrid Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Name it: `resume-generator-prod`
5. Select **Full Access** (or minimum: Mail Send permissions)
6. Click **Create & View**
7. **COPY THE API KEY** - you can only see it once!

### 3. Verify Sender Email (Required)
SendGrid requires sender verification:

**Option A: Single Sender Verification (Easiest)**
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter email: `noreply@operationhired.com` (or your domain)
4. Fill in other fields:
   - From Name: `Operation Hired`
   - Reply To: Your support email
   - Company: `Operation Hired`
5. Click **Create**
6. Check your inbox and verify the email

**Option B: Domain Authentication (Professional)**
- Required if using a custom domain
- Adds DNS records to your domain
- Better deliverability
- See: https://docs.sendgrid.com/ui/account-and-settings/how-to-set-up-domain-authentication

### 4. Configure Cloud Run
Add environment variables to your Cloud Run service:

```bash
gcloud run services update resume-worker-dev \
  --region us-central1 \
  --project resume-gen-intent-dev \
  --set-env-vars "SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx,FROM_EMAIL=noreply@operationhired.com,FROM_NAME=Operation Hired"
```

**OR** via Cloud Console:
1. Go to Cloud Run → resume-worker-dev
2. Click **Edit & Deploy New Revision**
3. Go to **Variables & Secrets** tab
4. Add environment variables:
   - `SENDGRID_API_KEY` = `SG.xxxxxxxxxxxxxxxxxxxxx`
   - `FROM_EMAIL` = `noreply@operationhired.com`
   - `FROM_NAME` = `Operation Hired`
5. Click **Deploy**

### 5. Test Email Sending
1. Submit a new candidate with a valid email
2. Upload documents and generate resume
3. Check candidate's inbox for email with subject:
   **"🎉 Your Resume is Ready - Operation Hired"**

## Email Content

The email includes:
- ✅ Professional Operation Hired branding (gold #C59141)
- ✅ Download buttons for all 3 PDFs:
  - Civilian Resume
  - Military Resume
  - Translation Crosswalk
- ✅ Instructions for using the resumes
- ✅ Next steps for job applications

## Troubleshooting

### Email Not Sending?
1. **Check Cloud Run Logs:**
   ```bash
   gcloud run services logs read resume-worker-dev \
     --project resume-gen-intent-dev \
     --limit 100 \
     | grep emailService
   ```

2. **Common Issues:**
   - `SENDGRID_API_KEY not set` → Environment variable not configured
   - `401 Unauthorized` → Invalid API key
   - `403 Forbidden` → Sender email not verified
   - `Email already sent` → Duplicate prevention working (check `emailSentAt` in Firestore)

### Check SendGrid Activity
1. Go to SendGrid Dashboard
2. Click **Activity** → **Email Activity**
3. Search by recipient email
4. See delivery status, opens, clicks

### Verify Sender Status
1. SendGrid → **Settings** → **Sender Authentication**
2. Ensure sender email shows **Verified**
3. If "Pending", check your email for verification link

## Cost Estimate

**SendGrid Free Tier:**
- 100 emails/day
- Forever free
- Perfect for demo/testing

**Essentials Plan ($19.95/month):**
- 50,000 emails/month
- Better for production
- Advanced analytics

## Email Frequency

The app sends **1 email per candidate** when their resume is ready:
- De-duplicated via `emailSentAt` timestamp
- Candidate can trigger new email by re-generating resume (if `emailSentAt` is cleared)

## Security Notes

⚠️ **NEVER commit your SendGrid API key to Git**
- API keys are in Cloud Run environment variables only
- Rotate keys if accidentally exposed
- Use Secret Manager for production

## Next Steps

After setup:
1. ✅ Test with a real candidate email
2. ✅ Check spam folder if email doesn't arrive
3. ✅ Monitor SendGrid dashboard for delivery stats
4. ✅ Consider upgrading to paid plan for production volume
5. ✅ Set up domain authentication for better deliverability

## Support

- SendGrid Docs: https://docs.sendgrid.com/
- SendGrid Support: https://support.sendgrid.com/
- Email test tool: https://www.mail-tester.com/

---

**Ready for Demo?**
1. ✅ SendGrid account created
2. ✅ API key generated
3. ✅ Sender email verified
4. ✅ Cloud Run configured
5. ✅ Test email sent successfully

You're all set! 🎉
