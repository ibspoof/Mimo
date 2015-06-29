/**
* Module dependencies.
*/

var express = require('express')
, http = require('http')
, path = require('path')
, fs = require('fs')
, qs = require('querystring')
, persist = require("persist")
, morgan = require('morgan')
, cookieParser = require('cookie-parser')
, methodOverride = require('method-override')
, errorHandler = require('errorhandler')
, hbs = require('hbs');

var CorsaHelper = require('./lib/Corsa/helper');

var app = express();

GLOBAL.hash = "dsfsd$@@Wdsafasd23e8";
GLOBAL.cookieHash = "dsf*jasda9#@#(@dsd";
GLOBAL.cookieName = "mimoData";
GLOBAL.app = app;

// Due to some XML stuff, we need to override the default bodyParser
app.use(function (req, res, next)
{
	var data = '';
	req.on('data', function (chunk)
	{
		data += chunk;
	});
	req.on('end', function ()
	{
		if (req.get('content-type') == 'application/x-www-form-urlencoded') {
			req.postData = req.body = qs.parse(data);
		}
		if (req.is('json')) {
			req.body = JSON.parse(data);
		}
		req.rawBody = data;
		next();
	});
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.use(morgan('dev'));
app.use(cookieParser());
app.use(methodOverride());
app.use(express.static(path.join(__dirname, 'public')));

// overide jade with Handlebars
app.set('view engine', 'html');
app.engine('html', require('hbs').__express);

hbs.registerPartials('./views/partials');

// development only
if ('development' == app.get('env')) {
	app.use(errorHandler());
}


persist.connect({
	driver: 'sqlite3',
	filename: './data/mimo.sqlite',
	trace: false
}, function (err, connection)
{
	if (err) {
		throw new Error("unable to connect to db");
	}
	GLOBAL.persist = persist;
	GLOBAL.connection = connection;
});


// bring in router
require('./router')(app);

if (app.get('env') == 'development') {

	http.createServer(app).listen(app.get('port'), function ()
	{
		console.log('Express server listening on port ' + app.get('port'));
	});

} else {
	var cluster = require('cluster');
	var numCPUs = require('os').cpus().length;

	if (cluster.isMaster) {
		// Fork workers.
		for (var i = 0; i < numCPUs; i++) {
			cluster.fork();
		}

		cluster.on('exit', function (worker, code, signal)
		{
			console.log('worker ' + worker.process.pid + ' died');
		});

	} else {
		http.createServer(app).listen(8000,function ()
		{
			console.log('Express server listening on port 8000');
		}).listen(app.get('port'));
	}
}
