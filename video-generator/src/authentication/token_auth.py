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

import pickle

import log


class TokenAuth:
    FILE = 'token'

    logger = log.getLogger()

    def __init__(self, bucket_name, storage_client):
        self.bucket_name = bucket_name
        self.storage_client = storage_client

    def authenticate(self):

        self.logger.info('Retrieving token from %s/%s', self.bucket_name, self.FILE)

        try:
            token = self.storage_client.download_string(self.bucket_name, self.FILE)
            return pickle.loads(token, encoding='latin1')
        except Exception as e:
            self.logger.error('Error retrieving token: %s', e)
            return None
