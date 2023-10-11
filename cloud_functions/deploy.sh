#!/bin/bash
source ../pva.conf
gcloud functions deploy generate_video_configs --runtime python311 --trigger-http --project ${GOOGLE_CLOUD_PROJECT:=$(gcloud config get-value project)} --region ${GCP_REGION} --memory 512MB --gen2 --env-vars-file env.yaml
gcloud functions deploy generate_product_configs --runtime python311 --trigger-http --project ${GOOGLE_CLOUD_PROJECT:=$(gcloud config get-value project)} --region ${GCP_REGION} --memory 512MB --gen2 --env-vars-file env.yaml
gcloud functions deploy generate_video_targeting --runtime python311 --trigger-http --project ${GOOGLE_CLOUD_PROJECT:=$(gcloud config get-value project)} --region ${GCP_REGION} --memory 512MB --gen2 --env-vars-file env.yaml