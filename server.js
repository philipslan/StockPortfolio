// SET UP =====================================================================
var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');

var port = process.env.PORT || 7000;

app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/public/index'));
app.use(express.static(__dirname + '/public/overview'));

app.get('/', function (req, res) {
	res.sendFile('index.html');
});

app.get('/proxy', function (req,res) {
	http.get("http://murphy.wot.eecs.northwestern.edu/~psl463/portfolio/server.py", function(response) {
		var body = '';
		response.on('data', function(d) {
		    body += d;
		});
		response.on('end', function() {
		    res.send(body);
		});
	}).on('error', function(e) {
	  console.log("Got error: " + e.message);
	});
});

app.post('/proxy', function (req,res) {	 
	// Configure the request
	var options = {
	    url: 'http://murphy.wot.eecs.northwestern.edu/~psl463/portfolio/server.py',
	    method: 'POST',
	    form: req.body
	}
	// Start the request
	request(options, function (error, response, body) {
		res.send(body);
	});
});

app.listen(port);
console.log("App listening on port " + port);