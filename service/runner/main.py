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
import mimetypes
import os
import pathlib
import shutil
import subprocess
import tempfile
from typing import Optional, Sequence, Union
from urllib.parse import urlparse

import config as ConfigService
import functions_framework
import pva_video as VideoService
import requests
import storage as StorageService
from cloudevents.http import CloudEvent
from google.cloud import logging as cloudlogging
from PIL import Image
from rembg import remove


class PvaLiteRenderMessagePlacement:
  """Represents a placement in PVA Lite.

      Attributes:
        offset_x: The x position of the element.
        offset_y: The y position of the element.
        rotation_angle: The angle of the element.
        element_id: The id of the element.
        relative_to: The id of the element to position relative to.
        element_horizontal_anchor: The horizontal anchor of the element.
        element_vertical_anchor: The vertical anchor of the element.
        relative_horizontal_anchor: The horizontal anchor of the relative element.
        relative_vertical_anchor: The vertical anchor of the relative element.
      """

  offset_x: float
  offset_y: float
  rotation_angle: float = 0
  element_id: str
  relative_to: Optional[str] = None
  element_horizontal_anchor: Optional[str] = 'left'
  element_vertical_anchor: Optional[str] = 'top'
  relative_horizontal_anchor: Optional[str] = 'left'
  relative_vertical_anchor: Optional[str] = 'top'

  def __init__(self, **kwargs):
    field_names = set([f.name for f in dataclasses.fields(self)])
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

  def __str__(self):
    return (
        'PvaLiteRenderMessagePlacement('
        f'offset_x={self.offset_x}, '
        f'offset_y={self.offset_y}, '
        f'rotation_angle={self.rotation_angle}, '
        f'element_id={self.element_id}, '
        f'relative_to={self.relative_to}, '
        f'element_horizontal_anchor={self.element_horizontal_anchor}, '
        f'element_vertical_anchor={self.element_vertical_anchor}, '
        f'relative_horizontal_anchor={self.relative_horizontal_anchor}, '
        f'relative_vertical_anchor={self.relative_vertical_anchor},)'
    )


