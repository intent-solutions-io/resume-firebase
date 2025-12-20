// Slack Notifier Service
// Phase 2.1: Internal Slack Notifications

const SLACK_WEBHOOK_URL = process.env.SLACK_OPERATION_HIRED_WEBHOOK_URL;
const APP_BASE_URL = process.env.APP_BASE_URL || 'https://resume-gen-intent-dev.web.app';

export interface NewCandidatePayload {
  candidateId: string;
  name?: string;
  email?: string;
  branch?: string;
  rank?: string;
  mos?: string;
  createdAt?: Date;
}

export interface ResumeReadyPayload {
  candidateId: string;
  name?: string;
  email?: string;
  branch?: string;
  rank?: string;
  mos?: string;
  pdfPath?: string;
  docxPath?: string;
}

/**
 * Send Slack notification for new candidate intake
 */
export async function notifyNewCandidate(payload: NewCandidatePayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[slackNotifier] SLACK_OPERATION_HIRED_WEBHOOK_URL not set, skipping notification');
    return;
  }

  const {
    candidateId,
    name = 'Unknown',
    email = 'Not provided',
    branch = '-',
    rank = '-',
    mos = '-',
  } = payload;

  const viewUrl = `${APP_BASE_URL}/intake/complete/${candidateId}`;
  const militaryInfo = [branch, rank, mos].filter((x) => x && x !== '-').join(' / ') || 'Not specified';

  const message = {
    text: `New Candidate Intake: ${name}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'New Candidate Intake',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Email:*\n${email}`,
          },
          {
            type: 'mrkdwn',
            text: `*Branch/Rank/MOS:*\n${militaryInfo}`,
          },
          {
            type: 'mrkdwn',
            text: `*Candidate ID:*\n\`${candidateId}\``,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Candidate',
              emoji: true,
            },
            url: viewUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };

  await sendSlackMessage(message);
  console.log(`[slackNotifier] New candidate notification sent for: ${candidateId}`);
}

/**
 * Send Slack notification when resume is ready
 */
export async function notifyResumeReady(payload: ResumeReadyPayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[slackNotifier] SLACK_OPERATION_HIRED_WEBHOOK_URL not set, skipping notification');
    return;
  }

  const {
    candidateId,
    name = 'Unknown',
    branch = '-',
    rank = '-',
    mos = '-',
    pdfPath,
    docxPath,
  } = payload;

  const viewUrl = `${APP_BASE_URL}/intake/complete/${candidateId}`;
  const militaryInfo = [branch, rank, mos].filter((x) => x && x !== '-').join(' / ') || 'Not specified';

  const downloads: string[] = [];
  if (pdfPath) downloads.push('PDF');
  if (docxPath) downloads.push('DOCX');
  const downloadsText = downloads.length > 0 ? downloads.join(', ') : 'Generating...';

  const message = {
    text: `Resume Ready: ${name}`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Resume Ready',
          emoji: true,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Name:*\n${name}`,
          },
          {
            type: 'mrkdwn',
            text: `*Branch/Rank/MOS:*\n${militaryInfo}`,
          },
          {
            type: 'mrkdwn',
            text: `*Downloads:*\n${downloadsText}`,
          },
          {
            type: 'mrkdwn',
            text: `*Candidate ID:*\n\`${candidateId}\``,
          },
        ],
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: 'View Resume',
              emoji: true,
            },
            url: viewUrl,
            style: 'primary',
          },
        ],
      },
    ],
  };

  await sendSlackMessage(message);
  console.log(`[slackNotifier] Resume ready notification sent for: ${candidateId}`);
}

/**
 * Send a message to Slack webhook
 */
async function sendSlackMessage(message: Record<string, unknown>): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error('Slack webhook URL not configured');
  }

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Slack webhook failed: ${response.status} - ${text}`);
  }
}
