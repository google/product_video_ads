import functions_framework
import pandas as pd
import os
from pva import *
# env
VIDEO_NAME_SUFFIX = os.environ.get('VIDEO_NAME_SUFFIX')
TARGETING_SHEET = os.environ.get('TARGETING_SHEET')
MARKETS_CSV_FILE_PATH = os.environ.get('MARKETS_CSV_FILE_PATH')
VIDEO_CONFIGS_SHEET = os.environ.get('VIDEO_CONFIGS_SHEET')
# global
TARGETING_CONFIG_RANGE = f'{TARGETING_SHEET}!A1:ZZ'
VIDEO_CONFIGS_RANGE = f'{VIDEO_CONFIGS_SHEET}!A1:ZZ'

@functions_framework.http
def generate_video_targeting(request):
    targeting = get_targeting()
    update_ads_metadata(targeting)

    clean_range(TARGETING_CONFIG_RANGE)
    write_df_to_sheet(targeting, TARGETING_CONFIG_RANGE)
    return "OK"

def get_targeting():
    markets = read_markets()
    markets = markets.dropna()
    markets = markets.rename(columns={
        "Postleitzahl": "postcode",
        "Breitengrad": "lat",
        "Längengrad": "lon",
        "Einzugsgebiet (Radius)": "radius",
        "Beschreibung": "description",
        "wwIdent": "store_id"
    })[['store_id', 'description', 'postcode', 'lat', 'lon', 'radius']]

    markets['postcode'] = markets['postcode'].astype("string")
    markets['video'] = markets['postcode'] + VIDEO_NAME_SUFFIX
    markets = markets.sort_values(['postcode', 'radius'])

    return markets

def update_ads_metadata(targeting):
    video_configs = read_video_configs()
    



    clean_range(VIDEO_CONFIGS_RANGE)
    write_df_to_sheet(video_configs, VIDEO_CONFIGS_RANGE)

def read_video_configs():
    return read_df_from_sheet(VIDEO_CONFIGS_RANGE);

def read_markets():
    return pd.read_csv(MARKETS_CSV_FILE_PATH)
