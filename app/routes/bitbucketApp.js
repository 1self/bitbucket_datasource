var _ = require('underscore');
var usersRepo = require('./../repositories/users');
var btbktRest = require('./../services/bitbucketRestService');
var qdRest = require('./../services/qdRestService');

function doesPushStreamIdExists(user){
    return user && user.pushStreamId;
}

function findStreamById(streams,streamid){
    var result = null;
    _.each(streams,function(stream){
        if(streamid == stream.streamid){
            result = stream;
        }
    });
    if(!result){
        throw Error('Stream for id '+ streamid +' does not exist.');
    }else{
        return result;
    }
}

app.get('/refresh_push_events',function(req,res){
    var user = usersRepo.findByUsername(req.session.username)
    .then(function(user){

        if(!doesPushStreamIdExists(user)){
            qdRest.createStream()
            .then(function(newStream){
                    usersRepo.linkPushEventStreamToUser(newStream,user.username);
                    btbktRest.getPushEventsForUser(req.session.username)
                    .then(function(events){
                        return qdRest.transformToQdEvents(events,newStream.streamid)
                    })
                    .then(function(qdEvents){
                       qdRest.postEventsToQdApi(qdEvents,newStream.writeToken)
                    })
            })
            .then(function(){
                 res.send('events being posted to qd');
            })
            .catch(function (error){
              console.log('Error posting events. '+ error);
            });

        }else{
            var stream = findStreamById(user.streams,user.pushStreamId)
            btbktRest.getPushEventsForUser(req.session.username)
            .then(function(events){
                return qdRest.transformToQdEvents(events,stream.streamid)
               })
            .then(function(qdEvents){
                     qdRest.postEventsToQdApi(qdEvents,stream.writeToken)
                })
            .then(function(){
                res.send('events being posted to qd');
            })
            .catch(function (error){
                console.log('Error posting events. '+ error);
            })
        }
    })
});

app.get('/logout', function(req, res){
  req.session.destroy(function(){
      res.redirect('/');
  });
});

/*//Todo: Post hook for bitbucket push events
var addPostHookForPushEvents = function(){
    var user = {
        userName : 'shruti514',
        repoName : 'test_repo'
    };
    var options = {
                    url: 'https://api.bitbucket.org/1.0/repositories/' +user.userName+'/'+
                    user.repoName+'/services/ -data type=POST&URL='+properties.get('CONTEXT_URI')+'/event',
                  };
                request(options, function (err, res, body) {

                var parsedData = JSON.parse(body);
                var fileName = __dirname +'/temp/parsedBody';
                          fs.writeFile(fileName, JSON.stringify(res, null, 4), function(err) {
                              if(err) {
                                console.log(err);
                              } else {
                                console.log('JSON saved to ' + fileName);
                              }
                          });
    });
}*/
