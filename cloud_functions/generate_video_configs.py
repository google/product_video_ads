import functions_framework
import pandas as pd
from datetime import datetime
import json
from pva import *
import os


@functions_framework.http
def generate_video_configs(request):
    video_configs_range = f"{config_value('VIDEO_CONFIGS_SHEET')}!A1:ZZ"
    product_configs_range = f"{config_value('PRODUCT_SHEET')}!A1:ZZ"
    offer_types_range = f"{config_value('OFFER_TYPES_SHEET')}!A:C"
    bases_range = f"{config_value('BASES_SHEET')}!A:C"

    product_configs = read_df_from_sheet(product_configs_range)
    bases = read_df_from_sheet(bases_range)
    offer_types = read_df_from_sheet(offer_types_range)

    video_configs = create_campaigns_sheet_data(product_configs, offer_types, bases)

    clean_range(video_configs_range)
    write_df_to_sheet(video_configs, video_configs_range)
    return "OK"


def create_campaigns_sheet_data(video_configs: pd.DataFrame, df_offer_types: pd.DataFrame, bases: pd.DataFrame):
    date = datetime.now().strftime('%d/%m/%Y, %H:%M:%S')

    data = pd.DataFrame(
        columns=['Date', 'AdsMetadata', 'VideoMetadata', 'Status', 'GeneratedVideo'])

    video_groups = video_configs[[
        'OfferGroup', 'OfferType', 'Id', 'Position']].groupby('OfferGroup')
    metadatas = video_groups.apply(
        lambda group: video_metadata_generator(group, bases, df_offer_types, date, config_value('PRODUCT_SHEET')))

    data['VideoMetadata'] = metadatas
    data['Status'] = config_value('INITIAL_VIDEO_STATUS')
    data['GeneratedVideo'] = ''
    data['Date'] = date
    data['AdsMetadata'] = video_groups.apply(
        lambda group: ads_metadata_generator(group, config_value('VIDEO_NAME_SUFFIX')))
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
if __name__ == "__main__":
    generate_video_configs(None)