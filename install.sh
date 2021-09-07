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

echo 'Enabling some needed APIs...'
gcloud services enable \
  drive.googleapis.com \
  script.googleapis.com \
  sheets.googleapis.com \
  youtube.googleapis.com \
  storagetransfer.googleapis.com \
  container.googleapis.com

echo -n 'Enter a Spreadsheet Id (Leave blank to create a new one): '
read -r SPREADSHEET_ID

if [ -z "$SPREADSHEET_ID" ]
then
  echo 'Setting up Google Sheets and Drive'
  set -o allexport
  python3 setup.py --env-out='/tmp/pva.env' && cat /tmp/pva.env && source /tmp/pva.env
  set +o allexport
else
  export SPREADSHEET_ID
fi

cd frontend
sh install-cloud.sh
cd ../

cd video-generator
sh install-cloud.sh
cd ../

# Important reminder
RED='\033[1;91m'
BLUE='\033[1;34m'
NC='\033[0m' # No Color
APP_URL=$(gcloud app browse --no-launch-browser)
echo -e "${RED}IMPORTANT:${NC} Ensure your Web OAuth Client has authorized the following URL BEFORE launching the app."
echo -e "App URL: ${BLUE}$APP_URL/${NC}" 

gcloud app browse