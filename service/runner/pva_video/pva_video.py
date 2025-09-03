# Copyright 2024 Google LLC
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

"""PVA video-handling wrapper code.

All code calling the video manipulation library (currently ffmpeg) should be
here.
"""

import logging
import os
import subprocess
import tempfile


def filter_strings(images_and_videos, text_lines):
  """Generates a complex filter specification for ffmpeg.

  Args:
    images_and_videos: a list of image overlay objects
    text_lines: a list of text overlay objects

  Returns:
    A string that represents a complex filter specification, ready to be
    passed in to ffmpeg.
  """
  # groups overlays and creates the first to loop in
  retval = []
  overlays = [*images_and_videos, *text_lines]
  input_stream = '0:v'
  output_stream = None
  text_imgs = []
  # loops concatenating other overlays to the first
  for i, ovr in enumerate(overlays):
    output_stream = f'vidout{i}'
    use_cropped_text_fix = True  # Enable the pre-rotation fix for text (handled in write_temp_image)

    # if it is an image overlay, renames it to 'vidX'
    if 'image' in ovr:
      f = f'[{i+1}:v] copy [vid{i+1}];'

    # if it is a text overlay, convert text to img and name overlay as 'imgX'
    else:
      f, text_img = text_filter((i + 1), ovr['text'], ovr['font'],
                                ovr['font_size'], ovr['font_color'],
                                ovr['align'],
                                ovr['start_time'], ovr['end_time'],
                                ovr.get('angle', None), use_cropped_text_fix)
      text_imgs.append(text_img)

    # Angle should be passed normally, except if we're creating text with
    # the cropped text fix, in which case, the angle was already taken
    # care of in the text overlay creation.
    angle_already_used = ('text' in ovr and use_cropped_text_fix)

    # Applies ffmpeg effects to images and text generated images
    f += video_filter(
        input_stream, (i + 1), ovr['x'], ovr['y'], ovr.get('width', '-1'),
        ovr.get('height',
                '-1'), ovr['start_time'], ovr['end_time'], output_stream,
        (ovr.get('angle', None) if not angle_already_used else None),
        ovr.get('fade_in_duration', 0.1), ovr.get('fade_out_duration', 0.1),
        ovr.get('align', None), ovr.get('keep_ratio', None)
    )
    retval.append(f)

    # makes current concat of overlays the one to concat next overlay
    input_stream = output_stream

  # maps last output to final video, or input video if there are no filters
  if output_stream:
    out_video = f'[{output_stream}]'
  else:
    out_video = '0:v'

  # returns all overlays
  return (retval, text_imgs, out_video)


def text_filter(
    text_stream_index,
    text,
    font,
    font_size,
    font_color,
    align,
    t_start,
    t_end,
    angle,
    use_cropped_text_fix=False,
):
  """Generates a ffmeg filter specification for a text overlay.

    Args:
      text_stream_index: index of the input text among the -i arguments
      text: the text to overlay on the video
      font: the file name of the font to be used
      font_size: font size in dots
      font_color: font color, in hex RGB
      align: text alignment ("left" or "center")
      t_start: start time of the image's appearance
      t_end: end time of the image's appearance

    Returns:
      A string that represents a text filter specification, ready to be
      passed in to ffmpeg.
    """

  input_str = '[%s:v]' % text_stream_index
  out_str = '[vid%s]' % text_stream_index

  # If the text is empty, returns a "noop" filter, otherwise ffmpeg will
  # complain about the text file being empty.
  if not text:
    text = ' '

  # Write the text to a file to avoid the special character escaping mess
  # http://xkcd.com/1638/
  # text_file_name = write_to_temp_file(text)

  # creates an image with the text 4x its size
  temp_image_name = write_temp_image(
      font_color,
      font,
      str(font_size),
      text, #text_file_name, # TODO: check if we really need the text_file_name
      angle,
      use_cropped_text_fix,
  )

  # returns ffmpeg command reducing img in 1/4, for better rendering.
  return (
      '%s scale=iw/4:ih/4 %s;' % (input_str, out_str), {
          'path': temp_image_name,
          'start_time': t_start,
          'end_time': t_end
      }
  )


