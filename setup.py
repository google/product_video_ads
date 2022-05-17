# Copyright 2021 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google_auth_oauthlib.flow import InstalledAppFlow
from oauthlib.oauth2.rfc6749.errors import InvalidGrantError
from google.oauth2.credentials import Credentials
from google.cloud import storage
import pickle
from pathlib import Path
from urllib import parse
import sys

# @see https://developers.google.com/identity/protocols/oauth2/scopes
SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/script.projects',
]

# Configs for PVA. Installed into Sheets
CONFIGS = {
    'title': 'PVA Template - New',
    'time_interval': 1,
    'country': 'US',
    'lang': 'en',
}

_REDIRECT_URI = 'http://localhost:8080'

def setup_argparse():
    import argparse

    parser = argparse.ArgumentParser(
        description='Setup Sheets, AppScripts and Drive for PVA.')
    parser.add_argument('--drive-fonts', type=str, default='drive/fonts',
                        help='Directory containing fonts to be copied to Drive.')
    parser.add_argument('--secrets', type=str,
                        help='Your OAuth Secrets file. If empty, the app will ask for your client id and secret.')
    parser.add_argument('--env-out', type=str,
                        help='Full path to where ENV variables will be written.')
    parser.add_argument('--drive-id', type=str,
                        help='An existing Drive Id to reuse. If provided, setting up Drive is skipped.')
    parser.add_argument('--sheet-id', type=str,
                        help='An existing Sheet to reuse. If provided, setting up Sheets is skipped.')
    parser.add_argument('--build', type=str,
                        help='Type of build')
    return parser.parse_args()

class ClientConfigBuilder(object):
    """Helper class used to build a client config dict used in the OAuth 2.0 flow.
    """
    _DEFAULT_AUTH_URI = 'https://accounts.google.com/o/oauth2/auth'
    _DEFAULT_TOKEN_URI = 'https://accounts.google.com/o/oauth2/token'
    CLIENT_TYPE_WEB = 'web'
    CLIENT_TYPE_INSTALLED_APP = 'installed'

    def __init__(self, client_type=None, client_id=None, client_secret=None,
                 auth_uri=_DEFAULT_AUTH_URI, token_uri=_DEFAULT_TOKEN_URI):
        self.client_type = client_type
        self.client_id = client_id
        self.client_secret = client_secret
        self.auth_uri = auth_uri
        self.token_uri = token_uri

    def Build(self):
        """Builds a client config dictionary used in the OAuth 2.0 flow."""
        if all((self.client_type, self.client_id, self.client_secret,
                self.auth_uri, self.token_uri)):
            client_config = {
                self.client_type: {
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'auth_uri': self.auth_uri,
                    'token_uri': self.token_uri
                }
            }
        else:
            raise ValueError('Required field is missing.')

        return client_config


def main(args):

    credentials = None  # Use Cloud Shell defaults
    if args.secrets:
        flow = InstalledAppFlow.from_client_secrets_file(args.secrets, scopes=SCOPES)
    else:
        if args.build:
            splited_args = args.build.split(".")
            storage_client = storage.Client()
            bucket = storage_client.get_bucket(splited_args[0])
            result = bucket.blob(splited_args[1]).download_as_string()
            credentials = pickle.loads(result)
        else:
            client_id = input('Desktop Client ID: ')
            client_secret = input('Client Secret: ')
            client_config = ClientConfigBuilder(
            client_type=ClientConfigBuilder.CLIENT_TYPE_WEB, client_id=client_id,
            client_secret=client_secret)
            flow = InstalledAppFlow.from_client_config(
                client_config.Build(), scopes=SCOPES)
            # Note that from_client_config will not produce a flow with the
            # redirect_uris (if any) set in the client_config. This must be set
            # separately.
            flow.redirect_uri = _REDIRECT_URI

            auth_url, _ = flow.authorization_url(prompt='consent')

            print('Log into the Google Account you use to access your Ads account '
                  'and go to the following URL: \n%s\n' % auth_url)
            print('After approving the token copy and paste the full URL.')
            url = input('URL: ').strip()
            code = parse.parse_qs(parse.urlparse(url).query)['code'][0]

            try:
                flow.fetch_token(code=code)
            except InvalidGrantError as ex:
                print('Authentication has failed: %s' % ex)
                sys.exit(1)
            credentials = flow.credentials
    drive_id = args.drive_id if args.drive_id else create_drive(credentials, args.drive_fonts)

    sheet_id = args.sheet_id
    if not sheet_id:
        sheet_id = create_sheet(credentials, drive_id)
        create_appscript(credentials, sheet_id)

    if args.env_out:
        with open(args.env_out, 'w') as file:
            file.write("SPREADSHEET_ID={}\n".format(sheet_id))
            file.write("DRIVE_ID={}\n".format(drive_id))


