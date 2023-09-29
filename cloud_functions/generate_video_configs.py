import pandas as pd
import pva_util
from datetime import datetime
import json

#env
INITIAL_VIDEO_STATUS = 'Preview'
VIDEOS_SHEET = 'Campaigns'
PRODUCT_SHEET = 'Prices'
BASES_SHEET = 'Bases'
OFFER_TYPES_SHEET = 'OfferTypes'
OFFER_TYPE = 'Sparkle'

#global
PRODUCT_CONFIGS_RANGE = f'{PRODUCT_SHEET}!A1:ZZ'
VIDEO_CONFIGS_RANGE = f'{VIDEOS_SHEET}!A1:ZZ'

def main():
    generate_video_configs()

def generate_video_configs():
    product_configs = read_products_from_sheet()
    video_configs = create_campaigns_sheet_data(product_configs)
    pva_util.clean_range(VIDEO_CONFIGS_RANGE)
    pva_util.write_df_to_sheet(video_configs, VIDEO_CONFIGS_RANGE)

def create_campaigns_sheet_data(video_configs: pd.DataFrame):
    video_config_template_json, base_video = get_video_metadata()
    bases = read_bases()
    timings = json.loads(bases[bases['Title']==base_video]['Products'].values[0])
    date = datetime.now().strftime('%d/%m/%Y, %H:%M:%S')

    data = pd.DataFrame(columns=['Date','AdsMetadata','VideoMetadata','Status','GeneratedVideo'])    

    video_groups = video_configs[['OfferGroup','Id','Position']].groupby('OfferGroup')
    metadatas = video_groups.apply(lambda group: video_metadata_generator(group, timings,video_config_template_json, base_video, date))

    data['VideoMetadata'] = metadatas
    data['Status'] = INITIAL_VIDEO_STATUS
    data['GeneratedVideo'] = ''
    data['Date'] = date
    data['AdsMetadata'] = ''
    return data

def video_metadata_generator(product_group, timings, template_json:str, base_video:str, date:str):
    products_label = PRODUCT_SHEET
    custom_dir = ''
    description = ''
    visibility = ''       
    offerGroup = product_group['OfferGroup'].values[0]
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
        "name": offerGroup,
        "base_video": base_video,
        "products_label": products_label,
        "configs": configs,
        "custom_dir": custom_dir,
        "description": description,
        "visibility": visibility,
        "date": date
    }
    return json.dumps(metadata)


def get_video_metadata():
    df_offerTypes = read_offer_types()
    df_offerTypes = df_offerTypes[df_offerTypes['Title'] == OFFER_TYPE]
    video_metadata =  df_offerTypes.iloc[0]['Configs']
    base = df_offerTypes.iloc[0]['Base']
    return video_metadata, base


def read_offer_types():
    return pva_util.read_df_from_sheet(f'{OFFER_TYPES_SHEET}!A:C')

def read_bases():
    return pva_util.read_df_from_sheet(f'{BASES_SHEET}!A:C')

def read_products_from_sheet():
    return pva_util.read_df_from_sheet(PRODUCT_CONFIGS_RANGE)

if __name__ == "__main__":
    main()


