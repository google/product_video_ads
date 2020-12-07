# Copyright 2020 Google LLC

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     https://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from ffmpeg.ffmpeg_generator import FFMPEGGenerator


def test_resize_images_png():
    FFMPEGGenerator().resize_images('test.png', 'test.png', 100, 100, True)
    assert True


def test_resize_images_jpg():
    FFMPEGGenerator().resize_images('test.jpg', 'test.jpg', 100, 100, True)
    assert True
