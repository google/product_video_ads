import functions_framework
from cloudevents.http import CloudEvent
import pandas as pd
import os
from pva import *
# env
VIDEO_NAME_SUFFIX = os.environ.get('VIDEO_NAME_SUFFIX')
TARGETING_SHEET = os.environ.get('TARGETING_SHEET')
MARKETS_CSV_FILE_PATH = os.environ.get('MARKETS_CSV_FILE_PATH')
# global
TARGETING_CONFIG_RANGE = f'{TARGETING_SHEET}!A1:ZZ'

@functions_framework.cloud_event
def generate_video_targeting(cloud_event: CloudEvent):
    targeting = get_targeting()

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

def read_markets():
    return pd.read_csv(MARKETS_CSV_FILE_PATH)
