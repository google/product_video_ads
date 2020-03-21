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
"""SpreadsheetConfiguration."""

from googleapiclient.discovery import build
from log.SpreadsheetHandler import SpreadsheetHandler
import log
import json


class SpreadsheetConfiguration(object):

  # Configuration ranges
  BASE_VIDEOS_NAMED_RANGE = 'Bases'
  CAMPAIGN_NAMED_RANGE = 'ProductsBaseStatus'
  PRODUCTS_NAMED_RANGE = 'ProductsCustom'
  ASSETS_NAMED_RANGE = 'Assets'
  STATUS_VIDEO_NAMED_RANGE = 'StatusVideoId'
  DRIVE_CONFIG_NAMED_RANGE = 'DriveConfigFolder'
  INTERVAL_IN_MINUTES_NAMED_RANGE = 'IntervalInMinutes'

  logger = log.getLogger()

  def __init__(self, spreadsheet_id, credentials):

    self.spreadsheet_id = spreadsheet_id

    # Init sheet to read configuration from
    self.sheet = build('sheets', 'v4', credentials=credentials).spreadsheets()
    self.logger.info('Spreadsheet configuration for ID %s initialized...',
                     spreadsheet_id)

    # Add log handler to write to configuration spreadsheet
    def log_callback(message):
      self.write_log(message)

    trix_handler = SpreadsheetHandler(log_callback)
    trix_handler.setFormatter(self.logger.handlers[0].formatter)
    self.logger.addHandler(trix_handler)
    self.logger.info('Spreadsheet log handler configured')

  def write_log(self, message):

    self.sheet.values().append(
        spreadsheetId=self.spreadsheet_id,
        range='Generator!A:A',
        valueInputOption='RAW',
        body={
            'values': [[message]]
        }).execute()

  def update_status(self, row, video_id, status):

    range_a1_notation = self.__get_named_range_A1_notation(
        self.STATUS_VIDEO_NAMED_RANGE)

    # Update only one line
    range_a1_notation['startRow'] = range_a1_notation['endRow'] = row

    self.sheet.values().update(
        spreadsheetId=self.spreadsheet_id,
        range=range_a1_notation['str'](),
        valueInputOption='RAW',
        body={
            'values': [[status, video_id]]
        }).execute()

    self.logger.info('Updating status to %s and video_id to %s to row %s',
                     status, video_id, row)

  def get_all_bases(self):
    """Return will be in the following format:
       {
         'Base Name': 'FileNameInsideDriveFolder.xyz',
         ...
       }
    """
    bases = dict()
    base_list = self.__get_named_range_values(self.BASE_VIDEOS_NAMED_RANGE)

    for video in base_list:
      bases[video[0]] = video[1].split('/')[-1]

    return bases

  def get_campaign_config(self):
    """Return will be in the following format:
       [configs, base_name, status]
    """
    return map(lambda c: [json.loads(c[0]), c[1], c[2]],
        self.__get_named_range_values(self.CAMPAIGN_NAMED_RANGE)
    )

  def get_products_data(self):
    """Return will be in the following format:

       {
           'product_id_100293': {
             'title': 'nice product',
             'price': 120,
             'image': 'https://image/here',
             ...
           },
           ...
        }
    """

    # Load products
    products_config = dict()
    prods = self.__get_named_range_values(self.PRODUCTS_NAMED_RANGE)
    header = prods.pop(0)[1:]

    for p in prods:
      products_config[p[0]] = dict(zip(header, p[1:]))

    # Also load assets
    assets_configs = dict()
    assets = self.__get_named_range_values(self.ASSETS_NAMED_RANGE)
    assets_headers = assets.pop(0)[1:]

    for a in assets:
      assets_configs[a[0]] = dict(zip(assets_headers, a[1:]))

    return {'product': products_config, 'asset': assets_configs}

  def get_drive_folder(self):
    return self.__get_named_range_values(self.DRIVE_CONFIG_NAMED_RANGE)[0][0]

  def get_interval_in_minutes(self):
    return self.__get_named_range_values(
        self.INTERVAL_IN_MINUTES_NAMED_RANGE)[0][0]

  def __get_named_range_values(self, range_name):

    range_a1_notation = self.__get_named_range_A1_notation(range_name)

    return self.sheet.values().get(
        spreadsheetId=self.spreadsheet_id,
        range=range_a1_notation['str']()).execute().get('values', [])

  def __get_named_range_A1_notation(self, range_name):

    range_notation = dict()
    sheetId = None

    spreadsheet_data = self.sheet.get(
        spreadsheetId=self.spreadsheet_id).execute()

    # Find named range in A1 notation
    for namedRange in spreadsheet_data['namedRanges']:
      if namedRange['name'] == range_name:
        range = namedRange['range']

        sheetId = range['sheetId']

        range_notation['startColumn'] = chr(
            ord('A') + range['startColumnIndex'])
        range_notation['startRow'] = str(range['startRowIndex'] + 1)
        range_notation['endColumn'] = chr(
            ord('A') + range['endColumnIndex'] - 1)
        range_notation['endRow'] = str(range['endRowIndex'])
        break

    if sheetId is None:
      raise Exception('Named range %s not found!' % range_name)

    # Find named range sheet name
    for sheet in spreadsheet_data['sheets']:
      if sheet['properties']['sheetId'] == sheetId:
        range_notation['sheetName'] = sheet['properties']['title']
        break

    # Build a str method to assemble everything
    range_notation['str'] = lambda: '%s!%s:%s' % (
        range_notation['sheetName'],
        (range_notation['startColumn'] + range_notation['startRow']),
        (range_notation['endColumn'] + range_notation['endRow']))

    return range_notation
