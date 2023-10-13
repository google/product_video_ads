import functions_framework
from cloudevents.http import CloudEvent
from google.cloud import pubsub_v1
import pandas as pd
import os
from pva import *

#env
DEFAULT_VIDEO_NAME_SUFFIX = '_test'

PRODUCT_SHEET = os.environ.get('PRODUCT_SHEET')
VIDEO_NAME_SUFFIX = os.environ.get('VIDEO_NAME_SUFFIX')
OFFER_TYPE = os.environ.get('OFFER_TYPE')
PRODUCTS_PER_VIDEO = int(os.environ.get('PRODUCTS_PER_VIDEO'))
PROJECT_ID=os.environ.get('GCP_PROJECT_ID')
TOPIC_ID=os.environ.get('CONFIG_GENERATED_TOPIC_NAME')
#global
PRODUCT_CONFIGS_RANGE = f'{PRODUCT_SHEET}!A1:ZZ'

@functions_framework.cloud_event
def generate_product_configs(cloud_event: CloudEvent):        
    global OFFERS_JSON_FILE_PATH
    OFFERS_JSON_FILE_PATH = os.environ.get('OFFERS_JSON_FILE_PATH')
    global MARKETS_CSV_FILE_PATH
    MARKETS_CSV_FILE_PATH = os.environ.get('MARKETS_CSV_FILE_PATH')
    global RANKING_JSON_FILE_PATH
    RANKING_JSON_FILE_PATH = os.environ.get('RANKING_JSON_FILE_PATH')

    ranking = get_product_ranking()
    video_configs = convert_ranking_to_video_configs(ranking)
    clean_range(PRODUCT_CONFIGS_RANGE)
    write_df_to_sheet(video_configs,PRODUCT_CONFIGS_RANGE)
    publisher = pubsub_v1.PublisherClient()
    topic_path = publisher.topic_path(PROJECT_ID, TOPIC_ID)
    publisher.publish(topic_path,b"Product Configs Generated")    

def convert_ranking_to_video_configs(ranking: pd.DataFrame):
    # column labels:    Id  OfferGroup  OfferType   Position        Title   Image   Price   ...
    # fields:           nan video_title offer_type  rankingorder    Title   picture price   ...
    columns = ['Id', 'OfferGroup', 'OfferType',
               'Position', 'Title', 'Image', 'Price']
    configs = ranking
    configs = configs.rename(columns={'nan': 'Id', 'postcode': 'OfferGroup',
                             'rankingorder': 'Position', 'title': 'Title', 'picture': 'Image', 'price': 'Price'})
    configs['OfferType'] = OFFER_TYPE
    configs['OfferGroup'] = configs['OfferGroup']+VIDEO_NAME_SUFFIX
    configs['Image'] = configs['Image'].str.strip()
    return configs[columns]

def get_product_ranking():
    df_offers = read_offers()
    df_ranking = read_ranking()
    
    offers = df_offers.apply(transform_offer, axis=1, result_type="expand")
    # price, kg/liter price, crossoutprice
    ranking = pd.DataFrame(df_ranking['mediaCellList'].to_list())
    ranking["postcode"] = ranking["postcode"].astype('string')
    # TODO pin down selection logic for same-ranking products
    # TODO drop this after logic is clear
    ranking = ranking.sort_values(['postcode', 'rankingorder']).groupby(
        ['postcode', 'rankingorder']).agg('first').groupby('postcode').head(PRODUCTS_PER_VIDEO).reset_index()
    ranking = ranking.merge(offers, how='left', on='nan')
    ranking = ranking.dropna()
    ranking = ranking.filter(
        ['nan', 'postcode', 'rankingorder', 'title', 'picture', 'price'])
    ranking = ranking.sort_values(['postcode', 'rankingorder']).groupby(
        ['postcode', 'rankingorder']).agg('first').groupby('postcode').head(PRODUCTS_PER_VIDEO).reset_index()
    ranking = ranking[(ranking.groupby(
        'postcode').rankingorder.transform('count') == PRODUCTS_PER_VIDEO)]
    return ranking

def transform_offer(x):
    return {'nan': x.nan,
            'price': x.price['price'],
            'crossOutPrice': x.price['crossOutPrice'],
            'advantage': x.price['advantage'],
            'title': x.texts['Werbeartikelbezeichnung'],
            'picture': x.pictures[0]['url'] if len(x.pictures) > 0 else ''
            }

def get_targeting():
    df_markets = read_markets()
    markets = df_markets
    markets = markets.rename(
        columns={"Postleitzahl": "postcode", "Breitengrad": "lat", "Längengrad": "lon", "Einzugsgebiet (Radius)": "radius"})
    markets = markets.filter(
        ['postcode', 'lat', 'lon', 'radius'],
        axis=1)
    markets['postcode'] = markets['postcode'].astype("string")
    markets = markets.sort_values(['postcode', 'radius'])

def read_offers():
    return pd.read_json(OFFERS_JSON_FILE_PATH)

def read_markets():
    return pd.read_csv(MARKETS_CSV_FILE_PATH)

def read_ranking():
    return pd.read_json(RANKING_JSON_FILE_PATH)

