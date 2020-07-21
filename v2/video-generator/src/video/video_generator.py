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


class VideoGenerator(FFMPEGGenerator):
    """Video-handling class, which actually turns inputs into videos."""

    logger = log.getLogger()

    def process_video(self, image_or_videos_overlays, text_overlays, input_video,
                      output_video):
        # Validate first:
        self._validate_overlay_times(input_video, image_or_videos_overlays + text_overlays)

        # Holds images generated from text
        self.text_imgs = []

        # Prepares all ffmpeg overlays
        img_overlays = self._filter_strings(image_or_videos_overlays, text_overlays)

        # Prepares all images/videos import
        img_args = self._image_and_video_inputs(image_or_videos_overlays, self.text_imgs)

        # prepares audio files
        audio_files_index = len(img_overlays)

        # forces input audio to output
        audio_args, audio_overlays = [], []
        self.out_audio = '0:a?'

        # assets_args
        assets_args = img_args + audio_args
        filter_complex = img_overlays + audio_overlays

        # Group all args and runs ffmpeg
        ffmpeg_output = self._run_ffmpeg(assets_args, filter_complex, input_video,
                                         output_video, self.ffmpeg_executable)

        self.logger.debug('ffmpeg ran with output %s:', ffmpeg_output)

        return output_video
