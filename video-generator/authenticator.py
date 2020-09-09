# Copyright 2020 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import pickle
from google_auth_oauthlib.flow import InstalledAppFlow

# Read client's ID and secret
client_id = input('Client ID: ')
client_secret = input('Client secret: ')

# Get credentials from console flow
credentials = InstalledAppFlow.from_client_config({
    "installed": {
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob"],
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token"
    }
}, scopes=[
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/devstorage.read_write'
]).run_console()

# Writes credentials token to current folder
with open('token', 'wb') as token_file:
    token_file.write(pickle.dumps(credentials))
