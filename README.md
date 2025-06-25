<!--
Copyright 2024 Google LLC

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->

# Product Video Ads

Disclaimer: This is not an officially supported Google product.

[Purpose](#purpose) •
[Requirements](#requirements) •
[Deployment](#deployment) •
[Configuration](#configuration) •
[Regular Usage](#regular-usage) •
[Architecture](#architecture) •
[Alternatives](#alternatives)

## Purpose

Product Video Ads (PVA) builds ad videos by taking a base video (effectively a template) and putting product information (names, images, prices etc.) on them, updating automatically when there are changes to the configuration, prices etc. For example, retailers who have different special offers in different cities, can use this mapping to efficiently create localised video ads and and update them whenever the assignment changes.

The following example illustrates the functionality with a single product in a single video: a template video (shown are frames from its beginning, middle and end) is combined with a product (data and image) to yield a video that advertises that product:

<table>
<tr>
<td></td>
<td><img src="documentation_assets/template-start.jpg" width="150"></td>
<td><img src="documentation_assets/template-product.jpg" width="150"></td>
<td><img src="documentation_assets/template-end.jpg" width="150"></td>
</tr>

<tr>
<td style="font-size:200%">+</td>
<td colspan="3" style="font-size:200%; text-align:center; vertical-align:middle;"><img style="margin:-15px 0 -10px; vertical-align:middle;" src="example_assets/apples.png" width="100"> / Apples / €1.09</td>
</tr>

<tr>
<td style="font-size:200%">=</td>
<td><img src="documentation_assets/template-start.jpg" width="150"></td>
<td><img src="documentation_assets/result.jpg" width="150"></td>
<td><img src="documentation_assets/template-end.jpg" width="150"></td>
</tr>
</table>

Given a list of products and a configuration of which of them should be shown in the same video, PVA can generate many such videos automatically.

## Requirements

To use PVA "out of the box", you need at least

- Google Workspace, because the configuration is stored in Google Sheets and interpreted with Apps Script
- Google Cloud Platform (GCP), because the videos are built with Cloud Functions and stored on Cloud Storage
- YouTube to publish the videos
- Google Ads to run them as ads

This documentation assumes that you want to use the tool as intended, with all its components. If for some reason you can't use Google Workspace, you would need to manually write configuration files, upload them to Cloud Storage and manually download (and further process) the resulting videos. In this case, you could also consider using Google Web Designer, as described under [Alternatives](#alternatives).

### Quota Increase

By default, YouTube allows at most six API-based uploads per day – resulting from the limit of [10 000 daily "units" available](https://developers.google.com/youtube/v3/guides/quota_and_compliance_audits) and a cost of [1600 such units per upload](https://developers.google.com/youtube/v3/determine_quota_cost). Given the intended scale of PVA, it hence makes sense to request an increase of this limit via [this form](https://support.google.com/youtube/contact/yt_api_form) – see the instructions on it.

## Deployment

Before being able to use PVA, the following steps are required:

### A. Prepare your deployment environment

You have two options for the deployment environment:

#### OPTION 1: Deploying from your local machine and terminal (preferred!)

1. Make sure your system has an up-to-date installation of [Node.js, npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and `git`.
2. Install [clasp](https://github.com/google/clasp) by running `npm install @google/clasp -g`, then log in via `clasp login`.
3. In the [Apps Script settings](https://script.google.com/home/usersettings), ensure that the Apps Script API is enabled.
4. In your GCP project, ensure [OAuth consent](https://console.cloud.google.com/apis/credentials/consent) is [configured](https://developers.google.com/workspace/guides/configure-oauth-consent). (If possible, choose the "Internal" type to avoid the need for approval.)
5. Make sure your system has an up-to-date installation of the [gcloud CLI](https://cloud.google.com/sdk/docs/install), then log in via `gcloud auth login`.

#### OPTION 2: Deploying from Google Cloud Shell (if unable to install npm / clasp / gcloud on your machine)

1. On your Google Cloud Shell, login to [clasp](https://github.com/google/clasp) by running `clasp login --no-localhost`.
2. Copy the url from your web browser (it might show that the page is not reachable. This is okay.) and paste into the Cloud Shell as instructed.
3. In the [Apps Script settings](https://script.google.com/home/usersettings), ensure that the Apps Script API is enabled.
4. In your GCP project, ensure [OAuth consent](https://console.cloud.google.com/apis/credentials/consent) is [configured](https://developers.google.com/workspace/guides/configure-oauth-consent). (If possible, choose the "Internal" type to avoid the need for approval.)
   `

### B. Check out the code

Execute

```bash
git clone https://github.com/google/product_video_ads
```

### C. Execute the installation script

Execute the installation script on Google Cloud Platform (GCP):

```bash
npm run deploy
```

You will be asked for

- the (textual) ID of your GCP project,
- the GCP region to locate the service,
- the GCS (multi-)region to locate the temporary storage, and
- the name of the Pub/Sub topic to be used (see [Architecture](#architecture) for details),
- the ID of the Google Sheets document to host the configuration.

It is recommended to not provide the latter, as then a clean new sheet will be created. Its address will be output at the end of the process, but you could also simply look for it in your Google Drive under the name "Product Video Ads" or find its ID as `parentId` in `appsscript/.clasp.json`.

> **Notes:**
>
> - During deployment, your GCS bucket will receive two folders:
>   - The folder named "gcf-v2-uploads-[...].cloudfunctions.appspot.com" needs no interaction but is required for PVA's operation.
>   - The folder composed of your GCP project's name and the suffix `-bucket` is where the videos will be generated, but also where initially content needs to be uploaded – see the corresponding later step in this list.
> - If you installed the cloud components before but merely want to deploy the Sheets document, you can execute the deployment command in the `appsscript/` folder.
> - If you get an error message about lacking permissions for Eventarc, try again after a couple of minutes.

### D. Initialise the Google Sheets config document

1. Open the document whose link you obtained at the end of the installation.
2. Click the menu item \[Extensions | Apps Script\], there open \[⚙ Project Settings\] and under _Google Cloud Platform (GCP) Project_ enter the number you find as _Project number_ on https://console.cloud.google.com/welcome?project=[your-project-name]
3. In the document, click the menu item \[🎬 Product Video Ads | Initialisation | ⚠️ Initialise sheet\] to populate it with the necessary sheets. (You can then delete the original "Sheet1" if you didn't put anything in before.)

### E. Deploy the Ads Script in Google Ads

For this, see the [official documentation](https://developers.google.com/google-ads/scripts/docs/getting-started) of how to use Ads Scripts, but instead of the provided example use [this code](./adsScriptsScript.js). At its top, change the link to that of your own PVA spreadsheet.

### F. Upload the needed template video(s) and font(s) to Google Cloud Storage

PVA expects the following files referenced in the [configuration](#configuration) to exist in the **root folder** of the storage bucket created by the installation script:

- The template video(s) – their name(s) is what you will later need to specify as _Template Video_ in the sheets _Timing_ and _Ad Groups_.
- The `.ttf` font files specified as _Text Font_ in the sheet _Placement_.

> **Note:** Templates should be small enough so that the resulting videos do not exceed 50 MB: otherwise, the tool won't be able to get them (for uploading to YouTube) due to the [limit for "URL Fetch response size"](https://developers.google.com/apps-script/guides/services/quotas#current_limitations).

For the actual upload, you have two main choices:

- Upload the needed files via the Cloud Storage web interface.
- In the PVA sheet, use \[🎬 Product Video Ads | Upload files to GCS\] to show a dialog that allows you to upload arbitrary files. For this to work, the correct bucket first needs to be set in the [Base Config](#base-config)].

> **Note:** The form does not give any progress information, so once you have triggered an upload, simply wait for a confirmation to appear.

### G. Enter the desired configuration and product data in the sheet

What to enter is described in detail in the section [Configuration](#configuration).

Once everything is set up, refer to the section [Regular Usage](#regular-usage) on next steps.

## Configuration

After initialisation, the pivotal Google Sheets document has seven sheets/tabs to control the process. Different parts of the configuration will see changes differently often:

- Product details (_Offers_) and the decision which products to show (_Offers to Ad Groups_) change most often. It makes sense to set up automated updates for these.
- _Ad Groups_ may also change if the number of target videos is variable, e.g. based on a variable set of locations with their own sets of locally promoted products. If it is a superset of what could be expected in _Offers to Ad Groups_, it can remain static, too.
- Products' visual arrangement on the base video (defined in _Timing_ and _Placement_) can usually be fixed as long as that same template video is used.
- _Base Config_ would usually only be set once, assuming that the Google Ads account, YouTube channel etc. are constant.
- _Status_ is not meant for manual editing at all, but is used by the different components to communicate state.

The sheets are described below, but PVA comes with an example configuration that you can try:

1. Insert the example config into the document via: 🎬 Product Video Ads | Testing | ⚠️ Populate config
2. Upload [this template video](https://raw.githubusercontent.com/google/product_video_ads/main/example_assets/template.mp4) in Cloud Storage as described in [Deployment](#deployment).
3. Insert the name of your GCS bucket in the pertinent field on the [Base Config](#base-config) sheet.

> **Note:** While the configuration sheet features numerous checks concerning the validity of entered values, they allow for mistakes (like the absence of a value) that will only get caught when the code runs and evaluates it.

### Base Config

Here, you enter references to other systems:

- Google Cloud
  - Storage Bucket: the bucket used to store data (including the videos) temporarily
- Google Merchant Center
  - Account ID: the account from which to import product data
  - Feed Filtering: if set to `only mapped`, only imports products present in the _Offers to AdGroups_ sheet
- YouTube
  - Channel ID: the channel on which to publish the videos (find it [here](https://www.youtube.com/account_advanced)) – if left empty, the user's (primary) personal channel is used
- Google Ads
  - Account ID: the account on which to run the video ads
  - Campaign Name: the campaign to use inside that account

### Timing

For each template video to be used, this specifies the temporal position & duration of each product occurrence, as well as references the visual arrangement. There needs to be at least one line per template video and product slot – e.g. three lines if there is just one such template and it is meant to show three products. If not all product elements (title, image etc.) are to appear and disappear at the same time (e.g. to make the video more interesting), then the number of lines would increase accordingly – e.g. two per slot, if first the image should appear and then the textual elements.

The columns:

- _Template Video_: video filename as present in the bucket on Google Cloud Storage
- _Offset \[s\]_: number of seconds from the start of the video at which product elements should be shown
- _Duration \[s\]_: amount of seconds for which the product elements should be shown
- _Placement ID_: reference to the spatial arrangement of the product elements (title, image etc.) at this time. This number may be the same for all lines if all positions in a template video are graphically identical and all product elements are to be shown at the same time.

### Placement

#### 🚨 NEW: Placements Helper UI

> Introducing a new lightweight Placements helper UI, which allows users to visually drag and drop
> elements on a video frame, in order to determine the positioning, width and height values for PVA configuration. To learn more, check out the [docs](https://github.com/google/product_video_ads/tree/main/positioning_helper#pva-positioning-helper), or get started [here](https://google.github.io/product_video_ads/positioning_helper/index.html).

This defines those visual arrangements, defining textual and image elements along with their position, size and similar properties, but also the field in the product feed that provides the actual text or image to use.

All columns need to have values, except _Text Font_ and those referring to a different element type, like _Text Color_ for images:

- _Placement ID_: number or text serving as the target of references to the namesake field on the sheet _Timing_
- _Element Type_: either `Text` or `Image`
- _Data Field_: name of the field in the sheet _Offers_ that has the text or (the URL of the) image to be shown
- _Position X_ and _Position Y_: horizontal/vertical coordinate on the base video at which to place the content – For images, this is their center, for text it is the upper left corner.
- _Rotation Angle_: angle (in degrees) at which to rotate the content, positive values meaning clockwise rotation
- _Image Width_ and _Image Height_: dimensions into which the image should be scaled – Its aspect ratio will be retained, so one of the resulting dimensions may be smaller.
- _Text Font_ (optional): font filename (including its extension)
- _Text Size_: vertical size in pixels
- _Text Width_: maximum characters after which the text should be wrapped using a line break
- _Text Alignment_: alignment inside the available width, either `left`, `center` or `right`
- _Text Color_: color as a hexadecimal value with a leading `#`

> **Note:** Your template may not allow for text to be rendered in several lines. In this case, ensure that the input feed has no entries that would result in line wrapping.

### Offers

This hosts the list of products, with their properties, that could theoretically be configured to be shown in the videos.

Among the columns, only _Offer ID_ is compulsory. The others simply need to provide all the data that is ultimately meant to be shown on the generated video.

### Offers to Ad Groups

This defines how products should be grouped to form videos. The columns are:

- _Offer ID_: reference to the value in the column on _Offers_ of the same name
- _Output AdGroup_: reference to the value of the column on _AdGroups_ of the same name

The order of entries here determines the order in which the corresponding products will appear in the generated video.

### Ad Groups

For each of the aforementioned groups of products, this specifies the properties the resulting video ad (and its ad group) should have in Google Ads, as well as references the template video (and hence _Timing_ and _Placement_) to actually use.

The columns:

- _Output AdGroup_: name of the ad group to be generated/replaced
- _Template Video_: name of the file (uploaded to the configured bucket on Cloud Storage) to be used for the videos in this ad group
- _AdGroup Type_: type of the ad group – possible values are enumerated [here](https://developers.google.com/google-ads/api/rest/reference/rest/v18/AdGroupType)
- _Target Location_ – currently ignored, to be implemented
- _Audience Name_ – currently ignored, to be implemented
- Self-explanatory properties of the ad group:
  - _URL_
  - _Call to Action_
  - _Headline_
  - _Long Headline_
  - _Description 1_
  - _Description 2_

> **Note:** Currently, an ad group can't be called "config" due to resulting name conflicts.

### Status

This is used by PVA to store status information coordinating the various independent processes, but also to inform the user of parts of the configuration being ignored due to errors.

The columns:

- _Output AdGroup_: reference to the entries in the sheet _Ad Groups_ – For each entry there, one is created here.
- _Output Video ID_: public ID that the video has on YouTube – This is written here after being obtained from YouTube, and is used by the Ads Script creating/updating the ads. When a new version of the ad group's video is requested, the value is deleted to signal to the code that it needs to check Cloud Storage for a new version.
- _Video Creation_: point in time at which the _Output Video ID_ was entered – Deleted when that is deleted. Only serves documentation purposes, is not read anywhere.
- _Ad Creation_: point in time at which the most recent ad was created (i.e. the ad group was updated)
- _Expected Status_: flag indicating whether the corresponding ad should currently be shown – This is set to `DISABLED` if the configuration of the ad group has an error, which will cause the Ads Script to pause this ad group if not already the case, or not create it in the first place. The pausing would happen if, for example, an entry disappears from the _Offers_ sheet but is still used in _Offers to AdGroups_: this can't be turned into a valid video, so the existing one is paused as a safety measure.
- _Error(s)_: message(s) reflecting errors that occurred during processing of the configuration or during creation/update of the ad group – As described above, the harm of these errors should be limited by disabling of the ad groups, but not least as that could fail as well, it makes sense to regularly check up on this.
- _Content Checksum_: a character sequence summarising the configuration of the ad group, including pixel positions, prices etc. – The code requesting video generation uses this to check whether anything changed since the last time (or whether there even was a "last time") to see whether a new video needs to be generated, in which case it then writes the new to be compared in future checks.
- _Checksum Creation_: point in time at which the _Content Checksum_ was written – Only serves documentation purposes, is not read anywhere.
- _Folder Name_: name of the folder in the Cloud Storage bucket that was created to host the files for the most recent video-creation request for this ad group – It is written whenever a request is made, and later used to look up results.

## Regular Usage

Once the configuration is complete, there are two processes that need to be triggered:

- Whenever the configuration or product data changed\*:
  \[🎬 Product Video Ads | Request video creation\]
- Whenever new videos were uploaded to YouTube:
  \[🎬 Product Video Ads | Register video uploads\]

These calls can be scheduled in Apps Script, which mainly makes sense if the data on offers (_Offers_ sheet) and its mapping to ad group (_Offers to Ad Groups_) are also automatically updated, to reflect those updates as soon as possible.

> **Note:** To force video creation irrespective of whether the config changed compared with the previous run, simply remove the respective ad group's _Content Checksum_ value in the _Status_ sheet.

> **Note:** When an ad group's config is detected as having changed, the old video remains active until the new one has been generated.

### Feed import

As the offers data can also be imported directly from Google Merchant Center, basic such functionality is built in:
\[🎬 Product Video Ads | Get products from Merchant Center\]

This puts the data into a sheet called _Offers Feed_, which is generated with a default setup if it does not yet exist. There are two main concerns when importing this data:

- _What products to include_ – for which there are currently two options:
  - Load all the products
    This is the default.
  - Only load products mapped to an ad group in _Offers to Ad Groups_
    This can be chosen by entering `only mapped` in the _Feed Filtering_ configuration field.
- _Which fields to include_ – which is determined via the column headers (i.e. first line) of the _Offers Feed_ sheet. For example, the aforementioned default setup puts `offerId`, `title` etc. there. See [this list](https://developers.google.com/shopping-content/reference/rest/v2.1/products#Product) for what is potentially available.

The data in this sheet can then be used in the _Offers_ sheet via Google Sheets' [QUERY](https://support.google.com/docs/answer/3093343) function. However, more complex functionality (like putting together a price with a currency-dependent symbol) may require more other functions (like [VLOOKUP](https://support.google.com/docs/answer/3093318)), which bring issues with adapting their presence to changing sizes of product feeds.

Of course, the code could also be changed to import the data directly into the _Offers_ sheet, with all the needed restrictions, formatting etc.

## Architecture

### Process coordination

PVA has the following "actors" that communicate with each other via files on Cloud Storage or entries in the _Status_ sheet of the configuration sheet:

1. _Apps Script validating and exporting the configuration_\
   By combining the content of the various sheets in the Google Sheets document, this script determines the ad groups to be generated. Those get requested by submitting the result to a unique folder on Cloud Storage. That folder is stored in the _Status_ sheet, as is a checksum of the video configuration, to inform a future need for re-generation.
2. _Cloud Function "orchestrator" determining what needs to be generated_\
   By listening to Cloud Storage, this function detects new requests and queues their execution using Pub/Sub.
3. _Cloud Function "runner" actually generating the videos_\
   By taking requests from the Pub/Sub queue, these instances merge the template video with the other elements and store the results on Cloud Storage in the same unique folder that the config was found in.
4. _Apps Script uploading videos to YouTube_\
   Regularly checking the Cloud Storage folder that it created with the video configuration, this function detects new videos, uploads them to YouTube, and stores their IDs in the _Status_ sheet.
5. _Ads Scripts script generating or updating Google Ads_\
   Based on the state and the _Status_ sheet, this creates, pauses and/or re-enables ad groups.

## Alternatives

The following are among the most relevant practical limitations of PVA:

- In terms of the visual complexity of how the product information can appear on the template video, PVA is limited to (a subset of) the capabilities of the tool used for the actual video creation, [FFmpeg](https://www.ffmpeg.org/). While some additional flexibility could be achieved, e.g. by optionally allowing a partially transparent second template video to be layered on top, there are clear limits to this approach.
- The placement of the products needs to be defined via the textual definition of pixel coordinates. While whoever created the template video should be able to provide these, this is far from the intuitive image of the future result that a graphical "What you see is what you get" interface would provide.
- Videos over 50 MB in size cannot be uploaded to YouTube with the mechanism in this tool.

A fundemantally different level of freedom and control is provided by [Google Web Designer](https://webdesigner.withgoogle.com/) (GWD), a tool that allows the creation of animated HTML files, often used for Display ads. GWD is able to generate videos from these, and can be used for scaled work by reading lists of input data. Effectively, it can hence be used to create product videos that, compared with what is supported by PVA, are larger, feature special effects, and allow elements to be graphically placed with the mouse instead of having to provide numerical coordinates.

Google Web Designer comes with its own downsides, however:

- A tool for creating the needed input lists would need to be implemented additionally.
- Automatically getting the list into GWD and automatically triggering video generation is not supported out of the box and would require the implementation of macros at the level of the Operating System hosting the tool.
- While the generated videos can be automatically uploaded to Google Drive, further upload to YouTube and Google Ads would also need to be implemented additionally.
- The fact that the tool runs on a local machine without parallelisation limits its throughput. Moving this to the cloud and spawning several virtual machines that each run GWD would be complex. (One option would be to export HTML files and then create videos by screen-recording Chrome running on VMs.)

Note that Ads Creative Studio, which might be recommended in this context, is set to be [discontinued in early 2025](https://support.google.com/adscreativestudio/answer/10726939).
