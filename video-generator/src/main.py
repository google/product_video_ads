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

"""Application entrypoint."""

import os
import time

import log
from auth import authentication
from google.auth.transport.requests import Request
# Handle "events" from configuration
from configuration.config_handler import ConfigHandler as ConfigHandler
from configuration.spreadsheet_configuration import SpreadsheetConfiguration as Configuration
from image.image_generator import ImageGenerator as ImageGenerator
# Handles image processing
from image.image_processor import ImageProcessor as ImageProcessor
from storage.cloud_storage_handler import CloudStorageHandler as CloudStorageHandler
from storage.drive_storage_handler import DriveStorageHandler as StorageHandler
from uploader.youtube_upload import YoutubeUploader as Uploader
from video.video_generator import VideoGenerator as VideoGenerator
# Handles video processing
from video.video_processor import VideoProcessor as VideoProcessor
import random
import filelock

logger = log.getLogger()


def main():
    # Read environment parameters
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')
    gcs_bucket_name = os.environ.get('GCS_BUCKET_NAME')
    gcp_project_number = os.environ.get('GCP_PROJECT_NUMBER')
    disable_sheet_logging = os.getenv(
        "DISABLE_SHEET_LOGGING", 'False').lower() in ('true', '1', 't')
    lock_path = os.environ.get('SHEET_LOCK_FILE')
    lock = filelock.FileLock(lock_path)
    cloud_preview = False

    if spreadsheet_id is None:
        print('Please set environment variable SPREADSHEET_ID.')
        exit(1)
    if gcs_bucket_name:
        cloud_preview = True
        print(
            f"Saving image and video preview to Google Cloud Storage bucket named: {gcs_bucket_name}.")

    credentials = authentication.get_credentials_from_secret_manager(
        gcp_project_number)

    # Starts processing only after token authenticated!
    logger.info('[v2] Started processing...')

    # Dependencies
    configuration = Configuration(
        spreadsheet_id, credentials, not disable_sheet_logging)
    storage = StorageHandler(configuration.get_drive_folder(), credentials)
    cloud_storage = CloudStorageHandler(gcs_bucket_name=gcs_bucket_name)
    video_processor = VideoProcessor(
        storage, VideoGenerator(), Uploader(credentials), cloud_storage, cloud_preview)
    image_processor = ImageProcessor(
        storage, ImageGenerator(), cloud_storage, cloud_preview)
    interval = configuration.get_interval_in_minutes()
    # Handler acts as facade
    handler = ConfigHandler(
        configuration, video_processor, image_processor, lock)

    while True:
        try:
            # Sync drive files to local tmp
            storage.update_local_files()
            logger.info('Acquiring lock...')
            lock.acquire()
            logger.info('Lock Acquired, checking queue')
            rows_todo = handler.rows_to_be_processed()
            row_to_process = None
            if (len(rows_todo) > 0):
                row_to_process = rows_todo[0]
                (metadata, original_status) = handler.mark_row_in_progress(
                    row_to_process)
                lock.release()
                logger.info(f'Processing row {row_to_process}')
                # critical section protects config sheet only, generation is long
                (new_status, result_id) = handler.process_row(
                    row_to_process, metadata, original_status)
                logger.info('Re-Acquiring lock to mark processing done')
                lock.acquire()
                logger.info(f'Marking row {row_to_process} as {new_status}')
                handler.update_status(row_to_process, new_status, result_id)
            else:
                logger.info(f'Sleeping for {interval} minutes')
                time.sleep(int(interval * 60))

        except Exception as e:
            logger.error(e)
            if (row_to_process != None):
                logger.info(
                    f'Resetting row {row_to_process} status to {original_status} and backing off')
                time.sleep(int(interval * 60))
                lock.acquire()
                handler.update_status(row_to_process, original_status)
                lock.release()                
                
        finally:
            logger.info('Releasing lock')
            lock.release()


if __name__ == '__main__':
    main()
