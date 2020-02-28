#!/bin/bash

gsutil cp gs://video-generator-image/video-generator.tar .

docker load -i video-generator.tar

PROJECT_NAME=video-generator:latest
PROJECT_ID=$(gcloud config list --format 'value(core.project)' 2>/dev/null)
#PROJECT_ID=${PROJECT_ID/:/\/}
IMAGE_NAME=gcr.io/${PROJECT_ID}/${PROJECT_NAME}

docker tag $PROJECT_NAME $IMAGE_NAME
docker push $IMAGE_NAME

IMAGE_NAME=$(docker inspect --format='{{index .RepoDigests 0}}' $IMAGE_NAME)

kubectl set image deployment video-generator video-generator=$IMAGE_NAME
