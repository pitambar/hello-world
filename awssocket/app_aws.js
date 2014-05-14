var http = require('http');
var AWS = require('aws-sdk');

var request = require("request");


http.createServer(function(request1, response) 
	{
	console.log("inside server");
	var options = {
			 host : 'graph.facebook.com', // here only the domain name
			    // (no http/https !)
			    port : 443,
			    path : '/youscada', // the rest of the url with parameters if needed
			    method : 'GET' // do GET
			};

			http.request(options, function(res) {
			  console.log('STATUS: ' + res.statusCode);
			  console.log('HEADERS: ' + JSON.stringify(res.headers));
			  res.setEncoding('utf8');
			  res.on('data', function (chunk) {
			    console.log('BODY: ' + chunk);
			  });
			}).end();

}).listen(8124);
 
console.log('Server running at http://127.0.0.1:8124/');