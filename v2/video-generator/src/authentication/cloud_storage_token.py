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

"""cloud_storage_token."""

import pickle
import log

from google.cloud import storage
from google.cloud.exceptions import NotFound


class CloudStorageToken():

  FILE = 'token'

  logger = log.getLogger()

  def __init__(self, bucket_name):
    self.bucket_name = bucket_name

  def retrieve_token(self, credentials):

    storage_client = storage.Client(credentials=credentials)
    self.logger.info('Retrieving token from %s/%s', self.bucket_name, self.FILE)

    try:
      bucket = storage_client.get_bucket(self.bucket_name)
      token = bucket.blob('token').download_as_string()
      return pickle.loads(token)
    except Exception as e:
      self.logger.error('Error retrieving token: %s', e)
      raise e

  def store_token(self, credentials):

    storage_client = storage.Client(credentials=credentials)
    bucket = None

    try:
      bucket = storage_client.get_bucket(self.bucket_name)
    except NotFound:
      self.logger.info('Bucket %s not found, creating...', self.bucket_name)
      bucket = storage_client.create_bucket(self.bucket_name)

    bucket.blob('token').upload_from_string(pickle.dumps(credentials))

    self.logger.info('Storing token on %s/%s', self.bucket_name, self.FILE)