@dataclasses.dataclass(init=False)
class PvaLiteRenderMessageTextPlacement(PvaLiteRenderMessagePlacement):
  """Represents a text placement in PVA Lite.

      Attributes:
        offset_x: Position along the x axis.
        offset_y: Position along the y axis.
        rotation_angle: Optional rotation angle of the text element.
        element_id: The id of the element.
        relative_to: The id of the element to position relative to.
        element_horizontal_anchor: The horizontal anchor of the element.
        element_vertical_anchor: The vertical anchor of the element.
        relative_horizontal_anchor: The horizontal anchor of the relative element.
        relative_vertical_anchor: The vertical anchor of the relative element.
        text_value: Optional text value.
        text_size:  Font size for text values.
        text_color: Font color of the element.
        text_alignment: Align text element left, center or right.
        text_font: Optional font for text values.
        text_width: Optional width text values.
      """

  offset_x: float
  offset_y: float
  rotation_angle: float = 0
  element_id: str
  relative_to: Optional[str] = None
  element_horizontal_anchor: Optional[str] = 'left'
  element_vertical_anchor: Optional[str] = 'top'
  relative_horizontal_anchor: Optional[str] = 'left'
  relative_vertical_anchor: Optional[str] = 'top'
  text_value: str
  text_size: float
  text_color: str
  text_alignment: str
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
        remove_background: Optional, if 'Yes' then remove background before placing.
        keep_ratio: Optional, if 'No' then resize image to the provided width and height.
      """
  offset_x: float
  offset_y: float
  rotation_angle: float = 0
  element_id: str
  relative_to: Optional[str] = None
  element_horizontal_anchor: Optional[str] = 'left'
  element_vertical_anchor: Optional[str] = 'top'
  relative_horizontal_anchor: Optional[str] = 'left'
  relative_vertical_anchor: Optional[str] = 'top'
  image_url: Optional[str] = None
  image_width: Optional[float] = 0
  image_height: Optional[float] = 0
  remove_background: Optional[str] = 'No'
  keep_ratio: Optional[bool] = False

  def __init__(self, **kwargs):
    # Handle string value 'Yes'/'No' from the sheet for keep_ratio.
    if 'keep_ratio' in kwargs and isinstance(kwargs['keep_ratio'], str):
      kwargs['keep_ratio'] = kwargs['keep_ratio'].lower() == 'yes'
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
    placements_data = kwargs.pop('placements', [])
    field_names = {f.name for f in dataclasses.fields(self)}
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

    self.placements = []
    for p_data in placements_data:
      if 'text_value' in p_data:
        self.placements.append(PvaLiteRenderMessageTextPlacement(**p_data))
      elif 'image_url' in p_data:
        self.placements.append(PvaLiteRenderMessageImagePlacement(**p_data))

  def __str__(self):
    return (
        'PvaLiteRenderMessageContent('
        f'offset_s={self.offset_s}, '
        f'duration_s={self.duration_s}, '
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
    content_data = kwargs.pop('content', [])
    field_names = {f.name for f in dataclasses.fields(self)}
    for k, v in kwargs.items():
      if k in field_names:
        setattr(self, k, v)

    self.content = [PvaLiteRenderMessageContent(**c) for c in content_data]

  def __str__(self):
    return (
        'PvaLiteRenderMessage('
        f'output_path={self.output_path}, '
        f'ad_group={self.ad_group}, '
        f'template_video={self.template_video}, '
        f'content={self.content})'
    )


def _get_text_dimensions(
    output_dir: str, placement: PvaLiteRenderMessageTextPlacement
) -> tuple[float, float, list[str]]:
  """Gets the dimensions of a text element.

  Args:
    output_dir: The directory to store temporary files.
    placement: The text placement object.

  Returns:
    A tuple containing the width, height, and wrapped lines of the text element.
  """
  # If the text is empty or just whitespace, return 0 dimensions.
  if not placement.text_value or not placement.text_value.strip():
    return 0, 0, []

  font_path = None
  if placement.text_font:
    font_path = StorageService.download_gcs_file(
        filepath=placement.text_font,
        bucket_name=ConfigService.GCS_BUCKET,
        output_dir=output_dir,
    )

  # Wrap the text first to get the correct dimensions for multi-line text.
  wrapped_lines = _wrap_text(placement.text_value, placement.text_width or 0)
  multi_line_text = '\n'.join(wrapped_lines)

  temp_image_name = VideoService.write_temp_image(
      placement.text_color,
      font_path,
      str(placement.text_size),
      multi_line_text,
      placement.rotation_angle,
      use_cropped_text_fix=True,
  )
  # The height returned by measuring the actual text can be inconsistent.
  # We only reliably use the width from this measurement.
  width = 0
  args = ['convert', temp_image_name, '-trim', '-format', '%w', 'info:']
  try:
    output = subprocess.check_output(args,
                                     stderr=subprocess.STDOUT).decode('utf-8')
    if output.strip():
      # We use cropped_text_fix, so we need to divide by 4 to get correct width.
      width = float(output.split()[0]) / 4.0
  except (subprocess.CalledProcessError, IndexError, ValueError) as e:
    logging.warning('Could not determine text width: %s', e)
  finally:
    os.remove(temp_image_name)

  # To get a consistent and accurate height, we query ImageMagick for font
  # metrics. This is more reliable than rendering text to an image and
  # measuring it, which can include unwanted vertical padding (leading).
  args_metric = [
      'convert',
      'xc:none',
      '-font',
      font_path,
      '-pointsize',
      str(placement.text_size),
      '-debug',
      'annotate',
      'label:A',  # A simple character to trigger font metric calculation.
      'null:',
  ]
  proc = subprocess.run(
      args_metric, capture_output=True, text=True, check=False
  )
  stderr_output = proc.stderr

  # Parse the stderr output to find ascender and descender.
  ascender = None
  descender = None
  for line in stderr_output.splitlines():
    line = line.strip()
    if line.startswith('ascender:'):
      try:
        ascender = float(line.split(':')[1].strip())
      except (ValueError, IndexError):
        pass
    elif line.startswith('descender:'):
      try:
        descender = float(line.split(':')[1].strip())
      except (ValueError, IndexError):
        pass

  if ascender is not None and descender is not None:
    single_line_height = ascender - descender  # Descender is negative.
  else:
    # Fallback to a raw estimate if metrics can't be parsed.
    logging.warning('Could not parse font metrics. Falling back to text_size.')
    single_line_height = placement.text_size

  # Calculate the total height based on the number of lines and the line
  # spacing logic used in `convert_text_overlay`.
  num_lines = len(wrapped_lines)
  if num_lines > 1:
    line_spacing = 1.2 * placement.text_size
    height = (num_lines-1) * line_spacing + single_line_height
  else:
    height = single_line_height

  return width, height, wrapped_lines


@dataclasses.dataclass
class Element:
  """Represents an element for rendering."""
  width: float
  height: float
  placement: Union[PvaLiteRenderMessageTextPlacement,
                   PvaLiteRenderMessageImagePlacement]
  absolute_x: Optional[float] = None
  absolute_y: Optional[float] = None
  wrapped_text: Optional[list[str]] = None


def _calculate_absolute_positions(
    elements: dict[str, Element]
) -> dict[str, Element]:
  """Calculates absolute positions for all elements.

  Args:
    elements: A dictionary of elements with relative positions.

  Returns:
    A dictionary of elements with absolute positions.
  """
  # Check for missing references
  for element_id, element in elements.items():
    if (
        element.placement.relative_to
        and element.placement.relative_to not in elements
    ):
      raise ValueError(
          f'Element "{element_id}" references a missing element'
          f' "{element.placement.relative_to}"'
      )
  # Build dependency graph
  graph = {
      element_id: element.placement.relative_to
      for element_id, element in elements.items()
      if element.placement.relative_to
  }

  # Topological sort
  sorted_elements = []
  visited = set()
  recursion_stack = set()

  def visit(element_id):
    if element_id in recursion_stack:
      raise ValueError(f'Circular dependency detected: {element_id}')
    if element_id in visited:
      return

    recursion_stack.add(element_id)
    if element_id in graph:
      visit(graph[element_id])

    visited.add(element_id)
    recursion_stack.remove(element_id)
    sorted_elements.append(element_id)

  for element_id in elements:
    if element_id not in visited:
      visit(element_id)

  # Calculate absolute positions
  for element_id in sorted_elements:
    element = elements[element_id]

    # Calculate anchor offsets for the current element
    element_anchor_x = 0
    if element.placement.element_horizontal_anchor == 'center':
      element_anchor_x = element.width / 2
    elif element.placement.element_horizontal_anchor == 'right':
      element_anchor_x = element.width

    element_anchor_y = 0
    if element.placement.element_vertical_anchor == 'center':
      element_anchor_y = element.height / 2
    elif element.placement.element_vertical_anchor == 'bottom':
      element_anchor_y = element.height

    if not element.placement.relative_to:
      element.absolute_x = element.placement.offset_x - element_anchor_x
      element.absolute_y = element.placement.offset_y - element_anchor_y
    else:
      relative_to = elements[element.placement.relative_to]

      # Calculate anchor offsets for the relative element
      relative_anchor_x = 0
      if element.placement.relative_horizontal_anchor == 'center':
        relative_anchor_x = relative_to.width / 2
      elif element.placement.relative_horizontal_anchor == 'right':
        relative_anchor_x = relative_to.width

      relative_anchor_y = 0
      if element.placement.relative_vertical_anchor == 'center':
        relative_anchor_y = relative_to.height / 2
      elif element.placement.relative_vertical_anchor == 'bottom':
        relative_anchor_y = relative_to.height
      element.absolute_x = (
          relative_to.absolute_x + relative_anchor_x - element_anchor_x
          + element.placement.offset_x
      )
      element.absolute_y = (
          relative_to.absolute_y + relative_anchor_y - element_anchor_y
          + element.placement.offset_y
      )
  logging.info('Generated ELEMENTS\n%s', elements)
  return elements


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
  logging.info('Received message: %s', received_message_json)
  msg = PvaLiteRenderMessage(**received_message_json)
  logging.info('Parsed message: %s', msg)
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
  # No need to create ad_group subdir if output_video_path includes it
  # os.mkdir(f'{output_dir}/{message.ad_group}')
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
  # Ensure the parent directory exists for the output path
  output_video_filename = f"{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}.mp4"
  output_video_path = pathlib.Path(
      output_dir, message.ad_group, output_video_filename
  )
  output_video_path.parent.mkdir(parents=True, exist_ok=True)

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

  logging.info(
      'Starting process_video function: Processing content %s', content
  )

  for placement_content in content:
    logging.info('Processing placement: %s', placement_content)
    duration = placement_content.duration_s
    offset = placement_content.offset_s

    elements = {}
    for placement in placement_content.placements:
      if isinstance(placement, PvaLiteRenderMessageImagePlacement):
        width = placement.image_width
        height = placement.image_height
        wrapped_lines = None
      else:
        width, height, wrapped_lines = _get_text_dimensions(
            output_dir, placement
        )
      elements[placement.element_id] = Element(
          width=width,
          height=height,
          placement=placement,
          wrapped_text=wrapped_lines,
      )

    elements = _calculate_absolute_positions(elements)

    logging.info('Elements with absolute positions: %s', elements)

    for _, element in elements.items():
      placement = element.placement
      if isinstance(placement, PvaLiteRenderMessageImagePlacement):
        image_or_videos_overlays.append(
            convert_image_overlay(
                output_dir,
                offset,
                duration,
                element,
            )
        )
      else:
        text_overlays.extend(
            convert_text_overlay(
                output_dir,
                offset,
                duration,
                element,
            )
        )

  logging.info('image_or_videos_overlays: %s', image_or_videos_overlays)
  logging.info('text_overlays: %s', text_overlays)
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
    element: Element,
):
  placement = element.placement
  wrapped_lines = element.wrapped_text
  font_path = None

  if placement.text_font:
    font_path = StorageService.download_gcs_file(
        filepath=placement.text_font,
        bucket_name=ConfigService.GCS_BUCKET,
        output_dir=output_dir,
    )

  # Create overlays to all lines broken down.
  texts = []

  for i, line in enumerate(wrapped_lines):
    texts.append({
        'start_time': offset,
        'end_time': offset + duration,
        'align': placement.text_alignment or "center",
        'x': element.absolute_x,
        'y': element.absolute_y +
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

  if not lines and text:
    return [text]

  return lines


def remove_background(input_path):
  input_image = Image.open(input_path)
  output_image = remove(input_image)
  output_path = f'{input_path}.png'
  output_image.save(output_path)
  return output_path


def convert_image_overlay(
    output_dir: str,
    offset: float,
    duration: float,
    element: Element,
):
  placement = element.placement
  logging.debug('Downloading image %s...', placement.image_url)

  # Download image from url to local temp file
  tmp_file_name = _download_image_to_file(output_dir, placement.image_url)

  if placement.remove_background == 'Yes':
    logging.debug('Removing background from image %s...', placement.image_url)
    tmp_file_name = remove_background(tmp_file_name)

  # Find out file's extension
  extension = imghdr.what(tmp_file_name) or 'tmp'
  image_size = os.stat(tmp_file_name).st_size
  if image_size <= 0:
    raise ValueError(
        f'Invalid image {placement.image_url} with extension {extension}'
    )

  return {
      'x': element.absolute_x,
      'y': element.absolute_y,
      'width': element.width,
      'height': element.height,
      'angle': placement.rotation_angle,
      'image': tmp_file_name,
      'keep_ratio': placement.keep_ratio,
      'start_time': offset,
      'end_time': offset + duration,
  }


def _download_image_to_file(output_dir, url):
  # Special case to download from Google Cloud Storage
  if url.startswith('gs://'):
    parsed_url = urlparse(url)
    file_path = parsed_url.path.lstrip('/')  # Remove leading slash.
    tmp_file_name = StorageService.download_gcs_file(
        filepath=file_path,
        bucket_name=ConfigService.GCS_BUCKET,
        output_dir=output_dir,
    )
  # Downloads image from https/https urls
  elif url.startswith('http://') or url.startswith('https://'):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) '
        'Chrome/90.0.4430.72 Safari/537.36 '
    }

    try:
      r = requests.get(url, stream=True, headers=headers, timeout=30)
      r.raise_for_status()

      # Get content type and guess extension
      content_type = r.headers.get('content-type')
      extension = mimetypes.guess_extension(
          content_type
      ) if content_type else '.img'  # Default extension if type unknown

      # If guessed extension is None or odd
      if extension is None:
        extension = '.img'  # Use default extension
      elif extension == '.jpe':
        extension = '.jpg'

      if not extension.startswith('.'):
        extension = '.' + extension

      # Construct a safe filename
      timestamp = datetime.datetime.now().timestamp()
      base_filename = f'img_{timestamp}{extension}'
      tmp_file_name = os.path.join(output_dir, base_filename)

      r.raw.decode_content = True
      with open(tmp_file_name, 'wb') as f:
        shutil.copyfileobj(r.raw, f)

    except requests.exceptions.RequestException as e:
      print(f'Error downloading image from {url}: {e}')
      raise

  else:
    raise ValueError(
        f"Unsupported URL: {url}. Only 'gs://', 'http://', 'https://' are supported."
    )

  return tmp_file_name
