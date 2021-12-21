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

echo 'About to install Video Generator on Kubernetes Engine...'

# Enable APIs
echo 'Enabling APIs...'
gcloud services enable drive.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable youtube.googleapis.com
gcloud services enable storagetransfer.googleapis.com
gcloud services enable container.googleapis.com

# Create cluster
echo 'Creating cluster video-generator-cluster on Google Kubernetes Engine...'
gcloud container clusters create video-generator-cluster \
--num-nodes=1 \
--zone us-west1-a \
--machine-type=e2-standard-2 \
--no-enable-autoupgrade \
--scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/youtube,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/devstorage.read_write

gcloud container clusters get-credentials --zone us-west1-a video-generator-cluster
sleep 5

IMAGE_NAME=gcr.io/${GOOGLE_CLOUD_PROJECT}/${PROJECT_NAME}
export IMAGE_NAME

if [ "$1" ]
then
  gsutil cp gs://pva-cloud-build-tokens/token_backend token
fi

if ! test -f "token"; then
  python3 authenticator.py
fi

# Image is not there yet
# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID
docker build -t video-generator .
docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"

# Install application to cluster
echo 'Apply application to cluster...'

# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID
envsubst < video-generator.yaml | kubectl apply -f -

echo 'Deploying video-generator to cluster...'
sleep 10

echo 'Done'
