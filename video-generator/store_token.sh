#!/bin/bash

# Copyright 2024 Google LLC

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
export COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL=$(gcloud iam service-accounts list | grep -a1 Compute | grep EMAIL | sed 's/EMAIL: //')
export SECRET_ID=video_generator_auth_token

store_token_in_secret_manager(){    
    python3 authenticator.py $GCP_PROJECT_NUMBER $DESKTOP_CLIENT_ID $DESKTOP_CLIENT_SECRET
    echo "Granting access to the secret for GKE service account"
    gcloud secrets add-iam-policy-binding projects/$GCP_PROJECT_NUMBER/secrets/$SECRET_ID \
        --member serviceAccount:$COMPUTE_ENGINE_SERVICE_ACCOUNT_EMAIL \
        --role roles/secretmanager.secretAccessor
}

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