import functions_framework
import pandas as pd
import os
import json
from pva import *

CAMPAIGN_STATUS = 'Enabled'
ADGROUP_STATUS = 'Enabled'
ADGROUP_ACTION = 'Create'
CAMPAIGN_ACTION = 'Create'
AD_ACTION = 'Add'
ADGROUP_TYPE = 'In-feed video'
AD_TYPE = 'In-feed video ad'

@functions_framework.http
def generate_video_targeting(request):
    read_environment()
    campaigns_targeting = get_campaigns_targeting()
    adgroups_targeting = get_adgroups_targeting(campaigns_targeting)
    video_configs = read_video_configs()
    ads_targeting = get_ads_targeting(campaigns_targeting, video_configs)

    clean_range(CAMPAIGNS_CONFIG_RANGE)
    write_df_to_sheet(campaigns_targeting, CAMPAIGNS_CONFIG_RANGE)

    clean_range(ADGROUPS_CONFIG_RANGE)
    write_df_to_sheet(adgroups_targeting, ADGROUPS_CONFIG_RANGE)

    clean_range(ADS_CONFIG_RANGE)
    write_df_to_sheet(ads_targeting, ADS_CONFIG_RANGE)

    return "OK"


def read_environment():
    global VIDEO_NAME_SUFFIX, CAMPAIGNS_SHEET, ADGROUPS_SHEET, ADS_SHEET, MARKETS_CSV_FILE_PATH, VIDEO_CONFIGS_SHEET, CAMPAIGNS_CONFIG_RANGE, ADGROUPS_CONFIG_RANGE, ADS_CONFIG_RANGE, VIDEO_CONFIGS_RANGE
    # env
    VIDEO_NAME_SUFFIX = os.environ.get('VIDEO_NAME_SUFFIX')
    CAMPAIGNS_SHEET = os.environ.get('CAMPAIGNS_SHEET')
    ADGROUPS_SHEET = os.environ.get('ADGROUPS_SHEET')
    ADS_SHEET = os.environ.get('ADS_SHEET')
    MARKETS_CSV_FILE_PATH = os.environ.get('MARKETS_CSV_FILE_PATH')
    VIDEO_CONFIGS_SHEET = os.environ.get('VIDEO_CONFIGS_SHEET')
    # global
    CAMPAIGNS_CONFIG_RANGE = f'{CAMPAIGNS_SHEET}!A1:ZZ'
    ADGROUPS_CONFIG_RANGE = f'{ADGROUPS_SHEET}!A1:ZZ'
    ADS_CONFIG_RANGE = f'{ADS_SHEET}!A1:ZZ'
    VIDEO_CONFIGS_RANGE = f'{VIDEO_CONFIGS_SHEET}!A1:ZZ'

def get_campaigns_targeting():
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
    campaigns['Action'] = CAMPAIGN_ACTION
    campaigns['Campaign status'] = CAMPAIGN_STATUS
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


def get_adgroups_targeting(campaigns_targeting):
    adgroups = pd.DataFrame()
    # Action Campaign ID Ad group Status Ad group type
    adgroups['Campaign'] = campaigns_targeting['Campaign']
    adgroups['Ad group'] = campaigns_targeting['Campaign']
    adgroups['Action'] = ADGROUP_ACTION
    adgroups['Status'] = ADGROUP_STATUS
    adgroups['Ad group type'] = ADGROUP_TYPE
    return adgroups[['Action', 'Campaign', 'Ad group', 'Status', 'Ad group type']]

def get_ads_targeting(campaigns_targeting, video_configs):
    video_configs['Campaign'] = video_configs['AdsMetadata'].apply(
        lambda x: json.loads(x)['campaign_name'])

    ads = pd.DataFrame()
# Row Type	Action	Ad status	Final URL Headline	Description 1	Description 2	Ad name	Ad type	Video	Campaign	Ad group	Campaign type
    
    ads['Campaign'] = campaigns_targeting['Campaign']
    ads = ads.merge(video_configs[['Campaign', 'GeneratedVideo']], on='Campaign')
    ads['Final Url'] = 'https://www.youtube.com/watch?v=' + ads['GeneratedVideo']
    ads['Video'] = ads['Final Url']
    ads['Ad group'] = campaigns_targeting['Campaign']
    ads['Row Type'] = 'Ad'
    ads['Action'] = AD_ACTION
    ads['Ad status'] = 'Enabled'
    ads['Ad name'] = ads['Campaign']
    ads['Headline'] = ads['Campaign']
    ads['Description 1'] = ads['Campaign']
    ads['Description 2'] = ads['Campaign']
    ads['Ad type'] = AD_TYPE
    ads['Campaign type'] = 'Video'
    return ads[['Row Type', 'Action', 'Ad status', 'Final Url', 'Headline', 'Description 1', 'Description 2', 'Ad name', 'Ad type', 'Video', 'Campaign', 'Ad group', 'Campaign type']]
    
def read_video_configs():
    return read_df_from_sheet(VIDEO_CONFIGS_RANGE)

def read_markets():
    return pd.read_csv(MARKETS_CSV_FILE_PATH)


if __name__ == "__main__":
    load_local_environment()
    generate_video_targeting(None)
