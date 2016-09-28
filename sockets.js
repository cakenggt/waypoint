'use strict';

module.exports = function(options){

  //This is your express app object
  let app = options.app;

  //This is the io object that we will listen for connections to
  const io = require('socket.io')(app);

  io.on('connection', function(socket) {
    //Join the selected room
    socket.join(socket.handshake.query.room);
  });

  return io;
};
