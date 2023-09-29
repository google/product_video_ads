import pandas as pd
import pva_util as pva_util
import os
#env
VIDEO_NAME_SUFFIX = '_test'
PRODUCT_SHEET = 'Prices'
OFFER_TYPE = 'Sparkle'
PRODUCTS_PER_VIDEO = 2
OFFERS_JSON_FILE_PATH = '2023_32_offers.json'
MARKETS_JSON_FILE_PATH = 'Marktliste.csv'
RANKING_JSON_FILE_PATH = '2023_32_ranking.json'

#global
PRODUCT_CONFIGS_RANGE = f'{PRODUCT_SHEET}!A1:ZZ'

def main():
    generate_product_configs()

def generate_product_configs():
    ranking = get_product_ranking()
    video_configs = convert_ranking_to_video_configs(ranking)
    pva_util.clean_range(PRODUCT_CONFIGS_RANGE)
    pva_util.write_df_to_sheet(video_configs,PRODUCT_CONFIGS_RANGE)

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
    return pd.read_csv(MARKETS_JSON_FILE_PATH)


def read_ranking():
    return pd.read_json(RANKING_JSON_FILE_PATH)

if __name__ == '__main__':
    main()
