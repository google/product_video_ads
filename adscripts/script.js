// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var SPREADSHEET_URL = 'INSERT_YOUR_SHEETS_URL_HERE'
var SHEET_NAME = 'Campaigns'
var SLEEP_TIME_SECONDS = 60
var ACCOUNTS_LIMIT = 50

function main() {
  
  // It will run processAccount (for each account) for a total of 30 minutes
  // After that, will run finalize as MCC for another 30 minutes
  AdsManagerApp.accounts()
    .withLimit(ACCOUNTS_LIMIT)
    .executeInParallel('processAccount', 'finalize')
}
// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function finalize() {
  
	var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(SHEET_NAME)
  	
    var accountSelector = AdsManagerApp.accounts()
      .withLimit(ACCOUNTS_LIMIT)
  	  .get()
    
  	// Will run for 30 minutes then timeout
  	while (true) {
    
      // Find all account IDs
      var accountIds = Util.findAccountIds(sheet)

      // Start processing line matching account ID
      for (var row = 0; row < accountIds.length; row++) {

        var accountId = accountIds[row] != '' ? JSON.parse(accountIds[row])['account_id'] : ''

        if (!accountId || accountId == '')
          continue

        // + 2 because we need to skip header, and sheet rows start at 1 (instead of 0)
        processGenericRow(new Row(row + 2, sheet), accountId, accountSelector)
      }

      SpreadsheetApp.flush()

      Logger.log('Processed all account - Waiting %s seconds', SLEEP_TIME_SECONDS)
      Utilities.sleep(SLEEP_TIME_SECONDS * 1000)
  }
}

function processGenericRow(row, accountId, accountSelector) {
  
	// Find handler based on Status
    var status = row.get('Status')
    var handler = STATUS_HANDLERS[status]

    if (!handler)
      return
  
	// Switch to correct account
    while (accountSelector.hasNext()) {
  	
    var childAccount = accountSelector.next()
    
    if (childAccount.getCustomerId() == accountId)
    	AdsManagerApp.select(childAccount)
   }
    
   Logger.log('Handling %s to row %s', status, row.row)
   handler(row)

   // Persist to sheet
   row.save()
}
// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function processAccount() {
  
  var currentAccount = AdsApp.currentAccount().getCustomerId()
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(SHEET_NAME)
  
  // Will run for 30 minutes then timeout
  while (true) {
    
    // Find all account IDs
    var accountIds = Util.findAccountIds(sheet)
    

    // Start processing line matching account ID
    for (var row = 0; row < accountIds.length; row++) {

      var accountId = accountIds[row] != '' ? JSON.parse(accountIds[row])['account_id'] : ''

      if (!accountId || accountId == '')
        continue

      // + 2 because we need to skip header, and sheet rows start at 1 (instead of 0)
      if (accountId == currentAccount)
        processRow(new Row(row + 2, sheet))
    }

    SpreadsheetApp.flush()

    Logger.log('Processed account %s - Waiting %s seconds', currentAccount, SLEEP_TIME_SECONDS)
    Utilities.sleep(SLEEP_TIME_SECONDS * 1000)
  }
}

function processRow(row) {
  
  // Find handler based on Status
  var status = row.get('Status')
  var handler = STATUS_HANDLERS[status]
    
  if (!handler) {
    //Logger.log('Status %s is not handled to row %s', status, row.row)
    return
  }
    
  Logger.log('Handling %s to row %s', status, row.row)
  handler(row)
  
  // Persist to sheet
  row.save()
}
// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function Row(row, sheet) {

  var rowRange = sheet.getRange(row, 1, 1, FIELDS.length)
  var rowData = rowRange.getValues()
  var data = {}
      
  FIELDS.forEach(function(field, index) {
  	data[field] = rowData[0][index]
  })
  
  // Class attributes
  this.row = row.toFixed(0)
  
  this.get = function(field) {
  	return data[field]
  }
  
  this.set = function(field, value) {
  	data[field] = value
    rowData[0][FIELDS.indexOf(field)] = value
  }
  
  this.save = function() {
  	rowRange.setValues(rowData)
  }
}
// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var FIELDS = ['ID', 'AdsMetadata', 'VideoMetadata', 'Status', 'GeneratedVideo']

