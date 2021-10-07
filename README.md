# Product Video Ads

<img src="https://github.com/google/product_video_ads/blob/main/logo.png" alt="PVA Logo" width="300"/>

Product Video Ads is an open-source solution that builds videos at scale, by reading
product data from Google Sheets or Google Merchant Center and generating videos
with product information (name, image, price) automatically. These videos are 
automatically uploaded to Youtube or Drive, and can be configured to Google Ads campaigns.

The integrated installer will setup the project on Google Cloud so
you are up and running right away.

## Requirements
You will need a **new** Google Cloud project and a user with at least **Editor (or Owner) role** to do the install.

Also ensure that '**Google Apps Script API**' is **ENABLED** for this user. You can enable it at: https://script.google.com/home/usersettings

*This user will be the owner of the newly generated Sheet and Drive folders. You can share these with other users after the installation is complete.*

## How to install
Installation is in 2 parts:

1. Setup the Authorization keys from the GCP UI
2. Run the installer

### Setup the Authorization Keys
You will need to create the following keys from the [GCP dashboard](https://console.cloud.google.com/):
1. An **OAuth Client Id for Web**
1. An **OAuth Client Id for Desktop**
1. An **API Key**

Instructions are as follows.

#### 1.Create an OAuth Client ID for a 'Web Application'
1. Go to ['APIs and Services' > 'Credentials'](https://console.cloud.google.com/apis/credentials/)
1. Click ['Create Credentials' > 'OAuth Client Id'](https://console.cloud.google.com/apis/credentials/oauthclient)
	- If you are asked to configure the '**OAuth Consent Screen**' follow the steps below. Otherwise continue with Step 3.
		- Enter an ‘App Name’ and a ‘User Support Email’.
		- Skip the optional fields and Save.
		- Go to [‘Apis & Services’ > ‘OAuth consent screen’](https://console.cloud.google.com/apis/credentials/consent) and set the following:
			- Publishing Status: **Testing**
			- User **Type: Internal**
		- *Consent screen configuraiton is now complete.* Go to ['APIs and Services' > 'Credentials' > 'Create Credentials' > 'OAuth Client Id'](https://console.cloud.google.com/apis/credentials/oauthclient) to continue configuring the client.
1. Configure your **OAuth Client Id for Web** as follows:
	- Application Type: `Web Application`
	- Name: `Web Client 1` *(or anything you prefer)*
	- Click 'Save'

#### 2.Create an OAuth Client ID for a 'Desktop app'
1. Go to ['APIs and Services' > 'Credentials'](https://console.cloud.google.com/apis/credentials/)
1. Click ['Create Credentials' > 'OAuth Client Id'](https://console.cloud.google.com/apis/credentials/oauthclient) and configure as follows:
	- Application Type: `Desktop app`
	- Name: `Desktop Client 1` *(or anything you prefer)*
1. Click 'Create'

#### 3.Create an API key
1. Go to ['APIs and Services' > 'Credentials'](https://console.cloud.google.com/apis/credentials/)
1. Click 'Create Credentials' > 'API Key'
1. Click 'Close'	

### Run the Installation Script
1. Open your project's [Cloud shell](https://console.cloud.google.com/?cloudshell=true).
1. Run the following:
	```bash
	git clone https://github.com/google/product_video_ads.git
	cd product_video_ads
	./install.sh
	```
1. Follow the on-screen instructions to complete the install.
1. **STOP**: Before you click on the AppEngine URL, add the URL to the authorized URIs section in the **Web OAuth Client ID** as follows:
	1. Go to ['APIs and Services' > 'Credentials'](https://console.cloud.google.com/apis/credentials/)
	1. Click on the name of your client under 'OAuth 2.0 Client IDs'
	1. Add the URI to `Authorized redirect URIs` and `Authorized Javascript Origins`
		- Your URL will be like this: `PROJECT_ID.REGION_ID.r.appspot.com` ([Ref](https://cloud.google.com/appengine/docs/standard/python/how-requests-are-routed)).
	1. Click 'Save'
1. **Installation is complete!** Click on the AppEngine URL to run your app.
	- **IMP**: Ensure cookies and pop-ups are allowed. Ref: [Allow pop-ups in Chrome](https://support.google.com/chrome/answer/95472?co=GENIE.Platform%3DDesktop&hl=en)

*Optional:* Check that your Spreadsheet has access to Google Merchant Center as follows:
1. [Optional] Navigate to _Tools_ > _Script Editor_ > _Settings (gear icon)_
	1. Update the GCP Project ID
	1. Test the Google Merchant Center connection by
		1. Add an ID on "Prices" tab in the format `<Google Merchant Center id>:<product id>` 
		1. Click _Merchant Center_ > _Run Now_
