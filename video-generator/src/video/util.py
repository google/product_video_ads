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
    if config['field'].lower() in ['image']:
      image_overlays.append(
          convert_image_overlay(config, product_data, storage))
    elif config['field'].lower() in ['retail price']:
      text_overlays.extend(
          convert_retail_price_overlay(config, product_data, storage))
    # Then it must be a text column
    else:
      text_overlays.extend(convert_text_overlay(config, product_data, storage))

  return image_overlays, text_overlays


def convert_retail_price_overlay(config, product_data, storage):

  texts = []

  # Split 2,99 in ['2', '99']
  parts = product_data['price'].split(',')

  # First part of price
  first_part = product_data.copy()
  first_part[config['field'].lower()] = parts[0]
  texts.append(convert_text_overlay(config, first_part, storage)[0])

  # Now, calculate comma and second part of price relative to first part
  x = float(config['x'])
  y = float(config['y'])

  # Comma
  comma_part = product_data.copy()
  comma_part[config['field'].lower()] = ','
  comma_config = config.copy()
  comma_config['x'] = x * 1.09
  comma_config['y'] = y * 1.045
  comma_config['font_size'] = int(comma_config['font_size']) / 2
  texts.append(convert_text_overlay(comma_config, comma_part, storage)[0])

  # Second part of price
  second_part = product_data.copy()
  second_part[config['field'].lower()] = parts[1]
  second_part_config = config.copy()
  second_part_config['x'] = x * 1.156
  second_part_config['y'] = y * 1.05
  second_part_config['font_size'] = int(second_part_config['font_size']) / 2
  texts.append(
      convert_text_overlay(second_part_config, second_part, storage)[0])

  return texts


def convert_text_overlay(config, product_data, storage):

  width = int(config.get('width', 0))
  font_size = float(config['font_size'])
  text = product_data[config['field'].lower()]

  # Wrap long texts to many smaller texts
  words = _wrap_text(text, width)

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
        'font_color': config['font_color'],
        'font_size': config['font_size']
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


def convert_image_overlay(config, product_data, storage):

  # Tries to retrieve image extension
  name_extension = product_data['image'].split('/')[-1].split('.')
  extension = 'jpg' if len(name_extension) < 2 else name_extension[1]

  # Save product image to image folder
  image_path = storage.get_absolute_path(config['product'] + extension)
  urllib.urlretrieve(product_data['image'], image_path)

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
