#!/bin/bash
# Setup Cloud Tasks Queue for Resume Generation
# Run once to create the queue with retry configuration

set -e

PROJECT_ID="${GCP_PROJECT_ID:-resume-gen-intent-dev}"
LOCATION="${VERTEX_LOCATION:-us-central1}"
QUEUE_NAME="resume-generation"

echo "Setting up Cloud Tasks queue: $QUEUE_NAME in $LOCATION"

# Create the queue with retry configuration
gcloud tasks queues create "$QUEUE_NAME" \
  --location="$LOCATION" \
  --project="$PROJECT_ID" \
  --max-dispatches-per-second=10 \
  --max-concurrent-dispatches=5 \
  --max-attempts=5 \
  --min-backoff=10s \
  --max-backoff=300s \
  --max-doublings=4 \
  2>/dev/null || echo "Queue may already exist"

# Describe the queue to verify
echo ""
echo "=== Queue Configuration ==="
gcloud tasks queues describe "$QUEUE_NAME" \
  --location="$LOCATION" \
  --project="$PROJECT_ID" \
  --format="table(name,rateLimits.maxDispatchesPerSecond,retryConfig.maxAttempts,retryConfig.minBackoff,retryConfig.maxBackoff)"

echo ""
echo "Queue setup complete!"
echo "Console: https://console.cloud.google.com/cloudtasks/queue/$LOCATION/$QUEUE_NAME?project=$PROJECT_ID"
