var properties = require('/home/ee/data/office/project/quantified_dev/bit_bucket_app/app/util/propertiesHelper');
var mongoDbConnection = require('./../util/connection');
var request = require("request");
var _ = require("underscore");
var moment = require("moment");

function findUserByUsername(bitbucketUsername,callback){
    var query = {
        "bitbucketUser.username": bitbucketUsername
    };
    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').findOne(query, function (err, user) {
            callback(err,user);
        });
    });
}

function getPushEvents(username,response,callback){
     var oauth ={
          consumer_key: properties.get('BITBUCKET_CONSUMER_KEY')
        , consumer_secret: properties.get('BITBUCKET_CONSUMER_SECRET')
            }
        var url = 'https://bitbucket.org/api/1.0/users/'+username+'/events?type=pushed';
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
        "bitbucketUser.username": username
    };
    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').findOne(usernameQuery, function (err, user) {
           callback(err,user.bitbucketUser.pushStreamId);
        });
    });
}

function linkPushStreamToUser(stream,bitbucketUsername,callback){
    var query = {
        "bitbucketUser.username": bitbucketUsername
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

var setSession = function (req, user) {
        req.session.bitbucketUsername = user.bitbucketUser.username;
};

var addPostHookForPushEvents = function(){
    var user = {
        userName : 'shruti514',
        repoName : 'test_repo'
    };
    var options = {
                    url: "https://api.bitbucket.org/1.0/repositories/" +user.userName+"/"+
                    user.repoName+"/services/ -data type=POST&URL="+properties.get('CONTEXT_URI')+"/event",
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


function postEventsToQdApi(res,events,writeToken,callback){
_.each(events,function(event){
    var options = {
                    url:  properties.get('QD_REST_APP_URL')+ '/stream/'+event.streamid+'/event',
                    json: event,
                    headers: {
                            'Authorization': writeToken,
                            'Content-Type' : 'application/json',
                            'Accept' : 'application/json'
                        }
                  };
    request.post(options,function(err,response,body){
       callback(err,body);
    })

  });
};


app.get('/refresh_push_events',function(req,res){
   findUserByUsername(req.session.bitbucketUsername,function(err,user){
        if(err){
            res.status(500).send("Database error");
        }
        if(user && user.bitbucketUser.pushStreamId){
            getPushEvents(req.session.bitbucketUsername,res,function(res,result){
                    var listOfQdEvents = transformToQdEvent(result.events,user.bitbucketUser.pushStreamId);
                    postEventsToQdApi(res,listOfQdEvents,user.streams[0].writeToken,function(err,body){
                    });
                     res.json(listOfQdEvents);
                });

        }else{
            var qdUrl = properties.get('QD_REST_APP_URL')+'/stream';
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
                    getPushEvents(req.session.bitbucketUsername,res,function(res,result){
                        var listOfQdEvents = transformToQdEvent(result.events,streamId);
                        postEventsToQdApi(res,listOfQdEvents,stream.writeToken,function(err,body){

                        });
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