import functions_framework
from cloudevents.http import CloudEvent
import pandas as pd
from datetime import datetime
import json
from pva import *
import os

#env
DEFAULT_INITIAL_VIDEO_STATUS = 'Preview'

#global
VIDEOS_SHEET = 'Campaigns'
PRODUCT_SHEET = 'Prices'
BASES_SHEET = 'Bases'
OFFER_TYPES_SHEET = 'OfferTypes'
PRODUCT_CONFIGS_RANGE = f'{PRODUCT_SHEET}!A1:ZZ'
VIDEO_CONFIGS_RANGE = f'{VIDEOS_SHEET}!A1:ZZ'

@functions_framework.cloud_event
def generate_video_configs(cloud_event: CloudEvent):
    initial_video_status = os.environ.get('INITIAL_VIDEO_STATUS', DEFAULT_INITIAL_VIDEO_STATUS)

    product_configs = read_products_from_sheet()
    video_configs = create_campaigns_sheet_data(product_configs, initial_video_status)
    clean_range(VIDEO_CONFIGS_RANGE)
    write_df_to_sheet(video_configs, VIDEO_CONFIGS_RANGE)
    return "OK"

def create_campaigns_sheet_data(video_configs: pd.DataFrame, initial_video_status:str):
    bases = read_bases()
    df_offer_types = read_offer_types()
    date = datetime.now().strftime('%d/%m/%Y, %H:%M:%S')

    data = pd.DataFrame(columns=['Date','AdsMetadata','VideoMetadata','Status','GeneratedVideo'])    

    video_groups = video_configs[['OfferGroup','OfferType','Id','Position']].groupby('OfferGroup')
    metadatas = video_groups.apply(lambda group: video_metadata_generator(group, bases, df_offer_types, date))

    data['VideoMetadata'] = metadatas
    data['Status'] = initial_video_status
    data['GeneratedVideo'] = ''
    data['Date'] = date
    data['AdsMetadata'] = ''
    return data

def video_metadata_generator(product_group, bases: pd.DataFrame, df_offer_types: pd.DataFrame, date:str):    
    products_label = PRODUCT_SHEET
    custom_dir = ''
    description = ''
    visibility = ''       
    offer_group = product_group['OfferGroup'].values[0]
    offer_type = product_group['OfferType'].values[0]
    template_json, base_video = get_video_metadata(offer_type, df_offer_types)

    timings = json.loads(bases[bases['Title']==base_video]['Products'].values[0])
    configs = []
    for row in product_group.to_dict(orient='records'):
        product_elements = json.loads(template_json)
        for el in product_elements:
            el['key'] = row['Id']
            position = int(row['Position'])
            el['start_time'] = timings[position-1]['start_time']
            el['end_time'] = timings[position-1]['end_time']
            configs.append(el)
    metadata = { 
        "name": offer_group,
        "base_video": base_video,
        "products_label": products_label,
        "configs": configs,
        "custom_dir": custom_dir,
        "description": description,
        "visibility": visibility,
        "date": date
    }
    return json.dumps(metadata)


def get_video_metadata(offer_type:str, df_offer_types: pd.DataFrame):
    df_offer_types = df_offer_types[df_offer_types['Title'] == offer_type]
    video_metadata =  df_offer_types.iloc[0]['Configs']
    base = df_offer_types.iloc[0]['Base']
    return video_metadata, base


def read_offer_types():
    return read_df_from_sheet(f'{OFFER_TYPES_SHEET}!A:C')

def read_bases():
    return read_df_from_sheet(f'{BASES_SHEET}!A:C')

def read_products_from_sheet():
    return read_df_from_sheet(PRODUCT_CONFIGS_RANGE)