def create_drive(credentials: Credentials, drive_dir: str) -> str:
    """Creates the folder setup on Google Drive.

    Args:
      credentials: The credentials used with the API.
      drive_dir: Upload files from `drive_dir` to the new Drive folder.

    Returns:
      The Drive ID of the parent folder.
    """

    print('Setting up Drive ... ', end='', flush=True)

    service = build('drive', 'v3', credentials=credentials)

    file_metadata = {
        'name': 'PVA-v2',
        'mimeType': 'application/vnd.google-apps.folder'
    }
    file = service.files().create(body=file_metadata, fields='id').execute()
    drive_id = file.get('id')

    file_metadata = {
        'name': 'base_videos',
        'parents': [drive_id],
        'mimeType': 'application/vnd.google-apps.folder'
    }
    base_videos = service.files().create(body=file_metadata, fields='id').execute()
    base_videos_id = base_videos.get('id')

    file_metadata = {
        'name': 'base_example.mp4',
        'parents': [base_videos_id]
    }

    media = MediaFileUpload(drive_dir + '/base_example.mp4',
                            mimetype='video/mp4', resumable=True)

    service.files().create(body=file_metadata, media_body=media).execute()


    file_metadata = {
        'name': 'fonts',
        'parents': [drive_id],
        'mimeType': 'application/vnd.google-apps.folder'
    }
    file = service.files().create(body=file_metadata, fields='id').execute()
    fonts_id = file.get('id')

    file_metadata = {
        'name': 'preview',
        'parents': [drive_id],
        'mimeType': 'application/vnd.google-apps.folder'
    }
    service.files().create(body=file_metadata).execute()

    file_metadata = {
        'name': 'Ubuntu-Bold.ttf',
        'parents': [fonts_id]
    }
    media = MediaFileUpload(drive_dir + '/Ubuntu-Bold.ttf',
                            mimetype='application/x-font-ttf', resumable=True)
    service.files().create(body=file_metadata, media_body=media).execute()

    file_metadata = {
        'name': 'Ubuntu-Regular.ttf',
        'parents': [fonts_id]
    }
    media = MediaFileUpload(drive_dir + '/Ubuntu-Regular.ttf',
                            mimetype='application/x-font-ttf', resumable=True)
    service.files().create(body=file_metadata, media_body=media).execute()

    print(f'Done. Drive URL: https://drive.google.com/drive/folders/{drive_id}')

    return drive_id


