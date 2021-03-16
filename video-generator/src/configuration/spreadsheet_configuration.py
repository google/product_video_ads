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

import json

from googleapiclient.discovery import build

import log
from log.SpreadsheetHandler import SpreadsheetHandler


class SpreadsheetConfiguration(object):

    # Configuration ranges
    CAMPAIGN_RANGE = 'Campaigns!D2:D'
    CAMPAIGN_SINGLE_RANGE = 'Campaigns!C%s:D%s'
    STATUS_VIDEO_RANGE = 'Campaigns!D%s:E%s'
    PRODUCTS_RANGE = '!A1:ZZ'
    BASE_VIDEOS_RANGE = 'Bases!A2:C'
    ASSETS_RANGE = 'Static!A1:C'
    DRIVE_CONFIG_RANGE = 'Configuration!C6'
    INTERVAL_IN_MINUTES_RANGE = 'Configuration!C7'

    logger = log.getLogger()

    def __init__(self, spreadsheet_id, credentials):

        self.spreadsheet_id = spreadsheet_id

        # Init sheet to read configuration from
        self.sheet = build('sheets', 'v4', credentials=credentials).spreadsheets()
        self.logger.info('Spreadsheet configuration for ID %s initialized...',
                         spreadsheet_id)

        # Add log handler to write to configuration spreadsheet
        def log_callback(message, position):
            self.write_log(message, position)

        trix_handler = SpreadsheetHandler(log_callback)
        trix_handler.setFormatter(self.logger.handlers[0].formatter)
        self.logger.addHandler(trix_handler)
        self.logger.info('Spreadsheet log handler configured')

    def write_log(self, message, position):
        # Clear first
        if position == 1:
            self.sheet.values().clear(
                spreadsheetId=self.spreadsheet_id,
                range='Generator!A:A',
            ).execute()

        # Append log line
        self.sheet.values().append(
            spreadsheetId=self.spreadsheet_id,
            range='Generator!A:A',
            valueInputOption='RAW',
            body={
                'values': [[message[:4900]]]
            }).execute()

    def update_status(self, row, video_id, status):

        # Update only one line
        self.sheet.values().update(
            spreadsheetId=self.spreadsheet_id,
            range=self.STATUS_VIDEO_RANGE % (row, row),
            valueInputOption='RAW',
            body={
                'values': [[status, video_id]]
            }).execute()

        self.logger.info('Updating status to %s and video_id to %s to row %s',
                         status, video_id, row)

    def get_all_bases(self):
        bases = dict()
        base_list = self.__get_range_values(self.BASE_VIDEOS_RANGE)

        for video in base_list:
            bases[video[0]] = video[1].split('/')[-1]

        return bases

    def get_campaign_status(self):
        return map(lambda c: c[0], self.__get_range_values(self.CAMPAIGN_RANGE))

    def get_single_campaign_config(self, row):
        values = self.__get_range_values(self.CAMPAIGN_SINGLE_RANGE % (row, row))[0]
        return json.loads(values[0]), values[1]

    def get_products_data(self, products_label):
        # Load products
        products_config = dict()
        prods = self.__get_range_values(products_label + self.PRODUCTS_RANGE)
        header = prods.pop(0)[1:]

        for p in prods:
            products_config[p[0]] = dict(zip(header, p[1:]))

        # Also load assets
        assets_configs = dict()
        assets = self.__get_range_values(self.ASSETS_RANGE)
        assets_headers = assets.pop(0)[1:]

        for a in assets:
            assets_configs[a[0]] = dict(zip(assets_headers, a[1:]))

        return {'product': products_config, 'asset': assets_configs}

    def get_drive_folder(self):
        return self.__get_range_values(self.DRIVE_CONFIG_RANGE)[0][0]

    def get_interval_in_minutes(self):
        return self.__get_range_values(
            self.INTERVAL_IN_MINUTES_RANGE)[0][0]

    def __get_range_values(self, range_a1_notation):
        return self.sheet.values().get(
            spreadsheetId=self.spreadsheet_id,
            range=range_a1_notation).execute().get('values', [])
