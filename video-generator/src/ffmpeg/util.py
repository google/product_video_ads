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

import imghdr
import math
import os
import shutil

import requests

import log

logger = log.getLogger()


def convert_configs_to_format(configs, products_data, storage, cloud_storage):
    image_overlays = []
    text_overlays = []

    for config in configs:

        product_data = products_data[config['type']].get(str(config['key']))

        # Skip to next config if it doesnt exist
        if (not product_data) or (not product_data.get(config['field'])):
            continue

        field_value = product_data.get(config['field'])

        # Handle image to be added to video (http* or gs://*)
        if field_value.lower().startswith('http') or field_value.lower().startswith('gs://'):
            image_overlays.append(convert_image_overlay(config, field_value, storage, cloud_storage))
        # Then it must be a text column
        else:
            text_overlays.extend(convert_text_overlay(config, field_value, storage))

    return image_overlays, text_overlays


def convert_text_overlay(config, field_value, storage):

    width = int(config.get('width') or 0)
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
            'font_size': font_size
        })

    return texts


def _fit_font_size_to_width_height(font_size, width, desired_lines, text_length):

    actual_size = float(text_length)
    desired_size = float(width * desired_lines)

    factor = actual_size / desired_size
    
    return (font_size/factor)*0.9, math.ceil(width*factor)


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


def convert_image_overlay(config, field_value, storage, cloud_storage):

    logger.debug('Downloading image %s...' % field_value)

    # Tries to retrieve image extension
    tmp_file_name = 'img.tmp'

    # Download image from url to local temp file
    _download_image_to_file(field_value, tmp_file_name, cloud_storage)

    # Find out file's extension
    extension = imghdr.what(tmp_file_name) or 'tmp'
    image_size = os.stat(tmp_file_name).st_size

    if image_size <= 0:
        raise ValueError('Invalid image %s with extension %s' % (field_value, extension))

    # Save product image to image folder
    image_path = storage.get_absolute_path(config['type'] + str(config['key']) + str(config['field']) + '.' + extension)
    os.rename(tmp_file_name, image_path)

    logger.debug(config)

    return {
        'x': float(config['x']),
        'y': float(config['y']),
        'width': int(config['width']),
        'height': int(config['height']),
        'angle': int(config.get('angle', '0')),
        'align': config.get('align', 'center'),
        'image': image_path,
        'keep_ratio': config.get('keep_ratio', False),
        'start_time': float(config['start_time']),
        'end_time': float(config['end_time'])
    }


def _download_image_to_file(url, tmp_file_name, cloud_storage):
    # Special case to download from Google Cloud Storage
    if url.startswith('gs://'):
        first_slash_index = url.index('/', 5)

        bucket = url[5:first_slash_index]
        file_path = url[first_slash_index + 1:]

        cloud_storage.download_file_to_path(bucket, file_path, tmp_file_name)

    # Downloads image from https/https urls
    else:

        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
                          'Chrome/90.0.4430.72 Safari/537.36 '
        }

        r = requests.get(url, stream=True, headers=headers, timeout=20)
        r.raw.decode_content = True

        # Open a local file with wb ( write binary ) permission.
        with open(tmp_file_name, 'wb') as f:
            shutil.copyfileobj(r.raw, f)
