#!/bin/bash
source ../pva.conf

INPUT_BUCKET_NAME=pva-deployment-test-1-input
CONFIG_GENERATED_TOPIC_NAME=pva_product_configs_generated

gcloud pubsub topics create ${CONFIG_GENERATED_TOPIC_NAME}

gcloud functions deploy generate_product_configs\
 --runtime python311\
 --trigger-event-filters="type=google.cloud.storage.object.v1.finalized"\
 --trigger-event-filters="bucket=${INPUT_BUCKET_NAME}"\
 --project "${GOOGLE_CLOUD_PROJECT:=$(gcloud config get-value project)}"\
 --region ${GCP_REGION} --memory 2048MB --gen2 --env-vars-file env.yaml

gcloud functions deploy generate_video_configs\
 --runtime python311\
 --trigger-topic="${CONFIG_GENERATED_TOPIC_NAME}"\
 --project "${GOOGLE_CLOUD_PROJECT:=$(gcloud config get-value project)}"\
 --region ${GCP_REGION} --memory 2048MB --gen2 --env-vars-file env.yaml

gcloud functions deploy generate_video_targeting\
 --runtime python311\
 --trigger-topic="${CONFIG_GENERATED_TOPIC_NAME}"\
 --project "${GOOGLE_CLOUD_PROJECT:=$(gcloud config get-value project)}"\
 --region ${GCP_REGION} --memory 2048MB --gen2 --env-vars-file env.yaml