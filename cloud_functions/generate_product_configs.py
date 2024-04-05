import functions_framework
import pandas as pd
import os
from pva import *

#DONE TODO: Herkunftsland
#DONE  TODO: Title, Herkunftsland longer than 23 letters -> ...
#DONE  TODO: Werbeartikelbezeichnung: line breaks <br/>
#DONE TODO: put dot into price_euros AS A STRING!

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
    ranking = ranking[ranking['postcode'].isin(
        markets['Postleitzahl'].astype(str).str.zfill(5))]
    video_configs = convert_ranking_to_video_configs(ranking)

    write_df_to_sheet(video_configs, product_configs_range, True)
    return "OK"


def convert_ranking_to_video_configs(ranking: pd.DataFrame):
    columns = ['Id', 'OfferGroup', 'OfferType',
               'Position'] + list(ranking.columns.values)
    configs = ranking
    configs['Id'] = configs['nan'].astype(
        str)+"_"+configs["postcode"].astype(str)
    configs['OfferType'] = config_value('OFFER_TYPE')
    # configs['Position'] = configs['rankingorder']
    configs['Position'] = configs.groupby(['postcode'])['postcode'].rank(method='first',ascending=True)
    configs['OfferGroup'] = configs['postcode'] + \
        config_value('VIDEO_NAME_SUFFIX')
    return configs[columns]


def get_product_ranking(df_offers: pd.DataFrame, df_ranking: pd.DataFrame):
    products_per_video = int(config_value('PRODUCTS_PER_VIDEO'))

    offers = df_offers.apply(transform_offer, axis=1, result_type="expand")
    #some anomaly that gets us multiple (same-valued) offers for the same nan. 'id' is to blame
    offers = offers.sort_values('nan').groupby(['nan']).agg('first').reset_index()
    #expand data format of ranking list
    ranking = pd.DataFrame(df_ranking['mediaCellList'].to_list())
    ranking["postcode"] = ranking["postcode"].astype('string')
    
    merged = ranking.merge(offers, how='left',on='nan')
    #avoid non-matching NaNs
    merged = merged.dropna()

    merged = merged.sort_values(['postcode', 'rankingorder']).groupby(
        ['postcode', 'rankingorder']).agg('first').reset_index()
    
    # #take top ranking products per postcode from those that have offer data
    merged = merged.groupby('postcode').head(products_per_video).reset_index(drop=True)
 
    return merged


def transform_offer(x):
    auslobungmittel = x.texts['Auslobungmittel'] if 'Auslobungmittel' in x.texts else ''
    auslobungkurz = x.texts['Auslobungkurz'] if 'Auslobungkurz' in x.texts else ''
    auslobung = auslobungmittel if auslobungmittel != '' else auslobungkurz

    amount = x.facets['amount'] if 'amount' in x.facets else ''
    baseprice = x.price['basePrice'] if 'basePrice' in x.price else ''
    drippedOffWeight = x.facets['DrippedOffWeight'] if 'DrippedOffWeight' in x.facets else ''
    refundtext = x.facets['RefundText'] if 'RefundText' in x.facets else ''

    produktDatei = '\n'.join([s for s in [auslobung, amount, baseprice,
                             refundtext, drippedOffWeight] if s is not None and s != ''])

    price = int(x.price['price'])
    priceEuro = str(int(price / 100))+'.'
    priceCents = price % 100
    priceOneDigit = price >= 1000

    length_limit = int(config_value('TITLE_LENGHT_LIMIT'))
    herkunftsland = x.texts['Herkunftsland'] if 'Herkunftsland' in x.texts else ''
    if len(herkunftsland) > length_limit:
        herkunftsland = herkunftsland[:length_limit] + '...'

    werbeartikelbezeichnung = x.texts['Werbeartikelbezeichnung'] if 'Werbeartikelbezeichnung' in x.texts else ''
    if len(werbeartikelbezeichnung) > length_limit:
        werbeartikelbezeichnung = werbeartikelbezeichnung[:length_limit] + '...'

    return {'nan': x.nan,
            'price': x.price['price'],
            'price_euro': priceEuro,
            'price_cents': f"{priceCents:02d}",
            'price_one_digit': priceOneDigit,
            'image_url': x.pictures[0]['url'].strip() if len(x.pictures) > 0 else '',
            'Herkunftsland': herkunftsland,
            'Werbeartikelbezeichnung': werbeartikelbezeichnung,
            'ProduktDatei': produktDatei,
            }


if __name__ == "__main__":
    generate_product_configs(None)
