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

CREDENTIALS_FOLDER=$(pwd)/credentials

echo 'SPREADSHEET_ID: '
read -r SPREADSHEET_ID

echo 'Bucket Name:'
read -r BUCKET_NAME

if [[ "$(docker images -q video-generator:latest 2> /dev/null)" == "" ]]; then
  echo 'Image video-generator:latest not found - You must build it first!'
  exit 1
fi

docker run --rm \
  -e SPREADSHEET_ID="$SPREADSHEET_ID" \
  -e GOOGLE_APPLICATION_CREDENTIALS='/credentials/credentials.json' \
  -e BUCKET_NAME="$BUCKET_NAME" \
  -v "$CREDENTIALS_FOLDER":/credentials \
  -m 6g \
  --name video-generator \
  video-generator