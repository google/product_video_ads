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

import log
from ffmpeg.ffmpeg_generator import FFMPEGGenerator


class ImageGenerator(FFMPEGGenerator):
  """Image-handling class, which actually turns inputs into images."""

  logger = log.getLogger()

  def process_image(self, image_or_videos_overlays, text_overlays, input_image,
                    output_image):

    # Holds images generated from text
    self.text_imgs = []

    # Prepares all ffmpeg overlays
    img_overlays = self._filter_strings(image_or_videos_overlays, text_overlays)

    # Prepares all images/videos import
    img_args = self._image_and_video_inputs(image_or_videos_overlays, self.text_imgs)

    # assets_args
    assets_args = img_args
    filter_complex = img_overlays

    # Group all args and runs ffmpeg
    ffmpeg_output = self._run_ffmpeg_image(assets_args, filter_complex, input_image,
                                     output_image, self.ffmpeg_executable)

    self.logger.debug('ffmpeg ran with output %s:', ffmpeg_output)

    return output_image

  def _filter_strings(self, images_and_videos, text_lines):
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
    overlays = (images_and_videos + text_lines)
    input_stream = '0:v'
    output_stream = None

    # loops concatenating other overlays to the first
    for i, ovr in enumerate(overlays):
      output_stream = 'vidout%i' % i
      use_cropped_text_fix = ovr.get('useCroppedTextFix', False)

      # if it is an image overlay, renames it to 'vidX'
      if 'image' in ovr:
        f = '[%s:v] copy [vid%s];' % ((i + 1), (i + 1))

      # if it is a text overlay, convert text to img and name overlay as 'imgX'
      else:
        f = self._text_filter((i + 1), ovr['text'], ovr['font'],
                              ovr['font_size'], ovr['font_color'],
                              ovr['align'], ovr['start_time'],
                              ovr['end_time'],
                              ovr.get('angle', None), use_cropped_text_fix)

      # Angle should be passed normally, except if we're creating text with
      # the cropped text fix, in which case, the angle was already taken
      # care of in the text overlay creation.
      angle_already_used = ('text' in ovr and use_cropped_text_fix)

      # Applies ffmpeg effects to images and text generated images
      f += self._video_filter(input_stream, (i + 1), ovr['x'], ovr['y'],
                              ovr.get('width', '-1'),
                              ovr.get('height', '-1'), ovr['start_time'],
                              ovr['end_time'], output_stream,
                              (ovr.get('angle', None) if not angle_already_used
                               else None),
                              ovr.get('fade_in_duration', 0),
                              ovr.get('fade_out_duration', 0),
                              ovr.get('align', None),
                              ovr.get('keep_ratio', None))
      retval.append(f)

      # makes current concat of overlays the one to concat next overlay
      input_stream = output_stream

    # maps last output to final video, or input video if there are no filters
    if output_stream:
      self.out_video = '[%s]' % (output_stream)
    else:
      self.out_video = '0:v'

    # returns all overlays
    return retval

  def process_image_old(self, image_or_videos_overlays, text_overlays, input_image,
                    output_image):

    # Holds images generated from text
    self.text_imgs = []

    # Prepares all ffmpeg overlays
    img_overlays = self._filter_strings(image_or_videos_overlays, text_overlays)

    # Prepares all images/videos import
    img_args = self._image_and_video_inputs(image_or_videos_overlays, self.text_imgs)

    # assets_args
    assets_args = img_args
    filter_complex = img_overlays

    # Group all args and runs ffmpeg
    ffmpeg_output = self._run_ffmpeg_image(assets_args, filter_complex, input_image,
                                     output_image, self.ffmpeg_executable)

    self.logger.debug('ffmpeg ran with output %s:', ffmpeg_output)

    return output_image