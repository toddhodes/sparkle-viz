

// Class
function Location(/*location*/ l) {
  this.id = l.id;
  this.lon = l.lon;
  this.lat = l.lat;
  this.unc = l.unc;
  this.time = l.time;
  this.expiration = l.expiration;
  this.latLng = function() {
    return new google.maps.LatLng(this.lat, this.lon);
  };
}

// Class
function TravelSpan(/*location*/ src, /*location*/ dest) {
  this.src = new Location(src);
  this.dest = new Location(dest);

  this.startTime = src.time;
  this.endTime = dest.time;
  this.timeSpan = dest.time - src.time;

  this.getPosAtTime = function(time) {
    if (!this.timeSpan)
      return undefined;

    var frac_dest = (time - this.startTime) / this.timeSpan;
    var frac_src = (this.endTime - time) / this.timeSpan;
    //console.debug((frac_dest*100).toFixed(0) + "% along dest");

    var lat = (this.src.latLng().lat() * frac_src)
                + (this.dest.latLng().lat() * frac_dest);
    var lon = (this.src.latLng().lng() * frac_src)
                + (this.dest.latLng().lng() * frac_dest);
    //console.debug("lat: " + lat +", lon:"+ lon);

    return new google.maps.LatLng(lat, lon);
  };

  this.equals = function(cmp) {
    if (this.src.id == cmp.src.id && this.dest.id == cmp.dest.id)
      return true;
    return false;
  };
}

// Class
function DataContainer() {
  this.locData = [];
  this.travelSpans = [];
  this.beginTime = 0;
  this.endTime = 0;

  this.load = function(dayOffset) {
    this.locData = [];
    var mdn = urlArg("mdn");
    if (mdn == "") mdn = "5105551212";

    // due to XSS security issues, generally can't access
    // sparkledemo; thus we need this for local devel
    var url = 'data/' + mdn + '.json';
    if (window.location.hostname == "sparkledemo.locationlabs.com") {
      url = 'http://sparkledemo.locationlabs.com/'
              + 'finder-att-family/location_feed/' + mdn + '/playback.svc';
    }

    var xhrArgs = {
      url: url,
      handleAs: 'json',
      container: this,
      postLoad: function() {
        this.container.computeTimeline();
        setTimeout(refresh,100); // update UI to new data
      },
      load: function(data) {
        var du = new DateUtil();
        for (var b in data) {
          var l = data[b].location;
          if(du.isOnThisDayOffset(l.time, dayOffset))
            this.container.locData.push(data[b]);
        }
        this.postLoad();
      },
      error: function(error) {
        console.warn("An unexpected error occurred: " + error);
        //console.warn("using default data");
        //locData = defaultLocationData;
        this.postLoad();
      }
    };
    var deferred = dojo.xhrGet(xhrArgs);
  };

  this.computeTimeline = function() {
    this.travelSpans = [];
    dojo.query(".tick").orphan();

    var cnt = this.locData.length;
    if (cnt < 2) {
      //alert("Need at least two locations to animate anything");
      return false;
    }

    this.beginTime = this.locData[0].location.time;
    this.endTime = this.locData[this.locData.length-1].location.time;

    for (var i=0; i < cnt-1; i++) {
      var travelSpan = new TravelSpan(this.locData[i].location,
                                      this.locData[i+1].location);
      this.travelSpans.push(travelSpan);
    }
    //console.debug("travelspans: ", this.travelSpans);

    var ticks = this.getTickPercentages();
    console.log("ticks: " , ticks);
    var tickHolder = dojo.byId("timelineBackground");
    for (var tick in ticks) {
      var left = 20 + ticks[tick]/100 * TIMELINE_WIDTH;
      dojo.create("span", { 'class': "tick",
                            style: { left: left.toFixed(0)+"px" }
                          }, tickHolder);
    }

    return true;
  };

  this.getTickPercentages = function() {
    var ticks = [];
    var cnt = this.locData.length;
    for (var i=0; i < cnt; i++) {
      ticks.push(this.getPercentAt(this.locData[i].location.time).toFixed(2));
    }
    return ticks;
  };

  this.getTimeAt = function(percentComplete) {
    var offset =  (this.endTime - this.beginTime) * (percentComplete / 100);
    return this.beginTime + offset;
  };

  this.getPercentAt = function(time) {
    return 100 * (time - this.beginTime) / (this.endTime - this.beginTime);
  };

  this.getTravelSpan = function(time) {
    //console.debug("getTravelLoc(" + time+ "), beginTime="+ this.beginTime);
    var lastLoc = 0;
    var nextLoc = 1;

    var cnt = this.locData.length;
    for (var i=0; i < cnt; i++) {
      var locVal = this.locData[i].location;
      if (time > locVal.time) {
        lastLoc = i;
      } else {
        nextLoc = i;
        break;
      }
    }

    if (time == this.beginTime) {
      lastLoc = 0;
      nextLoc = 1;
    }
    if (time == this.endTime) {
      lastLoc = cnt-1;
      nextLoc = 0;
    }

    var dbgmsg = "on path: " + lastLoc + " -> " + nextLoc;
    if (dbgmsg != this.lastdbgmsg) {
      console.debug(dbgmsg);
      this.lastdbgmsg = dbgmsg;
    }

    var span = new TravelSpan(this.locData[lastLoc].location,
                              this.locData[nextLoc].location);

    return span;
  };
  this.lastdbgmsg = undefined;

  this.getPathAtTime = function(time) {
    var curSpan = this.getTravelSpan(time);
    var posNow = curSpan.getPosAtTime(time);
    if (!posNow)
      return undefined;
    //console.debug("posNow", posNow);

    var path = new google.maps.MVCArray();

    var cnt = this.travelSpans.length;
    for (var i=0; i < cnt; i++) {
      path.push(this.travelSpans[i].src);
      if (this.travelSpans[i].equals(curSpan)) {
        break;
      }
    }

    // special case last span dest, which otherwise wouldn't get added
    if (time == this.endTime) {
      path.push(this.travelSpans[i-1].dest);
    }

    path.push(new Location({ lat: posNow.lat(),
                             lon: posNow.lng(),
                             unc: 0 }));
    return path;
  };

};


//Class
function DateUtil() {

  this.startOfDay = function(date) {
    var day = new Date(date.getTime());
    day.setHours(0);
    day.setMinutes(0);
    day.setSeconds(0);
    day.setMilliseconds(0);
    return day;
  };

  this.endOfDay = function(date) {
    var day = new Date(date.getTime());
    day.setHours(23);
    day.setMinutes(59);
    day.setSeconds(59);
    day.setMilliseconds(999);
    return day;
  };

  this.isOnThisDay = function(timeSecs, thisdate) {
    var dayStart = this.startOfDay(thisdate);
    var dayEnd = this.endOfDay(thisdate);
    var timeMillis = timeSecs * 1000;
    if (dayStart.getTime() <= timeMillis
          && timeMillis <= dayEnd.getTime())
      return true;
    return false;
  };

  this.dateFromDayOffset = function(dayOffset) {
    var time = new Date();
    time.setDate(time.getDate() + dayOffset);
    return time;
  };

  this.isOnThisDayOffset = function(timeSecs, offset) {
    var thisdate = this.dateFromDayOffset(offset);
    var is = this.isOnThisDay(timeSecs, thisdate);
    return is;
  };
}





