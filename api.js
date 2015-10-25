var router = require('express').Router();
var request = require('request');
var OAuth2 = require('oauth').OAuth2;
var nodemailer = require('nodemailer');
var mailUserName = process.env.MAIL_USER_NAME;
var mailPassword = process.env.MAIL_PASSWORD;

var uberApiUrl = 'https://sandbox-api.uber.com/v1/';
var uberServerToken = process.env.UBER_SERVER_TOKEN;
var uberClientID = process.env.UBER_CLIENT_ID;
var uberClientSecret = process.env.UBER_CLIENT_SECRET;
var serverUrl = ( process.env.HEROKU_URL || 'http://localhost:' ) + ( process.env.PORT || 3000 );

console.log(serverUrl);

router.post('/send_mail', function(req, res){
  var contactList = [
    req.body.contact_1,
    req.body.contact_2,
    req.body.contact_3,
    req.body.contact_4,
    req.body.contact_5
  ];

  console.log(contactList);

  // create reusable transporter object using SMTP transport
  var transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
          user: mailUserName, 
          pass: mailPassword
      }
  });

  // setup e-mail data (unicode symbols)
  var mailOptions = {
      from: 'UberGuardians <' + mailUserName + '>', // sender address
      to: contactList, // list of receivers
      //'siyuanpfx@gmail.com, pickettd@gmail.com, zac.mroz@gmail.com, hawaiianredz.anzai@gmail.com', // list of receivers
      subject: 'Testing UberGuardians Mailing!', // Subject line
      text: 'Hello world ✔', // plaintext body
      html: '<b>Hello world ✔</b>' // html body
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, function(error, info){
      if(error){
          return console.log(error);
      }
      console.log('Message sent: ' + info.response);
  });
});

var oauth2 = new OAuth2(
    uberClientID,
    uberClientSecret,
    'https://login.uber.com/',
    'oauth/authorize',
    'oauth/token',
    null);

router.get('/estimates/price', function(req, res){
  var source = JSON.parse(req.query.source);
  var destination = JSON.parse(req.query.destination);
  // create http request to uber api
  request.get({
    url : uberApiUrl + 'estimates/price',
    strictSSL: false,
    qs : {
      server_token : uberServerToken,
      start_latitude : source.lat,
      start_longitude : source.lng,
      end_latitude : destination.lat,
      end_longitude : destination.lng
    }
  }, function(err, response, body){
    if(err){
      return res.json(err);
    }
    res.json(body);
  });
});

router.post('/get_ride', function(req, res){
  if( !req.body.hasOwnProperty('auth_token') ){
    return res.json({
      success : false,
      code : 401,
      popupUrl : getAuthorizeUrl()
    });
  }

  var uberRequest = {
    start_latitude : req.body.source.lat,
    start_longitude : req.body.source.lng,
    end_latitude : req.body.destination.lat,
    end_longitude : req.body.destination.lng,
    product_id : req.body.product_id
  };

  // create http request to uber api
  request.post({
    url : uberApiUrl + 'requests',
    json : uberRequest,
    strictSSL: false,
    auth : {
      bearer : req.body.auth_token
    }
  }, function(err, response, body){
    if(err){
      return res.json(err);
    }
    body.success = true;
    res.json(body);
  });

});

// from redirect after auth
router.get('/oauth/cb', function(req, res){
  var code = req.query.code;

  oauth2.getOAuthAccessToken(
    code,
    { // NOT IN THE UBER DOCS
      grant_type: 'authorization_code',
      redirect_uri: serverUrl+'/api/oauth/cb'
    },
    function (err, access_token, refresh_token, results){
      if(err){
        console.log(err);
        if(err.data){
          res.end(err.data);
        }else{
          res.json(err);
        }
      } else if(results.error) {
        console.log(results.error);
        res.json(results.error);
      } else {
        // got token, send back to client
        // POPUP Blocker must be disabled, or find workaround, or use redirect instead
        res.send(closeAndRedirectScript(access_token));
      }
    });
});

function closeAndRedirectScript(access_token) {
  return '<script> \
          if (window.opener != null && !window.opener.closed){ \
            window.opener.location = "'+redirectAccessTokenUrl(access_token)+'"; \
            window.close(); \
          }else{ \
            document.write("Pop-up blocker prevented proper authorization process. Please disable and re-authorize."); \
          } \
          </script>';
}

function redirectAccessTokenUrl(access_token) {
  return serverUrl + '#store-auth-token/' + access_token;
}

function getAuthorizeUrl(){
  return oauth2.getAuthorizeUrl({
      redirect_uri: serverUrl + '/api/oauth/cb',
      scope: ['request'],
      state: 'authorizing',
      response_type: 'code'
    });
}


module.exports = router;
