var passport = require('passport');
var BitbucketStrategy = require('passport-bitbucket').Strategy;
var properties = require('./propertiesHelper');

exports = module.exports = passport;

 passport.use(new BitbucketStrategy({
            consumerKey: properties.get('BITBUCKET_CONSUMER_KEY'),
            consumerSecret: properties.get('BITBUCKET_CONSUMER_SECRET'),
            callbackURL: properties.get('CONTEXT_URI')+"/auth/bitbucket/callback"
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




