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

from mock import Mock, patch
from pytest import raises

from video.video_processor import VideoProcessor


def test_generate_video_with_invalid_config():

  # Arrange
  storage = Mock()
  generator = Mock()
  uploader = Mock()

  processor = VideoProcessor(storage, generator, uploader)

  # Act
  with raises(KeyError):
    processor.generate_single_video('1', {})


@patch('video.video_processor.util')
def test_process_video_with_upload_exception_must_return_none(mock_util):

  # Arrange
  row = '1'
  config = {
      'base_config': '',
      'product_ids': '',
      'products_data': '',
      'base_video': ''
  }

  mock_util.convert_configs_to_format.return_value = 'image', 'text'

  generator = Mock()
  storage = Mock()
  uploader = Mock()
  uploader.upload_video.side_effect = Exception

  processor = VideoProcessor(storage, generator, uploader)

  # Act
  assert processor.process_task(row, config) is None


@patch('video.video_processor.util')
def test_process_video_with_generation_exception_must_return_none(mock_util):

  # Arrange
  row = '1'
  config = {
      'base_config': '',
      'product_ids': '',
      'products_data': '',
      'base_video': ''
  }

  mock_util.convert_configs_to_format.return_value = 'image', 'text'

  generator = Mock()
  generator.process_video.side_effect = Exception
  storage = Mock()
  uploader = Mock()

  processor = VideoProcessor(storage, generator, uploader)

  # Act
  assert processor.process_task(row, config) is None


@patch('video.video_processor.util')
def test_processing_video(mock_util):

  # Arrange
  row = '1'
  config = {
      'base_config': '',
      'product_ids': '',
      'products_data': '',
      'base_video': ''
  }

  mock_util.convert_configs_to_format.return_value = 'image', 'text'

  storage = Mock()

  generator = Mock()
  generator.process_video.return_value = 'video/path'

  uploader = Mock()
  uploader.upload_video.return_value = 'video_id'

  processor = VideoProcessor(storage, generator, uploader)

  # Act
  returned_id = processor.process_task(row, config)

  # Assert
  assert returned_id == 'video_id'

  uploader.upload_video.assert_called_once_with('video/path')
  storage.delete_file.assert_called_once_with('video/path')


@patch('video.video_processor.util')
def test_processing_video_with_preview(mock_util):

  # Arrange
  row = '1'
  config = {
      'base_config': '',
      'product_ids': '',
      'products_data': '',
      'base_video': ''
  }

  mock_util.convert_configs_to_format.return_value = 'image', 'text'

  storage = Mock()
  storage.upload_to_preview.return_value = 'video_id'

  generator = Mock()
  generator.process_video.return_value = 'video/path'

  uploader = Mock()

  processor = VideoProcessor(storage, generator, uploader)

  # Act
  returned_id = processor.process_task(row, config, True)

  # Assert
  assert returned_id == 'video_id'

  uploader.upload_video.assert_not_called()
  storage.upload_to_preview.assert_called_once_with('video/path')
  storage.delete_file.assert_called_once_with('video/path')
