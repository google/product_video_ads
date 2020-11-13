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

echo 'Building docker image...'
sleep 3

./build-docker.sh

echo 'Running with user account' $(gcloud auth list --format="value(account)")

docker save $PROJECT_NAME -o video-generator.tar

echo 'Sending docker image as TAR to cloud storage...'

# Copy files to Cloud Storage
gsutil cp video-generator.tar gs://product-video-ads/v2/video-generator/video-generator.tar
gsutil cp video-generator.yaml gs://product-video-ads/v2/video-generator/video-generator.yaml
gsutil cp install-cloud.sh gs://product-video-ads/v2/video-generator/install-cloud.sh
gsutil cp update-cloud.sh gs://product-video-ads/v2/video-generator/update-cloud.sh
gsutil cp authenticator.py gs://product-video-ads/v2/video-generator/authenticator.py

rm video-generator.tar

echo 'Done'