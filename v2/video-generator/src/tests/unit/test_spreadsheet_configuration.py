from mock import Mock, patch
from pytest import fixture, raises

from configuration.spreadsheet_configuration import SpreadsheetConfiguration


@fixture
def sheets_data():
  return {
      'namedRanges': [{
          'name': 'REPLACE_ME',
          'range': {
              'sheetId': '123',
              'startColumnIndex': 1,
              'endColumnIndex': 1,
              'startRowIndex': 1,
              'endRowIndex': 1
          }
      },
      {
          'name': 'REPLACE_ME',
          'range': {
              'sheetId': '123',
              'startColumnIndex': 1,
              'endColumnIndex': 1,
              'startRowIndex': 1,
              'endRowIndex': 1
          }
      }],
      'sheets': [{
          'properties': {
              'sheetId': '123',
              'title': 'Test'
          }
      }]
  }


@patch('configuration.spreadsheet_configuration.build')
def test_get_all_bases(mock_build, sheets_data):

  # Mock imported build for API
  sheets_mock = Mock()
  mock_build.return_value.spreadsheets.return_value = sheets_mock

  # Mock behaviour
  sheets_data['namedRanges'][0]['name'] = SpreadsheetConfiguration.BASE_VIDEOS_NAMED_RANGE
  sheets_mock.get.return_value.execute.return_value = sheets_data

  # Values to test
  values = [
      ['BaseUm', 'BaseArquivoUm.mp4'],
      ['Base2', 'Base2.mp4']
  ]

  sheets_mock.values.return_value.get.return_value.execute.return_value = {
      'values': values
  }

  # Act
  configuration = SpreadsheetConfiguration('spreadsheet_id', 'credentials')
  all_base_videos = configuration.get_all_bases()

  # Assert
  assert len(all_base_videos) == 2
  assert all_base_videos[values[0][0]] == values[0][1]
  assert all_base_videos[values[1][0]] == values[1][1]
