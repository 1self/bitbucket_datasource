var expect = require('chai').expect;
var request = require('superagent');
var should =require('should');
var moment = require('moment');
var mongoConnection = require('./../test.db.connection');

describe('user\'s repository',function(){
    var usersRepo = require('./../../app/repositories/users.js');
     var user = {
        username:'testUser',
        registeredOn:new Date(2013,2,1,1,10),
        emails:['test1@test.com','test2@test.com']
     }

     beforeEach(function(done){
        mongoConnection(function(db){
            db.collection('users').insert(user, function (err, insertedRecords) {
                    currentUser = insertedRecords[0];
                    done();
            });
        });
      });

    afterEach(function(done){
        mongoConnection(function(db){
            db.collection('users', function(err, collection) {
                collection.remove({},function(err,removed){
                    done();
                });

            });
        });
    });

    it('should find user by username',function(done){
        usersRepo.findByUsername(currentUser.username).then(function(user){
            user.username.should.equal(currentUser.username);
            user.registeredOn.toString().should.equal(currentUser.registeredOn.toString());
            user.emails.should.have.property(0,currentUser.emails[0]);
            user.emails.should.have.property(1,currentUser.emails[1]);
            done();
        });
    });

    it('should link push stream to user',function(done){
        var stream = {
        streamid : 'push Stream Id',
        writeToken : 'stream write token'
        }
        usersRepo.linkPushEventStreamToUser(stream,currentUser.username)
        {
            mongoConnection(function(db){
                db.collection('users').findOne({"username":currentUser.username}, function (err, user) {
                       user.username.should.equal(currentUser.username);
                       user.registeredOn.toString().should.equal(currentUser.registeredOn.toString());
                       user.emails.should.have.property(0,currentUser.emails[0]);
                       user.emails.should.have.property(1,currentUser.emails[1]);
                       user.pushStreamId.should.equal(stream.streamid);
                       done();
                });
            });
        }
    });

    it('should save a user data',function(done){
        var toSave={
        username:'to save',
        emails:['toSave1@test.com','toSave2@test.com']
        }

        usersRepo.save(toSave,function(err,result){
            (err === null).should.be.true;
            mongoConnection(function(db){
                db.collection('users').findOne({"username":toSave.username}, function (err, user) {
                       user.username.should.equal(toSave.username);
                       user.emails.should.have.property(0,toSave.emails[0]);
                       done();
                });
            });
        });
    });
});
