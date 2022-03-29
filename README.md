# youtube-live-calendar
Use Google App Script to create upcoming live events in your Google Calendar

## Setup
Script ID: `AKfycbwcytUuy06Yf1T_Aoxk6RnNxks5tEpOrZz67i84nI8Sy_jec97INb_9xrhnTpLODpue` \
See https://developers.google.com/apps-script/guides/libraries

## Getting Started
```js
var subscribedChannels = [
  {key: 'CDC', shortName: 'TCDC', id: 'UCyh91eTE9jA3ykg8W3_v3DQ'},
  // Add more channels as above
]
// Find your Calendar ID in https://calendar.google.com/calendar/u/0/r/settings
var calendarId = 'xxxxxxxxxxxxxxxxxxxxxxxxxx@group.calendar.google.com'
var YTLC = YouTubeLiveCalendar.init(calendarId, subscribedChannels)

// Run single channel
function runCDC() {
  YTLC.runChannel('CDC')
}

// Run all channels defined in subscribedChannels
function runAllChannels() {
  YTLC.runAllChannels()
}

// Use this method to list your subscriptions and find channel ID
function listSubscriptions() {
  YTLC.listSubscriptions()
}
```
