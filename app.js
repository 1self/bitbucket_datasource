
/**
 * Module dependencies.
 */
var swig = require('swig');
var express = require('express'), routes = require('./routes');
var session = require("express-session");
var request = require("request");
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var crypto = require('crypto');
var moment = require("moment");
var uuid = require('node-uuid');
var ObjectId = require('mongodb').ObjectID;
var passport = require('passport');
var BitbucketStrategy = require('passport-bitbucket').Strategy;

var BITBUCKET_CONSUMER_KEY = "qV9nLJEV3qdaazVXdZ"
var BITBUCKET_CONSUMER_SECRET = "Z3Am42b7eTP6rCnVTxNmNm55pURqCCT3";

var CONTEXT_URI = 'http://app.qdbitbucket:4000';


var app = express();

app.engine('html', swig.renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));
app.use(session({ secret: 'keyboard cat' }));
app.use(passport.initialize());
app.use(passport.session());

exports.app = app;

passport.use(new BitbucketStrategy({
    consumerKey: BITBUCKET_CONSUMER_KEY,
    consumerSecret: BITBUCKET_CONSUMER_SECRET,
    callbackURL: CONTEXT_URI+"/auth/bitbucket/callback"
  },
  function(token, tokenSecret, profile, done) {
      var bitbucketProfile= {
        profile: profile,
        token: token
        };
        addPostHookForPushEvents();
      return done(null, bitbucketProfile);
  }
));

passport.serializeUser(function (user, done) {
        done(null, user);
});

passport.deserializeUser(function (obj, done) {
        done(null, obj);
});

app.get("/signup", function (req, res) {
        res.render('signup');
});

app.get('/', function (request, response) {
    response.redirect(CONTEXT_URI+'/signup');
});

app.get('/auth/bitbucket', passport.authenticate('bitbucket'), function(req, res){
    // The request will be redirected to Bitbucket for authentication, so this
    // function will not be called.
});

var handleCallback = function (req, res) {
    res.redirect(CONTEXT_URI+'/dashboard');
};

app.get('/dashboard',function (req, res){
    res.render('dashboard');
});


app.get('/auth/bitbucket/callback'
        , passport.authenticate('bitbucket', { failureRedirect: '/'})
        , handleCallback
);

app.get('/logout', function(req, res){
  req.session.destroy(function(){
      res.redirect('/');
  });
});

app.post('/event', function (req, res) {
    
}



var addPostHookForPushEvents = function(){
    var user = {
        userName : 'shruti514',
        repoName : 'test_repo'
    };
    var options = {
                    url: "https://api.bitbucket.org/1.0/repositories/" +user.userName+"/"+
                    user.repoName+"/services/ -data type=POST&URL="+CONTEXT_URI+"/event",
                  };
                request(options, function (err, res, body) {

                var parsedData = JSON.parse(body);
                var fileName = __dirname +'/temp/parsedBody';
                          fs.writeFile(fileName, JSON.stringify(res, null, 4), function(err) {
                              if(err) {
                                console.log(err);
                              } else {
                                console.log("JSON saved to " + fileName);
                              }
                          });
});
}

var port = 4000;
app.listen(port, function () {
    console.log("Listening on " + port);
});