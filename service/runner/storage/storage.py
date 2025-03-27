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
    filepath: The path of the file to download (relative to the bucket root).
    bucket_name: The name of the bucket to retrieve the file from.
    output_dir: Directory path to store the downloaded file in. If None and
      fetch_contents is False, this will cause an error.
    fetch_contents: Whether to fetch the file contents instead of writing to a
      file.

  Returns:
    The retrieved file path or contents based on `fetch_contents`, or None if
    the file was not found.
  """
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
      # Ensure output_dir is provided if not fetching contents
      if output_dir is None:
        raise ValueError(
            "output_dir must be specified when fetch_contents is False"
        )

      # Construct the full local destination path
      destination_file_name = str(pathlib.Path(output_dir, filepath))

      # Get the directory part of the destination path
      destination_directory = os.path.dirname(destination_file_name)

      # Create the local directory structure if it doesn't exist
      os.makedirs(destination_directory, exist_ok=True)

      # Now download the file; the directory is guaranteed to exist
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
    overwrite: If True, allows overwriting an existing file in GCS.
               If False (default), fails if the destination blob already exists.
  """
  storage_client = storage.Client()
  bucket = storage_client.bucket(bucket_name)

  blob = bucket.blob(destination_file_name)

  gen_match = None if overwrite else 0

  try:
    blob.upload_from_filename(file_path, if_generation_match=gen_match)
    logging.info(
        'UPLOAD - Uploaded "%s" to "%s" in bucket "%s".',
        file_path,
        destination_file_name,
        bucket_name,
    )
  except Exception as e:
    # Catch potential errors like PreconditionFailed (412) if overwrite is False and file exists
    logging.error(
        'UPLOAD - Failed to upload "%s" to "%s": %s',
        file_path,
        destination_file_name,
        e,
        exc_info=True,  # Log traceback for better debugging
    )
    raise


def upload_gcs_dir(
    source_directory: str,
    bucket_name: str,
    target_dir: str,
) -> None:
  """Uploads all files in a directory to a GCS bucket using transfer_manager.

  Args:
    source_directory: The local directory whose contents to upload.
    bucket_name: The name of the bucket to upload to.
    target_dir: The directory prefix within the bucket to upload to.
  """
  storage_client = storage.Client()
  bucket = storage_client.bucket(bucket_name)  # Get bucket object from name

  directory_path = pathlib.Path(source_directory)
  if not directory_path.is_dir():
    logging.error(
        f"UPLOAD - Source directory '{source_directory}' not found or is not a directory."
    )
    return

  # Use rglob to find all files recursively
  file_paths = [path for path in directory_path.rglob('*') if path.is_file()]

  # Get paths relative to the source directory for correct blob naming
  relative_paths = [path.relative_to(source_directory) for path in file_paths]
  string_paths = [
      str(path) for path in relative_paths
  ]  # Paths relative to source_dir
  absolute_file_paths = [
      str(path) for path in file_paths
  ]  # Full local paths for upload function

  # Ensure target_dir ends with a slash if it's not empty
  blob_prefix = target_dir
  if blob_prefix and not blob_prefix.endswith('/'):
    blob_prefix += '/'

  logging.info(
      f'UPLOAD - Starting upload of {len(string_paths)} files from'
      f' "{source_directory}" to "gs://{bucket_name}/{blob_prefix}"...'
  )

  # Use transfer_manager for potentially faster parallel uploads
  results = transfer_manager.upload_many_from_filenames(
      bucket,
      filenames=absolute_file_paths,  # Pass the full local paths here
      source_directory=source_directory,  # Helps TM construct relative paths if needed, though we provide blob names
      blob_name_prefix=blob_prefix,
      skip_if_exists=True,
  )

  errors_found = False
  for name, result in zip(string_paths, results):
    # The result is the Future object for the upload, check its exception
    try:
      result.result()  # Wait for upload and raise exception if it failed
      logging.debug('UPLOAD - Successfully uploaded "%s".', name)
    except Exception as e:
      errors_found = True
      logging.warning(
          'UPLOAD - Failed to upload path "%s" due to exception: %r.',
          name,
          e,
      )

  if errors_found:
    logging.warning("UPLOAD - Finished uploading directory with some errors.")
  else:
    logging.info("UPLOAD - Finished uploading directory successfully.")
