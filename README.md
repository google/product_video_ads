# Product Video Ads

Product Video Ads is a solution to build video Ads at scale, by reading data
from a feed (e.g. Merchant Center feed, Spreadsheet, etc) and rendering videos
with price, product name and images variations, automatically uploading
them to Youtube, and configuring Google Ads campaigns.

The solution is intended to run on top of Google Cloud's infrastructure, so
that you don't have to worry abount setting up too many different pieces in
order to get it up and running.

## Pre-requisites

Please ensure that you have the following in place within your GCP Project before running the installation:

* Configure an OAuth Consent Screen
	* Go to _Apis & Services_ > _OAuth consent screen_ and set the following:
		* `Publishing Status: In production`
		* `User Type: External`
* Create an OAuth Client ID as a Web Application
	* Add the AppEngine URL to `Authorized redirect URIs` and `Authorized Javascript Origins` in the Client ID. Your URL is 
	`PROJECT_ID.REGION_ID.r.appspot.com` ([Reference](https://cloud.google.com/appengine/docs/standard/python/how-requests-are-routed)) 
	* Once you finish deployment make sure the provided url matches the one you entered here
	* Copy the Client ID and Client Secret (we will need this later)
* Create an API key and copy the key
* Create an OAuth Client ID as a Desktop app
	* Copy the Client ID and Client Secret (we will need this later)
* Request access to the templates - [Config sheet](https://docs.google.com/spreadsheets/d/1JAGj6lpR1Ghz943fzBF3SMEuxxMn8aiY77GVNKdP_9Q/edit?resourcekey=0-ht2AXur6faTs_Jt6vUJgaQ#gid=6031590) and [Drive folder](https://drive.google.com/drive/u/0/folders/1fG2pUo5obYJDkZmyoxhjVc_h9-WuW5Xr)
	* [Optional] Create a copy of both in your Google Drive

## Installation

1. Clone this repository into your GCP project by running
	`git clone https://github.com/google/product_video_ads.git`
2. Once cloned succesfully, run `install.sh`
3. The script will install the frontend first, enter the **Web** OAuth Client ID and secret when prompted
	* Follow the on-screen instructions to continue the installation
4. When prompted for Spreadsheet ID, 
	* Navigate to the UI link from the previous step (ensure cookies and pop-ups are allowed)
	* Generate a new spreadsheet ID using the web interface, or use the id of a copy of the Config template
	* Ensure that the Service Account has access to spreadsheet and Drive folder