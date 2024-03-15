import functions_framework
import pandas as pd
from datetime import datetime
import json
from pva import *
import os


@functions_framework.http
def generate_video_configs(request):
    payload = request.get_json()
    print(payload)
    video_configs_sheet = payload.get('video_configs_sheet', os.environ.get('VIDEO_CONFIGS_SHEET'))
    product_sheet = payload.get('product_sheet', os.environ.get('PRODUCT_SHEET'))
    bases_sheet = payload.get('bases_sheet', os.environ.get('BASES_SHEET'))
    offer_types_sheet = payload.get('offer_types_sheet', os.environ.get('OFFER_TYPES_SHEET'))
    video_name_suffix = payload.get('video_name_suffix', os.environ.get('VIDEO_NAME_SUFFIX'))
    initial_video_status = payload.get('initial_video_status', os.environ.get('INITIAL_VIDEO_STATUS'))

    video_configs_range = f'{video_configs_sheet}!A1:ZZ'
    product_configs_range = f'{product_sheet}!A1:ZZ'
    offer_types_range = f'{offer_types_sheet}!A:C'
    bases_range = f'{bases_sheet}!A:C'

    product_configs = read_df_from_sheet(product_configs_range)
    bases = read_df_from_sheet(bases_range)
    offer_types = read_df_from_sheet(offer_types_range)

    video_configs = create_campaigns_sheet_data(
        product_configs, initial_video_status, video_name_suffix, product_sheet, offer_types, bases)

    clean_range(video_configs_range)
    write_df_to_sheet(video_configs, video_configs_range)
    return "OK"


def create_campaigns_sheet_data(video_configs: pd.DataFrame, initial_video_status: str, video_name_suffix: str, product_sheet: str, df_offer_types: pd.DataFrame, bases: pd.DataFrame):
    date = datetime.now().strftime('%d/%m/%Y, %H:%M:%S')

    data = pd.DataFrame(
        columns=['Date', 'AdsMetadata', 'VideoMetadata', 'Status', 'GeneratedVideo'])

    video_groups = video_configs[[
        'OfferGroup', 'OfferType', 'Id', 'Position']].groupby('OfferGroup')
    metadatas = video_groups.apply(
        lambda group: video_metadata_generator(group, bases, df_offer_types, date, product_sheet))

    data['VideoMetadata'] = metadatas
    data['Status'] = initial_video_status
    data['GeneratedVideo'] = ''
    data['Date'] = date
    data['AdsMetadata'] = video_groups.apply(
        lambda group: ads_metadata_generator(group, video_name_suffix))
    return data


def ads_metadata_generator(product_group, video_name_suffix: str):
    offer_group = product_group['OfferGroup'].values[0]
    postcode = offer_group.replace(video_name_suffix, '')
    return '{"postcode": "'+postcode+'"}'


def video_metadata_generator(product_group, bases: pd.DataFrame, df_offer_types: pd.DataFrame, date: str, product_sheet: str):
    products_label = product_sheet
    custom_dir = ''
    description = ''
    visibility = ''
    offer_group = product_group['OfferGroup'].values[0]
    offer_type = product_group['OfferType'].values[0]
    template_json, base_video = get_video_metadata(offer_type, df_offer_types)

    timings = json.loads(
        bases[bases['Title'] == base_video]['Products'].values[0])
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


def get_video_metadata(offer_type: str, df_offer_types: pd.DataFrame):
    df_offer_types = df_offer_types[df_offer_types['Title'] == offer_type]
    video_metadata = df_offer_types.iloc[0]['Configs']
    base = df_offer_types.iloc[0]['Base']
    return video_metadata, base
