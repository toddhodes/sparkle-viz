
var sys = require("sys");
puts = require("sys").puts;
var c = 0;
setInterval(function () {
  c += 500;
  puts("hello " + c + "ms");
}, 500);

process.addListener("SIGINT",
  function () {
    puts("goodbye");
    process.exit(0)
  });


var http = require('http');
var s = http.createServer(function (req, res) {
  req.on('data', function (chunk) { 
    console.log('BODY: ' + chunk);
  });
  console.log(req.headers);
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Hello World\n');
});
s.listen(8124, "127.0.0.1");
console.log('Server running at http://127.0.0.1:8124/');




//////////////////////////


var util   = require('util'),
    exec  = require('child_process').exec,
    child;

child = exec('cat samples.js bad_file | wc -l',
  function (error, stdout, stderr) {
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + stderr);
    if (error !== null) {
      console.log('exec error: ' + error);
    }
});


var spawn = require("child_process").spawn;
var ls = spawn('ls', ['-lh', '/tmp']);
ls.stdout.on('data', function (data) {
  console.log('stdout: ' + data);
});
ls.stderr.on('data', function (data) {
  console.log('stderr: ' + data);
});
ls.on('exit', function (code) {
  console.log('child process exited with code ' + code);
});
