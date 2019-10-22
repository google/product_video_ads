var FIELDS = ['AccountID', 'CampaignName', 'AdGroupName', 'AdName', 'Target', 'Url', 'CallToAction', 'AdGroupType', 'ProductIDs', 'BaseVideo', 'Status', 'GeneratedVideo', 'CurrentPrices']

var STATUS_HANDLERS = {
  
  	'Off': function(row) {
      
      	Util.pauseAllVideoAds(row.get('AdGroupName'), row.get('CampaignName'))
      
      	row.set('AdName', '')
        row.set('AdGroupName', '')
        row.set('GeneratedVideo', '')
  		  row.set('Status', 'Not Started')
    },
  	  
  	'Video Ready': function(row) {
      
      	var adGroupName = row.get('BaseVideo') + '-' + String(row.get('ProductIDs')).replace(/,/g, '-')
        var adGroupTargets = row.get('Target').split(',').filter(function(t) { 
        		return t // Exclude blank entries
        	}).map(function(e) {
          		return e.trim().split(':') // [0] is code and [1] is type
          	})
            
        Logger.log(adGroupTargets)
      
        // Create or simply get adGroup
        var adGroup = Util.createOrRetrieveVideoAdGroup(row.get('CampaignName'), row.get('AdGroupType'), adGroupTargets, adGroupName)
        row.set('AdGroupName', adGroupName)
          
      	// Create video ad
      	var currentPrice = row.get('CurrentPrices') || 'NoPrice'
      	var adName = currentPrice.replace(/,/g, '-')
      	var videoAd = Util.createOrReactivateVideoAd(adName, adGroup, row.get('GeneratedVideo'), row.get('Url'), row.get('CallToAction'))
        
        // This may be null if video is not available
        if (videoAd != null) {
          row.set('AdName', videoAd.getName())

          // It's running
          row.set('Status', 'Running')
   		}
    },
    
	'Price Changed': function(row) {
      
		Util.pauseAllVideoAds(row.get('AdGroupName'), row.get('CampaignName'))
      
      	row.set('GeneratedVideo', '')
      	row.set('AdName', '')
  		row.set('Status', 'Paused')
	}
}
