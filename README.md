# Product Video Ads

## About

This solution was created by **gTech CSEs** and the main purpose it to **enable
retailers to use video ads for performance, advertising their products**.

PVA creates retail videos by connecting **Merchant Center products to a base
video** (which is basically a plain video with some blank spaces where dynamic
content will be placed). It **uploads generated video to Youtube and also create
video ad on Google Ads, keeping track of price changes automatically**!

That's Product Video Ads - and remember `This is not an officially supported
Google product`

## Resources

Installation and usage guide:
https://docs.google.com/presentation/d/1sNFNabBuJb2lrBoj92afVuoxSE5gCWXFYHLUYSEbav8

Template spreadsheet: https://docs.google.com/spreadsheets/d/1t1um9EkgxHeNyl0nEXpsFzjipfnZaclLR1BlBUqNBj4

Template assets folder:
https://drive.google.com/corp/drive/u/0/folders/1NA4mOJaLgEZRwbsyvOKJaPcybCI3_ZTf

Sales pitch:
https://docs.google.com/presentation/d/1ztn5WT472_MJzkmUy6J0ZkZc2rMJnsWyryfSSq9rWfk

Authenticator: https://product-video-ads-ext.appspot.com

## Project

It's composed by following folders:

-   **adscripts**: Google Ads scripts to manage AdGroups and video ads on MCC
-   **appscripts**: Google AppsScripts linked to configuration folder which
    tracks prices and load products from Merchant Center
-   **video-generator**: Python application which generates videos
-   **authenticator**: Simple AppEngine Flask webpage to authenticate user on
    Google Account and download token to be used by video-generator
