
var sys = require("sys"),
    fs = require("fs"),
    http = require('http'),
    util = require('util'),
    puts = require("sys").puts;

var reqs = 0,
    posts = 0;


function log(arg) {
  puts(new Date() + ': ' + arg + '\n');
}

function stat() {
  log("have recv'd " + (reqs-posts) + " GETs, " + posts + " POSTs");
}
//setInterval(stat, 15000);

process.addListener("SIGINT",
                    function () {
                      stat();
                      log("goodbye");
                      process.exit(0);
                    });

var s = http.createServer(function(req,res) {
  console.log(req.headers);

  req.on('data', function (chunk) {
    console.log('\n' + chunk);
    var locStore =
      fs.createWriteStream('data/captured-data.txt', {'flags': 'a'});
    locStore.write(new Date() + ": " + chunk + '\n');

    var jsonStore =
      fs.createWriteStream('data/captured-data.json', {'flags': 'a'});
    jsonStore.write((""+chunk).replace("[","").replace("]","") + '\n');

    posts++;
  });

  reqs++;

  fs.readFile('data/captured-data.json', 'UTF-8', function (err, data) {
    if (err) throw err;
    res.writeHead(200, {'Content-Type': 'application/json'});
    var delimited = data.replace(/}{/, '},\n {').replace(/}\n/g, '},\n ');
    res.end(("[\n " + delimited + "]\n").replace(",\n ]","\n]"));
  });
});
//s.listen(8421, "127.0.0.1");
s.listen(8421);
log('Server running at http://'+ s.address().address + ':' + s.address().port);
//console.log(util.inspect(s.address(), true, null));


