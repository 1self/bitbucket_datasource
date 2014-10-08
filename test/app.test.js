var expect = require('chai').expect;
var request = require('superagent');
var should =require('should');
var properties = require('./../app/util/properties')
var config = properties.config();

describe("bit bucket app",function(){
    var bit_bucket_app = require('./../app/app.js');
    var base_url = 'http://app.qdbitbucket';
    var port = 4000;

    before(function(done){
        bit_bucket_app.start(port,done);
    });

    after(function(done){
        bit_bucket_app.stop(done);
    });

    describe("when requested at /signup",function(){
        it('should return signup page',function(done){
            request.get(base_url+':'+port+'/signup').end(function(err,res){
                expect(err).to.not.be.ok;
                expect(res).to.have.property('status',200);
            })
        done();
        });
    });

    describe("when requested at /refresh_push_events",function(){
            it('should return a dash board',function(done){
                request.get(base_url+':'+port+'/auth/bitbucket').end(function(err,res){
                    expect(err).to.not.be.ok;
                    expect(res).to.have.property('status',200);
                })
            done();
            });
    });
});
