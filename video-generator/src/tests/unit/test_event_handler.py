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

from mock import Mock, ANY
from pytest import fixture

from configuration.event_handler import EventHandler


@fixture
def campaigns():
  return [
      ['1,2,3', 'Base1', EventHandler.HANDLED_STATUS[0]],
      ['1,2,3', 'Base1', EventHandler.HANDLED_STATUS[0]],
      ['1,2', 'Base2', 'Not Handled Status']
  ]


@fixture
def campaigns_with_preview():
  return [
      ['1,2,3', 'Base1', EventHandler.HANDLED_STATUS[0]],
      ['1,2,3', 'Base1', 'Preview'],
      ['1,2', 'Base2', 'Not Handled Status']
  ]


@fixture
def base_videos():
  return {
      'Base1': '/my/base/video/file.mp4'
  }


@fixture
def base_config():
  return {
      'Base1': [{
      }]
  }


def test_handling_configuration_preview(campaigns_with_preview, base_videos,
                                        base_config):

  # Arrange
  mock_configuration = Mock()
  mock_configuration.get_campaign_config.return_value = campaigns_with_preview
  mock_configuration.get_all_bases.return_value = base_videos
  mock_configuration.get_base_config.return_value = base_config

  mock_image_processor = Mock()

  video_id = 't3YQ8H'
  mock_processor = Mock()
  mock_processor.process_task.side_effect = [None, video_id]

  handler = EventHandler(mock_configuration, mock_processor, mock_image_processor)

  # Act
  handler.handle_configuration()

  # Assert
  assert mock_processor.process_task.call_count == 2

  # Called with preview True
  mock_processor.process_task.assert_called_with(ANY, ANY, True)

  mock_configuration.update_status.assert_called_once_with(ANY, video_id, ANY)

def test_handling_configuration(campaigns, base_videos, base_config):

  # Arrange
  mock_configuration = Mock()
  mock_configuration.get_campaign_config.return_value = campaigns
  mock_configuration.get_all_bases.return_value = base_videos
  mock_configuration.get_base_config.return_value = base_config

  mock_image_processor = Mock()

  video_id = 't3YQ8H'
  mock_processor = Mock()
  mock_processor.process_task.side_effect = [None, video_id]

  handler = EventHandler(mock_configuration, mock_processor, mock_image_processor)

  # Act
  handler.handle_configuration()

  # Assert
  assert mock_processor.process_task.call_count == 2

  mock_configuration.update_status.assert_called_once_with(ANY, video_id, ANY)


def test_handling_invalid_configuration():

  # Arrange
  mock_configuration = Mock()
  mock_configuration.get_campaign_config.return_value = [
      ['', 'Base2', EventHandler.HANDLED_STATUS[0]]
  ]
  mock_configuration.get_all_bases.return_value = {}
  mock_configuration.get_base_config.return_value = {}

  mock_image_processor = Mock()
  mock_processor = Mock()

  handler = EventHandler(mock_configuration, mock_processor, mock_image_processor)

  # Act
  handler.handle_configuration()

  # Assert
  mock_image_processor.process_task.assert_called_once()
  mock_processor.process_task.assert_not_called()
