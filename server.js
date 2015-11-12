// SET UP =====================================================================
var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var ts = require("timeseries-analysis");

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

app.post('/stocks', function (req,res) {
	var stock = "http://www.google.com/finance/info?q="+req.body.stock;
	http.get(stock, function(response) {
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

app.post('/predict', function (req, res) {
	var testset = req.body.data;
	testset = testset.map(function(data){
		return [new Date(data[0]), data[1]];
	});
	// We're going to forecast the nth datapoint
	var forecastDatapoint = testset.length + 1;
	var t = new ts.main(testset);
	console.log(t.data);
	 
	// We calculate the AR coefficients of the 10 previous points
	var coeffs = t.ARMaxEntropy({
	    data:   t.data.slice(0,testset.length)
	});
	 
	// Output the coefficients to the console
	console.log(coeffs);
	 
	// Now, we calculate the forecasted value of that 11th datapoint using the AR coefficients:
	var forecast    = 0;    // Init the value at 0.
	for (var i=0;i<coeffs.length;i++) { // Loop through the coefficients
	    forecast -= t.data[testset.length-1-i][1]*coeffs[i];
	    // Explanation for that line:
	    // t.data contains the current dataset, which is in the format [ [date, value], [date,value], ... ]
	    // For each coefficient, we substract from "forecast" the value of the "N - x" datapoint's value, multiplicated by the coefficient, where N is the last known datapoint value, and x is the coefficient's index.
	}
	console.log("forecast",forecast);
	var results = {
		data: testset,
		forecast: forecast
	}
	res.json(results);
});

app.listen(port);
console.log("App listening on port " + port);