def create_sheet(credentials: Credentials, drive_id: str) -> str:
    """Creates a new Google SpreadSheet.

    Creates all internal sheets, namedranges, with limited formatting.

    Args:
      credentials: The credentials used with the API.
      drive_id: Set to this Drive folder in the 'Config' sheet.

    Returns:
      The Sheet ID.
    """

    print('Setting up Sheets ... ', end='', flush=True)

    def _add_sheet_request(sheet_id, title, hidden=False):
        return {
            'addSheet': {
                'properties': {
                    'sheetId': sheet_id,
                    'title': title,
                    'hidden': hidden,
                    'tabColorStyle': {"themeColor": "ACCENT1"},
                }
            },
        }

    def _named_range_request(name, sheet_id, row, col, row_end=None, col_end=None):
        row_end = row_end if row_end else row + 1
        col_end = col_end if col_end else col + 1

        return {
            "addNamedRange": {
                "namedRange": {
                    "name": name,
                    "range": {
                        "sheetId": sheet_id,
                        "startRowIndex": row,
                        "endRowIndex": row_end,
                        "startColumnIndex": col,
                        "endColumnIndex": col_end,
                    },
                }
            }
        }

    def _paste_data_request(sheet_id, row, col, data, delimiter=","):
        return {
            "pasteData": {
                "data": data,
                "type": "PASTE_NORMAL",
                "delimiter": delimiter,
                "coordinate": {
                    "sheetId": sheet_id,
                    "rowIndex": row,
                    "columnIndex": col,
                }
            }
        }

    service = build('sheets', 'v4', credentials=credentials)
    sheet = service.spreadsheets()

    props = {
        'properties': {
            'title': CONFIGS['title']
        }
    }
    spreadsheet = sheet.create(body=props, fields='spreadsheetId').execute()
    sheet_id = spreadsheet.get('spreadsheetId')

    update_body = {
        'requests': [
            _add_sheet_request(1, 'Configuration'),
            _add_sheet_request(2, 'Prices'),
            _add_sheet_request(3, 'Static'),
            _add_sheet_request(4, 'Ads'),
            _add_sheet_request(5, 'Bases', hidden=True),
            _add_sheet_request(6, 'OfferTypes', hidden=True),
            _add_sheet_request(7, 'Campaigns', hidden=True),
            _add_sheet_request(8, 'Generator', hidden=True),
            _paste_data_request(1, row=5, col=1, data=f"DriveConfigFolder, {drive_id}"),
            _paste_data_request(1, row=6, col=1, data="Interval In Minutes, {0}".format(
                CONFIGS['time_interval'])),
            _paste_data_request(
                1, row=7, col=1, data="MC - Target Country, {0}".format(CONFIGS['country'])),
            _paste_data_request(
                1, row=8, col=1, data="MC -  Content Language, {0}".format(CONFIGS['lang'])),
            _named_range_request("ContentLanguage", 1, row=8, col=2),
            _named_range_request("TargetCountry", 1, row=7, col=2),
            _named_range_request("Output", 1, row=3, row_end=6, col=4, col_end=7),
            _paste_data_request(
                2, row=0, col=None, data="Id, OfferGroup, OfferType, Position, Title, Image, Price"),
            _paste_data_request(
                2, row=1, col=0, data="1"),
            _paste_data_request(
                2, row=1, col=4, data="Your Product Name"),
            _paste_data_request(
                2, row=1, col=5, data="https://raw.githubusercontent.com/google/product_video_ads/main/logo.png"),
            _paste_data_request(
                2, row=1, col=6, data="R$ 2.899"),
            _paste_data_request(3, row=0, col=None, data="Id, Text, Image"),
            _paste_data_request(
                3, row=1, col=0, data="1, This is static and does not change!"),
            _paste_data_request(
                3, row=2, col=0, data="2, red bar, https://raw.githubusercontent.com/google/product_video_ads/main/bar.png"),
            _paste_data_request(
                4, row=2, col=1, data="Account ID"),
            _paste_data_request(
                4, row=3, col=1, data="Campaign Name"),
            _paste_data_request(
                4, row=4, col=1, data="Ad Group Type"),
            _paste_data_request(
                4, row=5, col=1, data="URL"),
            _paste_data_request(
                4, row=6, col=1, data="Call to Action"),
            _paste_data_request(
                4, row=7, col=1, data="Target Location"),
            _paste_data_request(
                4, row=8, col=1, data="Audience Name"),
            _paste_data_request(5, row=0, col=None, data="Title, File, Products"),
            #_paste_data_request(5, row=1, col=0, data='Base Example, base_example.mp4'),
            _paste_data_request(5, row=1, col=0, data='Base Example; base_example.mp4; [{"start_time":3.1,"end_time":"7"}]', delimiter=";"),
            _paste_data_request(6, row=0, col=None,
                       data="Title, Base, Configs, Parent"),
            _paste_data_request(6, row=1, col=0,
                       data='MyTest; Base Example; [{"key":"1","type":"product","field":"Title","x":925,"y":108,"start_time":0,"end_time":0,"font":"Ubuntu-Bold.ttf","color":"#ff0000","size":96,"width":20,"height":20,"align":"center","angle":0,"keep_ratio":false,"conditions":[]},{"key":"1","type":"product","field":"Price","x":948,"y":814,"start_time":0,"end_time":0,"font":"Ubuntu-Bold.ttf","color":"#ffed00","size":168,"width":20,"height":20,"align":"center","angle":0,"keep_ratio":false,"conditions":[]},{"key":"1","type":"product","field":"Image","x":684,"y":274,"start_time":0,"end_time":0,"font":"","color":"","size":0,"width":480,"height":480,"align":"left","angle":0,"keep_ratio":true,"conditions":[]}]', delimiter=";"),
            _paste_data_request(
                7, row=0, col=None, data="Date, AdsMetadata, VideoMetadata, Status, GeneratedVideo"),
            {
                'deleteSheet': {
                    'sheetId': 0,  # Sheet 1
                }
            },
        ],
    }

    request = service.spreadsheets().batchUpdate(
        spreadsheetId=sheet_id, body=update_body)
    request.execute()

    print(f'Done. Sheet URL: https://docs.google.com/spreadsheets/d/{sheet_id}/edit')

    return sheet_id


def create_appscript(credentials: Credentials, sheet_id: str) -> str:
    """Create the Merchant Center scripts as an AppScript Project and assign it a Sheet.

    Args:
      credentials: The credentials used with the API.
      sheet_id: Add the scripts to this sheet.

    Returns:
      The AppScript Project ID.
    """

    print('Installing scripts into Sheets ... ', end='', flush=True)

    service = build('script', 'v1', credentials=credentials)

    request = {'title': CONFIGS['title'], 'parentId': sheet_id}
    response = service.projects().create(body=request).execute()

    request = {
        'files': [{
            'name': 'Main.js',
            'type': 'SERVER_JS',
            'source': Path('appscript/src/Main.js').read_text()
        }, {
            'name': 'MerchantCenter.js',
            'type': 'SERVER_JS',
            'source': Path('appscript/src/MerchantCenter.js').read_text()
        }, {
            'name': 'appsscript',
            'type': 'JSON',
            'source': Path('appscript/src/appsscript.json').read_text()
        }]
    }

    response = service.projects().updateContent(body=request, scriptId=response['scriptId']).execute()

    print(f'Done. AppScript Project URL: https://script.google.com/d/{response["scriptId"]}/edit')

    return response['scriptId']


if __name__ == '__main__':
    args = setup_argparse()
    main(args)
