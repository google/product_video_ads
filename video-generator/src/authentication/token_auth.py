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
import google.auth

API_SCOPES = [
   # 'https://www.googleapis.com/auth/spreadsheets',
   # 'https://www.googleapis.com/auth/youtube.upload',
   # 'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/devstorage.read_write'
]


class TokenAuth():

  logger = log.getLogger()

  def __init__(self, token_storage):

    self.token_storage = token_storage

    # Obtains Service Account from environment just to access storage
    # It comes from GCP or GOOGLE_APPLICATION_CREDENTIALS env variable file
    self.default_credentials, _ = google.auth.default(scopes=API_SCOPES)

  def authenticate(self):

    try:
      return self.token_storage.retrieve_token(self.default_credentials)
    except Exception as e:
      self.logger.info('Token not found on Storage - Check guide to fix it!')
      return None
