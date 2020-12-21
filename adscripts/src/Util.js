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
          
          	// New adGroup
        	var videoCampaign = AdsApp.videoCampaigns()
              .withCondition('Name = "' + campaignName + '"')
              .get()
              .next()
        
            adGroup =  videoCampaign.newVideoAdGroupBuilder()
                  .withName(adGroupName)
                  .withAdGroupType(AdGroupType)
                  .build()
                  .getResult()
          
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
        case 'VIDEO_NON_SKIPPABLE_IN_STREAM':
         videoAd = adGroup.newVideoAd()
           .inStreamAdBuilder()
           .withAdName(adName)
           .withDisplayUrl(url)
           .withFinalUrl(url)
           .withCallToAction(callToAction)
           .withVideo(video)
           .build()
           .getResult()
          break
          
        case 'VIDEO_TRUE_VIEW_IN_DISPLAY':
          videoAd = adGroup.newVideoAd()
            .videoDiscoveryAdBuilder()
            .withAdName(adName)
            .withDescription1('Description 1')
            .withDescription2('Description 2')
            .withHeadline('Headline')
          	.withThumbnail('DEFAULT')
            .withVideo(video)
          	.build()
          	.getResult()
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

