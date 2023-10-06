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

#Service accounts are described by several lines, hence the grep/grep/sed combo
export COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL=$(gcloud iam service-accounts list | grep -a1 Compute | grep EMAIL | sed 's/EMAIL: //')
PROJECT_NAME=video-generator:latest
export SECRET_ID=video_generator_auth_token

store_token_in_secret_manager(){    
    python3 authenticator.py $GCP_PROJECT_NUMBER $DESKTOP_CLIENT_ID $DESKTOP_CLIENT_SECRET
    echo "Granting access to the secret for GKE service account"
    gcloud secrets add-iam-policy-binding projects/$GCP_PROJECT_NUMBER/secrets/$SECRET_ID \
        --member serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL \
        --role roles/secretmanager.secretAccessor
}

create_cluster(){
    gcloud container clusters create video-generator-cluster \
    --num-nodes=${VIDEO_GENERATOR_NODES} \
    --zone ${GCP_ZONE} \
    --machine-type=${VIDEO_GENERATOR_MACHINE_TYPE} \
    --addons=GcpFilestoreCsiDriver \
    --no-enable-autoupgrade \
    --scopes=https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/youtube,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/devstorage.read_write,https://www.googleapis.com/auth/cloud-platform

    # gcloud container clusters update video-generator-cluster --update-addons=GcpFilestoreCsiDriver=ENABLED --zone ${GCP_ZONE}
}

echo 'Installing Video Generator on Kubernetes Engine...'

echo 'Storing Desktop authentication credentials for use by video-generator-cluster'
pip install -q google-cloud-secret-manager
export GCP_PROJECT_NUMBER=$(gcloud projects describe $GOOGLE_CLOUD_PROJECT --format="value(projectNumber)")
if gcloud secrets describe $SECRET_ID >> /dev/null; then
    read -p 'Previous token found, do you want to replace it? [y/N] ' -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        store_token_in_secret_manager
    fi
else
    store_token_in_secret_manager
fi

# Install required plugin
sudo apt-get -qq install google-cloud-sdk-gke-gcloud-auth-plugin

if [ "$(gcloud container clusters list | grep video-generator-cluster)" ]; then
    read -p 'Found already running video-generator-cluster. Do you want to redeploy it? [y/N] ' -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]
    then
        gcloud container clusters delete video-generator-cluster --zone ${GCP_ZONE} -q
        create_cluster
    fi
else
    echo "Creating video-generator-cluster on Google Kubernetes Engine"
    create_cluster
fi

gcloud container clusters get-credentials --zone ${GCP_ZONE} video-generator-cluster

echo "Authorizing GKE to pull images from Container Registry..."
#Give GKE service account right to pull image from private gcr.
#Context: On first docker push, the private docker repository is created and Compute Engine service account (used by Kubernetes instances)
#doesn't have read permissions for some reason. This resulted in "ErrorImagePull" and video-generator pod being unable to start.
#There are 3 GCRs, just to be sure let's add it to all of them (only one willbe used)
#TODO this should be based on GRC_URL (sed it later)
export GCR_GCS_BUCKET=$(gsutil ls | grep /artifacts.)
gsutil iam ch serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer $GCR_GCS_BUCKET
export GCR_GCS_BUCKET=$(gsutil ls | grep /eu.artifacts.)
gsutil iam ch serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer $GCR_GCS_BUCKET
export GCR_GCS_BUCKET=$(gsutil ls | grep /us.artifacts.)
gsutil iam ch serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL:roles/storage.objectViewer $GCR_GCS_BUCKET

#TODO - Change editor role for service account and specify a better role for security reasons
gcloud projects add-iam-policy-binding $GOOGLE_CLOUD_PROJECT \
    --member=serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL \
    --role=roles/editor

echo 'Building Docker image for video-generator'
IMAGE_NAME=${GCR_URL}/${GOOGLE_CLOUD_PROJECT}/${PROJECT_NAME}
export IMAGE_NAME
# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID
docker build -t video-generator .
docker tag $PROJECT_NAME "$IMAGE_NAME"
docker push "$IMAGE_NAME"

echo -e "Applying application to cluster..."
echo -e "Sheet Id inside container shoud be: $SPREADSHEET_ID"
echo -e "Google Cloud Storage bucket Name inside container shoud be: $GCS_BUCKET_NAME"
echo -e "GCP Project Number inside container shoud be: $GCP_PROJECT_NUMBER"
echo -e "Replicas count should be ${VIDEO_GENERATOR_REPLICAS}"

# ENV vars needed: IMAGE_NAME, SPREADSHEET_ID, GCS_BUCKET_NAME, GOOGLE_CLOUD_PROJECT, VIDEO_GENERATOR_REPLICAS
envsubst < video-generator.yaml | kubectl apply -f -

echo 'Done'
