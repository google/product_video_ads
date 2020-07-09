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