import functions_framework
import pandas as pd
import os
import json
from pva import *

DEAFAULT_HEADLINE_TEXT = 'Test'
CAMPAIGN_NAME_PREFIX = "PVA_CAMPAIGN_"
ADGROUP_NAME_PREFIX = "PVA_ADGROUP_"
AD_NAME_PREFIX = "PVA_AD_"

# [START functions_http_content]


@functions_framework.http
def generate_ads_targeting(request):
    args = request.args

    campaigns_sheet = os.environ.get('CAMPAIGNS_SHEET')
    adgroups_sheet = os.environ.get('ADGROUPS_SHEET')
    ads_sheet = os.environ.get('ADS_SHEET')
    video_configs_sheet = os.environ.get('VIDEO_CONFIGS_SHEET')

    video_configs_range = f'{video_configs_sheet}!A1:ZZ'
    campaigns_config_range = f'{campaigns_sheet}!A1:ZZ'
    adgroups_config_range = f'{adgroups_sheet}!A1:ZZ'
    ad_config_range = f'{ads_sheet}!A1:ZZ'

    markets_csv_file_path = args.get(
        'markets_csv_file_path', default=os.environ.get('MARKETS_CSV_FILE_PATH'), type=str)

    campaign_status = args.get(
        'campaign_status', default=os.environ.get('CAMPAIGN_STATUS'), type=str)
    adgroup_status = args.get(
        'adgroup_status', default=os.environ.get('ADGROUP_STATUS'), type=str)
    adgroup_action = args.get(
        'adgroup_action', default=os.environ.get('ADGROUP_ACTION'), type=str)
    campaign_action = args.get(
        'campaign_action', default=os.environ.get('CAMPAIGN_ACTION'), type=str)
    ad_action = args.get(
        'ad_action', default=os.environ.get('AD_ACTION'), type=str)
    adgroup_type = args.get(
        'adgroup_type', default=os.environ.get('ADGROUP_TYPE'), type=str)
    ad_type = args.get('ad_type', default=os.environ.get('AD_TYPE'), type=str)
    langing_page_url = args.get('landing_page_url', default=os.environ.get('LANDING_PAGE_URL'), type=str)

    markets = pd.read_csv(markets_csv_file_path)

    campaigns_targeting = get_campaigns_targeting(
        markets, campaign_action, campaign_status)
    adgroups_targeting = get_adgroups_targeting(campaigns_targeting,
                                                adgroup_action, adgroup_status, adgroup_type)
    video_configs = read_df_from_sheet(video_configs_range)
    ads_targeting = get_ads_targeting_df(
        campaigns_targeting, video_configs, ad_action, ad_type, langing_page_url)

    clean_range(campaigns_config_range)
    write_df_to_sheet(campaigns_targeting, campaigns_config_range)

    clean_range(adgroups_config_range)
    write_df_to_sheet(adgroups_targeting, adgroups_config_range)

    clean_range(ad_config_range)
    write_df_to_sheet(ads_targeting, ad_config_range)

    return "OK"


def get_campaigns_targeting(markets: pd.DataFrame, campaign_action: str, campaign_status: str):
    campaigns = markets.dropna()
    campaigns = campaigns.rename(columns={
        "Postleitzahl": "Postcode",
        "Breitengrad": "lat",
        "Längengrad": "lon",
        "Einzugsgebiet (Radius)": "radius",
        "Beschreibung": "description",
        "wwIdent": "store_id",
        "Mediabudget Social PRO TAG": "Budget"
    })[['Postcode', 'store_id', 'description', 'lat', 'lon', 'radius', 'Budget']]
    campaigns['Postcode'] = campaigns['Postcode'].sort_values().astype(
        str).str.zfill(5)

    store_postcodes = campaigns[["store_id", "Postcode"]]
    campaigns = campaigns[['radius', 'lat', 'lon', 'store_id']].groupby(
        'store_id').apply(generateLocations).reset_index(name='Location')
    campaigns = campaigns.merge(store_postcodes, on="store_id")

    campaigns = campaigns.sort_values(['Postcode'])
    campaigns['Row Type'] = 'Campaign'
    campaigns['Action'] = campaign_action
    campaigns['Campaign status'] = campaign_status
    campaigns['Campaign'] = CAMPAIGN_NAME_PREFIX + \
        campaigns['store_id'].astype(str)
    campaigns['Currency code'] = 'EUR'
    campaigns['Budget'] = 1
    campaigns['Budget type'] = 'Daily'
    campaigns['Status'] = 'Eligible'
    campaigns['Campaign type'] = 'Video'
    campaigns['Campaign subtype'] = 'Standard'
    campaigns['Bid strategy type'] = 'Manual CPV'

    return campaigns[['Row Type', 'Action', 'Campaign status', 'Campaign', 'Currency code', 'Budget', 'Budget type', 'Status', 'Campaign type', 'Campaign subtype', 'Bid strategy type', 'Location', 'Postcode']]


