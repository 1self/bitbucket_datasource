var mongoConnection = require('./../util/connection');
var Q = require('q');

var Users = function(){

    var _findByUsername = function(username){
        var deferred = Q.defer();
        var query = {
            "username": username
        };
        mongoConnection(function (qdDb) {
            qdDb.collection('users').findOne(query, function (err, user) {
            if(err){
                deferred.reject(err);
            }
                deferred.resolve(user);
            });
        });
        return deferred.promise;
    }

    var _linkPushEventStreamToUser = function (stream,username){
           var query = {
               "username": username
           };
           var updateQuery = {
               $set: {
                   "pushStreamId": stream.streamid
               },
               $push: {
                   "streams": {
                   "streamid": stream.streamid,
                   "writeToken" : stream.writeToken
                   }
               }
           };
           mongoConnection(function (qdDb) {
               qdDb.collection('users').update(query, updateQuery, {
                   upsert: true
               },
               function (err, numberOfUpdatedRecords) {
                    if(err){
                        console.log('Database error '+err);
                        throw new Error();
                    }
               });
           });
       }

    var _save = function(user,callback){
        mongoConnection(function (qdDb) {
            qdDb.collection('users').insert(user, function (err, insertedRecords) {
                callback(err,insertedRecords[0]);
            });
        });
    }

    var _updateLastSyncedDateTime = function(lastSyncedDateTime,username,streamid){
     var query = {"username":username,
                  "streams.streamid":streamid
                };
                var updateQuery = {
                    $set: {
                        "streams.$.lastSyncedDateTime": lastSyncedDateTime
                    }
                };
                mongoConnection(function (qdDb) {
                    qdDb.collection('users').update(query, updateQuery, {
                        upsert: true
                    },
                    function (err, numberOfUpdatedRecords) {
                         if(err){
                             console.log('Database error '+err);
                             throw new Error();
                         }
                         console.log('records updated '+numberOfUpdatedRecords);
                    });
                });
    }

    return {
        findByUsername : _findByUsername,
        linkPushEventStreamToUser : _linkPushEventStreamToUser,
        save : _save,
        updateLastSyncedDateTime:_updateLastSyncedDateTime
    }
}();

module.exports = Users;
