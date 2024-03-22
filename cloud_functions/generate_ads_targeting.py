import functions_framework
import pandas as pd
import os
import json
from flask import Request as Request
from pva import *


@functions_framework.http
def generate_ads_targeting(request):
    campaigns_sheet = config_value('CAMPAIGNS_SHEET')
    adgroups_sheet = config_value('ADGROUPS_SHEET')
    ads_sheet = config_value('ADS_SHEET')
    video_configs_sheet = config_value('VIDEO_CONFIGS_SHEET')
    markets_csv_file_path = config_value('MARKETS_CSV_FILE_PATH')
    campaign_status = config_value('CAMPAIGN_STATUS')
    adgroup_status = config_value('ADGROUP_STATUS')
    adgroup_action = config_value('ADGROUP_ACTION')
    campaign_action = config_value('CAMPAIGN_ACTION')
    ad_action = config_value('AD_ACTION')
    adgroup_type = config_value('ADGROUP_TYPE')
    ad_type = config_value('AD_TYPE')
    langing_page_url = config_value('LANDING_PAGE_URL')
    campaign_name_prefix = config_value('CAMPAIGN_NAME_PREFIX')

    video_configs_range = f'{video_configs_sheet}!A1:ZZ'
    campaigns_config_range = f'{campaigns_sheet}!A1:ZZ'
    adgroups_config_range = f'{adgroups_sheet}!A1:ZZ'
    ad_config_range = f'{ads_sheet}!A1:ZZ'

    logging.warn(f"reading markets from {markets_csv_file_path}")
    markets = pd.read_csv(markets_csv_file_path)

    campaigns_targeting = get_campaigns_targeting(
        markets, campaign_name_prefix, campaign_action, campaign_status)
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


def get_campaigns_targeting(markets: pd.DataFrame, campaign_name_prefix: str, campaign_action: str, campaign_status: str):
    stores = markets.dropna()
    stores = stores.rename(columns={
        "Breitengrad": "lat",
        "Längengrad": "lon",
        "Einzugsgebiet (Radius)": "radius",
        "wwIdent": "store_id",
    })[['store_id', 'lat', 'lon', 'radius']]

    stores = stores.groupby(
        'store_id').apply(generateLocations).reset_index(name='Location')

    campaigns = markets.dropna()
    campaigns = campaigns.rename(columns={
        "wwIdent": "store_id",
        "Postleitzahl": "Postcode",
        # daily budget
        "Mediabudget Social PRO TAG": "Budget",
        "Kampagnenstart": "Campaign start date",
        "Kampagnenende": "Campaign end date"
    })[['store_id', 'Postcode',  'Budget', 'Campaign start date', 'Campaign end date']]

    campaigns['Postcode'] = campaigns['Postcode'].astype(str).str.zfill(5)

    # campaigns['Currency'] = campaigns['Budget'].str[-3:].str.strip()
    campaigns['Currency'] = "EUR"
    campaigns['Budget'] = campaigns['Budget'].str[:-3].astype(float)
    campaigns['Campaign start date'] = campaigns['Campaign start date'].apply(
        date_formatter)
    campaigns['Campaign end date'] = campaigns['Campaign end date'].apply(
        date_formatter)
# //TODO naming convention
# start_date
# end date
# daily budget
# location

# //TODO
# what can change for a given market?
# start-end date
# daily budget
# radius - as markets open nearby
# wwIdent - if that changes, then campaign end date is set in the past (ID stays in markets file)

# ads valid sunday to saturday (updates to homepage on Sat night)
# sunday 10AM - saturday 6PM

    campaigns = campaigns.merge(stores, on="store_id")

    campaigns = campaigns.sort_values(['Postcode'])
    campaigns['Row Type'] = 'Campaign'
    campaigns['Action'] = campaign_action
    campaigns['Campaign status'] = campaign_status
    campaigns['Campaign'] = campaign_name_prefix + campaigns['store_id'].astype(str)
    campaigns['Currency code'] = 'EUR'
    campaigns['Budget'] = 1
    campaigns['Budget type'] = 'Daily'
    campaigns['Status'] = 'Eligible'
    campaigns['Campaign type'] = 'Video'
    campaigns['Campaign subtype'] = 'Standard'
    campaigns['Bid strategy type'] = 'Manual CPV'

    return campaigns[['Row Type', 'Action', 'Campaign status', 'Campaign', 'Currency code', 'Budget', 'Budget type', 'Status', 'Campaign type', 'Campaign subtype', 'Bid strategy type', 'Location', 'Postcode', 'store_id']]


def date_formatter(date):
    if '-' in date:
        return pd.to_datetime(date, format='%Y-%m-%d')
    else:
        return pd.to_datetime(date, format='%m/%d/%Y')


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
    adgroups['Ad group'] = config_value('ADGROUP_NAME_PREFIX') + campaigns_targeting['store_id'].astype(str)
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
    ads['Ad group'] = config_value('ADGROUP_NAME_PREFIX') + campaigns_targeting['store_id'].astype(str)
    ads['Row Type'] = 'Ad'
    ads['Action'] = ad_action
    ads['Ad status'] = 'Enabled'
    ads['Ad name'] = config_value('AD_NAME_PREFIX') + campaigns_targeting['store_id'].astype(str)
    ads['Headline'] = config_value('DEFAULT_HEADLINE_TEXT') + " headline"
    ads['Description 1'] = config_value('DEFAULT_HEADLINE_TEXT') + " description 1"
    ads['Description 2'] = config_value('DEFAULT_HEADLINE_TEXT') + " description 2"
    ads['Ad type'] = ad_type
    ads['Campaign type'] = 'Video'
    ads = ads.merge(
        video_configs[['Postcode', 'GeneratedVideo']], on='Postcode').reset_index()
    ads['Video'] = 'https://www.youtube.com/watch?v=' + ads['GeneratedVideo']
    ads['Final Url'] = landing_page_url
    return ads[['Row Type', 'Action', 'Ad status', 'Final Url', 'Headline', 'Description 1', 'Description 2', 'Ad name', 'Ad type', 'Video', 'Campaign', 'Ad group', 'Campaign type']]


def read_value(sheet, row, col, default=""):
    return sheet.cell(row=row, column=col).value if sheet.cell(row=row, column=col).value else default


if __name__ == "__main__":
    class Request:
        def get_json(self):
            return json.loads("{}")
    generate_ads_targeting(Request())
