var SheetLogger = BetterLog
var IgnoreTitleRegex = /會員限定|會限|會員場/

var subscribedChannels_ = [];
var calendarId_ = null;
var targetCalendar_ = null;

/**
 * Set your Calendar ID and subscribed channels. It needs to be called before any other function
 *
 * @param {string} calendarId Calendar ID
 * @param {array} subscribedChannels List of your subscribed channels
 * @returns {YouTubeLiveCalendar} This object
 */
function init(calendarId, subscribedChannels) {
  targetCalendar_ = CalendarApp.getCalendarById(calendarId)
  subscribedChannels_ = subscribedChannels;
  return this;
}

/**
 * Update upcoming live events for single channel.
 *
 * @param {string} key Channel key defined in subscribedChannels
 * @returns {YouTubeLiveCalendar} This object
 */
function runChannel(key) {
  var channel = getChannelByKey_(key);
  var videoIds = getUpcommingVideoIds_(channel);
  SheetLogger.log('Run %s, %s upcoming lives', key, videoIds.length.toString());
  runVideos(videoIds);
}

/**
 * Update upcoming live events for all channels in subscribedChannels.
 *
 * @returns {YouTubeLiveCalendar} This object
 */
function runAllChannels() {
  var videoIds = [];
  for (var subscribedChannel of subscribedChannels_) {
    videoIds = videoIds.concat(getUpcommingVideoIds_(subscribedChannel));
  }
  runVideos(videoIds);
}

/**
 * Process specific videos
 *
 * @param {string[]} videoIds YouTube video IDs list
 * @returns {YouTubeLiveCalendar} This object
 */
function runVideos(videoIds) {
  if (videoIds.length === 0) {
    return;
  }
  // Logger.log(videoIds)

  var results = YouTube.Videos.list('snippet,liveStreamingDetails,status', {
    id: videoIds,
  });
  var oldEvents = getOldEvents_();
  for (var i in results.items) {
    var item = results.items[i];

    var now = new Date();
    var three_hour_ago = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    var one_month = new Date(now.getTime() + 86400 * 30 * 1000);
    var startTime = new Date(item.liveStreamingDetails.scheduledStartTime);
    var publishedAt = new Date(item.snippet.publishedAt);
    var endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    var channel = getChannelById_(item.snippet.channelId);
    var shortName = channel ? channel.shortName : null;
    var url = 'https://youtu.be/' + item.id;
    var title = (shortName ? shortName + '-' : '') + item.snippet.title;
    var description = url;
    var status;

    if (IgnoreTitleRegex.test(title)) {
      status = 'member';
    } else if (startTime > one_month) {
      status = 'chat';
    } else if (startTime < three_hour_ago) {
      status = 'past';
    } else if (item.id in oldEvents) {
      var event = oldEvents[item.id];
      event.setTime(startTime, endTime);
      event.setTitle(title);
      event.setDescription(description);
      status = 'old';
    } else {
      var event = targetCalendar_.createEvent(title, startTime, endTime);
      event.setDescription(description);
      status = 'new';
    }
    SheetLogger.log(
      '%s | %s | %s | %s | %s | %s',
      status,
      item.id,
      startTime.toLocaleString('zh-tw', { hour12: false }),
      item.snippet.channelTitle,
      item.snippet.title,
      publishedAt.toLocaleString('zh-tw', { hour12: false })
    );
  }
}

function getUpcommingVideoIds_(subscribedChannel) {
  var videoIds = [];
  // Logger.log(subscribedChannel)
  var results = YouTube.Search.list('snippet', {
    channelId: subscribedChannel.id,
    eventType: 'upcoming',
    type: ['video'],
  });
  for (var i in results.items) {
    var item = results.items[i];
    videoIds.push(item.id.videoId);
    // Logger.log(item)
    // Logger.log('[%s] Title: %s', item.id.videoId, item.snippet.title)
  }

  return videoIds;
}

function getChannelById_(channelId) {
  for (channel of subscribedChannels_) {
    if (channel.id == channelId) {
      return channel;
    }
  }
  return null;
  // throw new Error('Cannot found channel ' + channelId)
}

function getChannelByKey_(channelKey) {
  for (channel of subscribedChannels_) {
    if (channel.key == channelKey) {
      return channel;
    }
  }
  throw new Error('Cannot found channel ' + channelKey);
}

function getOldEvents_() {
  var now = new Date();
  var start = new Date(now.getTime() - 86400 * 1000);
  var end = new Date('2030-12-31 23:59:59');
  var events = targetCalendar_.getEvents(start, end);
  var results = {};
  for (var event of events) {
    var m = event.getDescription().match(/https:\/\/youtu\.be\/(.{11})/);
    if (!m) {
      SheetLogger.log('%s | %s', event.getTitle(), event.getDescription());
      continue;
    }
    var videoId = m[1];
    results[videoId] = event;
    // Logger.log('[%s] %s - %s', videoId, event.getTitle(), event.getDescription())
  }
  return results;
}

/**
 * List your subscriptions with channel ID and Channel name
 */
function listSubscriptions() {
  var cnt = 0;
  var pageToken = '';
  while (true) {
    var results = YouTube.Subscriptions.list('snippet', {
      maxResults: 50,
      mine: true,
      pageToken: pageToken,
    });
    for (var i in results.items) {
      cnt += 1;
      var item = results.items[i];
      // Logger.log(item)
      Logger.log(
        '#%s [%s] %s',
        cnt.toString(),
        item.snippet.resourceId.channelId,
        item.snippet.title
      );
    }
    if (results.nextPageToken) {
      pageToken = results.nextPageToken;
    } else {
      break;
    }
  }
}
