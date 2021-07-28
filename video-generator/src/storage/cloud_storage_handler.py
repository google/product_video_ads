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

import google.auth
from google.cloud import storage

import log

API_SCOPES = [
    'https://www.googleapis.com/auth/devstorage.read_write'
]


class CloudStorageHandler():
    logger = log.getLogger()

    def __init__(self, project: str = None, credentials=None):
        if credentials is None:
            # Obtains Service Account from environment just to access storage
            # It comes from GCP or GOOGLE_APPLICATION_CREDENTIALS env variable file
            credentials, project = google.auth.default(scopes=API_SCOPES)

        self.storage_client = storage.Client(
            project=project, credentials=credentials)

    def download_string(self, bucket_name, object_name):
        return self.storage_client.get_bucket(bucket_name).blob(object_name).download_as_string()

    def download_file_to_path(self, bucket_name, object_name, destination_path):
        self.logger.debug(
            'Downloading from bucket %s file %s and saving to %s' % (bucket_name, object_name, destination_path))
        self.storage_client.get_bucket(bucket_name).blob(object_name).download_to_filename(destination_path)
