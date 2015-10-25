var express = require('express');
var app = express();
var api = require('./api');
var bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({extended:true}));
app.use('/api', api);

app.listen(process.env.PORT || 3000, function(){
  console.log('Server is listening on port', process.env.PORT || 3000);
});
