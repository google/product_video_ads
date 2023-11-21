import functions_framework
import pandas as pd
import os
from pva import *

DEFAULT_VIDEO_NAME_SUFFIX = '_test'


@functions_framework.http
def generate_product_configs(request):
    read_environment()
    request.args.get('video_name_suffix')
    global OFFERS_JSON_FILE_PATH
    OFFERS_JSON_FILE_PATH = os.environ.get('OFFERS_JSON_FILE_PATH')
    global MARKETS_CSV_FILE_PATH
    MARKETS_CSV_FILE_PATH = os.environ.get('MARKETS_CSV_FILE_PATH')
    global RANKING_JSON_FILE_PATH
    RANKING_JSON_FILE_PATH = os.environ.get('RANKING_JSON_FILE_PATH')

    ranking = get_product_ranking()
    video_configs = convert_ranking_to_video_configs(ranking)
    clean_range(PRODUCT_CONFIGS_RANGE)
    write_df_to_sheet(video_configs, PRODUCT_CONFIGS_RANGE)
    return "OK"


def read_environment():
    global PRODUCT_SHEET, VIDEO_NAME_SUFFIX, OFFER_TYPE, PRODUCTS_PER_VIDEO, PROJECT_ID, PRODUCT_CONFIGS_RANGE

    PRODUCT_SHEET = os.environ.get('PRODUCT_SHEET')
    VIDEO_NAME_SUFFIX = os.environ.get('VIDEO_NAME_SUFFIX')
    OFFER_TYPE = os.environ.get('OFFER_TYPE')
    PRODUCTS_PER_VIDEO = int(os.environ.get('PRODUCTS_PER_VIDEO'))
    PROJECT_ID = os.environ.get('GCP_PROJECT_ID')
    # global
    PRODUCT_CONFIGS_RANGE = f'{PRODUCT_SHEET}!A1:ZZ'


def convert_ranking_to_video_configs(ranking: pd.DataFrame):
    # column labels:    Id  OfferGroup  OfferType   Position        Title   Image   Price   ...
    # fields:           nan video_title offer_type  rankingorder    Title   picture price   ...
    columns = ['Id', 'OfferGroup', 'OfferType',
               'Position'] + list(ranking.columns.values)
    configs = ranking
    configs['Id'] = configs['nan']
    configs['OfferType'] = OFFER_TYPE
    configs['Position'] = configs['rankingorder']
    configs['OfferGroup'] = configs['postcode']+VIDEO_NAME_SUFFIX
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
    # ranking = ranking.filter(
    #     ['nan', 'postcode', 'rankingorder', 'title', 'picture', 'price'])
    ranking = ranking.sort_values(['postcode', 'rankingorder']).groupby(
        ['postcode', 'rankingorder']).agg('first').groupby('postcode').head(PRODUCTS_PER_VIDEO).reset_index()
    ranking = ranking[(ranking.groupby(
        'postcode').rankingorder.transform('count') == PRODUCTS_PER_VIDEO)]
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


if __name__ == "__main__":
    load_local_environment()
    generate_product_configs(None)
