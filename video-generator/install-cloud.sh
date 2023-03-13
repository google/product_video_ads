#!/bin/bash

# Copyright 2020 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

PROJECT_NAME=video-generator:latest

source ../pva.conf

echo 'About to install Video Generator on Kubernetes Engine...'

# Install required plugin
sudo apt-get install google-cloud-sdk-gke-gcloud-auth-plugin

echo 'Creating Service account and granting it required permissions'
#Service accounts are described by several lines, hence the grep/grep/sed combo
export COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL=$(gcloud iam service-accounts list | grep -a1 Compute | grep EMAIL | sed 's/EMAIL: //')
gcloud iam service-accounts create $PVA_SERVICE_ACCOUNT_NAME --display-name $PVA_SERVICE_ACCOUNT_NAME
export PVA_SERVICE_ACCOUNT=$(gcloud iam service-accounts list | grep -a1 $PVA_SERVICE_ACCOUNT_NAME  | grep EMAIL | sed 's/EMAIL: //')
gcloud iam service-accounts add-iam-policy-binding $PVA_SERVICE_ACCOUNT --member=serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL --role=roles/iam.serviceAccountTokenCreator

# Delete cluster
if [ "$(gcloud container clusters list | grep video-generator-cluster)" ]; then
  gcloud container clusters delete video-generator-cluster --zone ${GCP_ZONE} -q
fi

# Create cluster
echo 'Creating cluster video-generator-cluster on Google Kubernetes Engine...'
gcloud container clusters create video-generator-cluster \
--num-nodes=1 \
--zone ${GCP_ZONE} \
--machine-type=e2-standard-2 \
--no-enable-autoupgrade \
--scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/youtube,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/devstorage.read_write,https://www.googleapis.com/auth/cloud-platform

gcloud container clusters get-credentials --zone ${GCP_ZONE} video-generator-cluster
sleep 10

IMAGE_NAME=${GCR_URL}/${GOOGLE_CLOUD_PROJECT}/${PROJECT_NAME}
export IMAGE_NAME

echo 'Building an pushing image $IMAGE_NAME'

# Image is not there yet
# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID, PVA_SERVICE_ACCOUNT
docker build -t video-generator .
docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"

# Give GKE service account right to pull image from private gcr.
# Context: On first docker push, the private docker repository is created and Compute Engine service account (used by Kubernetes instances)
# doesn't have read permissions for some reason. This resulted in "ErrorImagePull" and video-generator pod being unable to start.
# Enabling all 3 potential locations just to be sure. We could have parsed GCR_URL but why complicate matters?
gsutil iam ch serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer $(gsutil ls | grep /artifacts.)
gsutil iam ch serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer $(gsutil ls | grep /eu.artifacts.)
gsutil iam ch serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer $(gsutil ls | grep /us.artifacts.)

# Install application to cluster
echo 'Apply application to cluster...'

echo -e "Sheet Id inside container shoud be: $SPREADSHEET_ID"
echo -e "Google Cloud Storage bucket Name inside container shoud be: $GCS_BUCKET_NAME"
echo -e "PVA will use $PVA_SERVICE_ACCOUNT account to access Drive,Sheets and other service - grant permissions to those manually"
echo -e "Image name is $IMAGE_NAME"
# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID, GCS_BUCKET_NAME
envsubst < video-generator.yaml | kubectl apply -f -

echo 'Deploying video-generator to cluster...'
sleep 10
echo 'Done'
