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
}