var request = require('request');
var _ = require('underscore');
var properties = require('./../util/properties')
var config = properties.config();
var Q = require('q');

var bitbucketRest = function(){

    var _getPushEventsForUser = function(username){
        var deferred = Q.defer();
        var oauth ={
            consumer_key: config.BITBUCKET_CONSUMER_KEY
            ,consumer_secret: config.BITBUCKET_CONSUMER_SECRET
        }
        var url = 'https://bitbucket.org/api/1.0/users/'+username+'/events?type=pushed';
        request.get({url:url, oauth:oauth, json:true}, function (err, res, body) {
            if (err){
                deferred.reject(err);
            }else{
                deferred.resolve(body.events);
            }
        });
        return deferred.promise
    }

    var _getUserEmails = function(username,callback){
        var emails=[];
        var oauth ={
            consumer_key: config.BITBUCKET_CONSUMER_KEY
            , consumer_secret: config.BITBUCKET_CONSUMER_SECRET
        }
        var url = 'https://bitbucket.org/api/1.0/users/'+username+'/emails';
        request.get({url:url, oauth:oauth, json:true},function (err, res, body) {
            if (!err){
               _.each(body,function(emailInfo) {
                emails.push(emailInfo.email);
               });
            }
            callback(err,emails);
        });
    }
    return {
        getPushEventsForUser : _getPushEventsForUser,
        getUserEmails : _getUserEmails
    }
}();

module.exports = bitbucketRest;


