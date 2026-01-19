// Cloud Tasks Service for Async Processing with Retry
// Handles resume generation with automatic retry on failure

import { CloudTasksClient, protos } from '@google-cloud/tasks';

const PROJECT_ID = process.env.GCP_PROJECT_ID || 'resume-gen-intent-dev';
const LOCATION = process.env.VERTEX_LOCATION || 'us-central1';
const QUEUE_NAME = 'resume-generation';

// Worker service URL (Cloud Run)
const WORKER_URL = process.env.WORKER_URL ||
  `https://resume-worker-dev-96171099570.${LOCATION}.run.app`;

const tasksClient = new CloudTasksClient();

/**
 * Task payload for resume generation
 */
export interface ResumeGenerationTask {
  candidateId: string;
  correlationId: string;
  attempt?: number;
  priority?: 'high' | 'normal' | 'low';
}

/**
 * Enqueue a resume generation task with retry configuration
 *
 * Cloud Tasks will automatically retry on failure with exponential backoff:
 * - Max attempts: 5
 * - Min backoff: 10s
 * - Max backoff: 300s (5 min)
 * - Max doublings: 4
 */
export async function enqueueResumeGeneration(
  task: ResumeGenerationTask
): Promise<string> {
  const queuePath = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);

  const payload = JSON.stringify({
    candidateId: task.candidateId,
    correlationId: task.correlationId,
    attempt: task.attempt || 1,
    enqueuedAt: new Date().toISOString(),
  });

  // Determine schedule time based on priority
  let scheduleTime: protos.google.protobuf.ITimestamp | undefined;
  if (task.priority === 'low') {
    // Delay low priority tasks by 30 seconds
    const delaySeconds = 30;
    scheduleTime = {
      seconds: Math.floor(Date.now() / 1000) + delaySeconds,
    };
  }

  const request: protos.google.cloud.tasks.v2.ICreateTaskRequest = {
    parent: queuePath,
    task: {
      httpRequest: {
        httpMethod: 'POST',
        url: `${WORKER_URL}/internal/tasks/processCandidate`,
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': task.correlationId,
        },
        body: Buffer.from(payload).toString('base64'),
        // Use OIDC token for authenticated requests
        oidcToken: {
          serviceAccountEmail: `${PROJECT_ID}@appspot.gserviceaccount.com`,
          audience: WORKER_URL,
        },
      },
      scheduleTime,
    },
  };

  console.log(`[cloudTasks] Enqueueing task for candidate: ${task.candidateId}`);
  console.log(`[cloudTasks] Queue: ${queuePath}`);
  console.log(`[cloudTasks] Target: ${WORKER_URL}/internal/tasks/processCandidate`);

  try {
    const [response] = await tasksClient.createTask(request);
    const taskName = response.name || 'unknown';
    console.log(`[cloudTasks] Task created: ${taskName}`);
    return taskName;
  } catch (error) {
    console.error('[cloudTasks] Failed to create task:', error);
    throw error;
  }
}

/**
 * Create the Cloud Tasks queue (run once during setup)
 */
export async function createQueue(): Promise<void> {
  const parent = tasksClient.locationPath(PROJECT_ID, LOCATION);

  const request: protos.google.cloud.tasks.v2.ICreateQueueRequest = {
    parent,
    queue: {
      name: tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME),
      rateLimits: {
        maxDispatchesPerSecond: 10,  // Max 10 tasks/sec
        maxConcurrentDispatches: 5,  // Max 5 concurrent
      },
      retryConfig: {
        maxAttempts: 5,
        minBackoff: { seconds: 10 },     // Start with 10s backoff
        maxBackoff: { seconds: 300 },    // Max 5 min backoff
        maxDoublings: 4,                 // Exponential backoff
      },
    },
  };

  try {
    console.log(`[cloudTasks] Creating queue: ${QUEUE_NAME}`);
    await tasksClient.createQueue(request);
    console.log(`[cloudTasks] Queue created successfully`);
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 6) {
      // ALREADY_EXISTS - queue exists, this is fine
      console.log(`[cloudTasks] Queue already exists`);
    } else {
      console.error('[cloudTasks] Failed to create queue:', error);
      throw error;
    }
  }
}

/**
 * Check if request is from Cloud Tasks (for handler validation)
 */
export function isCloudTasksRequest(headers: Record<string, string | string[] | undefined>): boolean {
  // Cloud Tasks adds these headers to all requests
  return !!(
    headers['x-cloudtasks-taskname'] ||
    headers['x-cloudtasks-queuename'] ||
    headers['x-cloudtasks-taskretrycount']
  );
}

/**
 * Get retry count from Cloud Tasks headers
 */
export function getRetryCount(headers: Record<string, string | string[] | undefined>): number {
  const retryCount = headers['x-cloudtasks-taskretrycount'];
  if (typeof retryCount === 'string') {
    return parseInt(retryCount, 10) || 0;
  }
  return 0;
}
