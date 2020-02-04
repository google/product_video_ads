#!/bin/bash

PROJECT_NAME=video-generator:latest

# Enable APIs
echo 'Enabling APIs...'
gcloud services enable drive.googleapis.com
gcloud services enable sheets.googleapis.com
gcloud services enable youtube.googleapis.com
gcloud services enable storagetransfer.googleapis.com
gcloud services enable container.googleapis.com

# Create cluster
echo 'Creating cluster video-generator-cluster on Google Kubernetes Engine...'
gcloud container clusters create video-generator-cluster --num-nodes=1 \
--zone us-west1-a \
--no-enable-autoupgrade \
--scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/youtube.upload,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/devstorage.read_write

gcloud container clusters get-credentials \
--zone us-west1-a \
video-generator-cluster

sleep 5

# Get docker image
gsutil cp gs://video-generator-image/video-generator.tar .
docker load -i video-generator.tar

PROJECT_ID=$(gcloud config list --format 'value(core.project)' 2>/dev/null)
#PROJECT_ID=${PROJECT_ID/:/\/}
IMAGE_NAME=gcr.io/${PROJECT_ID}/${PROJECT_NAME}

docker tag $PROJECT_NAME $IMAGE_NAME
docker push $IMAGE_NAME

# Install application to cluster
echo 'Apply application to cluster...'

gsutil cp gs://video-generator-image/video-generator.yaml video-generator.yaml

echo -n 'Type the spreadsheet ID: '
read SPREADSHEET_ID
export SPREADSHEET_ID=$SPREADSHEET_ID

echo -n 'Type the bucket name: '
read BUCKET_NAME
export BUCKET_NAME=$BUCKET_NAME

export IMAGE_NAME=$IMAGE_NAME

envsubst < video-generator.yaml | kubectl apply -f -

echo 'Deploying video-generator to cluster...'

sleep 10

echo 'Done'
