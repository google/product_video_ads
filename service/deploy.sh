#!/bin/bash
# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
set -e
# Read config variables
CONFIG_FILE="$(dirname $0)/deploy-config.sh"
if [ ! -r $CONFIG_FILE ]; then
  echo "ERROR: Config file '$CONFIG_FILE' not found. This file is needed to configure the application's settings."
  echo "Please run 'npm run start' before attempting to run this script."
  exit 1
fi
. $CONFIG_FILE

gcloud config set project $CONFIG_GCP_PROJECT_ID
gcloud services enable cloudresourcemanager.googleapis.com
gcloud auth application-default set-quota-project $CONFIG_GCP_PROJECT_ID
printf "\nINFO - GCP project set to '$CONFIG_GCP_PROJECT_ID' succesfully!\n"

BUCKET_EXISTS=$(gcloud storage ls gs://$CONFIG_GCS_BUCKET >/dev/null 2>&1 && echo "true" || echo "false")
if "${BUCKET_EXISTS}"; then
  printf "\nWARN - Bucket '$CONFIG_GCS_BUCKET' already exists. Skipping bucket creation...\n"
else
  gcloud storage buckets create gs://$CONFIG_GCS_BUCKET --project=$CONFIG_GCP_PROJECT_ID --location=$CONFIG_GCS_LOCATION --uniform-bucket-level-access
  test $? -eq 0 || exit
  printf "\nINFO - Bucket '$CONFIG_GCS_BUCKET' created successfully in location '$CONFIG_GCS_LOCATION'!\n"
fi
sleep 60

printf "\nINFO - Enabling GCP APIs...\n"
gcloud services enable \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  cloudfunctions.googleapis.com \
  compute.googleapis.com \
  eventarc.googleapis.com \
  logging.googleapis.com \
  pubsub.googleapis.com \
  run.googleapis.com \
  serviceusage.googleapis.com \
  storage.googleapis.com \
  youtube.googleapis.com
sleep 60

PROJECT_NUMBER=$(gcloud projects describe $CONFIG_GCP_PROJECT_ID --format="value(projectNumber)")
STORAGE_SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gs-project-accounts.iam.gserviceaccount.com"
EVENTARC_SERVICE_ACCOUNT="service-${PROJECT_NUMBER}@gcp-sa-eventarc.iam.gserviceaccount.com"
COMPUTE_SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
printf "\nINFO - Creating Service Agents and granting roles...\n"
for SA in "storage.googleapis.com" "eventarc.googleapis.com" "pubsub.googleapis.com"; do
  gcloud --no-user-output-enabled beta services identity create --project=$CONFIG_GCP_PROJECT_ID \
    --service="${SA}"
done
sleep 60

COMPUTE_SA_ROLES=(
  "roles/eventarc.eventReceiver"
  "roles/run.invoker"
  "roles/cloudfunctions.invoker"
  "roles/storage.objectAdmin"
  "roles/aiplatform.user"
  "roles/logging.logWriter"
  "roles/artifactregistry.createOnPushWriter"
  "roles/cloudbuild.builds.builder"
  "roles/pubsub.editor"
)
for COMPUTE_SA_ROLE in "${COMPUTE_SA_ROLES[@]}"; do
  gcloud --no-user-output-enabled projects add-iam-policy-binding \
    $CONFIG_GCP_PROJECT_ID \
    --member="serviceAccount:${COMPUTE_SERVICE_ACCOUNT}" \
    --role="${COMPUTE_SA_ROLE}"
done
sleep 60

gcloud --no-user-output-enabled projects add-iam-policy-binding \
  $CONFIG_GCP_PROJECT_ID \
  --member="serviceAccount:${STORAGE_SERVICE_ACCOUNT}" \
  --role="roles/pubsub.publisher"
gcloud --no-user-output-enabled projects add-iam-policy-binding \
  $CONFIG_GCP_PROJECT_ID \
  --member="serviceAccount:${EVENTARC_SERVICE_ACCOUNT}" \
  --role="roles/eventarc.serviceAgent"
printf "Operation finished successfully!\n"
printf "\nINFO - Deploying the 'pva-lite-orchestrator' Cloud Function...\n"
gcloud functions deploy pva-lite-orchestrator \
  --env-vars-file .env.yaml \
  --gen2 \
  --region=$CONFIG_GCP_REGION \
  --runtime=python310 \
  --source=orchestrator \
  --entry-point=gcs_file_uploaded \
  --timeout=540s \
  --memory=8Gi \
  --cpu=2 \
  --trigger-event-filters="type=google.cloud.storage.object.v1.finalized" \
  --trigger-event-filters="bucket=$CONFIG_GCS_BUCKET" \
  --trigger-location="$CONFIG_GCS_LOCATION"
test $? -eq 0 || exit

printf "\nINFO - Creating the '$CONFIG_GCP_PUBSUB_TOPIC' Pub/Sub Topic...\n"
TOPIC_EXISTS=$(gcloud pubsub topics list | grep topics/$CONFIG_GCP_PUBSUB_TOPIC >/dev/null 2>&1 && echo "true" || echo "false")
if "${TOPIC_EXISTS}"; then
  printf "\nWARN - Topic '$CONFIG_GCP_PUBSUB_TOPIC' already exists. Skipping topic creation...\n"
else
  gcloud pubsub topics create $CONFIG_GCP_PUBSUB_TOPIC
  test $? -eq 0 || exit
  printf "\nINFO - Topic '$CONFIG_GCP_PUBSUB_TOPIC' created successfully!\n"
fi

printf "\nINFO - Deploying the 'pva-lite-runner' Cloud Function...\n"
gcloud functions deploy pva-lite-runner \
  --env-vars-file .env.yaml \
  --gen2 \
  --region=$CONFIG_GCP_REGION \
  --runtime=python310 \
  --source=runner \
  --entry-point=subscribe \
  --timeout=540s \
  --memory=32Gi \
  --cpu=8 \
  --trigger-topic=$CONFIG_GCP_PUBSUB_TOPIC
test $? -eq 0 || exit
