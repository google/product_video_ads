var FIELDS = ['AccountID', 'CampaignName', 'AdGroupName', 'AdName', 'TargetLocation', 'TargetAge', 'TargetUserInterest', 'Url', 'CallToAction', 'AdGroupType', 'Configs', 'BaseVideo', 'Status', 'GeneratedVideo', 'CurrentPrices', 'AudienceName']

var STATUS_HANDLERS = {
  
  	'Off': function(row) {
      
      	Util.pauseAllVideoAds(row.get('AdGroupName'), row.get('CampaignName'))
      
      	row.set('AdName', '')
        row.set('AdGroupName', '')
        row.set('GeneratedVideo', '')
  		  row.set('Status', 'Not Started')
    },
  	  
  	'Video Ready': function(row) {
      
      	var adGroupName = row.get('BaseVideo') + '-' + String(row.get('GeneratedVideo')).replace(/,/g, '-')
        
        // Add targets related to Campaign
        add_campaign_targets(row.get('CampaignName'), row.get('TargetLocation'))        
      
        // Create or simply get adGroup
        var adGroup = Util.createOrRetrieveVideoAdGroup(row.get('CampaignName'), row.get('AdGroupType'), adGroupName)
        row.set('AdGroupName', adGroupName)

        // Associate audience with the adGroup
        Util.associateAudienceWithAdGroup(adGroup, row.get('AudienceName'))
          
      	// Create video ad
      	var adName = 'Ad ' + (adGroup.videoAds().get().totalNumEntities() + 1)
      	var videoAd = Util.createOrReactivateVideoAd(adName, adGroup, row.get('GeneratedVideo'), row.get('Url'), row.get('CallToAction'))
        
        // This may be null if video is not available
        if (videoAd != null) {
          
          Logger.log('videoAd %s created with type %s', videoAd.getName(), videoAd.getType())
          row.set('AdName', videoAd.getName())

          // It's running
          row.set('Status', 'Running')
   		}
    },
    
	'Price Changed': function(row) {
	  Util.pauseAllVideoAds(row.get('AdGroupName'), row.get('CampaignName'))
    row.set('AdName', '')
  	row.set('Status', 'Paused')
	}
}
