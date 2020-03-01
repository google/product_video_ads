#!/bin/bash

# gsutil cp install.sh gs://product-video-ads/install.sh

echo -n 'Type the project name: '
read CLOUD_PROJECT_NAME

gcloud config set project $CLOUD_PROJECT_NAME
gcloud config list

sleep 10

# Install frontend
echo 'Installing Web Frontend on App Engine...'
gsutil cp gs://product-video-ads/frontend/install-cloud.sh install-frontend.sh
sh install-frontend.sh

# Install video generator
echo 'About to install Video Generator on Kubernetes Engine...'
echo 'Obtain a sheet ID before moving forward...'
read
gsutil cp gs://product-video-ads/video-generator/install-cloud.sh install-video-generator.sh
sh install-video-generator.sh