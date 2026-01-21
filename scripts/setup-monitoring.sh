#!/bin/bash
# Setup Cloud Monitoring Alerts for Resume Worker
# Run once to configure alerting policies

set -e

PROJECT_ID="${GCP_PROJECT_ID:-resume-gen-intent-dev}"
SERVICE_NAME="resume-worker-dev"
NOTIFICATION_EMAIL="${ALERT_EMAIL:-jeremy@intentsolutions.io}"

echo "Setting up Cloud Monitoring for $SERVICE_NAME in $PROJECT_ID"

# Create notification channel (email)
echo "Creating email notification channel..."
CHANNEL_ID=$(gcloud alpha monitoring channels create \
  --display-name="Resume Worker Alerts" \
  --type=email \
  --channel-labels=email_address="$NOTIFICATION_EMAIL" \
  --project="$PROJECT_ID" \
  --format="value(name)" 2>/dev/null || echo "")

if [ -z "$CHANNEL_ID" ]; then
  echo "Notification channel may already exist, finding it..."
  CHANNEL_ID=$(gcloud alpha monitoring channels list \
    --project="$PROJECT_ID" \
    --filter="displayName='Resume Worker Alerts'" \
    --format="value(name)" | head -1)
fi

echo "Notification channel: $CHANNEL_ID"

# Alert 1: High Error Rate (>5% 5xx responses in 5 min window)
echo "Creating error rate alert..."
cat > /tmp/error-rate-alert.json << EOF
{
  "displayName": "Resume Worker - High Error Rate",
  "documentation": {
    "content": "Error rate exceeded 5% for resume-worker-dev. Check Cloud Run logs for details.",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "Error rate > 5%",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/request_count\" AND metric.labels.response_code_class=\"5xx\"",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_RATE"
          }
        ],
        "comparison": "COMPARISON_GT",
        "thresholdValue": 0.05,
        "duration": "300s"
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["$CHANNEL_ID"]
}
EOF

gcloud alpha monitoring policies create \
  --policy-from-file=/tmp/error-rate-alert.json \
  --project="$PROJECT_ID" 2>/dev/null || echo "Error rate alert may already exist"

# Alert 2: High Latency (P95 > 60s)
echo "Creating latency alert..."
cat > /tmp/latency-alert.json << EOF
{
  "displayName": "Resume Worker - High Latency",
  "documentation": {
    "content": "P95 latency exceeded 60s for resume-worker-dev. AI generation may be slow or timing out.",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "P95 latency > 60s",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/request_latencies\"",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_PERCENTILE_95"
          }
        ],
        "comparison": "COMPARISON_GT",
        "thresholdValue": 60000,
        "duration": "300s"
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["$CHANNEL_ID"]
}
EOF

gcloud alpha monitoring policies create \
  --policy-from-file=/tmp/latency-alert.json \
  --project="$PROJECT_ID" 2>/dev/null || echo "Latency alert may already exist"

# Alert 3: Instance Count = 0 (service down)
echo "Creating availability alert..."
cat > /tmp/availability-alert.json << EOF
{
  "displayName": "Resume Worker - Service Down",
  "documentation": {
    "content": "No active instances for resume-worker-dev. Service may be down or scaled to zero with no traffic.",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "No active instances",
      "conditionThreshold": {
        "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/container/instance_count\"",
        "aggregations": [
          {
            "alignmentPeriod": "300s",
            "perSeriesAligner": "ALIGN_MEAN"
          }
        ],
        "comparison": "COMPARISON_LT",
        "thresholdValue": 1,
        "duration": "600s"
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "notificationChannels": ["$CHANNEL_ID"]
}
EOF

gcloud alpha monitoring policies create \
  --policy-from-file=/tmp/availability-alert.json \
  --project="$PROJECT_ID" 2>/dev/null || echo "Availability alert may already exist"

# Create uptime check
echo "Creating uptime check..."
gcloud monitoring uptime create \
  --display-name="Resume Worker Health Check" \
  --resource-type=cloud-run-revision \
  --resource-labels="service_name=$SERVICE_NAME,project_id=$PROJECT_ID,location=us-central1" \
  --http-path="/health" \
  --check-interval=60 \
  --timeout=10 \
  --project="$PROJECT_ID" 2>/dev/null || echo "Uptime check may already exist"

# Create dashboard
echo "Creating monitoring dashboard..."
cat > /tmp/dashboard.json << EOF
{
  "displayName": "Resume Worker Dashboard",
  "gridLayout": {
    "columns": "2",
    "widgets": [
      {
        "title": "Request Count by Status",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/request_count\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_RATE",
                  "groupByFields": ["metric.labels.response_code_class"]
                }
              }
            }
          }]
        }
      },
      {
        "title": "Request Latency (P50, P95, P99)",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/request_latencies\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_PERCENTILE_99"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Active Instances",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/container/instance_count\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            }
          }]
        }
      },
      {
        "title": "Memory Utilization",
        "xyChart": {
          "dataSets": [{
            "timeSeriesQuery": {
              "timeSeriesFilter": {
                "filter": "resource.type=\"cloud_run_revision\" AND resource.labels.service_name=\"$SERVICE_NAME\" AND metric.type=\"run.googleapis.com/container/memory/utilizations\"",
                "aggregation": {
                  "alignmentPeriod": "60s",
                  "perSeriesAligner": "ALIGN_MEAN"
                }
              }
            }
          }]
        }
      }
    ]
  }
}
EOF

gcloud monitoring dashboards create \
  --config-from-file=/tmp/dashboard.json \
  --project="$PROJECT_ID" 2>/dev/null || echo "Dashboard may already exist"

echo ""
echo "=== Monitoring Setup Complete ==="
echo "Dashboard: https://console.cloud.google.com/monitoring/dashboards?project=$PROJECT_ID"
echo "Alerts: https://console.cloud.google.com/monitoring/alerting?project=$PROJECT_ID"
echo "Uptime Checks: https://console.cloud.google.com/monitoring/uptime?project=$PROJECT_ID"
