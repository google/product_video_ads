# Product Video Ads

<img src="https://github.com/google/product_video_ads/blob/main/logo.png" alt="PVA Logo" width="300"/>

Product Video Ads is an open-source solution that builds videos at scale, by reading
product data from Google Sheets or Google Merchant Center and generating videos
with product information (name, image, price) automatically. These videos are 
automatically uploaded to YouTube or Drive, and can be configured to Google Ads campaigns.

The integrated installer will setup the project on Google Cloud so
you are up and running right away.

## How does it work?

1. PVA works with a base-video, which is a template for the offers video. The average market video consists of an introduction, offers and closing, as described in the image below: 

    ![PVA Example](images/pva_example.png?raw=true "PVA Example")

1. After you have selected a base-video you just need to configure your offers inside PVA, using your feed as in the example below:

    [![PVA Demo](https://img.youtube.com/vi/nTVo8WQ99h4/0.jpg)](https://www.youtube.com/watch?v=nTVo8WQ99h4)

1. Then, you can upload your video to YouTube and it can be used as a Google Ad. Updating your video in PVA will update the Ad automatically. Here's one example of a video ad generated with PVA:

    [![Carrefour Brasil - PVA Video](images/pva_carrefour_example.png?raw=true)](https://www.youtube.com/watch?v=xk8hqo1lZbk&t)

## Requirements

1. A Google Cloud Project with a user with Owner or Editor permissions (the installation will be on Cloud Shell)

2. [Apps Script enabled](https://script.google.com/home/usersettings) for the user involved on the deployment (can be a different user from the GCP)

3. Access to your account or Brand Account. It's important to fetch the emails related to the deployment. If you are using a Brand Account, you need to be the Brand Account Manager or Owner (the steps to fetch your brand account email is on the video)

#### 1. GCP Configuration

1. Go to ['APIs and Services' > 'OAuth Consent Screen'](https://console.cloud.google.com/apis/credentials/consent)
	- **Type**: External (if using brand account), otherwise Internal
	- **App name**: The name of your PVA Application that will show up on the screen, e.g.: pva-video-upload
	- **Developer contact info**: Your development email
	- **Scopes**: Click 'Save and Continue'
	- **Test Users**: Add the emails that you are going to use for PVA (Brand Account included)
	- Click 'Save and Continue'
1. Go to ['APIs and Services' > Credentials](https://pantheon2.corp.google.com/apis/credentials)
	- Click 'Create Credentials > API Key' which will generate a new key related to your GCP Project ID
	- Click 'Create Credentials > OAuth Client Id':
		- **Application type**: 'Web Application'
		- **Name**: pva-web
		- **Authorized JavaScript Origins**: 'https://\<your_project_id\>.\<your_region\>.r.appspot.com'
		- **Authorized Redirect URIs**: 'https://\<your_project_id\>.\<your_region\>.r.appspot.com'
		- Click 'Create'
	- Click 'Create Credentials > OAuth Client Id'
		- **Application type**: 'Desktop Application'
		- **Name**: pva-desktop
		- **Authorized JavaScript Origins**: 'https://\<your_project_id\>.\<your_region\>.r.appspot.com'
		- **Authorized Redirect URIs**: 'https://\<your_project_id\>.\<your_region\>.r.appspot.com'
		- Click 'Create'

#### 2. Run the Installation Script

Just for example, lets suppose that we have: manager@gmail.com and brand_account@gmail.com

1. Open your project's [Cloud shell](https://console.cloud.google.com/?cloudshell=true).
1. Run the following:
	```bash
	git clone https://github.com/google/product_video_ads.git
	cd product_video_ads
	./install.sh
	```
1. On first execution, it will enable the required APIs for your GCP Project: Drive, Sheets, YouTube and more. So, click Authorize.
1. Your configuration choices made during the installation process are saved in `pva.conf` in case you need to re-run the installation. If you run into any problems, you can edit or delete this file with values of your choice. An example file is provided for reference or as a starting point (if you deploy to EU)
1. [Desktop Credentials] Enter your Desktop Client ID and Client Secret, configured on Step 2 of the previous section ('pva-desktop')
1. It will ask you for your Spreadsheet ID. If you don't have one, just leave it blank (it will be created)
1. Ensure that Google Apps Script API is ENABLED for the deployment user in the [Apps Script Settings](https://script.google.com/home/usersettings), then press Enter
1. Click on the URL. When selecting your account, remember that **you CAN'T use your brand account on this step**, because it will create your Drive and Sheets and it must be attached with an account that you can access, so we are going to use as example: manager@gmail.com. Then, allow everything that is prompted
	- After selecting your account, you will see a `ERR_CONNECTION_REFUSED`, which is expected. Just copy the full localhost URL (it will look like: 'http://localhost:8080/?state=...') and paste it into the terminal.
1. If everything is configured correctly, you will see your Drive and Sheets being created
1. You will be prompted to use GCS if you want. If not, just leave it blank - PVA will use Google Drive as storage
1. Now, you need to choose the GCP Region and Zone you want to use. You can use the default `us-central1-a`, or enter the full Zone name (Region will be inferred from that)
1. Next, in case you want to use Google Container Registry different from the default one (**gcr.io** which sits in US), enter it to the prompt. Europe uses **eu.gcr.io** but the default should work for most installations. Leave blank for default
1. [Web Credentials] Now, enter your Web Client ID (in this example we have created it as 'pva-web'. If you are using a Brand Account give access to Drive and Sheets on this account, like brand_account@gmail.com
1. Enter your API Key (not the Web Client ID Secret)
1. Now the frontend will be deployed on App Engine and a GKE Cluster will be created (this will take some time)
1. For the backend part (GKE), if it's the first time, PVA might throw an error 'Secret Not Found', which is okay. PVA requires another authentication to upload to YouTube (if necessary). Follow the same steps when prompted with a URL:
	- After selecting your account, you will see a `ERR_CONNECTION_REFUSED`, which is expected. Just copy the full localhost URL (it will look like: 'http://localhost:8080/?state=...'') and paste it into the terminal.
1. If everything passes without errors, **Congratulations! The installation is complete.** 
	- Click on the App Engine URL to run your app. And use the Sheet's ID prompted to log in
	- **IMP**: Ensure cookies and pop-ups are allowed ([Allow pop-ups in Chrome](https://support.google.com/chrome/answer/95472?co=GENIE.Platform%3DDesktop&hl=en))
	- You should see this screen: ![PVA Frontend](images/pva_frontend.png?raw=true "PVA Frontend")
	- After logging in, try to generate the video and upload it to YouTube. If anything fails, please see our [Troubleshooting](#troubleshoot) section

#### 3. Test

1. After login, go to Generate > Select Base Example > Price

    ![PVA Video Config](images/pva_video_config_0.png?raw=true "PVA Video Config")

1. To test the Youtube Upload, click Create One (YouTube)

    ![PVA Video Config](images/pva_video_config_1.png?raw=true "PVA Video Config")

1. To test, set:

    **Offer Type**: My Test

    **Product**: Your Product Name

    **All other fields**: Leave blank

1. Click 'Create Asset'

    ![PVA Video Config](images/pva_video_config_2.png?raw=true "PVA Video Config")

1. On Generator Logs, you can click on 'Update' to see PVA processing on GKE. And in Assets, you can see your video status.

    ![PVA Video Config](images/pva_video_status.png?raw=true "PVA Video Config")

## Troubleshoot

Kubernetes:
```bash
gcloud container clusters get-credentials video-generator-cluster --zone us-west1-a
kubectl get pods
```

If the Pod status is different from 'Running', use:

```bash
kubectl logs <pod_name>
kubectl describe pod <pod_name>
```

Common errors are lack of permission and permission denied when accessing Sheets and Drive. If you encounter more errors and have solved them, feel free to contribute.

## Contribute

PVA is an open-source project, so you can help us improve the application! Every push will trigger a CI/CD application which we will verify its integrity. Aafter that, if everything is fine, we are going to merge your pull request :)

*Optional:* Check that your Spreadsheet has access to Google Merchant Center as follows:
1. [Optional] Navigate to _Tools_ > _Script Editor_ > _Settings (gear icon)_
	1. Update the GCP Project ID
	1. Test the Google Merchant Center connection by
		1. Add an ID on "Prices" tab in the format `<Google Merchant Center id>:<product id>` 
		1. Click _Merchant Center_ > _Run Now_
