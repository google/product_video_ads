#!/bin/bash

# Copyright 2021 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#    https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# INSTRUCTIONS: This script should be run inside the Cloud Shell of your GCP.
set -e
export RED='\033[1;91m'
export BLUE='\033[1;34m'
export NC='\033[0m' # No Color
export BOLD=$(tput bold)
export NORMAL=$(tput sgr0)

CONFIG_FILE=pva.conf

printInitialPrompt(){
    echo -e "${BOLD}Welcome to the Product Video Ads Installer${NORMAL}"
    read -p "Press ENTER when ready"
}

saveConfig(){
    rm -f $CONFIG_FILE
    echo "export SPREADSHEET_ID=${SPREADSHEET_ID}" >> $CONFIG_FILE
    echo "export GCS_BUCKET_NAME=${GCS_BUCKET_NAME}" >> $CONFIG_FILE
    echo "export GCP_REGION=${GCP_REGION}" >> $CONFIG_FILE
    echo "export GCP_ZONE=${GCP_ZONE}" >> $CONFIG_FILE
    echo "export GCR_URL=${GCR_URL}" >> $CONFIG_FILE
    echo "export FRONTEND_CLIENT_ID=${FRONTEND_CLIENT_ID}" >> $CONFIG_FILE
    echo "export FRONTEND_API_KEY=${FRONTEND_API_KEY}" >> $CONFIG_FILE
    echo "export DESKTOP_CLIENT_ID=${DESKTOP_CLIENT_ID}" >> $CONFIG_FILE
    echo "export DESKTOP_CLIENT_SECRET=${DESKTOP_CLIENT_SECRET}" >> $CONFIG_FILE
}

readConfig(){
    if [ -f $CONFIG_FILE ]; then
        source $CONFIG_FILE
    fi
}

enableApis(){
    echo "Enabling some needed APIs..."
    gcloud services enable \
        drive.googleapis.com \
        script.googleapis.com \
        sheets.googleapis.com \
        youtube.googleapis.com \
        storagetransfer.googleapis.com \
        container.googleapis.com \
        secretmanager.googleapis.com
        
}

selectSpreadsheet(){
    PREVIOUS_SPREADSHEET_ID=${SPREADSHEET_ID}
    echo -n "Enter a Spreadsheet Id (Leave blank to create a new one) [${PREVIOUS_SPREADSHEET_ID}] : "
    read -r SPREADSHEET_ID

    SPREADSHEET_ID=${SPREADSHEET_ID:=${PREVIOUS_SPREADSHEET_ID}}

    if [ -z "$SPREADSHEET_ID" ]
    then
        echo "Setting up Google Sheets and Drive ... "
        echo -e "Ensure that '${BOLD}Google Apps Script API${NORMAL}' is ${BOLD}ENABLED${NORMAL} for this user. You can enable it at: https://script.google.com/corp/home/usersettings"
        read -p "Press ENTER when ready"

        set -o allexport
        pip3 install --upgrade google-auth-oauthlib google-api-python-client oauth2client google-cloud-storage
        python3 setup.py --env-out='/tmp/pva.env' && source /tmp/pva.env
        set +o allexport
    else
        export SPREADSHEET_ID
    fi
}

selectStorage(){
    echo -n "Enter Google Cloud Storage bucket name to store generated assets in Google Cloud Storage instead of Google Drive (Leave blank to default to Google Drive Storage): "
    read -r GCS_BUCKET_NAME
    if [ -z "$GCS_BUCKET_NAME" ]
    then
        export GCS_BUCKET_NAME=""
    else 
        export GCS_BUCKET_NAME
    fi
}

selectRegionAndZone() {
    
    PREVIOUS_REGION=${GCP_REGION:=us-central}
    PREVIOUS_ZONE=${GCP_ZONE:=us-central1-a}
    gcloud app regions list | grep REGION:
    echo -n "Select GCP region that you want to deploy into? [${GCP_REGION:=${PREVIOUS_REGION}}] : "
    read -r GCP_REGION
    export GCP_REGION=${GCP_REGION:=${PREVIOUS_REGION}}
    gcloud compute zones list | grep ${GCP_REGION} | grep NAME
    echo -n "Select GCP zone that you want to deploy into? [${GCP_ZONE:=${PREVIOUS_ZONE}}] : "
    read -r GCP_ZONE
    export GCP_ZONE=${GCP_ZONE:=${PREVIOUS_ZONE}}
    
    # echo "Selected deployment region ${GCP_REGION}, zone ${GCP_ZONE}"
}

selectGcrRegistry(){
    PREVIOUS_GCR=${GCR_URL:=gcr.io}
    echo -n "Select base GCP Container Registry URL [${GCR_URL:=${PREVIOUS_GCR}}] : "
    read -r GCR_URL
    export GCR_URL=${GCR_URL:=${PREVIOUS_GCR}}
    # echo "Will use GCR registry under ${GCR_URL}"
}