var STATUS_HANDLERS = {
  
  	'Off': function(row) {
      
        const adsMetadata = JSON.parse(row.get('AdsMetadata'))

      	Util.pauseAllVideoAds(adsMetadata['ad_group_name'], adsMetadata['campaign_name'])
      
      	adsMetadata['ad_name'] = ''
        adsMetadata['ad_group_name'] = ''

        row.set('GeneratedVideo', '')
        row.set('Status', 'Done')
        row.set('AdsMetadata', JSON.stringify(adsMetadata))
    },
  	  
  	'Video Ready': function(row) {
      
        const adsMetadata = JSON.parse(row.get('AdsMetadata'))
        const videoMetadata = JSON.parse(row.get('VideoMetadata'))

      	var adGroupName = videoMetadata['base_video'] + '-' + String(row.get('GeneratedVideo')).replace(/,/g, '-')
        
        // Add targets related to Campaign
        add_campaign_targets(adsMetadata['campaign_name'], adsMetadata['target_location'])        
      
        // Create or simply get adGroup
        var adGroup = Util.createOrRetrieveVideoAdGroup(adsMetadata['campaign_name'], adsMetadata['ad_group_type'], adGroupName)
        adsMetadata['ad_group_name'] = adGroupName

        // Associate audience with the adGroup
        Util.associateAudienceWithAdGroup(adGroup, adsMetadata['audience_name'], Util.videoAdAudienceAssociator)
          
      	// Create video ad
      	var adName = 'Ad ' + (adGroup.videoAds().get().totalNumEntities() + 1)
      	var videoAd = Util.createOrReactivateVideoAd(adName, adGroup, row.get('GeneratedVideo'), adsMetadata['url'], adsMetadata['call_to_action'])
        
        // This may be null if video is not available
        if (videoAd != null) {
          
          Logger.log('videoAd %s created with type %s', videoAd.getName(), videoAd.getType())
          adsMetadata['ad_name'] = videoAd.getName()

          // It's running
          row.set('Status', 'Running')
          row.set('AdsMetadata', JSON.stringify(adsMetadata))
   		}
    },

    'Image Ready': function(row) {
      
      const adsMetadata = JSON.parse(row.get('AdsMetadata'))
      const videoMetadata = JSON.parse(row.get('VideoMetadata'))

      var adGroupName = videoMetadata['base_video'] + '-' + String(row.get('GeneratedVideo')).replace(/,/g, '-')
      
      // Add targets related to Campaign
      add_campaign_targets(adsMetadata['campaign_name'], adsMetadata['target_location'])        
    
      // Create or simply get adGroup
      var adGroup = Util.createOrRetrieveAdGroup(adsMetadata['campaign_name'], adGroupName)
      adsMetadata['ad_group_name'] = adGroupName

      // Associate audience with the adGroup
      Util.associateAudienceWithAdGroup(adGroup, adsMetadata['audience_name'], Util.adAudienceAssociator)
        
      // Create video ad
      var adName = 'Ad ' + (adGroup.ads().get().totalNumEntities() + 1)
      var ad = Util.createOrReactivateAd(adName, adGroup, row.get('GeneratedVideo'), adsMetadata['url'])
      
      // This may be null if video is not available
      if (ad != null) {
        
        Logger.log('Ad %s created', ad.getName())
        adsMetadata['ad_name'] = ad.getName()

        // It's running
        row.set('Status', 'Running')
        row.set('AdsMetadata', JSON.stringify(adsMetadata))
      }
    },
    
    'Price Changed': function(row) {

      const adsMetadata = JSON.parse(row.get('AdsMetadata'))

      Util.pauseAllVideoAds(adsMetadata['ad_group_name'], adsMetadata['campaign_name'])

      adsMetadata['ad_name'] = ''
      row.set('Status', 'Paused')
      row.set('AdsMetadata', JSON.stringify(adsMetadata))
    }
}
// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

