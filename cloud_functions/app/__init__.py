from google.cloud import secretmanager
from google.auth.transport.requests import Request
import pickle
import pandas as pd
from googleapiclient.discovery import build
import logging
import sys
import os

log = logging.getLogger(__name__)

# global var
_sheet = None

SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')
GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID')
SECRET_ID = os.environ.get('SECRET_ID')

IS_DEV = False
def init(debug):
    global IS_DEV
    if debug:
        if not log.handlers:
            log.setLevel(logging.DEBUG)
            formatter = logging.Formatter(fmt="%(asctime)s %(levelname)s %(module)s: %(message)s", datefmt="%H:%M:%S")
            handler = logging.StreamHandler(sys.stdout)
            handler.setLevel(logging.DEBUG)
            handler.setFormatter(formatter)
            log.addHandler(handler)

def sheet():
    global _sheet
    if _sheet == None:
        credentials = get_credentials_from_secret_manager()
        _sheet = build('sheets', 'v4', credentials=credentials).spreadsheets()
    return _sheet

def get_credentials_from_secret_manager():
    client = secretmanager.SecretManagerServiceClient()
    version_name = f"projects/{GCP_PROJECT_ID}/secrets/{SECRET_ID}/versions/latest"
    response = client.access_secret_version(request={"name": version_name})
    credentials = pickle.loads(response.payload.data)
    credentials.refresh(Request())
    return credentials

def read_data_from_sheet(range: str):
    response = sheet().values().get(
        spreadsheetId=SPREADSHEET_ID,
        range=range
    ).execute()
    return response['values']


def read_df_from_sheet(range: str):
    values = read_data_from_sheet(range)
    return pd.DataFrame(values[1:], columns=values[0])

def write_df_to_sheet(df: pd.DataFrame, range: str):
    values = [df.columns.to_list()] + df.values.tolist()
    write_values_to_sheet(values, range)

def write_values_to_sheet(values, range: str):
    sheet().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=range,
        valueInputOption='RAW',
        body={
            'values': values
        }).execute()

def clean_range(range:str):
    sheet().values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=range
    ).execute()