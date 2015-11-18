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
var heroku_url = process.env.HEROKU_URL;
var serverUrl = null;

var timeOutGlobalSetting = 40000;

var messageBodyDefault = [
  'You\'re being notified that your friend is using a ridesharing service ',
  'right now and asked you to be their Ride Guardian. ',
  'These messages will continue until your friend safely completes their trip. ',
  'And you will receive a final, safe and sound notification when the trip is successfully completed.'
  ].join('');



if( heroku_url ) {
  serverUrl = heroku_url;
} else {
  serverUrl = ( 'http://localhost:' ) + ( process.env.PORT || 3000 );

}

console.log(serverUrl);

var cancelRequest = function(request_id, auth_token) {
  var uberUrl = uberApiUrl + 'requests/'+request_id;
  // create http request to uber api
  request({
    method: 'DELETE',
    url : uberUrl,
    strictSSL: false,
    auth : {
      bearer : auth_token
    }
  }, function(err, response, body){
    if(err){
      console.log('in cancelreq function, got error, err is: ');
      console.log(err);
      return;
    }
    console.log('in cancelreq function, no error, body is: ');
      console.log(body);
  });
};

// setting the transporter sendmail to send out mail every 300,000 millisec (5 mins)
var recursive = function(mailOptions, transporter, request_id, auth_token, panic_mode, me) {
  var uberUrl = uberApiUrl + 'requests/'+request_id;
  // create http request to uber api
  request.get({
    url : uberUrl,
    strictSSL: false,
    auth : {
      bearer : auth_token
    }
  }, function(err, response, body){
    if(err){
      console.log('Error in recursive call getting request info: ');
      console.log(err);
      return;
    }
    var parsedRequestInfo = JSON.parse(body);
    var thisStatus = parsedRequestInfo.status;
    if ((panic_mode === 'true') && ((thisStatus === 'in_progress') || (thisStatus === 'accepted') || (thisStatus === 'arriving'))) {
      cancelRequest(parsedRequestInfo.request_id, auth_token);
      mailOptions.subject = 'RideGuardians PANIC Notification!';
      mailOptions.text = 'You are '+me.first_name+' '+me.last_name+'\'s Ride Guardian. ';
      mailOptions.text += 'Your friend is using a ridesharing service and is worried about their safety! ';
      mailOptions.text += 'Please contact them immediately to help with the emergency.';
      mailOptions.text += ' Latest lat/lng: '+parsedRequestInfo.location.latitude+'/'+parsedRequestInfo.location.longitude;
      mailOptions.html = '<b>'+mailOptions.text+'</b>';
      if (mailOptions.to && mailOptions.to.length && mailOptions.to[0] !== '') {
        transporter.sendMail(mailOptions, function(error, info){
          if(error){
            console.log('Error in recursive call sending panic mail: ');
            return console.log(error);
          }
            console.log('Panic message sent: ' + info.response);
          });
      }
    }
    else {
      // No email and no checking
      if ((thisStatus === 'no_drivers_available') || (thisStatus === 'driver_canceled') || (thisStatus === 'rider_canceled')) {
        console.log('checked uber request status, not sending mail and not checking again, status is: '+thisStatus+' - request_id is: '+request_id);
      }
      else {
        // Send the SAFE AND SOUND email and stop checking
        if (thisStatus === 'completed') {
          mailOptions.subject = 'RideGuardians SAFE AND SOUND Notification!';
          mailOptions.text = 'You are '+me.first_name+' '+me.last_name+'\'s Ride Guardian. ';
          mailOptions.text += 'Your friend completed their ridesharing trip and thanks you for being their guardian!';
          mailOptions.text += ' Latest lat/lng: '+parsedRequestInfo.location.latitude+'/'+parsedRequestInfo.location.longitude;
          mailOptions.html = '<b>'+mailOptions.text+'</b>';
          if (mailOptions.to && mailOptions.to.length && mailOptions.to[0] !== '') {
            transporter.sendMail(mailOptions, function(error, info){
              if(error){
                console.log('Error in recursive call sending safe mail: ');
                return console.log(error);
              }
                console.log('Safe and sound message sent: ' + info.response);
              });
          }
        }
        else {
          // Don't send mail but do keep checking
          if ((thisStatus === 'processing') || (thisStatus === 'accepted')) {
            console.log('checked uber request status, not sending mail, status is: '+thisStatus+' request_id is: '+request_id);
            setTimeout(function(){recursive(mailOptions, transporter, request_id, auth_token, panic_mode, me);}, timeOutGlobalSetting);
          }
          else {
            // Send mail and keep checking
            if ((thisStatus === 'in_progress') || (thisStatus === 'arriving')) {
              mailOptions.subject += ' - current status - '+thisStatus;
              var messageBody = 'You are '+me.first_name+' '+me.last_name+'\'s Ride Guardian. ';
              messageBody += messageBodyDefault + 'Latest lat/lng: '+parsedRequestInfo.location.latitude+'/'+parsedRequestInfo.location.longitude;
              mailOptions.text = messageBody;
              mailOptions.html = '<b>'+messageBody+'</b>';
              if (mailOptions.to && mailOptions.to.length && mailOptions.to[0] !== '') {
                transporter.sendMail(mailOptions, function(error, info){
                 if(error){
                   console.log('Error in recursive call sending ongoing mail: ');
                   return console.log(error);
                 }
                 console.log('Message sent: ' + info.response);
                });
              }
              mailOptions.subject = 'RideGuardians Notification!';
              setTimeout(function(){recursive(mailOptions, transporter, request_id, auth_token, panic_mode, me);}, timeOutGlobalSetting);
            }
            else {
              console.log('checked uber request status, but status doesn\'t match any case: '+thisStatus+' - request_id is: '+request_id);
            }
          }
        }
      }
    }
  });
};

