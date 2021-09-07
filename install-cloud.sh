#!/bin/bash

# Copyright 2021 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# INSTRUCTIONS: This script should be run inside the Cloud Shell of your GCP.
set -e

echo 'Enabling some needed APIs...'
gcloud services enable \
  drive.googleapis.com \
  script.googleapis.com \
  sheets.googleapis.com \
  youtube.googleapis.com \
  storagetransfer.googleapis.com \
  container.googleapis.com

echo -n 'Enter a Spreadsheet Id (Leave blank to create a new one): '
read -r SPREADSHEET_ID

if [ -z "$SPREADSHEET_ID" ]
then
  echo 'Setting up Google Sheets and Drive'
  set -o allexport
  python3 setup.py --env-out='/tmp/pva.env' && cat /tmp/pva.env && source /tmp/pva.env
  set +o allexport
else
  export SPREADSHEET_ID
fi

echo 'Installing Web Frontend on App Engine...'

echo -n 'Type the Web Client ID: '
read FRONTEND_CLIENT_ID

echo -n 'Type API Key: '
read FRONTEND_API_KEY

npm --prefix=frontend install --legacy-peer-deps
npm --prefix=frontend run build --configuration=production

export FRONTEND_CLIENT_ID FRONTEND_API_KEY
envsubst < frontend/dist/assets/js/env.js > frontend/dist/assets/js/env.js

gcloud app deploy

# Clean up after installer
rm -rf dist node_modules package-lock.json

echo 'Install Video Generator on Kubernetes Engine...'

# Create cluster
echo 'Creating cluster video-generator-cluster on Google Kubernetes Engine...'
gcloud container clusters create video-generator-cluster \
--num-nodes=1 \
--zone us-west1-a \
--machine-type=e2-standard-2 \
--no-enable-autoupgrade \
--scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/youtube.upload,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/devstorage.read_write

gcloud container clusters get-credentials --zone us-west1-a video-generator-cluster
sleep 5

PROJECT_NAME=video-generator:latest
export IMAGE_NAME=gcr.io/${GOOGLE_CLOUD_PROJECT}/${PROJECT_NAME}

if ! test -f "token"; then
  python3 video-generator/authenticator.py
fi

# Build the image
# ENV variables needed: IMAGE_NAME, SPREADSHEET_ID
docker build -t "video-generator" video-generator
docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"

echo 'Deploying video-generator to the cluster...'
# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID
envsubst < video-generator/video-generator.yaml | kubectl apply -f -
sleep 10

echo 'Done'

# Start the front-end
gcloud app browse