
/** simple location data timestamp --> date formatting helper
 */

var util = require('util'),
    exec = require('child_process').exec,
    puts = require("sys").puts;

if (process.argv.length != 3) {
  puts("Usage: node formatDates.js <file-with-json-location-data>");
  puts("   eg: node formatDates.js data/5103326150.json");
  return;
}

var times = [];

puts('formatting dates from: ' + process.argv[2]);
var child = exec('grep time ' + process.argv[2] + ' | cut -d: -f2',
  function (error, stdout, stderr) {
     times = stdout.split(",");
     for (var i=0; i < times.length; i++) {
        var t = times[i].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        if (t != "") {
           puts(t + ": " + new Date(times[i] * 1000));
        }
     }

    //console.log('stdout: ' + stdout);
    //console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});

