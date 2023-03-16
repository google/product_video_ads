#!/bin/bash
#For quicker development only
export PROJECT_NAME=video-generator:latest
export GCR_URL=eu.gcr.io
export IMAGE_NAME=${GCR_URL}/${GOOGLE_CLOUD_PROJECT}/${PROJECT_NAME}
docker build -t video-generator .
docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"
kubectl scale deployment video-generator --replicas=0
sleep 1
kubectl scale deployment video-generator --replicas=1