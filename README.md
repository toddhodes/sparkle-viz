sparkle-viz
===========

javascript-animated visualization of location data.


### data

see the data/ dir for samples of the required data format 
(a list of json objects).

due to XSS security issues, by default, this data will be loaded from 
a local data/_PhoneNumber_.json file.  override this behavior by specifying a hostname
and URL for the live data in js/data.js.   a trivial sample server for loading and storing 
data in this format is provided in node.js/httpd.js
