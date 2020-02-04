# Video Generator

Application responsible to create retail videos by joining Merchant Center
products to a base video. It also uploads output video to Youtube so it can be
used as video ad.

*It's part of Product Video Ads solution alongside with Ads Script and App
Script (glued to configuration Spreadsheet)*

`Disclaimer: This is not an officially supported Google product`

## Requirements

It runs in a Docker image, so all you need is:

-   Docker installed and running (you want to use GCP for that)
-   Cloud SDK (https://cloud.google.com/sdk/downloads)

You may also run it in your machine, but you'll need:

-   Python 2.7 (with pipenv installed)
-   convert tool (from ImageMagick) version 7.0 installed
-   ffmpeg (zip included on project)

## Setup

Please, follow instructions to installation and configuration here:
https://docs.google.com/presentation/d/1sNFNabBuJb2lrBoj92afVuoxSE5gCWXFYHLUYSEbav8

## Running on Google Cloud Platform

    Run `run-cloud.sh` and follow the steps!

## Example

You can refer to a sample spreadsheet on
https://docs.google.com/spreadsheets/d/1-PiSw4B6mvBqRIVwQJC2JGVEXqgDG_KA2p0YgHcWg60/edit#gid=6031590

## Limitations

Be aware that some services and APIs used by this solution may hit their limits
or usage quotas. Please read carefully datails bellow and, in some cases, you
might want to ask for a quota raise.

For example, regular Youtube Data API quota allows you to upload around 7
videos/day, which may not be enough for most use-cases, so fill your request for
quota raise right away.

### Video-generator

It's not recommended to create more than **1000 videos** in a single instance.

### Sheets API

You probably won't hit quotas here, but be sure to understand limits:

https://developers.google.com/sheets/api/limits

### Youtube Data API

As explained above, you probably want to increase your quota here:

https://developers.google.com/youtube/v3/getting-started#quota

### Merchant Center Content API

Altough this API is used only by App Script checking prices, you might check it
out:

https://developers.google.com/shopping-content/v2/order-limits

### Google Ads

Check out campaigns, adGroups and ads limits for Google Ads accounts. You
probably won't need to worry about it!

https://support.google.com/google-ads/answer/6372658?hl=en
