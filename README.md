# Product Video Ads

<img src="https://github.com/google/product_video_ads/blob/main/logo.png" alt="PVA Logo" width="300"/>

Product Video Ads is an open-source solution that builds videos at scale, by reading
product data from Google Sheets or Google Merchant Center and generating videos
with product information (name, image, price) automatically. These videos are 
automatically uploaded to Youtube or Drive, and can be configured to Google Ads campaigns.

The integrated installer will setup the project on Google Cloud so
you are up and running right away.

## How does it work?

1 - PVA works with a base_video, which is a template for the offers video. The average market video consists of a introduction, offers and closing. As described in the image below: 

![PVA Example](images/pva_example.png?raw=true "PVA Example")

2 - So, after you have selected a base_video you just need to configurate your offers inside PVA, using your feed (it can be Merchant Center's) as in the example below:

![PVA Demo](images/pva_demo.gif?raw=true "PVA Demo")

3 - Then, you can upload your video to youtube and it can be used as a Google Ad, after you update your video on PVA, it update the Ad automatically. This is one example of a video ad generated with PVA:

[![Carrefour Brasil - PVA Video](images/pva_carrefour_example.png?raw=true)](https://www.youtube.com/watch?v=xk8hqo1lZbk&t)
## Requirements

See the tutorial video (deprecated): https://www.youtube.com/watch?v=n31ORQGDhRc

1. A Google Cloud Project, with a user with Owner or Editor permissions, the installation will be on Cloud Shell
2. Apps Script enabled for the user involved on the deployment (can be a different user from the GCP) it can be done here: https://script.google.com/home/usersettings
3. Access to your account or Brand Account, it's important to fetch the emails related to the deployment, if you are using a Brand Account, you need to be the Brand Account Manager or Owner (the steps to fetch your brand account email is on the video)

## How to install

See the tutorial video (deprecated): https://www.youtube.com/watch?v=n31ORQGDhRc

#### 1. GCP Configuration
1. Go to ['APIs and Services' > 'OAuth Consent Screen'](https://console.cloud.google.com/apis/credentials/consent)
	- On type select: External (if using brand account), otherwise, use Internal
	- App name: The name of your PVA Application that will show on the screen, eg: pva-video-upload
	- Developer contact info: Your development email
	- On Scopes click on Save and Continue
	- On Test Users, add the emails that you are going to use on pva (brand account included)
	- Click on Save and Continue
2. Go to ['APIs and Services' > Credentials](https://pantheon2.corp.google.com/apis/credentials)
	- Click "Create Credentials > API Key", it will generate a new key related to your GCP Project Id
	- Click "Create Credentials > OAuth Client Id":
		- On application type: "Web Application"
		- Name: pva-web
		- Authorized Javascript Origins: "https://your_project_id.your_region.r.appspot.com" (in the video case the Id and Name were equals)
		- Authorized Redirect URIs: "https://your_project_id.your_region.r.appspot.com" (in the video case the Id and Name were equals)
		- Click Create
	- Click "Create Credentials > OAuth Client Id":
		- On application type: "Desktop Application"
		- Name: pva-desktop
		- Authorized Javascript Origins: "https://your_project_id.your_region.r.appspot.com" (in the video case the Id and Name were equals)
		- Authorized Redirect URIs: "https://your_project_id.your_region.r.appspot.com" (in the video case the Id and Name were equals)
		- Click Create	

#### 2. Run the Installation Script

Just for example, lets suppose that we have: manager@gmail.com and brand_account@gmail.com

1. Open your project's [Cloud shell](https://console.cloud.google.com/?cloudshell=true).
2. Run the following:
	```bash
	git clone https://github.com/google/product_video_ads.git
	cd product_video_ads
	./install.sh
	```
3. The first execution, it will enable the required API's for your GCP Project: Drive, Sheets, Youtube and more. So, click in Authorize.
4. Then it will ask you for your Spreadsheet Id, if you don't have one, just leave it blank (it will be created).
5. Ensure that Google Apps Script API is ENABLED for the deployment user in https://script.google.com/corp/home/usersettings, then press enter.
6. [Desktop Credentials] Enter your Desktop Client Id and Client Secret, configured on Step 2 which we called "pva-desktop"
7. Click on the URL, when selecting your account, remeber that you **CAN'T use your brand account on this step**, because it will create your Drive and Sheets and it must be attached which a account that you can access, so we are going to use as example: manager@gmail.com, then, allow everything that is prompted
	- After selecting your account, you will see a ERR_CONNECTION_REFUSED, but this is correct, copy the full localhost url (it will look like: "http://localhost:8080/?state=...") and paste it on the terminal.
8. If everything is configured correctly, you will see your Drive and Sheets being created.
9. You will be prompted to use GCS if you want, if not, just leave it blank. 
10. [Web Credentials] Now, enter your web client id, in this example we have create with the name "pva-web", if you are using a brand account give access to drive and sheets on this account, like brand_account@gmail.com.
11. Enter your API Key (it's not the web client id secret)
10. Now the frontend will be deployed on app engine and GKE will be created (this will take some time)
11. [Desktop Credentials] Use your Desktop Client ID and Secret (the same used on step 6) as it is prompted, on the OAuth screen, choose the account that you want to do the upload (remeber that it must have access to Sheets and Drive), in the example case, we are using the brand account
	- After selecting your account, you will see a ERR_CONNECTION_REFUSED, but this is correct, copy the full localhost url (it will look like: "http://localhost:8080/?state=...") and paste it on the terminal.
12. If everything pass withou errors, **Congratulations the installation is complete!** 
	- Click on the AppEngine URL to run your app. And use the Sheet's Id prompted to Log-in
	- **IMP**: Ensure cookies and pop-ups are allowed. Ref: [Allow pop-ups in Chrome](https://support.google.com/chrome/answer/95472?co=GENIE.Platform%3DDesktop&hl=en)
	- You should see this screen: ![PVA Frontend](images/pva_frontend.png?raw=true "PVA Frontend")
	- After the login, try to generate the video and upload it to youtube, if nothing happens as in the video, see our Troubleshooting section

#### 3. Test

1. After your login, go to Generate > Select Base Example > Price

![PVA Video Config](images/pva_video_config_0.png?raw=true "PVA Video Config")

2. Now, to test the Youtube Upload, click Create One (Youtube)

![PVA Video Config](images/pva_video_config_1.png?raw=true "PVA Video Config")

3. To test, only select Offer Type: My Test and Product: Your Product Name, the other fields leave it blank

4. Click in Create Asset

![PVA Video Config](images/pva_video_config_2.png?raw=true "PVA Video Config")

5. On Generator Logs, you can click in Update to see PVA processing on GKE. And in Assets, you can see your video status.

![PVA Video Config](images/pva_video_status.png?raw=true "PVA Video Config")

## Troubleshoot

Kubernetes:
```bash
		gcloud container clusters get-credentials video-generator-cluster --zone us-west1-a
		kubectl get pods
```
If the Pod status is different from Running, use:

```bash
		kubectl logs <pod_name>
		kubectl describe pod <pod_name>
```

Common errors are lack of permission and permission denied when accessing the Sheets and Drive, if you encounter more errors and have solved them, feel free to contribute.

## Contribute

PVA is a open-source project, so you can help us create a better application! Every push will trigger a CI/CD application which we will verify it's integrity, after that, if everything is fine, we are going to merge your pull request :)



*Optional:* Check that your Spreadsheet has access to Google Merchant Center as follows:
1. [Optional] Navigate to _Tools_ > _Script Editor_ > _Settings (gear icon)_
	1. Update the GCP Project ID
	1. Test the Google Merchant Center connection by
		1. Add an ID on "Prices" tab in the format `<Google Merchant Center id>:<product id>` 
		1. Click _Merchant Center_ > _Run Now_
