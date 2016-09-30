'use strict';
const prefix = '/api/v1/';
const request = require('request');

module.exports = function(options){

  //This is your express app object
  let app = options.app;
  let io = options.io;

  /**
   * All of your api routes go here.
   * Format them in the following way:
   * app.post(prefix+'endpoint', callback);
   * app.get(prefix+'endpoint', callback);
   */
  app.all(prefix+'room/:room', function(req, res){
    var request = {
      method: req.method,
      headers: req.headers,
      url: req.url,
      body: req.body,
      ip: req.ip,
      xhr: req.xhr,
      protocol: req.protocol,
      query: req.query,
      cookies: req.cookies
    };
    io.to(req.params.room).emit('received', request);
    res.end();
  });

  app.post(prefix+'request', function(req, res){
    if (process.env.G_RECAPTCHA_ACTIVE == 'true'){
      var grecaptcha = req.body.grecaptcha;
      checkRecaptcha(grecaptcha, function(success){
        if (success){
          passOnRequest(req, res);
        }
        else{
          res.json({
            error: 'grecaptcha inaccurate'
          });
          res.end();
        }
      });
    }
    else {
      passOnRequest(req, res);
    }
  });

  app.get(prefix+'recaptcha', function(req, res){
    res.json({
      enabled: process.env.G_RECAPTCHA_ACTIVE == 'true'
    });
    res.end();
  });
};

function passOnRequest(req, res){
  request({
    uri: req.body.uri,
    method: req.body.method
  }, function(error, response, body){
    res.json({
      error: error,
      response: body
    });
    res.end();
  });
}

function checkRecaptcha(grecaptcha, callback){
  var secret = process.env.RECAPTCHA_SECRET;
  request({
    uri: 'https://www.google.com/recaptcha/api/siteverify?secret='+secret+'&response='+grecaptcha,
    method: 'POST',
    json: true
  }, function(error, response, body){
    callback(body.success);
  });
}
