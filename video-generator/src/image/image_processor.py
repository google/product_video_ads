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

"""Manages images processing tasks sequentially."""

import traceback
from datetime import datetime

import log
from ffmpeg import util

logger = log.getLogger()


class ImageProcessor():

  def __init__(self, storage, generator, cloud_storage, cloud_preview=False):
    self.storage = storage
    self.generator = generator
    self.cloud_storage = cloud_storage
    self.cloud_preview = cloud_preview

  def process_task(self, row, config, preview_only=False):

    logger.info('[Image Processor] Starting to process row %s...', row)

    try:

      # Generate image locally
      output_image = self.generate_single_image(row, config)

      # Uploads image to storage and retrieve the ID
      if self._should_upload_to_directory(config):
        output_id = self.cloud_storage.upload_to_directory(output_image, config)
      elif self.cloud_preview:
        output_id = self.cloud_storage.upload_to_preview(output_image)
      else:
        output_id = self.storage.upload_to_preview(output_image)

      # Finally, deletes local file since it's not needed anymore
      self.storage.delete_file(output_image)

      # Success, return ID
      logger.info('Row %s processed successfully', row)

      return output_id

    except Exception as e:
      logger.error([e, traceback.format_exc()])
      logger.error('Failed processing row: %s', {
          'row': row,
          'error_type': type(e).__name__,
          'error_string': str(e)
      })

  def generate_single_image(self, row, config):

    image_overlays, text_overlays = util.convert_configs_to_format(
        config['configs'],
        config['products_data'],
        self.storage,
        self.cloud_storage
    )

    input_image = self.storage.get_absolute_path(config['base_file'])
    output_path = self.storage.get_absolute_output_video_path(
        row,
        self._generate_image_name(config['base_file']))

    return self.generator.process_image(image_overlays,
                                        text_overlays,
                                        input_image,
                                        output_path)

  def _generate_image_name(self, input_image_file):
    return datetime.now().strftime('%Y%m%d%H%M%S') + '.' + input_image_file.split('.')[-1]

  def _should_upload_to_directory(self, config): 
    return bool(config.get('custom_dir'))