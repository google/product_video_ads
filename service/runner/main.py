# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""PVA Lite Runner module.

This file is the target of a "Pub/Sub" Trigger Cloud Function, with `subscribe`
as the main entry point.
"""

import base64
import dataclasses
import datetime
import imghdr
import json
import logging
import os
import pathlib
import shutil
import tempfile
from typing import Optional, Sequence, Union

import config as ConfigService
import functions_framework
import pva_video as VideoService
import requests
import storage as StorageService
from cloudevents.http import CloudEvent
from google.cloud import logging as cloudlogging

from rembg import remove
from PIL import Image


class PvaLiteRenderMessagePlacement:
  """Represents a placement in PVA Lite.

      Attributes:
        position_x: The x position of the element.
        position_y: The y position of the element.
        rotation_angle: The angle of the element.
      """

  position_x: float
  position_y: float
  rotation_angle: Optional[float] = 0

  def __init__(self, **kwargs):
    field_names = set([f.name for f in dataclasses.fields(self)])
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

  def __str__(self):
    return (
        'PvaLiteRenderMessagePlacement('
        f'position_x={self.position_x}, '
        f'position_y={self.position_y}, '
        f'rotation_angle={self.rotation_angle})'
    )


@dataclasses.dataclass(init=False)
class PvaLiteRenderMessageTextPlacement(PvaLiteRenderMessagePlacement):
  """Represents a text placement in PVA Lite.

      Attributes:
        position_x: Position along the x axis.
        position_y: Position along the y axis.
        text_value: Optional text value.
        text_size:  Font size for text values.
        text_color: Font color of the element.
        text_alignment: Align text element left, center or right.
        rotation_angle: Optional rotation angle of the text element.
        text_font: Optional font for text values.
        text_width: Optional width text values.
      """

  position_x: float
  position_y: float
  text_value: str
  text_size: float
  text_color: str
  text_alignment: str
  rotation_angle: float = 0
  text_font: Optional[str] = None
  text_width: Optional[str] = None

  def __init__(self, **kwargs):
    field_names = set([f.name for f in dataclasses.fields(self)])
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

  def __str__(self):
    return super().__str__() + (
        'PvaLiteRenderMessageTextPlacement('
        f'text_value={self.text_value}, '
        f'text_size={self.text_size}, '
        f'text_color={self.text_color}, '
        f'text_alignment={self.text_alignment}, '
        f'text_font={self.text_font}, '
        f'text_width={self.text_width})'
    )


@dataclasses.dataclass(init=False)
class PvaLiteRenderMessageImagePlacement(PvaLiteRenderMessagePlacement):
  """Represents an image placement in PVA Lite.

      Attributes:
        image_url: Optional image url.
        image_width: Optional width of the image.
        image_height: Optional height of the image.
        keep_ratio: Optional keep ratio of the image.
        rotation_angle: Optional rotation angle of the image element.
        remove_background: Optional, if 'Yes' then remove background before placing
      """
  position_x: float
  position_y: float
  image_url: Optional[str] = None
  image_width: Optional[float] = 0
  image_height: Optional[float] = 0
  rotation_angle: float = 0
  remove_background: Optional[str] = 'No'
  keep_ratio: Optional[bool] = True

  def __init__(self, **kwargs):
    field_names = set([f.name for f in dataclasses.fields(self)])
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

  def __str__(self):
    return super().__str__() + (
        'PvaLiteRenderMessageImagePlacement('
        f'image_url={self.image_url}, '
        f'image_width={self.image_width}, '
        f'image_height={self.image_height}, '
        f'keep_ratio={self.keep_ratio})'
        f'remove_background={self.remove_background}'
    )


@dataclasses.dataclass(init=False)
class PvaLiteRenderMessageContent:
  """Represents a message content for rendering videos in PVA Lite.

      Attributes:
        offset_s: The offset at which the placements must be displayed.
        duration_s: The duration for which the placements must be displayed.
        placements: The placements to display.
      """

  offset_s: float
  duration_s: float
  placements: Sequence[Union[PvaLiteRenderMessageTextPlacement,
                             PvaLiteRenderMessageImagePlacement]]

  def __init__(self, **kwargs):
    field_names = set([f.name for f in dataclasses.fields(self)])
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

  def __str__(self):
    return (
        'PvaLiteRenderMessageContent('
        f'offset_seconds={self.offset_s}, '
        f'duration_seconds={self.duration_s}, '
        f'placements={self.placements})'
    )


@dataclasses.dataclass(init=False)
class PvaLiteRenderMessage:
  """Represents a message for rendering videos in PVA Lite.

      Attributes:
        output_path: The output path to use.
        ad_group: The ad group for this render message.
        template_video: The template video for this render message.
        content: The content for this render message.
      """

  output_path: str
  ad_group: str
  template_video: str
  content: Sequence[PvaLiteRenderMessageContent]

  def __init__(self, **kwargs):
    field_names = set([f.name for f in dataclasses.fields(self)])
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

  def __str__(self):
    return (
        'PvaLiteRenderMessage('
        f'output_path={self.output_path}, '
        f'ad_group={self.ad_group}, '
        f'template_video={self.template_video}, '
        f'content={self.content})'
    )


@functions_framework.cloud_event
def subscribe(cloud_event: CloudEvent):
  """Triggered whenever a message is pushed to the Pub/Sub topic.

      Args:
        cloud_event: The Pub/Sub message.
      """

  lg_client = cloudlogging.Client()
  lg_client.setup_logging()

  logging.info('BEGIN - Processing Pub/Sub message... %r', cloud_event)

  received_message = base64.b64decode(cloud_event.data['message']['data']
                                     ).decode('utf-8')
  received_message_json = json.loads(received_message)
  msg = PvaLiteRenderMessage(**received_message_json)
  output_video_path = generate_video(msg)
  _, video_ext = os.path.splitext(msg.template_video)
  gcs_folder = f'{msg.output_path}/' if msg.output_path != '.' else ''
  gcs_path = f'{gcs_folder}{msg.ad_group}{video_ext}'

  StorageService.upload_gcs_file(
      output_video_path, gcs_path, ConfigService.GCS_BUCKET
  )

  logging.info('END - Finished processing Pub/Sub message')


def generate_video(message: PvaLiteRenderMessage):
  output_dir = tempfile.mkdtemp()
  os.mkdir(f'{output_dir}/{message.ad_group}')
  input_video_path = StorageService.download_gcs_file(
      filepath=message.template_video,
      bucket_name=ConfigService.GCS_BUCKET,
      output_dir=output_dir,
  )
  if not input_video_path:
    raise ValueError(
        f'Template {message.template_video} does not exist in '
        f'bucket {ConfigService.GCS_BUCKET}'
    )
  output_video_path = pathlib.Path(
      output_dir,
      message.ad_group,
      f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.mp4",
  )

  return process_video(
      message.content, output_dir, input_video_path, str(output_video_path)
  )


def process_video(
    content: Sequence[PvaLiteRenderMessageContent],
    output_dir: str,
    input_video_path: str,
    output_video_path: str,
):
  image_or_videos_overlays = []
  text_overlays = []

  for placement_content in content:
    placement_content = PvaLiteRenderMessageContent(**placement_content)
    logging.debug('Processing content %s', placement_content)
    duration = placement_content.duration_s
    offset = placement_content.offset_s

    for placement in placement_content.placements:
      if 'image_url' in placement:
        placement = PvaLiteRenderMessageImagePlacement(**placement)
        image_or_videos_overlays.append(
            convert_image_overlay(
                output_dir,
                offset,
                duration,
                placement,
            )
        )
      else:
        placement = PvaLiteRenderMessageTextPlacement(**placement)
        text_overlays.extend(
            convert_text_overlay(
                output_dir,
                offset,
                duration,
                placement,
            )
        )

  (img_overlays, text_imgs, out_video
  ) = VideoService.filter_strings(image_or_videos_overlays, text_overlays)
  img_args = VideoService.image_and_video_inputs(
      image_or_videos_overlays, text_imgs
  )
  # forces input audio to output
  audio_args, audio_overlays = [], []
  out_audio = '0:a?'

  # assets_args
  assets_args = img_args + audio_args
  filter_complex = img_overlays + audio_overlays

  # Group all args and runs ffmpeg
  ffmpeg_output = VideoService.run_ffmpeg(
      out_video,
      out_audio,
      assets_args,
      filter_complex,
      input_video_path,
      output_video_path,
  )

  logging.debug('ffmpeg ran with output %s:', ffmpeg_output)

  return output_video_path


def convert_text_overlay(
    output_dir: str,
    offset: float,
    duration: float,
    placement: PvaLiteRenderMessageTextPlacement,
):
  font_path = None

  if placement.text_font:
    font_path = StorageService.download_gcs_file(
        filepath=placement.text_font,
        bucket_name=ConfigService.GCS_BUCKET,
        output_dir=output_dir,
    )

  # Wrap long texts to multiple lines.
  lines = _wrap_text(placement.text_value, placement.text_width)

  # Create overlays to all lines broken down.
  texts = []

  for i, line in enumerate(lines):
    texts.append({
        'start_time': offset,
        'end_time': offset + duration,
        'align': placement.text_alignment or "center",
        'x': placement.position_x,
        'y': placement.position_y +
        (1.2 * i * placement.text_size),  # Add new line to wrap text.
        'angle': placement.rotation_angle,
        'text': line,
        'font': font_path,
        'font_color': placement.text_color,
        'font_size': placement.text_size,
    })

  return texts


def _wrap_text(text, characters_per_line):
  lines = []

  if characters_per_line <= 0:
    return [text]

  all_words = text.split()
  current_line = []
  current_line_length = 0

  for word in all_words:
    # If the current word is too long to fit on its own line, split it.
    if len(word) > characters_per_line:
      while len(word) > characters_per_line:
        lines.append(word[:characters_per_line])
        word = word[characters_per_line:]
      lines.append(word)
      current_line = []
      current_line_length = 0
      continue

    # If adding the current word exceeds the line limit, start a new line.
    if current_line_length + len(word) + (
        len(current_line) > 0
    ) > characters_per_line:
      lines.append(" ".join(current_line))
      current_line = []
      current_line_length = 0

    current_line.append(word)
    current_line_length += len(word)

  # Add the last line (if any words were left).
  if current_line:
    lines.append(' '.join(current_line))

  return lines


# def remove_background(input_path, output_path):
#   input_image = Image.open(input_path)
#   output_image = remove(input_image)
#   output_image.save(output_path)


def convert_image_overlay(
    output_dir: str,
    offset: float,
    duration: float,
    placement: PvaLiteRenderMessageImagePlacement,
):

  logging.debug('Downloading image %s...', placement.image_url)

  # Download image from url to local temp file
  tmp_file_name = _download_image_to_file(output_dir, placement.image_url)

  if placement.remove_background == 'Yes':
    logging.debug('Removing background from image %s...', placement.image_url)
    # remove_background(tmp_file_name, tmp_file_name)

  # Find out file's extension
  extension = imghdr.what(tmp_file_name) or 'tmp'
  image_size = os.stat(tmp_file_name).st_size
  if image_size <= 0:
    raise ValueError(
        f'Invalid image {placement.image_url} with extension {extension}'
    )

  # Make x, y coordinates for the image to be the center of the provided image.
  new_x = placement.position_x - placement.image_width / 2
  new_y = placement.position_y - placement.image_height / 2

  return {
      'x': new_x,
      'y': new_y,
      'width': placement.image_width,
      'height': placement.image_height,
      'angle': placement.rotation_angle,
      'image': tmp_file_name,
      'keep_ratio': placement.keep_ratio,
      'start_time': offset,
      'end_time': offset + duration,
  }


def _download_image_to_file(output_dir, url):
  # Special case to download from Google Cloud Storage
  if url.startswith('gs://'):
    first_slash_index = url.replace('gs://').index('/')
    file_path = url[first_slash_index + 1:]

    tmp_file_name = StorageService.download_gcs_file(
        filepath=file_path,
        bucket_name=ConfigService.GCS_BUCKET,
        output_dir=output_dir,
    )
  # Downloads image from https/https urls
  else:
    img_extension = url.split('.')[-1]
    tmp_file_name = f'{output_dir}/img_{datetime.datetime.now().timestamp()}.{img_extension}'
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/90.0.4430.72 Safari/537.36 '
    }

    r = requests.get(url, stream=True, headers=headers, timeout=20)
    r.raw.decode_content = True

    # Open a local file with wb ( write binary ) permission.
    with open(tmp_file_name, 'wb') as f:
      shutil.copyfileobj(r.raw, f)

    return tmp_file_name
