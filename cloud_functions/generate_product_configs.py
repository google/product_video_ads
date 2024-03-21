import functions_framework
import pandas as pd
import os
from pva import *

@functions_framework.http
def generate_product_configs(request):
    payload = request.get_json()
    print(payload)
    video_name_suffix = payload.get('video_name_suffix', os.environ.get('VIDEO_NAME_SUFFIX'))
    offers_json_file_path = payload.get('offers_json_file_path', os.environ.get('OFFERS_JSON_FILE_PATH'))
    ranking_json_file_path = payload.get('ranking_json_file_path', os.environ.get('RANKING_JSON_FILE_PATH'))
    markets_csv_file_path = payload.get('markets_csv_file_path', os.environ.get('MARKETS_CSV_FILE_PATH'))
    product_sheet = payload.get('product_sheet', os.environ.get('PRODUCT_SHEET'))
    offer_type = payload.get('offer_type', os.environ.get('OFFER_TYPE'))
    products_per_video = int(payload.get('products_per_video', os.environ.get('PRODUCTS_PER_VIDEO')))

    product_configs_range = f'{product_sheet}!A1:ZZ'

    print(f"reading offers from {offers_json_file_path}")
    offers = pd.read_json(offers_json_file_path)
    print(f"reading ranking from {ranking_json_file_path}")
    ranking = pd.read_json(ranking_json_file_path)
    print(f"reading markets from {markets_csv_file_path}")
    markets = pd.read_csv(markets_csv_file_path)

    ranking = get_product_ranking(products_per_video=products_per_video,
                                  df_offers=offers,
                                  df_ranking=ranking)
    ranking = ranking[ranking['postcode'].isin(markets['Postleitzahl'].astype(str).str.zfill(5))]
    video_configs = convert_ranking_to_video_configs(
        ranking, offer_type, video_name_suffix)

    clean_range(product_configs_range)
    write_df_to_sheet(video_configs, product_configs_range)
    return "OK"

def convert_ranking_to_video_configs(ranking: pd.DataFrame, offer_type: str, video_name_suffix: str):
    columns = ['Id', 'OfferGroup', 'OfferType',
               'Position'] + list(ranking.columns.values)
    configs = ranking
    configs['Id'] = configs['nan']
    configs['OfferType'] = offer_type
    configs['Position'] = configs['rankingorder']
    configs['OfferGroup'] = configs['postcode']+video_name_suffix
    return configs[columns]


def get_product_ranking(products_per_video: int, df_offers: pd.DataFrame, df_ranking: pd.DataFrame):

    offers = df_offers.apply(transform_offer, axis=1, result_type="expand")
    # price, kg/liter price, crossoutprice
    ranking = pd.DataFrame(df_ranking['mediaCellList'].to_list())
    ranking["postcode"] = ranking["postcode"].astype('string')
    # TODO pin down selection logic for same-ranking products
    # TODO drop this after logic is clear
    ranking = ranking.sort_values(['postcode', 'rankingorder']).groupby(
        ['postcode', 'rankingorder']).agg('first').groupby('postcode').head(products_per_video).reset_index()
    ranking = ranking.merge(offers, how='left', on='nan')
    ranking = ranking.dropna()
    # ranking = ranking.filter(
    #     ['nan', 'postcode', 'rankingorder', 'title', 'picture', 'price'])
    ranking = ranking.sort_values(['postcode', 'rankingorder']).groupby(
        ['postcode', 'rankingorder']).agg('first').groupby('postcode').head(products_per_video).reset_index()
    ranking = ranking[(ranking.groupby(
        'postcode').rankingorder.transform('count') == products_per_video)]
    return ranking


def transform_offer(x):
    return {'nan': x.nan,
            'id': x.id,
            'revision': x.revision,
            'price': x.price['price'],
            'crossOutPrice': x.price['crossOutPrice'],
            'advantage': x.price['advantage'],
            'title': x.texts['Werbeartikelbezeichnung'],
            'image_url': x.pictures[0]['url'].strip() if len(x.pictures) > 0 else '',
            'revision': x.revision,
            'Auslobung': x.texts['Auslobungmittel'] if 'Auslobungmittel' in x.texts else x.texts['Auslobungkurz'] if 'Auslobungkurz' in x.texts else '',
            'refundText': x.facets['RefundText'] if 'RefundText' in x.facets else '',
            'Werbeartikelbezeichnung': x.texts['Werbeartikelbezeichnung'] if 'Werbeartikelbezeichnung' in x.texts else ''
            }

