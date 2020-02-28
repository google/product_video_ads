# Product Video Ads

## About

This solution was created by **gTech CSEs** and the main purpose it to **enable
retailers to use video ads for performance, advertising their products**.

PVA creates videos by connecting any product feed to a base
video (which is basically a plain video with some blank spaces where dynamic
content will be placed). It **uploads generated video to Youtube and also create
video ad on Google Ads, keeping track of price changes automatically**!

Note that "product feed" may be anything as long it's integrated to the configuration spreadsheet.
The one integration already available is **Merchant Center products** retrieve using Content API, which makes it a lot easier to retailers to create their videos!

That's Product Video Ads - and remember `This is not an officially supported
Google product.`

## Resources

Installation and usage guide:
https://docs.google.com/presentation/d/1cfPnbv_4WRU4dfzzzJZqEkmqPg9hSzL30xuAwTPOcSQ

## Project

It's composed by following folders:

-   **adscripts**: Google Ads scripts to manage AdGroups and video ads on MCC
-   **appscripts**: Google AppsScripts linked to configuration folder which
    tracks prices and load products from Merchant Center
-   **video-generator**: Python application which generates videos
-   **pva-frontend**: Web interface to manage all configuration (using Spreadsheet as database)
-   **authenticator**: Simple AppEngine Flask webpage to authenticate user on
    Google Account and download token to be used by video-generator
