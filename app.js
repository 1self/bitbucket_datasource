var swig = require('swig');
var _ = require("underscore");
var express = require('express');
var session = require("express-session");
var request = require("request");
var util = require('util');
var env = require('node-env-file');
var qs = require('querystring')
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var fs = require('fs');
var crypto = require('crypto');
var moment = require("moment");
var uuid = require('node-uuid');
var ObjectId = require('mongodb').ObjectID;
var passport = require('passport');
var BitbucketStrategy = require('passport-bitbucket').Strategy;
var mongoDbConnection = require('./public/js/data/connection.js');

var BITBUCKET_CONSUMER_KEY = "qV9nLJEV3qdaazVXdZ"
var BITBUCKET_CONSUMER_SECRET = "Z3Am42b7eTP6rCnVTxNmNm55pURqCCT3";
var sessionSecret = process.env.SESSION_SECRET;

var CONTEXT_URI = 'http://app.qdbitbucket:4000';


var app = express();
var server;

app.use(cookieParser());
app.use(session({ secret: 'keyboard cat',
                  cookie: {maxAge: 24*60*60*1000}
                }));


app.engine('html', swig.renderFile);
app.set('views', __dirname + '/views');
app.set('view engine', 'html');
env(__dirname + '/.env');
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
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
      return done(null, bitbucketProfile);
  }
));

passport.serializeUser(function (user, done) {
        done(null, user);
});

passport.deserializeUser(function (obj, done) {
        done(null, obj);
});


function getPushEvents(response,callback){
     var oauth ={
          consumer_key: BITBUCKET_CONSUMER_KEY
        , consumer_secret: BITBUCKET_CONSUMER_SECRET
            }
        var url = 'https://bitbucket.org/api/1.0/users/shruti514/events';
        request.get({url:url, oauth:oauth, json:true}, function (err, res, body) {
            if (err){
                console.error(err);
            }
            callback(response,body);
        });
}

var singleEventTemplate = {
    "actionTags": [
        "Bitbucket",
        "Push"
    ],
    "source": "Bitbucket",
    "objectTags": [
        "Computer",
        "Software",
        "Source Control"
    ],
    "streamid": "",
    "properties": {}
};

function clone(a) {
    return JSON.parse(JSON.stringify(a));
}

var transformToQdEvent=function(events,streamid){
    var qdEvents = [];
        _.each(events, function (event) {
            var qdEvent = clone(singleEventTemplate);
            qdEvent.streamid = streamid;
            qdEvent.eventDateTime = {
                "$date": moment(event.created_at).format()
            };
            qdEvents.push(qdEvent);
        });
    return qdEvents;
}

function findPushStreamByUsername(username,callback){
    var usernameQuery = {
        "bitbucketUsername": username
    };
    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').findOne(usernameQuery, function (err, user) {
           callback(err,user.bitbucketUser.pushStreamId);
        });
    });
}

function linkPushStreamToUser(stream,bitbucketUsername,callback){
    var query = {
        "bitbucketUsername": bitbucketUsername
    };
    var updateQuery = {
        $set: {
            "bitbucketUser.pushStreamId": stream.streamid
        },
        $push: {
            "streams": {
            "streamid": stream.streamid,
            "readToken": stream.readToken,
            "writeToken" : stream.writeToken
            }
        }
    };
    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').update(query, updateQuery, {
            upsert: true
        },
        function (err, user) {
            callback(err,user);
        });
    });
}

function findPushStreamIdByUsername(bitbucketUsername,callback){
    var query = {
        "bitbucketUsername": bitbucketUsername
    };
    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').findOne(query, function (err, user) {
            callback(err,user);
        });
    });
}



var handleCallback = function (req, res) {
var bitbucketUsername;
    var byBitbucketUsername = {
        "bitbucketUser.username": req.user.profile.username
    };
    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').findOne(byBitbucketUsername, function (err, user) {
            if (!user) {
                insertBitbucketProfileInDb(req.user.profile,function(err,user){
                    if(err){
                        res.status(500).send("Database error");
                    }
                    bitbucketUsername = user.bitbucketUser.username;
                    req.session.bitbucketUsername = bitbucketUsername;
                        res.redirect(CONTEXT_URI+'/dashboard');
                });
            } else if(user && user.bitbucketUser.username) {
                bitbucketUsername = user.bitbucketUser.username;
                req.session.bitbucketUsername = bitbucketUsername;
                    res.redirect(CONTEXT_URI+'/dashboard');
            }
        });
    });

}

var setSession = function (req, user) {
        req.session.bitbucketUsername = user.bitbucketUser.username;
};

var insertBitbucketProfileInDb = function (userProfile,callback) {
    var username = userProfile.username;
    var getUserEmails = function(){
    var oauth ={
        consumer_key: BITBUCKET_CONSUMER_KEY
        , consumer_secret: BITBUCKET_CONSUMER_SECRET
    }
    var url = 'https://bitbucket.org/api/1.0/users/'+username+'/emails';
    request.get({url:url, oauth:oauth, json:true},
        function (err, res, body) {
            if (err){
                console.error(err);
            }
            _.each(JSON.parse(body), function (emailInfo) {
                    userProfile.emails.push(emailInfo.email);
            });
        });
    }
    var bitbucketUserRecord = {
        bitbucketUser: userProfile,
        registeredOn: new Date()
    }

    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').insert(bitbucketUserRecord, function (err, insertedRecords) {
            callback(err,insertedRecords[0]);
        });
    });
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

app.get('/auth/bitbucket/callback'
        , passport.authenticate('bitbucket', { failureRedirect: '/'})
        , handleCallback
);
app.get('/dashboard',function (req, res){
    res.render('dashboard');
});


app.get('/refresh_push_events',function(req,res){
    var streamId = findPushStreamIdByUsername(req.session.bitbucketUsername,function(err,pushStreamId){
        if(err){
            res.status(500).send("Database error");
        }
        if(pushStreamId){
            getPushEvents(res,function(res,result){
                    var listOfQdEvents = transformToQdEvent(result,pushStreamId);
                    res.json(listOfQdEvents);
                });
        }else{
            var qdUrl = process.env.QD_REST_APP_URL+'/stream';
            console.log('stream url : '+ qdUrl);
            request.post({url:qdUrl}, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var stream= JSON.parse(body);
                    streamId = stream.streamid;
                    linkPushStreamToUser(stream,req.session.bitbucketUsername,function(err,user){
                        if(err){
                            res.status(500).send("Database error");
                        }
                    });
                    getPushEvents(res,function(res,result){
                        var listOfQdEvents = transformToQdEvent(result,streamId);
                        res.json(listOfQdEvents);
                    });
                }else{
                    console.log(error);
                    res.status(response.status);
                }
            });
        }
    });
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
      res.redirect('/');
  });
});

var start = exports.start = function start(port,callback){
    server = app.listen(port,callback);
}

var stop = exports.stop = function stop(callback){
    server.close(callback);
}

/*var port = 4000;
start(port,function(){
    console.log("Listening on " + port);
})*/

