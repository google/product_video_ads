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

RED='\033[1;91m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color
BOLD=$(tput bold)
NORMAL=$(tput sgr0)

echo -e "${BOLD}Welcome to the Product Video Ads Installer${NORMAL}"
echo -e "Keep your OAuth 2.0 Keys (Web & Desktop) and API Key at hand."
read -p "Press ENTER when ready"

echo "Enabling some needed APIs..."
gcloud services enable \
  drive.googleapis.com \
  script.googleapis.com \
  sheets.googleapis.com \
  youtube.googleapis.com \
  storagetransfer.googleapis.com \
  container.googleapis.com

echo -n "Enter a Spreadsheet Id (Leave blank to create a new one): "
read -r SPREADSHEET_ID

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

echo -n "Enter Google Cloud Storage bucket name to store generated assets in Google Cloud Storage instead of Google Drive (Leave blank to default to Google Drive Storage): "
read -r GCS_BUCKET_NAME

if [ -z "$GCS_BUCKET_NAME" ]
then
  export GCS_BUCKET_NAME=""
else 
  export GCS_BUCKET_NAME
fi


cd frontend
sh install-cloud.sh
cd ../

cd video-generator
sh install-cloud.sh
cd ../

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