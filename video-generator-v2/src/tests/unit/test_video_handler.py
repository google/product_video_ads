from mock import Mock, ANY
from pytest import fixture

from video.video_handler import VideoHandler


@fixture
def campaigns():
  return [
      ['1,2,3', 'Base1', VideoHandler.HANDLED_STATUS[0]],
      ['1,2,3', 'Base1', VideoHandler.HANDLED_STATUS[0]],
      ['1,2', 'Base2', 'Not Handled Status']
  ]


@fixture
def campaigns_with_preview():
  return [
      ['1,2,3', 'Base1', VideoHandler.HANDLED_STATUS[0]],
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
  mock_configuration.get_all_base_videos.return_value = base_videos
  mock_configuration.get_base_config.return_value = base_config

  video_id = 't3YQ8H'
  mock_processor = Mock()
  mock_processor.process_task.side_effect = [None, video_id]

  handler = VideoHandler(mock_configuration, mock_processor)

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
  mock_configuration.get_all_base_videos.return_value = base_videos
  mock_configuration.get_base_config.return_value = base_config

  video_id = 't3YQ8H'
  mock_processor = Mock()
  mock_processor.process_task.side_effect = [None, video_id]

  handler = VideoHandler(mock_configuration, mock_processor)

  # Act
  handler.handle_configuration()

  # Assert
  assert mock_processor.process_task.call_count == 2

  mock_configuration.update_status.assert_called_once_with(ANY, video_id, ANY)


def test_handling_invalid_configuration():

  # Arrange
  mock_configuration = Mock()
  mock_configuration.get_campaign_config.return_value = [
      ['', 'Base2', VideoHandler.HANDLED_STATUS[0]]
  ]
  mock_configuration.get_all_base_videos.return_value = {}
  mock_configuration.get_base_config.return_value = {}

  mock_processor = Mock()

  handler = VideoHandler(mock_configuration, mock_processor)

  # Act
  handler.handle_configuration()

  # Assert
  mock_processor.process_task.assert_called_once()
