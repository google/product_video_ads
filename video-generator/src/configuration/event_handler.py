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


class EventHandler:

    VIDEO_READY_STATUS = 'Video Ready'
    IMAGE_READY_STATUS = 'Image Ready'
    NOT_STARTED_STATUS = 'Not Started'
    PREVIEW_STATUS = 'Preview'
    HANDLED_STATUS = ['On', 'Paused', 'Preview']

    def __init__(self, configuration, video_processor, image_processor):
        self.configuration = configuration
        self.video_processor = video_processor
        self.image_processor = image_processor

    def handle_configuration(self):
        """Generate custom videos/images according to the given configuration."""

        # All bases name and files
        base_videos = self.configuration.get_all_bases()

        # All configured ads: config info, base name and status to process
        campaign_config = self.configuration.get_campaign_config()

        # Go through all configured ads
        for row, campaign in enumerate(campaign_config):

            (date, metadata, status) = campaign

            # Not handled
            if status not in self.HANDLED_STATUS:
                continue

            # Skip header and starts on 1 instead of 0
            row = str(row + 2)

            # Find base file by its name
            base_file_name = base_videos.get(metadata['base_video'])

            config = {
                'name': metadata.get('name', 'Unnamed'),
                'description': metadata.get('description', ''),
                'visibility': metadata.get('visibility', ''),
                'base_file': base_file_name,
                'configs': metadata['configs'],
                'products_data': self.configuration.get_products_data(metadata['products_label'])
            }

            logger.info('[Event Handler] Handling new creative with base %s' % base_file_name)
            logger.debug('Configs: %s' % config)

            # Choose the correct processor to do the job (image or video)
            if base_file_name and base_file_name.endswith('.mp4'):
                processor = self.video_processor
                new_status = self.VIDEO_READY_STATUS
            else:
                processor = self.image_processor
                new_status = self.IMAGE_READY_STATUS

            # If it's a Preview status, preview the video only
            if status == self.PREVIEW_STATUS:
                result_id = processor.process_task(row, config, True)
                new_status = self.NOT_STARTED_STATUS
            else:
                result_id = processor.process_task(row, config)

            # When processed with success, update configuration status
            if result_id is not None:
                self.configuration.update_status(row, result_id, new_status)
