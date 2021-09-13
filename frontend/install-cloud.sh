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
set -e

npm install --legacy-peer-deps
npm run build --configuration=production

echo 'Enabling some needed APIs...'
gcloud services enable drive.googleapis.com
gcloud services enable sheets.googleapis.com

echo 'Installing Web Frontend on App Engine...'

echo -n 'Enter the Web Client Id: '
read FRONTEND_CLIENT_ID

echo -n 'Enter the API Key: '
read FRONTEND_API_KEY

export FRONTEND_API_KEY FRONTEND_CLIENT_ID
mv dist/assets/js/env.js dist/assets/js/env.js.orig
envsubst < dist/assets/js/env.js.orig > dist/assets/js/env.js
rm dist/assets/js/env.js.orig

gcloud app create || true
gcloud app deploy -q

rm -rf dist node_modules package-lock.json