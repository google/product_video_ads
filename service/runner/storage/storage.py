# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""PVA Lite storage service.

This module provides methods for interacting with Google Cloud Storage.
"""

import logging
import os
import pathlib
from typing import Optional, Union

from google.cloud import storage
from google.cloud.storage import transfer_manager


def download_gcs_file(
    filepath: str,
    bucket_name: str,
    output_dir: Optional[str] = None,
    fetch_contents: bool = False,
) -> Union[Optional[str], Optional[bytes]]:
  """Downloads a file from the given GCS bucket and returns its path.

  Args:
    filepath: The path of the file to download.
    bucket_name: The name of the bucket to retrieve the file from.
    output_dir: Directory path to store the downloaded file in.
    fetch_contents: Whether to fetch the file contents instead of writing to a
      file.

  Returns:
    The retrieved file path or contents based on `fetch_contents`, or None if
    the file was not found.
  """
  filename, file_ext = os.path.splitext(filepath)
  file_path = pathlib.Path(filename)

  storage_client = storage.Client()
  bucket = storage_client.bucket(bucket_name)

  blob = bucket.blob(filepath)
  result = None

  if not blob.exists():
    logging.warning(
        'DOWNLOAD - Could not find file "%s" in bucket "%s".',
        filepath,
        bucket_name,
    )
  else:
    if fetch_contents:
      result = blob.download_as_bytes()
    else:
      destination_file_name = str(pathlib.Path(output_dir, f'{filepath}'))
      blob.download_to_filename(destination_file_name)
      result = destination_file_name

    logging.info(
        'DOWNLOAD - Fetched file "%s" from bucket "%s".',
        filepath,
        bucket_name,
    )
  return result


def upload_gcs_file(
    file_path: str,
    destination_file_name: str,
    bucket_name: str,
    overwrite: bool = False,
) -> None:
  """Uploads a file to the given GCS bucket.

  Args:
    file_path: The path of the file to upload.
    destination_file_name: The name of the file to upload as.
    bucket_name: The name of the bucket to upload the file to.
  """
  storage_client = storage.Client()
  bucket = storage_client.bucket(bucket_name)

  blob = bucket.blob(destination_file_name)
  blob.upload_from_filename(
      file_path, if_generation_match=None if overwrite else 0
  )

  logging.info('UPLOAD - Uploaded path "%s".', destination_file_name)


def upload_gcs_dir(
    source_directory: str,
    bucket_name: storage.Bucket,
    target_dir: str,
) -> None:
  """Uploads all files in a directory to a GCS bucket.

  Args:
    source_directory: The directory to upload.
    bucket_name: The name of the bucket to upload to.
    target_dir: The directory within the bucket to upload to.
  """
  storage_client = storage.Client()
  bucket = storage_client.bucket(bucket_name)

  directory_path = pathlib.Path(source_directory)
  paths = directory_path.rglob('*')

  file_paths = [path for path in paths if path.is_file()]
  relative_paths = [path.relative_to(source_directory) for path in file_paths]
  string_paths = [str(path) for path in relative_paths]

  results = transfer_manager.upload_many_from_filenames(
      bucket,
      string_paths,
      source_directory=source_directory,
      blob_name_prefix=f'{target_dir}/',
      skip_if_exists=True,
  )
  for file_path, result in zip(string_paths, results):
    if isinstance(result, Exception) and result.code and result.code != 412:
      logging.warning(
          'UPLOAD - Failed to upload path "%s" due to exception: %r.',
          file_path,
          result,
      )
    elif result is None:
      logging.info('UPLOAD - Uploaded path "%s".', file_path)
