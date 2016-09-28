'use strict';
const prefix = '/api/v1/';

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
      body: req.body
    };
    io.to(req.params.room).emit('received', request);
    res.end();
  });

};
