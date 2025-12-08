import { CloudTasksClient, protos } from '@google-cloud/tasks';
import {
  processCasePayloadSchema,
  generateArtifactPayloadSchema,
} from '@resume-generator/shared/schemas';

const client = new CloudTasksClient();

const PROJECT_ID = process.env.PROJECT_ID || 'resume-generator';
const LOCATION = process.env.CLOUD_TASKS_LOCATION || 'us-central1';
const PROCESSING_QUEUE = process.env.PROCESSING_QUEUE || 'resume-processing-dev';
const WORKER_URL = process.env.WORKER_URL || 'http://localhost:8081';

class TasksService {
  private getQueuePath(queueName: string): string {
    return client.queuePath(PROJECT_ID, LOCATION, queueName);
  }

  /**
   * Enqueue a case processing task
   * Validates payload against shared schema before enqueueing
   */
  async enqueueProcessing(caseId: string): Promise<string> {
    // Validate payload against shared contract
    const payload = processCasePayloadSchema.parse({ caseId });

    const queuePath = this.getQueuePath(PROCESSING_QUEUE);

    const task: protos.google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${WORKER_URL}/internal/processCase`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        oidcToken: {
          serviceAccountEmail: process.env.WORKER_SERVICE_ACCOUNT,
          audience: WORKER_URL,
        },
      },
      scheduleTime: {
        seconds: Math.floor(Date.now() / 1000) + 5, // Start after 5 seconds
      },
    };

    const [response] = await client.createTask({
      parent: queuePath,
      task,
    });

    console.log(`Task created: ${response.name}`);
    return response.name || '';
  }

  /**
   * Enqueue an artifact generation task
   * Validates payload against shared schema before enqueueing
   */
  async enqueueArtifactGeneration(
    caseId: string,
    artifactType: string
  ): Promise<string> {
    // Validate payload against shared contract
    const payload = generateArtifactPayloadSchema.parse({ caseId, artifactType });

    const queuePath = this.getQueuePath('artifact-generation-dev');

    const task: protos.google.cloud.tasks.v2.ITask = {
      httpRequest: {
        httpMethod: 'POST',
        url: `${WORKER_URL}/internal/generateArtifact`,
        headers: {
          'Content-Type': 'application/json',
        },
        body: Buffer.from(JSON.stringify(payload)).toString('base64'),
        oidcToken: {
          serviceAccountEmail: process.env.WORKER_SERVICE_ACCOUNT,
          audience: WORKER_URL,
        },
      },
    };

    const [response] = await client.createTask({
      parent: queuePath,
      task,
    });

    console.log(`Artifact task created: ${response.name}`);
    return response.name || '';
  }
}

export const tasksService = new TasksService();
