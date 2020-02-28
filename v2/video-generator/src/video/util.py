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
"""Utility methods."""

from __future__ import absolute_import
from __future__ import division
from __future__ import print_function

import urllib
import log

def convert_configs_to_format(configs, products_data, storage):

  image_overlays = []
  text_overlays = []

  for config in configs:

    product_data = products_data[config['type']].get(str(config['key']))

    # Skip to next config if it doesnt exist
    if (not product_data) or (not product_data.get(config['field'])):
      continue

    field_value = product_data.get(config['field'])

    # Handle image to be added to video
    if field_value.lower().startswith('http'):
      image_overlays.append(
          convert_image_overlay(config, field_value, storage))
    # Then it must be a text column
    else:
      text_overlays.extend(convert_text_overlay(config, field_value, storage))

  return image_overlays, text_overlays


def convert_text_overlay(config, field_value, storage):

  width = int(config.get('width', 0))
  font_size = float(config['size'])

  # Wrap long texts to many smaller texts
  words = _wrap_text(field_value, width)

  # Create overlays to all lines broken down
  texts = []

  for i, word in enumerate(words):

    texts.append({
        'start_time': float(config['start_time']),
        'end_time': float(config['end_time']),
        'align': config.get('align', 'center'),
        'x': float(config['x']),
        'y': float(config['y']) + (1.2 * i * font_size),
        'angle': int(config.get('angle', '0')),
        'text': word,
        'font': storage.get_absolute_path(config['font']),
        'font_color': config['color'],
        'font_size': config['size']
    })

  return texts


def _wrap_text(text, charaters_per_line):

  words = []

  if charaters_per_line == 0:
    words.append(text)
  else:

    # Splits words for each line width
    all_words = text.split()
    curr_chars = 0
    last_index = 0

    for i, word in enumerate(all_words):

      if curr_chars + len(word) >= charaters_per_line:
        words.append(' '.join(all_words[last_index:i]))
        last_index = i
        curr_chars = 0

      if i == len(all_words) - 1:
        words.append(' '.join(all_words[last_index:i + 1]))

      curr_chars += len(word)

  return words


def convert_image_overlay(config, field_value, storage):

  # Tries to retrieve image extension
  name_extension = field_value.split('/')[-1].split('.')
  extension = 'jpg' if len(name_extension) < 2 else name_extension[1]

  # Save product image to image folder
  image_path = storage.get_absolute_path(config['type'] + str(config['key']) + extension)
  urllib.urlretrieve(field_value, image_path)

  return {
      'x': float(config['x']),
      'y': float(config['y']),
      'width': int(config['width']),
      'height': int(config['height']),
      'angle': int(config.get('angle', '0')),
      'align': config.get('align', 'center'),
      'image': image_path,
      'start_time': float(config['start_time']),
      'end_time': float(config['end_time'])
  }
