import datetime
import functions_framework
import pandas as pd
import json
from flask import Request as Request
from pva import *


@functions_framework.http
def generate_ads_targeting(request):
    markets_csv_file_path = config_value('MARKETS_CSV_FILE_PATH')
    video_configs_range = f"{config_value('VIDEO_CONFIGS_SHEET')}!A1:ZZ"
    campaigns_config_range = f"{config_value('CAMPAIGNS_SHEET')}!A1:ZZ"
    adgroups_config_range = f"{config_value('ADGROUPS_SHEET')}!A1:ZZ"
    ad_config_range = f"{config_value('ADS_SHEET')}!A1:ZZ"

    logging.warn(f"reading markets from {markets_csv_file_path}")
    markets = pd.read_csv(markets_csv_file_path)

    campaigns_targeting = get_campaigns_targeting(markets)
    adgroups_targeting = get_adgroups_targeting(campaigns_targeting)
    video_configs = read_df_from_sheet(video_configs_range)
    ads_targeting = get_ads_targeting_df(campaigns_targeting, video_configs)

    write_df_to_sheet(campaigns_targeting, campaigns_config_range, True)
    write_df_to_sheet(adgroups_targeting, adgroups_config_range, True)
    write_df_to_sheet(ads_targeting, ad_config_range, True)

    return "OK"


def get_campaigns_targeting(markets: pd.DataFrame):
    # TODO what can change for a given market?
    # start-end date
    # daily budget
    # radius - as markets open nearby
    # wwIdent - if that changes, then campaign end date is set in the past (ID stays in markets file)
    # ads valid sunday to saturday (updates to homepage on Sat night)
    # sunday 10AM - saturday 6PM

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
        "Tagesbudget pro Markt": "Budget",
        "Kampagnenstart": "Campaign start date",
        "Kampagnenende": "Campaign end date"
    })[['store_id', 'Postcode',  'Budget', 'Campaign start date', 'Campaign end date']]
    campaigns['Postcode'] = campaigns['Postcode'].astype(str).str.zfill(5)
    campaigns['Currency'] = "EUR"
    campaigns['Budget'] = campaigns['Budget'].str[:-3].replace(',','.').astype(float)
    campaigns['Campaign start date'] = campaigns['Campaign start date'].apply(
        date_formatter)
    campaigns['Campaign end date'] = campaigns['Campaign end date'].apply(
        date_formatter)

    campaigns = campaigns.merge(stores, on="store_id")

    campaigns = campaigns.sort_values(['Postcode'])
    campaigns['Row Type'] = 'Campaign'
    campaigns['Action'] = config_value('CAMPAIGN_ACTION')
    campaigns['Campaign status'] = config_value('CAMPAIGN_STATUS')
    campaigns['Campaign'] = config_value(
        'CAMPAIGN_NAME_PREFIX') + campaigns['store_id'].astype(str)
    campaigns['Budget type'] = config_value('CAMPAIGN_BUDGET_TYPE')
    campaigns['Campaign type'] = config_value('CAMPAIGN_TYPE')
    campaigns['Campaign subtype'] = config_value('CAMPAIGN_SUBTYPE')
    campaigns['Bid strategy type'] = config_value('CAMPAIGN_BID_STRATEGY_TYPE')

    return campaigns[['Row Type', 'Action', 'Campaign status', 'Campaign', 'Campaign start date', 'Campaign end date', 'Currency', 'Budget', 'Budget type', 'Campaign type', 'Campaign subtype', 'Bid strategy type', 'Location', 'Postcode', 'store_id']]


def date_formatter(date):
    date_object = pd.to_datetime(date, format='%Y-%m-%d') if '-' in date else pd.to_datetime(date, format='%m/%d/%Y')
    # if date_object < datetime.date.today():
    #     date_object = datetime.date.today().strftime('%Y-%m-%d')
    return date_object.strftime('%Y-%m-%d') 


def generateLocations(market_group):
    locations = []
    for row in market_group.to_dict(orient='records'):
        try:
            lat = row['lat'].replace(',', '.')
            lat = '{:.6f}'.format(float(lat))
            lon = row['lon'].replace(',', '.')
            lon = '{:.6f}'.format(float(lon))
            radius = row['radius'].replace(',', '.')
            radius = max(1, round(row['radius']/1000))
            locations.append(f"{radius}|km|{lat},{lon}")
        except Exception:
            pass
    return ';'.join(locations)


def get_adgroups_targeting(campaigns_targeting: pd.DataFrame):
    adgroups = pd.DataFrame()
    adgroups['Campaign'] = campaigns_targeting['Campaign']
    adgroups['Ad group'] = config_value(
        'ADGROUP_NAME_PREFIX') + campaigns_targeting['store_id'].astype(str)
    adgroups['Action'] = config_value('ADGROUP_ACTION')
    adgroups['Status'] = config_value('ADGROUP_STATUS')
    adgroups['Ad group type'] = config_value('ADGROUP_TYPE')
    return adgroups[['Action', 'Campaign', 'Ad group', 'Status', 'Ad group type']]


def get_ads_targeting_df(campaigns_targeting: pd.DataFrame, video_configs: pd.DataFrame):
    video_configs['Postcode'] = video_configs['AdsMetadata'].apply(
        lambda x: json.loads(x)['postcode'])

    ads = pd.DataFrame()
    ads['Campaign'] = campaigns_targeting['Campaign']
    ads['Postcode'] = campaigns_targeting['Postcode']
    ads['Ad group'] = config_value(
        'ADGROUP_NAME_PREFIX') + campaigns_targeting['store_id'].astype(str)
    ads['Row Type'] = 'Ad'
    ads['Action'] = config_value('AD_ACTION')
    ads['Ad status'] = config_value('AD_STATUS')
    ads['Ad name'] = config_value(
        'AD_NAME_PREFIX') + campaigns_targeting['store_id'].astype(str)
    ads['Headline'] = config_value('DEFAULT_HEADLINE_TEXT') + " headline"
    ads['Description 1'] = config_value(
        'DEFAULT_HEADLINE_TEXT') + " description 1"
    ads['Description 2'] = config_value(
        'DEFAULT_HEADLINE_TEXT') + " description 2"
    ads['Ad type'] = config_value('AD_TYPE')
    ads['Campaign type'] = 'Video'
    ads = ads.merge(
        video_configs[['Postcode', 'GeneratedVideo']], on='Postcode').reset_index()
    ads['Video'] = 'https://www.youtube.com/watch?v=' + ads['GeneratedVideo']
    ads['Final Url'] = config_value('LANDING_PAGE_URL')
    return ads[['Row Type', 'Action', 'Ad status', 'Final Url', 'Headline', 'Description 1', 'Description 2', 'Ad name', 'Ad type', 'Video', 'Campaign', 'Ad group', 'Campaign type']]


def read_value(sheet, row, col, default=""):
    return sheet.cell(row=row, column=col).value if sheet.cell(row=row, column=col).value else default


if __name__ == "__main__":
    generate_ads_targeting(None)
