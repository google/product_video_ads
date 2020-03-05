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

CREDENTIALS_FOLDER=/usr/local/google/home/rgodoy/credentials

export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

export GOOGLE_APPLICATION_CREDENTIALS=$CREDENTIALS_FOLDER/credentials.json
export SPREADSHEET_ID=1p0mGUCP6nIeljP7Gd3hBpWFijfYvm1KC16cYmHxOweQ
export BUCKET_NAME=video-generator

cd src
pipenv run python main.py