router.post('/send_mail', function(req, res){
  var request_id = req.body.request_id;
  var auth_token = req.body.auth_token;
  var panic_mode = req.body.panic_mode;

  var contactList = [
    req.body.contact_1,
    req.body.contact_2,
    req.body.contact_3,
    req.body.contact_4,
    req.body.contact_5
  ];

  console.log('In send mail, contact list is: ');
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
        from: 'RideGuardians <' + mailUserName + '>', // sender address
        to: contactList, // list of receivers
        //'siyuanpfx@gmail.com, pickettd@gmail.com, zac.mroz@gmail.com, hawaiianredz.anzai@gmail.com', // list of receivers
        subject: 'RideGuardians Notification!', // Subject line
        text: messageBodyDefault, // plaintext body
        html: '<b>'+messageBodyDefault+'</b>' // html body
    };

    request.get({
      url : uberApiUrl + 'me',
      strictSSL: false,
      auth : {
        bearer : auth_token
      }
    }, function(err, response, body){
      if(err){
        console.error(err);
      }
      //res.json(body);
      var me = JSON.parse(body);
      console.log('In send mail, sender object is: ');
      console.log(me);
      // send mail with defined transport object
      recursive(mailOptions, transporter, request_id, auth_token, panic_mode, me);
    });

  res.json({success: true});
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
  console.log('server-side-est-price: got estimate request, calling into Uber api');
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
      console.log('server-side-est-price: finished uber api call but got err: ');
      console.log(err);
      return res.json(err);
    }
    console.log('server-side-est-price: finished uber api and no error. body is: ');
    console.log(body);
    res.json(body);
  });
});

router.post('/request_info', function(req, res){

  if( !req.body.hasOwnProperty('auth_token') ){
    return res.json({
      success : false,
      code : 401,
      popupUrl : getAuthorizeUrl()
    });
  }
  var request_id = req.body.request_id;
  var uberUrl = uberApiUrl + 'requests/'+request_id;

// create http request to uber api
  request.get({
    url : uberUrl,
    strictSSL: false,
    auth : {
      bearer : req.body.auth_token
    }
  }, function(err, response, body){
    if(err){
      console.log('in request info, got an error: ');
      console.log(err);
      return res.json(err);
    }
    var newBody = JSON.parse(body);
    newBody.success = true;
    res.json(newBody);
  });
});

router.post('/change_request_status', function(req, res){
  if( !req.body.hasOwnProperty('auth_token') ){
    return res.json({
      success : false,
      code : 401,
      popupUrl : getAuthorizeUrl()
    });
  }

  var uberRequest = {
    status : req.body.status
  };
  var method = 'PUT';
  if (req.body.status === 'rider_canceled') {
    console.log('change status request for delete');
    method = 'DELETE';
  }

  // create http request to uber api
  request({
    method: method,
    url: uberApiUrl + 'sandbox/requests/'+req.body.request_id,
    json: uberRequest,
    strictSSL: false,
    auth : {
      bearer : req.body.auth_token
    }
  }, function(err, response, body){
    if(err){
      console.log('got error in change status request');
      console.error(err);
      return res.json(err);
    }
    console.log('in change status request - no error, body is: ');
    console.log(body);
    res.json({success: true});
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
  return [
    '<script> ',
    '  if (window.opener != null && !window.opener.closed){ ',
    '    window.opener.location = "'+redirectAccessTokenUrl(access_token)+'"; ',
    '    window.close(); ',
    '  }else{ ',
    '    document.write("Pop-up blocker prevented proper authorization process. Please disable and re-authorize."); ',
    '  } ',
    '</script>'
  ].join('');
}

function redirectAccessTokenUrl(access_token) {
  return serverUrl + '#store-auth-token/' + access_token;
}

function getAuthorizeUrl(){
  return oauth2.getAuthorizeUrl({
      redirect_uri: serverUrl + '/api/oauth/cb',
      scope: ['request profile'],
      state: 'authorizing',
      response_type: 'code'
    });
}


module.exports = router;