def generateLocations(market_group):
    locations = []
    for row in market_group.to_dict(orient='records'):
        radius = max(1, round(row['radius']/1000))
        lat = '{:.6f}'.format(row['lat'])
        lon = '{:.6f}'.format(row['lon'])
        locations.append(f"{radius}|km|{lat},{lon}")
    return ';'.join(locations)


def get_adgroups_targeting(campaigns_targeting: pd.DataFrame, adgroup_action: str, adgroup_status: str, adgroup_type: str):
    adgroups = pd.DataFrame()

    adgroups['Campaign'] = campaigns_targeting['Campaign']
    adgroups['Ad group'] = campaigns_targeting['Campaign'].str.replace(
        CAMPAIGN_NAME_PREFIX, ADGROUP_NAME_PREFIX)
    adgroups['Action'] = adgroup_action
    adgroups['Status'] = adgroup_status
    adgroups['Ad group type'] = adgroup_type

    return adgroups[['Action', 'Campaign', 'Ad group', 'Status', 'Ad group type']]


def get_ads_targeting_df(campaigns_targeting: pd.DataFrame, video_configs: pd.DataFrame, ad_action: str, ad_type: str, landing_page_url: str):
    video_configs['Postcode'] = video_configs['AdsMetadata'].apply(
        lambda x: json.loads(x)['postcode'])

    ads = pd.DataFrame()
    ads['Campaign'] = campaigns_targeting['Campaign']
    ads['Postcode'] = campaigns_targeting['Postcode']
    ads['Ad group'] = campaigns_targeting['Campaign'].str.replace(
        CAMPAIGN_NAME_PREFIX, ADGROUP_NAME_PREFIX)
    ads['Row Type'] = 'Ad'
    ads['Action'] = ad_action
    ads['Ad status'] = 'Enabled'
    ads['Ad name'] = campaigns_targeting['Campaign'].str.replace(
        CAMPAIGN_NAME_PREFIX, AD_NAME_PREFIX)
    ads['Headline'] = DEAFAULT_HEADLINE_TEXT + " headline"
    ads['Description 1'] = DEAFAULT_HEADLINE_TEXT + " description 1"
    ads['Description 2'] = DEAFAULT_HEADLINE_TEXT + " description 2"
    ads['Ad type'] = ad_type
    ads['Campaign type'] = 'Video'
    ads = ads.merge(
        video_configs[['Postcode', 'GeneratedVideo']], on='Postcode').reset_index()
    ads['Video'] = 'https://www.youtube.com/watch?v=' + ads['GeneratedVideo']
    ads['Final Url'] = landing_page_url
    return ads[['Row Type', 'Action', 'Ad status', 'Final Url', 'Headline', 'Description 1', 'Description 2', 'Ad name', 'Ad type', 'Video', 'Campaign', 'Ad group', 'Campaign type']]


if __name__ == "__main__":
    from werkzeug.datastructures import ImmutableMultiDict
    load_local_environment()
    request = Request()
    request.args = ImmutableMultiDict([])
    generate_ads_targeting(request)
