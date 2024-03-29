var mongoClient = require('mongodb').MongoClient;
var properties = require('./properties')
var config = properties.config();

var db;

module.exports = function(callback) {
    if (db) {
        callback(db);
        return;
    }

    mongoClient.connect(config.MONGO_URI, function(err, dbObject) {
        if (err) {
            console.log(err);
        } else {
            db = dbObject;
            callback(db);
        }
    });
};
