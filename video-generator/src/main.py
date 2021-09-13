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
from google.oauth2 import service_account
# Handle "events" from configuration
from configuration.event_handler import EventHandler as EventHandler
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

logger = log.getLogger()

def main():
    # Read environment parameters
    spreadsheet_id = os.environ.get('SPREADSHEET_ID')

    if spreadsheet_id is None:
        print('Please set environment variable SPREADSHEET_ID.')
        exit(1)

    SCOPES = [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/devstorage.read_write'
    ]
    # Load service account file as secret mount to K8S Pod
    SERVICE_ACCOUNT_FILE = '/.google/service_account.json'

    # Tries to retrieve token from storage each 5 minutes
    while True:
        credentials = service_account.Credentials.from_service_account_file(
                SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        if credentials is not None:
            break

        logger.info('Sleeping for 5 minutes before trying again...')
        time.sleep(5 * 60)

    # Starts processing only after token authenticated!
    logger.info('[v2] Started processing...')

    # Dependencies
    configuration = Configuration(spreadsheet_id, credentials)
    storage = StorageHandler(configuration.get_drive_folder(), credentials)
    cloud_storage = CloudStorageHandler(service_account_file=SERVICE_ACCOUNT_FILE)
    video_processor = VideoProcessor(
        storage, VideoGenerator(), Uploader(credentials), cloud_storage)
    image_processor = ImageProcessor(storage, ImageGenerator(), cloud_storage)

    # Handler acts as facade
    handler = EventHandler(configuration, video_processor, image_processor)

    while True:
        try:
            # Sync drive files to local tmp
            storage.update_local_files()

            # Process configuration joining threads
            handler.handle_configuration()

        except Exception as e:
            logger.error(e)

        # Sleep!
        interval = configuration.get_interval_in_minutes()
        logger.info('Sleeping for %s minutes', interval)
        time.sleep(int(interval) * 60)


if __name__ == '__main__':
    main()
