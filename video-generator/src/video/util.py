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


def convert_configs_to_format(base_config, product_ids, products_data, storage):

  image_overlays = []
  text_overlays = []

  for config in base_config:

    # Order of product starts on 1
    product_id = product_ids[int(config['product']) - 1]
    product_data = products_data[product_id]

    # Handle image to be added to video
    if config['field'] in ['Image']:
      image_overlays.append(convert_image_overlay(config, product_data, storage))
    # Then it must be a text column
    else:
      text_overlays.extend(convert_text_overlay(config, product_data, storage))

  return image_overlays, text_overlays


def convert_text_overlay(config, product_data, storage):

  width = int(config.get('width', 0))
  font_size = float(config['font_size'])
  text = product_data[config['field'].lower()]

  # Wrap long texts to many smaller texts
  words = _wrap_text(text, font_size, width)

  # Create overlays to all lines broken down
  texts = []

  for i, word in enumerate(words):

    texts.append({
        'start_time': float(config['start_time']),
        'end_time': float(config['end_time']),
        'h_align': 'left',
        'x': float(config['x']),
        'y': float(config['y']) + (1.5 * i * font_size),
        'angle': '0',
        'text': word,
        'font': storage.get_absolute_path(config['font']),
        'font_color': config['font_color'],
        'font_size': config['font_size']
    })

  return texts


def _wrap_text(text, font_size, width):

  words = []

  if width == 0:
    words.append(text)
  else:

    # Splits words for each line width
    charaters_per_line = width // font_size
    all_words = text.split()
    curr_chars = 0
    last_index = 0

    for i, word in enumerate(all_words):

      if curr_chars + len(word) >= charaters_per_line:
        words.append(' '.join(all_words[last_index:i]))
        last_index = i
        curr_chars = 0

      if i == len(all_words) - 1:
        words.append(' '.join(all_words[last_index:i+1]))

      curr_chars += len(word)

  return words


def convert_image_overlay(config, product_data, storage):

  # Save product image to image folder
  image_path = storage.get_absolute_path(config['product'] + '.jpg')
  urllib.urlretrieve(product_data['image'], image_path)

  return {
      'x': float(config['x']),
      'y': float(config['y']),
      'width': int(config['width']),
      'height': int(config['height']),
      'image': image_path,
      'start_time': float(config['start_time']),
      'end_time': float(config['end_time'])
  }
