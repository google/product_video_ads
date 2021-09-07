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
from pathlib import Path

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

    return parser.parse_args()


def main(args):

    credentials = None  # Use Cloud Shell defaults
    if args.secrets:
        flow = InstalledAppFlow.from_client_secrets_file(args.secrets, scopes=SCOPES)
    else:
        client_id = input('Desktop Client Id: ')
        client_secret = input('Client Secret: ')

        desktop_config = {
            "installed": {
                "client_id": client_id,
                "client_secret": client_secret,
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "redirect_uris": [
                    "urn:ietf:wg:oauth:2.0:oob",
                    "http://localhost"
                ]
            }
        }
        flow = InstalledAppFlow.from_client_config(desktop_config, scopes=SCOPES)
        
    flow.run_console()
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


def create_drive(credentials, drive_dir):

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
    service.files().create(body=file_metadata).execute()

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

    print(
        'Done. Drive URL: https://drive.google.com/drive/folders/{0}'.format(drive_id))

    return drive_id


def create_sheet(credentials, drive_id) -> str:
    """ Create a new Google SpreadSheet.

    Creates all internal sheets, namedranges, and limited formatting.
    """

    print('Setting up Sheets ... ', end='', flush=True)

    def add_sheet(sheet_id, title, hidden=False):
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

    def named_range(name, sheet_id, row, col, row_end=None, col_end=None):
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

    def paste_data(sheet_id, row, col, data):
        return {
            "pasteData": {
                "data": data,
                "type": "PASTE_NORMAL",
                "delimiter": ",",
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
            add_sheet(1, 'Configuration'),
            add_sheet(2, 'Prices'),
            add_sheet(3, 'Static'),
            add_sheet(4, 'Bases', hidden=True),
            add_sheet(5, 'OfferTypes', hidden=True),
            add_sheet(6, 'Campaigns', hidden=True),
            add_sheet(7, 'Generator', hidden=True),
            paste_data(1, row=5, col=1, data=f"DriveConfigFolder, {drive_id}"),
            paste_data(1, row=6, col=1, data="Interval In Minutes, {0}".format(
                CONFIGS['time_interval'])),
            paste_data(
                1, row=7, col=1, data="MC - Target Country, {0}".format(CONFIGS['country'])),
            paste_data(
                1, row=8, col=1, data="MC -  Content Language, {0}".format(CONFIGS['lang'])),
            named_range("ContentLanguage", 1, row=8, col=2),
            named_range("TargetCountry", 1, row=7, col=2),
            named_range("Output", 1, row=3, row_end=6, col=4, col_end=7),
            paste_data(
                2, row=0, col=None, data="Id, OfferGroup, OfferType, Position, Title, Image, Price"),
            paste_data(3, row=0, col=None, data="Id, Text, Image"),
            paste_data(4, row=0, col=None, data="Title, File, Products"),
            paste_data(5, row=0, col=None,
                       data="Title, Base, Configs, Parent"),
            paste_data(
                6, row=0, col=None, data="Date, AdsMetadata, VideoMetadata, Status, GeneratedVideo"),
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

    print(
        'Done. Sheet URL: https://docs.google.com/spreadsheets/d/{0}/edit'.format(sheet_id))

    return sheet_id


def create_appscript(credentials, sheet_id):

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

    print('Done. AppScript Project URL: https://script.google.com/d/{0}/edit'.format(response['scriptId']))

    return response['scriptId']
    

if __name__ == '__main__':
    args = setup_argparse()
    main(args)
