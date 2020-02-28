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


class VideoHandler():

  VIDEO_READY_STATUS = 'Video Ready'
  NOT_STARTED_STATUS = 'Not Started'
  PREVIEW_STATUS = 'Preview'
  HANDLED_STATUS = ['On', 'Paused', 'Preview']

  def __init__(self, configuration, processor):
    self.configuration = configuration
    self.processor = processor

  def handle_configuration(self):
    """Generate custom videos according to the given configuration."""

    # All products title, price and image url
    products_data = self.configuration.get_products_data()

    # All base videos name and location
    base_videos = self.configuration.get_all_base_videos()

    # All configured ads: product_ids, base video name and status to process
    campaign_config = self.configuration.get_campaign_config()

    # Go through all configured ads
    for row, campaign in enumerate(campaign_config):

      (configs, base_name, status) = campaign

      # Not handled
      if status not in self.HANDLED_STATUS:
        continue

      # Skip header and starts on 1 instead of 0
      row = str(row + 2)
      config = {
          'base_video': base_videos.get(base_name),
          'configs': configs,
          'products_data': products_data
      }

      # If it's a Preview status, preview the video only
      if status == self.PREVIEW_STATUS:
        video_id = self.processor.process_task(row, config, True)
        new_status = self.NOT_STARTED_STATUS
      else:
        video_id = self.processor.process_task(row, config)
        new_status = self.VIDEO_READY_STATUS

      # When processed with success, update configuration status
      if video_id is not None:
        self.configuration.update_status(row, video_id, new_status)
