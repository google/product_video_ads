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