def video_filter(
    input_stream,
    image_stream_index,
    x,
    y,
    width,
    height,
    t_start,
    t_end,
    output_stream,
    angle,
    fade_in_duration,
    fade_out_duration,
    align,
    keep_ratio,
):
  """Generates a ffmpeg filter specification for an image input.

  Args:
    input_stream: name of the input stream
    image_stream_index: index of the input image among the -i arguments
    x: horizontal position where to overlay the image on the video
    y: vertical position where to overlay the image on the video
    t_start: start time of the image's appearance
    t_end: end time of the image's appearance
    output_stream: name of the output stream
    fade_in_duration: float of representing how many seconds should fade in
    fade_out_duration: float of representing how many seconds should fade out
    align: align, for texts made image

  Returns:
    A string that represents an image filter specification, ready to be
    passed in to ffmpeg.
  """
  out_str = ('[%s]' % output_stream) if output_stream else ''
  image_str = '[vid%s]' % image_stream_index
  resize_str = '[vid%sresized]' % image_stream_index
  rotate_str = '[vid%srotated]' % image_stream_index
  fadein_str = '[vid%sfadedin]' % image_stream_index
  fadeout_str = '[vid%sfadedout]' % image_stream_index

  if align == 'center':
    x = f'{x}-overlay_w/2'

  if align == 'right':
    x = f'{x}-overlay_w'

  if not width:
    width = '-1'
  if not height:
    height = '-1'
  # raise Exception(fade_effect)

  # Keep aspect ratio
  if keep_ratio:
    img = '%s format=rgba,scale=%s %s;' % (
        image_str, "'if(gt(a,w/h),w,-1)':'if(gt(a,w/h),-1,h)'".
        replace('w', str(width)).replace('h', str(height)), resize_str
    )
    y = '%s+(%s-overlay_h)/2' % (y, height)
    x = '%s+(%s-overlay_w)/2' % (x, width)
  else:
    # scale regular image
    img = '%s format=rgba,scale=%s:%s %s;' % (
        image_str, width, height, resize_str
    )

  logging.debug(img)

  if angle and str(angle) != '0':
    # Rotate the already scaled image (resize_str) with expanded canvas
    img += '%s rotate=%s*PI/180:' % (resize_str, angle)
    # Make it large enough to display the entire rotated image
    img += 'ow=rotw(%s*PI/180):' % angle  # Use rotw() to calculate required width
    img += 'oh=roth(%s*PI/180):' % angle  # Use roth() to calculate required height
    img += 'c=none:'  # Use transparent background
    img += 'fillcolor=none'  # Fill empty space with transparency
    img += ' %s;' % rotate_str
  else:
    rotate_str = resize_str

  # adds fade in to image
  if float(fade_in_duration) > 0:
    fadein_start = t_start
    img += '%s fade=t=in:st=%s:d=%s:alpha=1 %s;' % (
        rotate_str, fadein_start, fade_in_duration, fadein_str
    )
  else:
    img += '%s copy %s;' % (rotate_str, fadein_str)
  # adds fade out to image
  if float(fade_out_duration) > 0:
    fadeout_start = float(t_end) - float(fade_out_duration)
    img += '%s fade=t=out:st=%s:d=%s:alpha=1 %s;' % (
        fadein_str, fadeout_start, fade_out_duration, fadeout_str
    )
  else:
    img += '%s copy %s;' % (fadein_str, fadeout_str)

  # place adds image to overall overlays
  start_at = t_start
  end_at = float(t_end)
  img += '[%s]%s overlay=%s:%s:enable=\'between(t,%s,%s)\' %s' % (
      input_stream, fadeout_str, x, y, start_at, end_at, out_str
  )

  # img += 'enable=\'between(t,%s,%s)\'' %(t_start, t_end)

  # raise Exception(img)

  return img


def write_to_temp_file(text):
  """Writes a string to a new temporary file and returns its name."""

  (fd, text_file_name
  ) = tempfile.mkstemp(prefix='pva_lite_', suffix='.txt', text=True)

  with os.fdopen(fd, 'wb') as f:
    f.write(text.encode('utf8'))

  return text_file_name


def write_temp_image(
    t_color,
    t_font,
    t_size,
    text,
    angle,
    use_cropped_text_fix=False,
):
  """Writes a text to a temporary image with transparent background."""

  # creates temp file
  temp_file_name = tempfile.mktemp(prefix='pva_lite_', suffix='.png')

  # If text is empty or just whitespace, create a 1x1 transparent png
  # to avoid errors with imagemagick's label:.
  if not text.strip():
    args = [
        'convert', '-size', '1x1', 'xc:transparent',
        escape_path(temp_file_name)
    ]
  else:
    # setup args to construct image
    args = ['convert']

    args += ['-background', 'transparent', '-colorspace', 'sRGB']
    if t_font:
      args += ['-font', t_font]
    args += ['-pointsize', str(float(t_size) * 4)]
    # The code below adds a thin border around the text. It was introduced as a
    # workaround for a light border on dark text that used to appear in some
    # projects. Since we're not seeing that issue anymore and some users are
    # complaining about the border, I'm removing it.
    # args += ['-stroke', t_color]
    # args += ['-strokewidth', str(float(t_size) / 10)]
    args += ['-fill', t_color]

    if use_cropped_text_fix:
      args += ['-size', '8000x8000']
      args += ['-gravity', 'center']

    args += [('label:' + text)]  # label:@text_file_name

    if use_cropped_text_fix:
      if angle and str(angle) != '0':
        args += ['-distort', 'SRT', str(angle)]
      args += ['-trim']

    args += [escape_path(temp_file_name)]

  logging.debug('Running imagemagick with args:')
  logging.debug(
      ' '.join([str(arg) for arg in args])
  )  # Ensure all args are strings for logging

  try:
    output = subprocess.check_output(args, stderr=subprocess.STDOUT)
    if output:
      raise FFMpegExecutionError(' '.join(args), output)
  except subprocess.CalledProcessError as e:
    raise FFMpegExecutionError(args, e.output) from e  # Pass args as list

  # return generated file name
  return temp_file_name


