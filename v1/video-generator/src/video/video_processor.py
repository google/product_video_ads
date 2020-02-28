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

"""Manages video processing tasks sequentially."""

import traceback
import log
from datetime import datetime
from video import util

logger = log.getLogger()


class VideoProcessor():

  OUTPUT_VIDEO_FORMAT = '.mp4'

  def __init__(self, storage, generator, uploader):
    self.storage = storage
    self.generator = generator
    self.uploader = uploader

  def process_task(self, row, config, preview_only=False):

    logger.info('Starting to process row %s...', row)

    try:

      # Generate video locally
      output_video = self.generate_single_video(row, config)

      if preview_only:
        # Uploads video to storage and retrieve the ID
        video_id = self.storage.upload_to_preview(output_video)
      else:
        # Uploads video to YouTube and retrieve the ID
        video_id = self.uploader.upload_video(output_video)

      # Finally, deletes local file since it's not needed anymore
      self.storage.delete_file(output_video)

      # Success, return video ID
      logger.info('Row %s processed successfully', row)

      return video_id

    except Exception as e:
      logger.error([e, traceback.format_exc()])
      logger.error('Failed processing row: %s', {
          'row': row,
          'products': config.get('product_ids'),
          'error_type': type(e).__name__,
          'error_string': str(e)
      })

  def generate_single_video(self, row, config):

    image_overlays, text_overlays = util.convert_configs_to_format(
        config['base_config'],
        config['product_ids'],
        config['products_data'],
        self.storage
    )

    input_video = self.storage.get_absolute_path(config['base_video'])
    output_video_path = self.storage.get_absolute_output_video_path(
        row,
        self._generate_video_name())

    return self.generator.process_video(image_overlays,
                                        text_overlays,
                                        input_video,
                                        output_video_path)

  def _generate_video_name(self):
    return datetime.now().strftime('%Y%m%d%H%M%S') + self.OUTPUT_VIDEO_FORMAT
