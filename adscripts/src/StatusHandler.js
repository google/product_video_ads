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
