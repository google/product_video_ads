var SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1yqn2zyCCIluXUEmlMcvCgWxQdTPTaAuherozaFjJzFQ/edit'
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

        var accountId = accountIds[row][0]

        if (accountId == '')
          break

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
function processAccount() {
  
  var currentAccount = AdsApp.currentAccount().getCustomerId()
  var sheet = SpreadsheetApp.openByUrl(SPREADSHEET_URL).getSheetByName(SHEET_NAME)
  
  // Will run for 30 minutes then timeout
  while (true) {
    
    // Find all account IDs
    var accountIds = Util.findAccountIds(sheet)

    // Start processing line matching account ID
    for (var row = 0; row < accountIds.length; row++) {

      var accountId = accountIds[row][0]

      if (accountId == '')
        break

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
var FIELDS = ['AccountID', 'CampaignName', 'AdGroupName', 'AdName', 'TargetLocation', 'TargetAge', 'TargetUserInterest', 'Url', 'CallToAction', 'AdGroupType', 'Configs', 'BaseVideo', 'Status', 'GeneratedVideo']

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
          
      	// Create video ad
      	var adName = 'Ad ' + (adGroup.videoAds().get().totalNumEntities() + 1)
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
    row.set('AdName', '')
  	row.set('Status', 'Paused')
	}
}
function add_campaign_targets(campaign_name, location_targets_string) {
  
  var campaign = Util.findCampaign(campaign_name)
  
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
}var NAMED_RANGES = {
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
