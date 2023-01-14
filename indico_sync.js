/**
Synchronize Indico with GoogleCalendar.
*/

function sync(config) {
  /* config:{
    gcal_id : "ABC...123@group.calendar.google.com",
    file : "name.json",
    //OR
    url : "https://indico.xx/indico/export/categ/xx.json" +
    "?from=-7d&detail=contributions&apikey=abc-123-xyz",
    filter: function(event),
  }
  */
  var json;
  if ("file" in config) {  // get values from file
    var files = DriveApp.getFilesByName(config.file);
    if (!files.hasNext()) {
      throw new Error("no such file: " + config.file);
    }
    json = files.next().getBlob().getDataAsString();
  }
  else if ("url" in config) {  // fetch values from url
    try {
      json = fetch_url(config.url);
    }
    catch(error) {
      Logger.log(config.url, error);
    }
  }
  
  var events = parse_indico(json);
  if (! events) { // null
    return;
  }
  
  if ("event_filter" in config) {
    events = events.map(config.event_filter);
  }
  
  //addEvents(config.gcal_id, events);
  api3_addEvents(config.gcal_id, events);
  return;
}


function fetch_url(url) {
  var response = UrlFetchApp.fetch(url, {'muteHttpExceptions': true});
  var json = response.getContentText();
  return json;
}


function strip_tags(html) {
  return html.replace(/<(?:.|\n)*?>/gm, '');
}


function api3_addEvents(calendar_id, events) {
  // add events to calendar using GoogleCalendar APIv3.
  events.map(function(event) {
    var item;
    try {
      // create
      item = Calendar.Events.insert(event,
                           calendar_id);
      Logger.log('created: ' + item.getId());
    } catch (err) {
      if (err.message.indexOf("already exists") >=0){
        // update, if already exists.
        item = Calendar.Events.update(event,
                           calendar_id,
                           event.id);
        Logger.log('updated: ' + item.getId());
      }
    }
  });
}

function addEvents(calendar_id, events) {
  // add events to calendar
  var calendar = CalendarApp.getCalendarById(calendar_id);
  
  if (!calendar) {
    Logger.log("no such calendar");
    return;
  }
  
  var tz_orig = calendar.getTimeZone();
  
  for (i = 0; i< events.length; i++) {
    event = events[i];
    calendar.setTimeZone(event.start.timeZone);
    start_date = new Date(event.start.dateTime);
    end_date = new Date(event.end.dateTime);
    description = event.description;
    //description += "\n" + event.id;
    
    olds = calendar.getEventsForDay(start_date, {'search': event.id});
    if(olds[0]) {  //already exists {
      Logger.log(olds);
      continue;  //TODO: update/recreate event;
    }
    item = calendar.createEvent(
      event.title,
      start_date,
      end_date,
      {'description': description,
       'location': event.location,
      }
      );
    Logger.log('event created: ' + item.getId());
  }
 
  calendar.setTimeZone(tz_orig);
}


var Event = function(obj) {
  this.id = obj.id;
  this.summary = obj.title;
  this.location = obj.room; 
  this.description = strip_tags(obj.description);
  
  this.start = {
    'dateTime': obj.startDate.date + "T" + obj.startDate.time, //'2015-05-28T09:00:00-07:00',
    'timeZone': obj.startDate.tz, //'America/Los_Angeles'
  };
  
  this.end = {
    'dateTime': obj.endDate.date + "T" + obj.endDate.time,
    'timeZone': obj.endDate.tz,
  };
  
  this.authors = obj.chairs.map( function(chair) {
    return {
      name: chair.fullName,
      affiliation: chair.affiliation,
      email: chair.email,
    };
  });
  
};
 

function parse_indico(json) {
  /** Parse indico exported JSON. 
  Return a list of events.
  */ 
  if (! json) {  // undefined
    return null;
  }
  var data = JSON.parse(json);
  var results = data.results;
  if (! results) {
    return null;
  }
  
  var events = results.map(function(res) {
       return new Event(res);
  });
  
  return events;
}
