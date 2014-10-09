var Q = require('q');
var request = require('request');
var _ = require('underscore');
var moment = require('moment');
var properties = require('./../util/properties')
var config = properties.config();

var qdRest = function(){

    //Todo[shruti]:need to handle location and properties
    var qdEventTemplate = {
        'eventDateTime': '',
        'dateTime': '',
        'streamid': '',
        'source': 'Bitbucket_app',
        'version': '0.0.1.alpha',
        'objectTags': [
            'source control'
        ],
        'actionTags': [
            'push'
        ],
        'location': {},
        'properties': {}
    }

    function clone(event) {
        return JSON.parse(JSON.stringify(event));
    }

    var _createStream = function(){
        var deferred = Q.defer();
        var qdUrl = config.QD_REST_APP_URL+'/stream';
        request.post({url:qdUrl}, function(err,res,body){
            if(err){
                deferred.reject(err);
            }else{
                deferred.resolve(JSON.parse(body));
            }
        });
        return deferred.promise;
    }

    var _transformToQdEvents = function(events,streamid){
        var deferred = Q.defer();
        var qdEvents = [];
         _.each(events, function (event) {
            var qdEvent = clone(qdEventTemplate);
            qdEvent.eventDateTime = moment(event.created_on).format();
            qdEvent.dateTime = moment().format();
            qdEvent.streamid = streamid;
            qdEvents.push(qdEvent);
         });
        deferred.resolve(qdEvents);
        return deferred.promise;
    }

    var _postEventsToQdApi = function(events,writeToken){
        _.each(events,function(event){
            var options = {
                            url:  config.QD_REST_APP_URL+ '/stream/'+event.streamid+'/event',
                            json: event,
                            headers: {
                                    'Accept' : 'application/json',
                                    'Content-Type' : 'application/json',
                                    'Authorization': writeToken
                                }
                          };
            request.post(options,function(err,response,body){
                if(err){
                console.log(err);
                }
            });

        });
    };

    return{
        createStream : _createStream,
        transformToQdEvents : _transformToQdEvents,
        postEventsToQdApi : _postEventsToQdApi
    }
}();

module.exports = qdRest;