def escape_path(path):
  """Escapes Windows path slashes, colons and spaces, adding extra escapes."""
  # http://xkcd.com/1638/
  p = path.replace('\\', '\\\\\\\\').replace(':', '\\\\:')
  p = p.replace(' ', '\\\\ ')
  return p


def image_and_video_inputs(images_and_videos, text_tmp_images):
  """Generates a list of input arguments for ffmpeg with the given images."""
  include_cmd = []
  resized_images = set()

  # adds images as video starting on overlay time and finishing on overlay end
  for ovl in images_and_videos:
    filename = ovl['image']

    duration = str(float(ovl['end_time']) - float(ovl['start_time']))

    is_gif = filename.lower().endswith('.gif')
    has_fade = (
        float(ovl.get('fade_in_duration', 0))
        + float(ovl.get('fade_out_duration', 0))
    ) > 0

    # A GIF with no fade is treated as an animated GIF should.
    # It works even if it is not animated.
    # An animated GIF cannot have fade in or out effects.
    if is_gif and not has_fade:
      include_args = ['-ignore_loop', '0']
    else:
      include_args = ['-f', 'image2', '-loop', '1']

    include_args += ['-itsoffset', str(ovl['start_time']), '-t', duration]

    # GIFs should have a special input decoder for FFMPEG.
    if is_gif:
      include_args += ['-c:v', 'gif']

    # include_args += ['-analyzeduration', '2147483647', '-probesize', '2147483647']
    # include_args += ['-thread_queue_size', str(self.thread_queue_size), '-re']
    include_args += ['-i']

    # Resize all images to avoid FFMPEG to run with unecessary large images
    if (filename not in resized_images) and filename.endswith('png'):
      resize_images(
          filename, filename, ovl.get('width', -1), ovl.get('height', -1),
          ovl.get('keep_ratio', True)
      )

      resized_images.add(filename)  # Add the potentially new filename

    include_cmd += include_args + ['%s'%filename]

    # treats video overlays
    # else:
    #    duration = str(float(ovl['end_time']) - float(ovl['start_time']))
    #    include_args = ['-itsoffset', str(ovl['start_time']), '-t', duration]
    #    include_args += ['-i']
    #    include_cmd += include_args + ['%s' % (filename)]

  # adds texts as video starting and finishing on their overlay timing
  for img2 in text_tmp_images:
    duration = str(float(img2['end_time']) - float(img2['start_time']))

    include_args = ['-f', 'image2', '-loop', '1']
    include_args += ['-itsoffset', str(img2['start_time']), '-t', duration]
    include_args += ['-i']

    include_cmd += include_args + [str(img2['path'])]

  return include_cmd


def resize_images(
    input_file, output_file, width, height, keep_ratio, executable='convert'
):

  args = [
      executable, input_file, '-resize',
      '%dx%d%s' % (width, height, '>' if keep_ratio else '!'), '-quality', '95',
      '-depth', '8', output_file
  ]

  logging.debug('Running imagemagick to resize image with args:')
  logging.debug(' '.join(args))

  # Returns results or raises an exception
  try:
    return subprocess.check_output(args, stderr=subprocess.STDOUT)
  except subprocess.CalledProcessError as e:
    raise FFMpegExecutionError(args, e.output) from e


def run_ffmpeg(
    out_video,
    out_audio,
    assets_args,
    filters,
    input_video,
    output_video,
    executable='ffmpeg',
):
  """Runs the ffmpeg executable for the given input and filter spec.

  Args:
    assets_args: a list of '-i' input arguments for the images
    filters: complex filter specification
    input_video: main input video file name
    output_video: output video file name
    executable: the full or relative path to the ffmpeg executable
  Returns:
    The output of the ffmpeg process
  Raises:
    VideoGenerationError: if the ffmpeg process returns an error
  """

  # Setup command line arguments
  extra_end_args = []
  extra_end_args += ['-map', out_video]
  extra_end_args += ['-map', out_audio]
  extra_end_args += ['-shortest', '-y']  # , '-c:a', 'libfdk_aac']

  args = [executable, '-i', input_video] + assets_args

  if filters:
    args += ['-filter_complex', '%s' % ';'.join(filters)]

  args += extra_end_args
  args += [output_video]
  args = [str(arg) for arg in args]
  logging.info('Running ffmpeg with args:')
  logging.info(' '.join(args))

  # Returns results or raises an exception
  try:
    return subprocess.check_output(args, stderr=subprocess.STDOUT)
  except subprocess.CalledProcessError as e:
    raise FFMpegExecutionError(' '.join(args), e.output) from e


class FFMpegExecutionError(Exception):

  def __init__(self, ffmpeg_args, ffmpeg_output):
    super(FFMpegExecutionError, self).__init__(ffmpeg_output)
    self.ffmpeg_args = ffmpeg_args
    self.ffmpeg_output = ffmpeg_output

  def __str__(self):
    return repr(self.ffmpeg_output)
