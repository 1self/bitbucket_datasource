var passport = require('passport');
var BitbucketStrategy = require('passport-bitbucket').Strategy;
var properties = require('./properties')
var config = properties.config();

exports = module.exports = passport;

 passport.use(new BitbucketStrategy({
            consumerKey: config.BITBUCKET_CONSUMER_KEY,
            consumerSecret: config.BITBUCKET_CONSUMER_SECRET,
            callbackURL: config.CONTEXT_URI+"/auth/bitbucket/callback"
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




