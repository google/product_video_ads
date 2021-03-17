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

gsutil -m cp gs://product-video-ads/main/video-generator/video-generator.tar .

docker load -i video-generator.tar

PROJECT_NAME=video-generator:latest
PROJECT_ID=$(gcloud config list --format 'value(core.project)' 2>/dev/null | tr ":" "/")
IMAGE_NAME=gcr.io/${PROJECT_ID}/${PROJECT_NAME}

docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"

IMAGE_NAME=$(docker inspect --format='{{index .RepoDigests 0}}' "$IMAGE_NAME")

gcloud container clusters get-credentials \
--zone us-west1-a \
video-generator-cluster

kubectl set image deployment video-generator video-generator="$IMAGE_NAME"