var swig = require('swig');
var express = require('express');
var session = require("express-session");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('./util/oauthConfig')
var server;

app = express();

app.use(cookieParser());
app.use(session({ secret: 'keyboard cat',
                  cookie: {maxAge: 24*60*60*1000}
                }));
app.engine('html', swig.renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(passport.initialize());
app.use(passport.session());

require('./routes');

var start = exports.start = function start(port,callback){
    server = app.listen(port,callback);
}

var stop = exports.stop = function stop(callback){
    server.close(callback);
}


