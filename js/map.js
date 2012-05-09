
var TIMELINE_LEFT_EDGE = 0;
var TIMELINE_IMG_WIDTH = 892;
var TIMELINE_RIGHT_EDGE = TIMELINE_IMG_WIDTH - 82 - 68;
var TIMELINE_WIDTH = TIMELINE_RIGHT_EDGE - TIMELINE_LEFT_EDGE;


// DataContainer
var data;
var dateutil = new DateUtil();

// divs
var nub;
var map;

// map overlays
var polyline;
var accuracyCircles = [];
var accuracyCircleMarkers = [];
var highlightCircle;

// play state
var playing = 0;
var dayOffset = 0;

// reverse geocode + cache
var geocoder = new google.maps.Geocoder();
var revgeocodeCache = {};
var geomisses =0, geohits =0;


function createMap() {
  // create the map
  var latlng = new google.maps.LatLng(37.828,-122.3);
  var myOptions = {
    zoom: 14,
    center: latlng,
    panControl: false,
    zoomControl: true,
    zoomControlOptions: {
      position: google.maps.ControlPosition.LEFT_CENTER
    },
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  map = new google.maps.Map(document.getElementById("map_canvas"),
                            myOptions);
  addBasePolygons();
}

function addBasePolygons() {
  var polyOptions = {
    strokeColor: "#9C09CD",
    strokeOpacity: 0.35,
    strokeWeight: 2
  };
  polyline = new google.maps.Polyline(polyOptions);
  polyline.setMap(map);

  accuracyCircles = [];
  accuracyCircleMarkers = [];
}

function clearPolygons() {
  polyline.setMap(null);
  clearCircles();
  addBasePolygons();
}

function clearCircles() {
  for (var c in accuracyCircles) {
    accuracyCircles[c].setMap(null);
  }
  accuracyCircles = [];
  for (var cm in accuracyCircleMarkers) {
    accuracyCircleMarkers[cm].setMap(null);
  }
  accuracyCircleMarkers = [];
  if (highlightCircle)
    highlightCircle.setMap(null);
  highlightCircle = undefined;
}


function doMove() {
  if (!playing) return;

  var lpos = parseInt(nub.style.left);
  lpos += 1;
  if (lpos > TIMELINE_RIGHT_EDGE) {
    lpos = TIMELINE_LEFT_EDGE;
    clearPolygons();
      // tmp fix for map refresh bug
    nub.style.left = lpos + 'px';
    dojo.attr(dojo.byId("pauseButton"), "id", "mainButton");
    playing = 0;
    return;
  }
  nub.style.left = lpos + 'px';

  updatePath();

  setTimeout(doMove,200); // animation loop
}

function updatePath() {
  var lpos = parseInt(nub.style.left);
  var progressPercent = 100 * ((lpos-TIMELINE_LEFT_EDGE)/TIMELINE_WIDTH);
  var curTime = data.getTimeAt(progressPercent);
  if (!curTime) return;

  updateTime(curTime);

    // get latest path
  var locs = data.getPathAtTime(curTime);
  if (!locs) return;

    // line
  var path = new google.maps.MVCArray();
  locs.forEach(function(element) { path.push(element.latLng()); });
  if (path.getLength() > 1)
    polyline.setPath(path);

    // circles (one less than #locations: last is path endpoint)
  var c, llen = locs.getLength(), clen = accuracyCircles.length;
  //console.debug("#locs,circs=",llen,clen);
  for (c = clen; c < llen-1; c++) {
    var element = locs.getAt(c);
    if (element.id) {
      createCircle(element);
    }
  }
  //console.debug("revgeo #hits,#misses=",geohits,geomisses);

  if (llen <= clen) {
    for (c = llen; c <= clen; c++) {
      accuracyCircles.pop().setMap(null);
    }
    clen = accuracyCircleMarkers.length;
    for (c = llen; c <= clen; c++) {
      accuracyCircleMarkers.pop().setMap(null);
    }
  }

    // update highlight circle if lengths don't match
  if (llen > 1 && llen-1 != clen) {
    if (highlightCircle)
      highlightCircle.setMap(null);

    var highlCirOptions = {
      strokeColor: '#008800',
      strokeOpacity: 0.8,
      strokeWeight: 1,
      fillColor: '#008800',
      fillOpacity: 0.35,
      map: map,
      center: locs.getAt(llen-2).latLng(),
      radius: locs.getAt(llen-2).unc
    };
    highlightCircle = new google.maps.Circle(highlCirOptions);
  }


  // center map
  var endpt = path.getAt(path.getLength()-1);
  //console.debug("endpt", endpt);
  if (endpt && !isNaN(endpt.lng()) && !isNaN(endpt.lat())) {
    var currBounds = map.getBounds();
    if (!latLngIsInsideBoundsExcludeEdge(endpt, currBounds, 15)) {
      //console.debug(currBounds);
      //map.fitBounds(currBounds.extend(endpt));
      map.panTo(endpt);
    }
  }
}

function latLngIsInsideBoundsExcludeEdge(latLng, bounds, edgePercent) {
  if (!bounds.contains(latLng)) return false;
  var ne = bounds.getNorthEast();
  var sw = bounds.getSouthWest();
  var width = ne.lng() - sw.lng();
  var height = ne.lat() - sw.lat();
  var percFromLeft = (latLng.lng() - sw.lng()) / width * 100;
  var percFromBottom = (latLng.lat() - sw.lat()) / height * 100;
  //console.debug("percFromLeft/Bottom", percFromLeft, percFromBottom);
  if (percFromLeft <= edgePercent || percFromLeft >= 100-edgePercent
      || percFromBottom <= edgePercent || percFromBottom >= 100-edgePercent)
    return false;
  return true;
}

function createCircle(location) {
  var locCirOptions = {
    strokeColor: '#9C09CD',
    strokeOpacity: 0.8,
    strokeWeight: 1,
    fillColor: '#9C09CD',
    fillOpacity: 0.35,
    map: map,
    center: location.latLng(),
    radius: location.unc
  };
  var circ = new google.maps.Circle(locCirOptions);
  accuracyCircles.push(circ);

  function addCircleAddresses(location) {
    var ll = location.latLng();
    if (revgeocodeCache[location.id]) {
      var text = fmtDate(location.time) + ": "
                   + revgeocodeCache[location.id];
      createMarker(ll, text);
      return;
    }

    // ll --> addr not cached; retrieve
    geocoder.geocode({'latLng': ll}, function(results, status) {
      var text = fmtDate(location.time) + ": ";

      if (status == google.maps.GeocoderStatus.OK && results[0]) {
        console.debug(results[0].formatted_address);
        text += results[0].formatted_address;
        revgeocodeCache[location.id] = results[0].formatted_address;
        geohits++;
        //console.debug("new revgeo cache", Object.keys(revgeocodeCache));
      } else {
        text += ll;
        geomisses++;
        // many misses due to rate limiting. should manage this better
      }
      createMarker(ll, text);
    });
  }

  // add address info to accuracy circle via marker
  addCircleAddresses(location);
}

function createMarker(ll, text) {
  var marker = new google.maps.Marker({
    position: ll,
    map: map,
    icon: 'images/circle_transparent.png',
    title: text
  });
  accuracyCircleMarkers.push(marker);
}

function refresh() {
  var msgElem = document.getElementById('mainMsg');
  msgElem.innerHTML = data.locData.length + " location updates";

  updateTime(dateutil.dateFromDayOffset(dayOffset).getTime()/1000);
  clearPolygons();
  updatePath();
}


window.onload = function() {
  nub = document.getElementById('sliderNub');
  nub.style.left = TIMELINE_LEFT_EDGE + 'px'; // initial position

  // load location data
  data = new DataContainer();
  data.load();

  createMap();
};



// calendar controls

function incrOffset() {
  dayOffset++;
  updateTime(dateutil.dateFromDayOffset(dayOffset).getTime()/1000);
  data.load(dayOffset);
}
function decrOffset() {
  dayOffset--;
  updateTime(dateutil.dateFromDayOffset(dayOffset).getTime()/1000);
  data.load(dayOffset);
}
