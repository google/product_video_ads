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

echo -n 'Type the project name: '
read CLOUD_PROJECT_NAME

gcloud config set project $CLOUD_PROJECT_NAME
gcloud config list

sleep 10

# Install frontend
echo 'Installing Web Frontend on App Engine...'
gsutil cp gs://product-video-ads/frontend/install-cloud.sh install-frontend.sh

echo 'Enabling some needed APIs...'
gcloud services enable drive.googleapis.com
gcloud services enable sheets.googleapis.com

sh install-frontend.sh

# Install video generator
echo 'About to install Video Generator on Kubernetes Engine...'
echo "Obtain a sheet ID before moving forward: https://$CLOUD_PROJECT_NAME.appspot.com"
read
gsutil cp gs://product-video-ads/video-generator/install-cloud.sh install-video-generator.sh
sh install-video-generator.sh