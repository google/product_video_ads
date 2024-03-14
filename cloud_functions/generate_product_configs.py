import functions_framework
import pandas as pd
import os
from pva import *

# TODO generate only videos for postcodes that HAVE A MARKET


@functions_framework.http
def generate_product_configs(request):
    args = request.args
    video_name_suffix = args.get(
        'video_name_suffix', default=os.environ.get('VIDEO_NAME_SUFFIX'), type=str)
    offers_json_file_path = args.get(
        'offers_json_file_path', default=os.environ.get('OFFERS_JSON_FILE_PATH'), type=str)
    ranking_json_file_path = args.get(
        'ranking_json_file_path', default=os.environ.get('RANKING_JSON_FILE_PATH'), type=str)
    markets_csv_file_path = args.get(
        'markets_csv_file_path', default=os.environ.get('MARKETS_CSV_FILE_PATH'), type=str)
    product_sheet = args.get(
        'product_sheet', default=os.environ.get('PRODUCT_SHEET'), type=str)
    offer_type = args.get(
        'offer_type', default=os.environ.get('OFFER_TYPE'), type=str)
    products_per_video = args.get(
        'products_per_video', default=int(os.environ.get('PRODUCTS_PER_VIDEO')), type=int)

    product_configs_range = f'{product_sheet}!A1:ZZ'

    offers = pd.read_json(offers_json_file_path)
    ranking = pd.read_json(ranking_json_file_path)
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


if __name__ == "__main__":
    from werkzeug.datastructures import ImmutableMultiDict
    load_local_environment()
    request = Request()
    request.args = ImmutableMultiDict([
        # ('offers_json_file_path', 'https://hop-wmam.paas.rewe.local/offers/2024/10'),
        # ('ranking_json_file_path', 'https://storage.cloud.google.com/wam-wmps-prod-hop-ranking/2024/10/ranking.json')
    ])
    generate_product_configs(request)
