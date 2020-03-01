#!/bin/bash

PROJECT_NAME=video-generator:latest

echo 'Building docker image...'
sleep 3

./build-docker.sh

echo 'Running with user account' $(gcloud auth list --format="value(account)")

#PROJECT_ID=${PROJECT_ID/:/\/}
#IMAGE_NAME=gcr.io/${PROJECT_ID}/$PROJECT_NAME

#docker tag $PROJECT_NAME $IMAGE_NAME
#docker save $IMAGE_NAME -o video-generator.tar

docker save $PROJECT_NAME -o video-generator.tar

echo 'Sending docker image as TAR to cloud storage...'
# Copy files to Cloud Storage
gsutil cp video-generator.tar gs://product-video-ads/video-generator/video-generator.tar
gsutil cp video-generator.yaml gs://product-video-ads/video-generator/video-generator.yaml
gsutil cp install-cloud.sh gs://product-video-ads/video-generator/install-cloud.sh
gsutil cp update-cloud.sh gs://product-video-ads/video-generator/update-cloud.sh

echo 'Done'