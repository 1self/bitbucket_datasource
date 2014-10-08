
## Quick Start

  The quickest way to get started :
  
```bash
$ git clone git://bitbucketapp
$ cd bitbucket_app
$ npm install
$ NODE_ENV=development foreman  start -f Procfile.dev
```  

## Running Tests

  To run the test suite, first invoke the following command within the repo, installing the development dependencies:

```bash
$ npm install
```

  Then run the tests:

```bash
$ NODE_ENV=test mocha test/*.test.js test/**/*.test.js
```


## Environment Properties

    env.json has the following properties.
    
    "CONTEXT_URI" : "http://app.qdbitbucket:4000",
    "QD_REST_APP_URL" : "http://localhost:7000",
    "SESSION_SECRET" : "bitbucketQdTest",
    "BITBUCKET_CONSUMER_KEY" : "qV9nLJEV3qdaazVXdZ",
    "BITBUCKET_CONSUMER_SECRET" : "Z3Am42b7eTP6rCnVTxNmNm55pURqCCT3",
    "MONGO_URI" : "mongodb://localhost/qd_bitbucket_app"
    
    Configure the properties suitable for your environment.