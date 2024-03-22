from google.cloud import secretmanager
from google.auth.transport.requests import Request
import pickle
import pandas as pd
from googleapiclient.discovery import build
import os
import logging

logging.getLogger().setLevel(logging.DEBUG)

# global variables
_sheet = None
_ENV_READ = False
_CONFIG = False

def _read_environment():
    global SPREADSHEET_ID, GCP_PROJECT_ID, SECRET_ID, _ENV_READ, CONFIG_SHEET_NAME
    if _ENV_READ:
        return
    load_local_environment()
    SPREADSHEET_ID = os.environ.get('SPREADSHEET_ID')
    GCP_PROJECT_ID = os.environ.get('GCP_PROJECT_ID')
    SECRET_ID = os.environ.get('SECRET_ID')
    CONFIG_SHEET_NAME = os.environ.get('CONFIG_SHEET_NAME')
    _ENV_READ = True


def config():
    global _CONFIG
    if _CONFIG:
        return _CONFIG
    else :
        _read_environment()
        _CONFIG =  read_config_from_sheet()
    return _CONFIG

def config_value(key: str, payload = {}):
    try:
        return config()[key]
    except Exception as e:
        logging.error(e)
        return None
    

def read_config_from_sheet():
    config = {}
    configuration_sheet_range=f'{CONFIG_SHEET_NAME}!A1:B'
    config_df = read_df_from_sheet(configuration_sheet_range)
    # config_df = pd.transpose(config_df)
    for _,row in config_df.iterrows():
        config[row['name']] = row['value']
    return config


def sheet():
    global _sheet
    if _sheet == None:
        credentials = get_credentials_from_secret_manager()
        _sheet = build('sheets', 'v4', credentials=credentials).spreadsheets()
    return _sheet


def get_credentials_from_secret_manager():
    _read_environment()
    client = secretmanager.SecretManagerServiceClient()
    version_name = f"projects/{GCP_PROJECT_ID}/secrets/{SECRET_ID}/versions/latest"
    response = client.access_secret_version(request={"name": version_name})
    credentials = pickle.loads(response.payload.data)
    credentials.refresh(Request())
    return credentials


def read_data_from_sheet(range: str):
    _read_environment()
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
    _read_environment()
    sheet().values().update(
        spreadsheetId=SPREADSHEET_ID,
        range=range,
        valueInputOption='RAW',
        body={
            'values': values
        }).execute()


def clean_range(range: str):
    _read_environment()
    sheet().values().clear(
        spreadsheetId=SPREADSHEET_ID,
        range=range
    ).execute()


def load_local_environment():
    import os
    import yaml
    try:
        with open("env.yaml") as env:
            data = yaml.load(env, Loader=yaml.FullLoader)
            for key, value in data.items():
                os.environ[key] = value
    except FileNotFoundError:
        pass
