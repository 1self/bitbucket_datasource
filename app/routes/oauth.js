var properties = require('./../util/propertiesHelper');
var passport = require('./../util/oauthConfig');
var mongoDbConnection = require('./../util/connection');


    var handleCallback = function (req, res) {
    var bitbucketUsername;
        var byBitbucketUsername = {
            "bitbucketUser.username": req.user.profile.username
        };
        mongoDbConnection(function (qdDb) {
            qdDb.collection('users').findOne(byBitbucketUsername, function (err, user) {
                if (!user) {
                    insertBitbucketProfileInDb(req.user.profile,function(err,user){
                        if(err){
                            res.status(500).send("Database error");
                        }
                        bitbucketUsername = user.bitbucketUser.username;
                        req.session.bitbucketUsername = bitbucketUsername;
                        res.redirect(properties.get('CONTEXT_URI')+'/dashboard');
                    });
                } else if(user && user.bitbucketUser.username) {
                    bitbucketUsername = user.bitbucketUser.username;
                    req.session.bitbucketUsername = bitbucketUsername;
                    res.redirect(properties.get('CONTEXT_URI')+'/dashboard');
                }
            });
        });

    }

var insertBitbucketProfileInDb = function (userProfile,callback) {
    var username = userProfile.username;
    var getUserEmails = function(){
    var oauth ={
        consumer_key: properties.get('BITBUCKET_CONSUMER_KEY')
        , consumer_secret: properties.get('BITBUCKET_CONSUMER_SECRET')
    }
    var url = 'https://bitbucket.org/api/1.0/users/'+username+'/emails';
    request.get({url:url, oauth:oauth, json:true},
        function (err, res, body) {
            if (err){
                console.error(err);
            }
            _.each(JSON.parse(body), function (emailInfo) {
                    userProfile.emails.push(emailInfo.email);
            });
        });
    }
    var bitbucketUserRecord = {
        bitbucketUser: userProfile,
        registeredOn: new Date()
    }

    mongoDbConnection(function (qdDb) {
        qdDb.collection('users').insert(bitbucketUserRecord, function (err, insertedRecords) {
            callback(err,insertedRecords[0]);
        });
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






