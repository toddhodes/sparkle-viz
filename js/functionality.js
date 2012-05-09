// JavaScript Document

  dojo.require("dojo.fx");
  dojo.require("dojo.dnd.Moveable");
  dojo.require("dojo.dnd.move");
  dojo.addOnLoad(function(){
    var logo = dojo.byId("logo"),
        sliderNub = dojo.byId("sliderNub"),
        timeline = dojo.byId("timelineBackground");
    var f1 = function() {
      b = {};
      b["t"] = -2;
      b["l"] = TIMELINE_LEFT_EDGE;
      b["w"] = TIMELINE_IMG_WIDTH - 82;
      b["h"] = 56;
      return b;
    };

    var moveableObj =
      new dojo.dnd.move.constrainedMoveable("sliderNub",
                                            { handle: "mainController",
                                              constraints: f1,
                                              within: true });
    dojo.connect(moveableObj, "onFirstMove", function(event){
                   //console.log("onFirstMove",event);
                 });
    dojo.connect(moveableObj, "onMoveStop", function(event) {
                   //console.log("onMoveStop",event);
                   updatePath();
                 });

    var mainButton = dojo.byId("mainButton");

    var playPauseToggle = function(){
      if (!playing) {
        dojo.attr(mainButton, "id", "pauseButton");
        var pauseButton = dojo.byId("pauseButton");
        playing = 1;
        doMove();
      } else {
        dojo.attr(dojo.byId("pauseButton"), "id", "mainButton");
        playing = 0;
      }
    };
    dojo.connect(mainButton, "onclick", playPauseToggle);

    dojo.connect(logo, "onclick", function() {
      //code for logo click through
      window.location = "selectDeviceToLocate.html";
    });
  });


  if (!Object.keys) {
    Object.keys = function(obj) {
        var keys = new Array();
        for (k in obj) if (obj.hasOwnProperty(k)) keys.push(k);
        return keys;
    };
  }


function updateTime(time, progressPercent) {
  var dt = new Date(time*1000);
  var timeElem = document.getElementById('timeMsg');
  timeElem.innerHTML = dt.format("h:MMtt");
  if (progressPercent) {
    timeElem.innerHTML += "<p>(" +progressPercent.toFixed(1) +"%)</p>";
  }
  var dateElem = document.getElementById('dateMsg');
  dateElem.innerHTML = dt.format("mmmm dS, yyyy");
}

function fmtDate(time) {
  var dt = new Date(time*1000);
  return dt.format("mmmm dS, yyyy h:MMtt");
}

function urlArg(name) {
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp(regexS);
  var results = regex.exec(window.location.href);
  if (results == null)
    return "";
  else
    return results[1];
}

