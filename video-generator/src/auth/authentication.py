# Copyright 2019 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#   https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import log
import os
import pickle
import google.auth.impersonated_credentials
from google.auth.transport.requests import Request

SCOPES = ['https://www.googleapis.com/auth/content',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/youtube',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/devstorage.read_write']

def get_credentials_for_service_account(service_account_name):
        # These are the service account and scopes we'll use for the external API.
    IMPERSONATED_SVC_ACCOUNT = service_account_name
    EXTRA_SCOPES = SCOPES

    # First, we must get default credentials (since this is an AppEngine example,
    # these will be credentials for your-project@appspot.google.com)
    source_credentials, _ = google.auth.default(scopes=SCOPES)
    # source_credentials = get_credentials_from_local_file()
    source_credentials.refresh(Request())

    # Now, use the credentials for the default service account to obtain credentials
    # for the impersonated service account, with whatever scopes we have defined
    # in EXTRA_SCOPES
    # this needs iamcredentials.googleapis.com API enabled
    credentials = google.auth.impersonated_credentials.Credentials(
        source_credentials=source_credentials,
        target_principal=IMPERSONATED_SVC_ACCOUNT,
        target_scopes=EXTRA_SCOPES,
        delegates=[],
        lifetime=3600)
    
    # credentials.refresh(Request())
    return credentials