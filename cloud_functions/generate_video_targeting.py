import functions_framework
import pandas as pd
import os
from pva import *
# env


@functions_framework.http
def generate_video_targeting(request):
    read_environment()
    targeting = get_targeting()
    # update_ads_metadata(targeting)

    clean_range(TARGETING_CONFIG_RANGE)
    write_df_to_sheet(targeting, TARGETING_CONFIG_RANGE)
    return "OK"


def read_environment():
    global VIDEO_NAME_SUFFIX, TARGETING_SHEET, MARKETS_CSV_FILE_PATH, VIDEO_CONFIGS_SHEET, TARGETING_CONFIG_RANGE, VIDEO_CONFIGS_RANGE
    # env
    VIDEO_NAME_SUFFIX = os.environ.get('VIDEO_NAME_SUFFIX')
    TARGETING_SHEET = os.environ.get('TARGETING_SHEET')
    MARKETS_CSV_FILE_PATH = os.environ.get('MARKETS_CSV_FILE_PATH')
    VIDEO_CONFIGS_SHEET = os.environ.get('VIDEO_CONFIGS_SHEET')
    # global
    TARGETING_CONFIG_RANGE = f'{TARGETING_SHEET}!A1:ZZ'
    VIDEO_CONFIGS_RANGE = f'{VIDEO_CONFIGS_SHEET}!A1:ZZ'


def get_targeting():
    markets = read_markets()
    markets = markets.dropna()
    markets = markets.rename(columns={
        "Postleitzahl": "postcode",
        "Breitengrad": "lat",
        "Längengrad": "lon",
        "Einzugsgebiet (Radius)": "radius",
        "Beschreibung": "description",
        "wwIdent": "store_id",
        "Mediabudget Social PRO TAG": "Budget"
    })[['store_id', 'description', 'postcode', 'lat', 'lon', 'radius', 'Budget']]

    campaigns = markets[['radius', 'lat', 'lon', 'postcode']].groupby(
        'postcode').apply(generateLocations).reset_index(name='Location')

    campaigns = campaigns.sort_values(['postcode'])
    # Row Type	Action	Campaign status	Campaign	Currency code	Budget	Budget type	Status	Campaign type	Campaign subtype	Bid strategy type	Location
    campaigns['Row Type'] = 'Campaign'
    campaigns['Action'] = 'Create'
    campaigns['Campaign status'] = 'Paused'
    campaigns['Campaign'] = campaigns['postcode'].map('{:0>5}'.format)
    campaigns['Currency code'] = 'EUR'
    campaigns['Budget'] = 1
    campaigns['Budget type'] = 'Daily'
    campaigns['Status'] = 'Eligible'
    campaigns['Campaign type'] = 'Video'
    campaigns['Campaign subtype'] = 'Standard'
    campaigns['Bid strategy type'] = 'Manual CPV'

    return campaigns[['Row Type', 'Action', 'Campaign status', 'Campaign', 'Currency code', 'Budget', 'Budget type', 'Status', 'Campaign type', 'Campaign subtype', 'Bid strategy type', 'Location']]


def generateLocations(market_group):
    locations = []
    for row in market_group.to_dict(orient='records'):
        # 10.0|km|0.121223,4.321000
        # radius = '{:.4f}'.format(row['radius']/1000)
        radius = round(row['radius']/1000)
        lat = '{:.6f}'.format(row['lat'])
        lon = '{:.6f}'.format(row['lon'])
        locations.append(f"{radius}|km|{lat},{lon}")
    return ';'.join(locations)


def read_video_configs():
    return read_df_from_sheet(VIDEO_CONFIGS_RANGE)


def read_markets():
    return pd.read_csv(MARKETS_CSV_FILE_PATH)


if __name__ == "__main__":
    load_local_environment()
    generate_video_targeting(None)
