var NAMED_RANGES = {
	AccountIds: 'AccountIds'
}

var Util = {
  
  	findAccountIds: function(sheet) {
    	return sheet.getNamedRanges().filter(function(n) {
      		return n.getName() == NAMED_RANGES.AccountIds
    	})[0].getRange().getValues()
    },
  
    findCampaign: function(campaign_name) {
    
      var campaign = AdsApp.videoCampaigns()
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
  
  	findVideoAd: function(adName, adGroup) {
    
      var videoAdsIterator = adGroup.videoAds().get()
          
      while (videoAdsIterator.hasNext()) {
        
      	var existingVideoAd = videoAdsIterator.next()
        
        if (existingVideoAd.getName() == adName)
          return existingVideoAd
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
    }
}
