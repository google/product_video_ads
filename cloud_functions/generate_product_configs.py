import functions_framework
import pandas as pd
import os
from pva import *

@functions_framework.http
def generate_product_configs(request):
    
    product_configs_range = f"{config_value('PRODUCT_SHEET')}!A1:ZZ"

    print(f"reading offers from {config_value('OFFERS_JSON_FILE_PATH')}")
    offers = pd.read_json(config_value('OFFERS_JSON_FILE_PATH'))
    print(f"reading ranking from {config_value('RANKING_JSON_FILE_PATH')}")
    ranking = pd.read_json(config_value('RANKING_JSON_FILE_PATH'))
    print(f"reading markets from {config_value('MARKETS_CSV_FILE_PATH')}")
    markets = pd.read_csv(config_value('MARKETS_CSV_FILE_PATH'))

    ranking = get_product_ranking(offers, ranking)
    ranking = ranking[ranking['postcode'].isin(markets['Postleitzahl'].astype(str).str.zfill(5))]
    video_configs = convert_ranking_to_video_configs(ranking)

    write_df_to_sheet(video_configs, product_configs_range, True)
    return "OK"

def convert_ranking_to_video_configs(ranking: pd.DataFrame):
    columns = ['Id', 'OfferGroup', 'OfferType',
               'Position'] + list(ranking.columns.values)
    configs = ranking
    configs['Id'] = configs['nan']
    configs['OfferType'] = config_value('OFFER_TYPE')
    configs['Position'] = configs['rankingorder']
    configs['OfferGroup'] = configs['postcode'] + config_value('VIDEO_NAME_SUFFIX')
    return configs[columns]


def get_product_ranking(df_offers: pd.DataFrame, df_ranking: pd.DataFrame):
    products_per_video = int(config_value('PRODUCTS_PER_VIDEO'))

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
    generate_product_configs(None)