selectWebClientId(){
    PREVIOUS_FRONTEND_CLIENT_ID=${FRONTEND_CLIENT_ID:=}
    echo -n "Enter Web Client ID [${FRONTEND_CLIENT_ID:=${PREVIOUS_FRONTEND_CLIENT_ID}}] : "
    read -r FRONTEND_CLIENT_ID
    export FRONTEND_CLIENT_ID=${FRONTEND_CLIENT_ID:=${PREVIOUS_FRONTEND_CLIENT_ID}}
}

selectFrontendApiKey(){
    PREVIOUS_FRONTEND_API_KEY=${FRONTEND_API_KEY:=}
    echo -n "Enter Web API key [${FRONTEND_API_KEY:=${PREVIOUS_FRONTEND_API_KEY}}] : "
    read -r FRONTEND_API_KEY
    export FRONTEND_API_KEY=${FRONTEND_API_KEY:=${PREVIOUS_FRONTEND_API_KEY}}
}


selectDesktopClientId(){
    PREVIOUS_DESKTOP_CLIENT_ID=${DESKTOP_CLIENT_ID:=}
    echo -n "Enter Desktop Client ID [${DESKTOP_CLIENT_ID:=${PREVIOUS_DESKTOP_CLIENT_ID}}] : "
    read -r DESKTOP_CLIENT_ID
    export DESKTOP_CLIENT_ID=${DESKTOP_CLIENT_ID:=${PREVIOUS_DESKTOP_CLIENT_ID}}
}

selectDesktopSecret(){
    PREVIOUS_DESKTOP_CLIENT_SECRET=${DESKTOP_CLIENT_SECRET:=}
    echo -n "Enter Desktop Client Secret [${DESKTOP_CLIENT_SECRET:=${PREVIOUS_DESKTOP_CLIENT_SECRET}}] : "
    read -r DESKTOP_CLIENT_SECRET
    export DESKTOP_CLIENT_SECRET=${DESKTOP_CLIENT_SECRET:=${PREVIOUS_DESKTOP_CLIENT_SECRET}}
}

printReminderAndConfig(){
    # Important reminder
    APP_URL=$(gcloud app browse --no-launch-browser)
    INSTRUCTIONS="
    ${RED}
    #############################################################################

    ██ ███    ███ ██████   ██████  ██████  ████████  █████  ███    ██ ████████ 
    ██ ████  ████ ██   ██ ██    ██ ██   ██    ██    ██   ██ ████   ██    ██    
    ██ ██ ████ ██ ██████  ██    ██ ██████     ██    ███████ ██ ██  ██    ██    
    ██ ██  ██  ██ ██      ██    ██ ██   ██    ██    ██   ██ ██  ██ ██    ██    
    ██ ██      ██ ██       ██████  ██   ██    ██    ██   ██ ██   ████    ██    
                                                                            
    #############################################################################
    ${NC}
    ${BOLD}Ensure your Web OAuth Client has authorized the following URL BEFORE launching the app.${NORMAL}

    ${BLUE}$APP_URL/${NC}

    1. Go to 'APIs & Services' > Credentials (https://console.cloud.google.com/apis/credentials).
    2. Click your Web Client under 'OAuth 2.0 Client IDs'.
    3. Add the URI to '${BOLD}Authorized JavaScript origins${NORMAL}' and '${BOLD}Authorized redirect URIs${NORMAL}'.
    4. Click 'Save'.
    "

    echo -e "$INSTRUCTIONS"
    echo "Your application was installed successfully! To login go to:"
    echo -e "\n${BLUE}$APP_URL/${NC}\n"
    echo -e "Sheet Id: $SPREADSHEET_ID"
    echo -e "Google Cloud Storage bucket name: $GCS_BUCKET_NAME"
    echo -e "GCP Region and Zone chosen: $GCP_REGION / $GCP_ZONE"
    echo -e "GCR repository used: $GCR_URL"
    echo -e "Frontend will use Web Client ID $FRONTEND_CLIENT_ID"
    echo -e "Frontend will use Web API key $FRONTEND_API_KEY"
    echo -e "Video Generator will use Desktop Client ID $DESKTOP_CLIENT_ID"
    echo -e "Video Generator will use Desktop Client Secret $DESKTOP_CLIENT_SECRET"
}

installFrontend(){
    cd frontend
    sh install-cloud.sh
    cd ../
}

installBackend(){
    cd video-generator
    sh install-cloud.sh
    cd ../
}

main() {
    readConfig
    printInitialPrompt
    enableApis
    selectSpreadsheet
    selectStorage
    selectRegionAndZone
    selectGcrRegistry
    selectWebClientId
    selectFrontendApiKey
    selectDesktopClientId
    selectDesktopSecret
    saveConfig
    installFrontend
    installBackend
    printReminderAndConfig
}

main
