var app = require('./app');

var port = 4000;

app.start(port,function(){
    console.log("Listening on " + port);
})