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

"""import os
import pickle
from configuration.spreadsheet_configuration import SpreadsheetConfiguration

from mock import Mock, patch
from pytest import fixture, raises
from main import main

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
      }],
      'sheets': [{
          'properties': {
              'sheetId': '123',
              'title': 'Test'
          }
      }]
  }


@patch.dict(os.environ, {'SPREADSHEET_ID': '1-zErt53fgFefgRw'})
@patch('authentication.cloud_storage_token.storage')
@patch('configuration.spreadsheet_configuration.build')
def test_smoke(storage_mock, configuration_mock, sheets_data):

  valid_token = pickle.dumps('valid_token_from_storage')

  # Mock Cloud Storage to obtain valid token
  storage_mock.Client.return_value.get_bucket.return_value.blob.return_value\
      .download_as_string.return_value = valid_token

  # Mock Sheets API build and bevahiour
  sheets_mock = Mock()
  configuration_mock.return_value.spreadsheets.return_value = sheets_mock

  sheets_mock.get.return_value.execute.return_value = sheets_data

  # Values to test
  values = [
      ['BaseUm', 'BaseArquivoUm.mp4'],
      ['Base2', 'Base2.mp4']
  ]

  sheets_mock.values.return_value.get.return_value.execute.return_value = {
      'values': values
  }

  main()"""
