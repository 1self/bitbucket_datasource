var properties = require('./../util/properties')
var config = properties.config();
var passport = require('./../util/oauthConfig');
var usersRepo = require('./../repositories/users');
var bitbucketClient = require('./../services/bitbucketRestService');

    var handleCallback = function (req, res) {
        var username;
        var findQuery = {
            "username": req.user.profile.username
        };
        usersRepo.findByUsername(findQuery).then(
        function(user){
                if (!user) {
                    insertBitbucketProfileInDb(req.user.profile,function(err,user){
                        if(err){
                            res.status(500).send("Database error");
                        }
                        username = user.username;
                        req.session.username = username;
                        res.redirect(config.CONTEXT_URI+'/dashboard');
                    });
                } else if(user && user.username) {
                    username = user.username;
                    req.session.username = username;
                    res.redirect(config.CONTEXT_URI+'/dashboard');
                }
            });
    }

    var insertBitbucketProfileInDb = function (userProfile,callback) {
        var username = userProfile.username;

        bitbucketClient.getUserEmails(username,function(err,emails){
            if(err){
                console.log('Failed to get user\'s email address!!');
            }else{
                var userRecord = {
                    username: userProfile.username,
                    emails: emails,
                    registeredOn: new Date(),
                }

                usersRepo.save(userRecord,function(err,insertedRecord){
                    callback(err,insertedRecord);
                });
            }
        });
    }

    app.get("/signup", function (req, res) {
            res.render('signup');
    });

    app.get('/', function (request, response) {
        response.redirect(CONTEXT_URI+'/signup');
    });

    app.get('/auth/bitbucket', passport.authenticate('bitbucket'), function(req, res){
        // The request will be redirected to Bitbucket for authentication, so this
        // function will not be called.
    });

    app.get('/auth/bitbucket/callback'
            , passport.authenticate('bitbucket', { failureRedirect: '/'})
            , handleCallback
    );
    app.get('/dashboard',function (req, res){
        res.render('dashboard');
    });






