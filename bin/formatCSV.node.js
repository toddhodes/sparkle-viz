
/** location data json --> CSV formatter
 */

var util = require('util'),
    exec = require('child_process').exec,
    puts = require("sys").puts;

if (process.argv.length != 3) {
  puts("Usage: node formatCSV.node.js <file-with-json-location-data>");
  puts("   eg: node formatCSV.node.js data/5103326150.json");
  return;
}


//puts('formatting data from: ' + process.argv[2]);

var mdn = process.argv[2].split("/")[1].split(".")[0];

var child = exec('cat ' + process.argv[2],
  function (error, stdout, stderr) {
    var locs = JSON.parse(stdout);
    puts('# mdn,locateid,date,lon,lat,uncertainty');
    for (var i=0; i < locs.length; i++) {
      var l = locs[i].location;
      puts(mdn + ","
           + l.id +","
           + new Date(l.time * 1000) + ","
           + l.lon.toFixed(6) + ","
           + l.lat.toFixed(6) + ","
           + l.unc
          );

    }
    //console.log('stdout: ' + stdout);
    //console.log('stderr: ' + stderr);

    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

