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

"""Handle processing of rows from storage."""

import log

logger = log.getLogger()


class ConfigHandler:
    VIDEO_READY_STATUS = 'Video Ready'
    IMAGE_READY_STATUS = 'Image Ready'
    DONE_STATUS = 'Done'
    PROCESSING_STATUS = 'Processing'
    ERROR_STATUS = 'Error'
    PREVIEW_STATUS = 'Preview'
    HANDLED_STATUS = ['On', 'Paused', PREVIEW_STATUS]

    def __init__(self, configuration, video_processor, image_processor, lock):
        self.configuration = configuration
        self.video_processor = video_processor
        self.image_processor = image_processor
        self.lock = lock

    # returns indices of sheet rows that are ready to be handled
    def rows_to_be_processed(self):
        with self.lock:
            try:
                # sheet is one-indexed plus header row
                rows = [str(i+2) for i, s in enumerate(
                                self.configuration.get_campaign_status()) if s in self.HANDLED_STATUS]
            except Exception as e:
                logger.debug(e)
                rows=[]
        logger.info(f'Found {len(rows)} rows to process')
        return rows

    def mark_row_in_progress(self, row_number):
        with self.lock:
            logger.info(f'Fetching configuration of row {row_number}')
            (metadata, original_status) = self.configuration.get_single_campaign_config(row_number)
            logger.info(f'Updating status of row {row_number} to {self.PROCESSING_STATUS}')
            self.configuration.update_status(row_number, '', self.PROCESSING_STATUS)
        return (metadata, original_status)

    def update_status(self, row_number, new_status, result_id):
        with self.lock:
            self.configuration.update_status(
                row_number, result_id, self.ERROR_STATUS if result_id is None else new_status)

    def process_row(self, row_number, metadata, original_status):
        """Generate custom videos/images according to the given configuration."""

        # All bases name and files
        base_videos = self.configuration.get_all_bases()

        # process until all rows are handled
        while True:
            try:
                # Find base file by its name
                base_file_name = base_videos.get(metadata['base_video'])

                config = {
                    'name': metadata.get('name', 'Unnamed'),
                    'custom_dir': metadata.get('custom_dir', ''),
                    'description': metadata.get('description', ''),
                    'visibility': metadata.get('visibility', ''),
                    'base_file': base_file_name,
                    'configs': metadata['configs'],
                    'products_data': self.configuration.get_products_data(metadata['products_label'])
                }

                logger.info(
                    f'[Event Handler] Handling new creative with base {base_file_name}')
                logger.debug('Configs: %s' % config)

                # Choose the correct processor to do the job (image or video)
                if base_file_name and base_file_name.endswith('.mp4'):
                    processor = self.video_processor
                    new_status = self.VIDEO_READY_STATUS
                else:
                    processor = self.image_processor
                    new_status = self.IMAGE_READY_STATUS

                    # If it's a Preview status, preview the video only
                if original_status == self.PREVIEW_STATUS:
                    result_id = processor.process_task(row_number, config, True)
                    new_status = self.DONE_STATUS
                else:
                    result_id = processor.process_task(row_number, config)

                return (new_status, result_id)
            except Exception as e:
                logger.error(e)
                logger.info(f'Retrying generation of video row {row_number}')
