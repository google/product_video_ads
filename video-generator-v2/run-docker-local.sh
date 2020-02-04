#!/bin/bash

CREDENTIALS_FOLDER=/usr/local/google/home/rgodoy/credentials

echo 'SPREADSHEET_ID: '
read SPREADSHEET_ID

echo 'Bucket Name:'
read BUCKET_NAME

if [[ "$(docker images -q video-generator:latest 2> /dev/null)" == "" ]]; then
  echo 'Image video-generator:latest not found - You must build it first!'
  exit 1
fi

docker run --rm \
  -e SPREADSHEET_ID=$SPREADSHEET_ID \
  -e GOOGLE_APPLICATION_CREDENTIALS='/credentials/credentials.json' \
  -e BUCKET_NAME=$BUCKET_NAME \
  -v $CREDENTIALS_FOLDER:/credentials \
  --name video-generator \
  video-generator
