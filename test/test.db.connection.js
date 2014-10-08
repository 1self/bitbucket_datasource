var mongoClient = require('mongodb').MongoClient;

var db;

var connectionUrl = 'mongodb://localhost/qd_bitbucket_app_test';

module.exports = function(callback) {
    if (db) {
        callback(db);
        return;
    }

    mongoClient.connect(connectionUrl, function(err, dbObject) {
        if (err) {
            console.log(err);
        } else {
            db = dbObject;
            callback(db);
        }
    });

};
