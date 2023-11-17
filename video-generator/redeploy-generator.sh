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
source ../pva.conf
PROJECT_NAME=video-generator:latest

echo 'Building Docker image for video-generator'
IMAGE_NAME=${GCR_URL}/${GOOGLE_CLOUD_PROJECT}/${PROJECT_NAME}
export IMAGE_NAME
# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID
docker build -t video-generator .
docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"
kubectl scale deployment video-generator --replicas=0
sleep 1
kubectl scale deployment video-generator --replicas=$VIDEO_GENERATOR_REPLICAS