function add_campaign_targets(campaign_name, location_targets_string) {
  
  var campaign = Util.findVideoCampaign(campaign_name) || Util.findCampaign(campaign_name) 
  
  if (campaign === undefined) {
    Logger.log('Campaign not found: ' + campaign_name) 
    return
  }
  
  var location_targets = String(location_targets_string).split(';').filter(function(t) { 
    return t // Exclude blank entries
  }) //.map(function(e) { return e.trim().split(':') })
          
  Logger.log("Adding location targets: " + location_targets)
  
  // Remove all locations
  var active_locations = campaign.targeting().targetedLocations().get()
  
  while(active_locations.hasNext()) {
    active_locations.next().remove()
  }
    
  // Add those wanted
  location_targets.forEach(function(t) {
    campaign.addLocation(parseInt(t))
  })
  
  // Link all audiences
  //adGroupTargets.forEach(function(e) {
  //  adGroup.videoTargeting().newAudienceBuilder()
  //         .withAudienceId(e[1])
  //         .withAudienceType(e[0])
  //         .build()                   
  //}) 
}// Copyright 2020 Google LLC

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Util = {
  
  	findAccountIds: function(sheet) {
      return sheet.getRange('B2:B').getValues()
    },
  
    findVideoCampaign: function(campaign_name) {
    
      var campaign = AdsApp.videoCampaigns()
                   .withCondition('CampaignName = "' + campaign_name + '"')
                   .get()
      
      return campaign.hasNext() ? campaign.next() : undefined
    },

    findCampaign: function(campaign_name) {
    
      var campaign = AdsApp.campaigns()
                   .withCondition('CampaignName = "' + campaign_name + '"')
                   .get()
      
      return campaign.hasNext() ? campaign.next() : undefined
    },
  
  	findVideoAdGroup: function(adGroupName, campaignName) {
    
      var videoAdGroup = AdsApp.videoAdGroups()
            .withCondition('CampaignName = "' + campaignName + '"')
            .withCondition('Name = "' + adGroupName + '"')
            .get()
    
      return videoAdGroup.hasNext() ? videoAdGroup.next() : undefined
    },

    findAdGroup: function(adGroupName, campaignName) {
    
      var displayAdGroup = AdsApp.adGroups()
            .withCondition('CampaignName = "' + campaignName + '"')
            .withCondition('Name = "' + adGroupName + '"')
            .get()
    
      return displayAdGroup.hasNext() ? displayAdGroup.next() : undefined
    },
  
  	findVideoAd: function(adName, adGroup) {
    
      var videoAdsIterator = adGroup.videoAds().get()
          
      while (videoAdsIterator.hasNext()) {
        
      	var existingVideoAd = videoAdsIterator.next()
        
        if (existingVideoAd.getName() == adName)
          return existingVideoAd
      }
      
      return undefined
    },

    findAd: function(adName, adGroup) {
    
      var adsIterator = adGroup.ads().get()
          
      while (adsIterator.hasNext()) {
        
      	var existingAd = adsIterator.next()
        
        if (existingAd.getName() == adName)
          return existingAd
      }
      
      return undefined
    },

	pauseAllVideoAds: function(adGroupName, campaignName) {
    
    	var videoAdGroup = this.findVideoAdGroup(adGroupName, campaignName)
        
        // This should not happen
        if (!videoAdGroup) {
        	Logger.log('videoAdGroup %s not found for campaign %s', adGroupName, campaignName)
          	return
        }

        var videoAdsIterator = videoAdGroup.videoAds()
          							.withCondition("Status = ENABLED")
          							.get()
          
        while (videoAdsIterator.hasNext()) {
          
          	var videoAd = videoAdsIterator.next()
          
        	videoAd.pause()
          	videoAd.isPaused()
          
          	Logger.log('Paused videoAd %s', videoAd.getName())
        }
    },
  
  	createOrRetrieveVideoAdGroup: function(campaignName, AdGroupType, adGroupName) {
      
      	var adGroup = this.findVideoAdGroup(adGroupName, campaignName)
      
        // Already existing adGroup
        if (adGroup) {
          adGroup.enable()
          adGroup.isEnabled()
          Logger.log('AdGroup %s already exists with type %s', adGroup.getName(), adGroup.getAdGroupType())
        } else {
          Logger.log('AdGroupName: %s, AdGroupType %s, campaignName %s', adGroupName, AdGroupType, campaignName)
        	var videoCampaign = AdsApp.videoCampaigns()
              .withCondition('Name = "' + campaignName + '"')
              .get()
              .next();
          Logger.log('videoCampaign %s', videoCampaign.getName())
          adGroup =  videoCampaign.newVideoAdGroupBuilder()
              .withName(adGroupName)
              .withAdGroupType(AdGroupType)
              .build()
              .getResult();         
          	Logger.log('AdGroup %s created with type %s', adGroup.getName(), adGroup.getAdGroupType())
        }
        
        return adGroup
    },

    createOrRetrieveAdGroup: function(campaignName, adGroupName) {
      
      var adGroup = this.findAdGroup(adGroupName, campaignName)
    
      // Already existing adGroup
      if (adGroup) {
        
        adGroup.enable()
        adGroup.isEnabled()
        
        Logger.log('AdGroup %s already exists', adGroup.getName())
        
      } else {
        
          // New adGroup
        var campaign = AdsApp.campaigns()
            .withCondition('Name = "' + campaignName + '"')
            .get()
            .next()
      
          adGroup =  campaign.newAdGroupBuilder()
                .withName(adGroupName)
                .build()
                .getResult()
        
          Logger.log('AdGroup %s created', adGroup.getName())
      }
      
      return adGroup
  },
  
  	createOrReactivateVideoAd: function(adName, adGroup, videoId, url, callToAction) {

      // First, check if it already exists
      var videoAd = this.findVideoAd(adName, adGroup)
      
      if (videoAd) {
        
        videoAd.enable()
        videoAd.isEnabled()
          
        Logger.log('Existing videoAd %s with type %s changed to ENABLED', videoAd.getName(), videoAd.getType())
        
        return videoAd
      }
      
      // Else, let's create new videoAd
      var video = AdsApp.adMedia()
        .newVideoBuilder()
        .withYouTubeVideoId(videoId)
        .build()
        .getResult()
      
      if (video == null) {
      	Logger.log('Problem linking video %s - please verify!', videoId)
        return null
      }
      
      switch(adGroup.getAdGroupType()) {
        case 'VIDEO_TRUE_VIEW_IN_STREAM':
          videoAd = adGroup.newVideoAd()
            .inStreamAdBuilder()
            .withAdName(adName)
            .withDisplayUrl(url)
            .withFinalUrl(url)
            .withCallToAction(callToAction)
            .withVideo(video)
            .build()
            .getResult();
          break
        case 'VIDEO_NON_SKIPPABLE_IN_STREAM':
         videoAd = adGroup.newVideoAd()
           .nonSkippableAdBuilder()
           .withAdName(adName)
           .withDisplayUrl(url)
           .withFinalUrl(url)
           .withVideo(video)
           .build()
           .getResult();
          break
        case 'VIDEO_TRUE_VIEW_IN_DISPLAY':
          videoAd = adGroup.newVideoAd()
            .videoDiscoveryAdBuilder()
            .withAdName(adName)
            .withDescription1('Description 1')
            .withDescription2('Description 2')
            .withHeadline('Headline')
            .withDestinationPage("WATCH")
          	.withThumbnail('DEFAULT')
            .withVideo(video)
          	.build()
          	.getResult()
          if(!videoAd){
            var errors = videoAd = adGroup.newVideoAd()
            .videoDiscoveryAdBuilder()
            .withAdName(adName)
            .withDescription1('Description 1')
            .withDescription2('Description 2')
            .withHeadline('Headline')
            .withDestinationPage("WATCH")
          	.withThumbnail('DEFAULT')
            .withVideo(video)
          	.build().getErrors();
            Logger.log(errors);
          }
          break
        case 'VIDEO_BUMPER':
          videoAd = adGroup.newVideoAd()
            .bumperAdBuilder()
            .withAdName(adName)
            .withDisplayUrl(url)
            .withFinalUrl(url)
            .withVideo(video)
            .build()
          	.getResult()
          break
      }
      
      Logger.log('videoAd %s created with type %s', videoAd.getName(), videoAd.getType())
      
      return videoAd
    },

    createOrReactivateAd: function(adName, adGroup, imageId, url) {

      // First, check if it already exists
      var ad = this.findAd(adName, adGroup)
      
      if (ad) {
        
        ad.enable()
        ad.isEnabled()
          
        Logger.log('Existing ad %s changed to ENABLED', ad.getName())
        
        return ad
      }
      
      // Else, let's create new ad
      var imageBlob = DriveApp.getFileById(imageId).getBlob()

      var imageMedia = AdsApp.adMedia()
        .newImageBuilder()
        .withName(imageId)
        .withData(imageBlob)
        .build()
        .getResult()
      
      if (imageMedia == null) {
      	Logger.log('Problem linking image %s - please verify!', imageId)
        return null
      }

      ad = adGroup.newAd().imageAdBuilder()
        .withName(adName)
        .withImage(imageMedia)
        .withDisplayUrl(url)
        .withFinalUrl(url)
        .build()
        .getResult()
      
      return ad
    },
  
    associateAudienceWithAdGroup: function(adGroup, audienceNames, audienceAssociator) {
      if (audienceNames === null || audienceNames ===  '') {
        Logger.log('Row without audience')
        return
      }
      
      audienceNames.split(',').forEach(function(originalAudienceName) {
        audienceName = originalAudienceName.trim()

        userListIterator = AdsApp.userlists().withCondition("Name = '" + audienceName + "'").get()
      
        if (!userListIterator.hasNext()) {
          Logger.log('Could not find audience ' + audienceName)
          return
        }
        
        if (userListIterator.totalNumEntities() > 1) {
          Logger.log('More than one audience found for name ' + audienceName)
          while (userListIterator.hasNext()) {
            Logger.log('Audience found: ' + userListIterator.next().getName())
          }
          return
        }
        
        audienceOperation = audienceAssociator(adGroup, userListIterator.next().getId())

        var audienceResultSuccessful = audienceOperation.isSuccessful();
        if (audienceResultSuccessful) {
          Logger.log('AdGroup ' + adGroup.getName() + ' linked to audience ' + audienceName)
        } else {
          Logger.log('Could not link adGroup ' + adGroup.getName() + ' to audience ' + audienceName)
        }
      })
    },
    
    videoAdAudienceAssociator: function(adGroup, audienceId) {
        return adGroup
          .videoTargeting()
          .newAudienceBuilder()
          .withAudienceType("USER_LIST")
          .withAudienceId(audienceId)
          .build();
    },
    
    adAudienceAssociator: function(adGroup, audienceId) {
        return adGroup.targeting()
          .newUserListBuilder()
          .withAudienceId(audienceId)
          .build();
    }
}