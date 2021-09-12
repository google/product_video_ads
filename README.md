# Product Video Ads

<img src="https://github.com/google/product_video_ads/blob/main/logo.png" alt="PVA Logo" width="300"/>

Product Video Ads is an open-source solution to build videos at scale, by reading
product data from Google Sheets or Google Merchant Center and generating videos
with product information (name, image, price) automatically. These videos are 
automatically uploaded to Youtube or Drive, and can be configured to Google Ads campaigns.

The integrated installer will setup the project on Google Cloud so
you are up and running right away.

## Requirements
You will need a **new** Google Cloud project and a user with atleast **Editor (or Owner) role** to do the install.

*This user will be the owner of the newly generated Sheet and Drive folders. You can share these with other users after the installation is complete.*

## How to install
Installation is in 2 parts:

1. Create authorization keys from the GCP UI
2. Run the installer with them

### Setup the Keys
You will need to create an **API Key**, and **2x OAuth Client Ids (Web and Desktop)** from the [GCP dashboard](https://console.cloud.google.com/) as follows:

#### Create an OAuth Client ID as a **Web Application**
1. Go to ['APIs and Services' > 'Credentials'](https://console.cloud.google.com/apis/credentials/)
1. Click ['Create Credentials' > 'OAuth Client Id'](https://console.cloud.google.com/apis/credentials/oauthclient)
	1. **Configure the Consent Screen** *If this is the first time you're creating an OAuth client you will be asked to configure an **OAuth Consent Screen**. Configure as follows*:
		1. Enter an ‘App Name’ and a ‘User Support Email’.
		1. Skip the optional fields and Save.
		1. Go to [‘Apis & Services’ > ‘OAuth consent screen’](https://console.cloud.google.com/apis/credentials/consent) and set the following:
			- Publishing Status: **In production**
			- User **Type: External**
		1. *The consent screen is now configured.* Now go to 'APIs and Services' > 'Credentials' > 'Create Credentials' > 'OAuth Client Id'
1. Configure as follows:
	- Application Type: `Web Application`
	- Name: `Web Client 1` *(or anything you prefer)*
	- Add the AppEngine URL to `Authorized redirect URIs` and `Authorized Javascript Origins` in the Client ID. Your URL is 
	`PROJECT_ID.REGION_ID.r.appspot.com` ([Reference](https://cloud.google.com/appengine/docs/standard/python/how-requests-are-routed)). *If you don't know the exact URL, the installer script will tell you at the end of the install. Make sure you edit this client BEFORE launching the app*.

#### Create an OAuth Client ID as a **Desktop app**
1. Go to ['APIs and Services' > 'Credentials'](https://console.cloud.google.com/apis/credentials/)
1. Click ['Create Credentials' > 'OAuth Client Id'](https://console.cloud.google.com/apis/credentials/oauthclient) and configure as follows:
	- Application Type: `Desktop app`
	- Name: `Desktop Client 1` *(or anything you prefer)*
1. Click 'Create'

#### Create an API key
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
	- **IMP**: Before you click on the AppEngine URL, add it to `Authorized redirect URIs` and `Authorized Javascript Origins` in the **Web OAuth Client Id**.
1. **Installation is complete!** Click on the AppEngine URL to run your app.
	- **IMP**: Ensure cookies and pop-ups are allowed. Ref: [Allow pop-ups in Chrome](https://support.google.com/chrome/answer/95472?co=GENIE.Platform%3DDesktop&hl=en)

*Optional:* Check that your SpreadSheet has access to GMC as follows:
1. [Optional] Navigate to _Tools_ > _Script Editor_ > _Settings (gear icon)_
	1. Update the GCP Project ID
	1. Test the GMC connection by
		1. Add an ID on "Prices" tab in the format `<GMC id>:<product id>` 
		1. Click _Merchant Center_ > _Run Now_
