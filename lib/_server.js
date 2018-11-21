"use strict";


const WebSocketServer = require('ws').Server;
const Splitter        = require('stream-split');
const merge           = require('mout/object/merge');

const NALseparator    = new Buffer([0,0,0,1]);//NAL break


class _Server {

  constructor(server, options) {

    this.options = merge({
        width : 960,
        height: 540,
    }, options);

    this.wss = new WebSocketServer({ server });

    this.new_client = this.new_client.bind(this);
    this.start_feed = this.start_feed.bind(this);
    this.broadcast  = this.broadcast.bind(this);
    this.new_frame  = this.new_frame.bind(this);

    this.wss.on('connection', this.new_client);
    
    this.started = false;
    this.initBuffer = [];
    this.initReady = false;
    this.start_feed();

  }
  

  start_feed() {
    if (!this.started) {
      console.log("Starting stream");
      this.started = true;
      var readStream = this.get_feed();
      this.readStream = readStream;

      readStream = readStream.pipe(new Splitter(NALseparator));
      readStream.on("data", this.new_frame);
    
    }
  }

  get_feed() {
    throw new Error("to be implemented");
  }


  new_frame(data) {
    if (data[0] > 37) {
      // found something other than an i or p frame
      if (this.initReady) {
        this.initReady = false;
        this.initBuffer = [];
      }
      console.log('Buffering init frame ' + (this.initBuffer.length + 1));
      this.initBuffer.push(data);
    } else {
      if (!this.initReady) {
        this.initReady = true;
        console.log('Init ready');
      }
      this.broadcast(data);
    }
  }


  broadcast(data) {
    this.wss.clients.forEach(function(socket) {
      if (socket.isStreaming) {
        socket.send(Buffer.concat([NALseparator, data]), { binary: true}, function ack(error) {});
      }
    });
  }

  new_client(socket) {
  
    var self = this;
    console.log("Client connect - now serving " + self.wss.clients.length + " clients");

    socket.send(JSON.stringify({
      action : "init",
      width  : this.options.width,
      height : this.options.height,
    }));

    socket.on("message", function(data){
      var cmd = "" + data, action = data.split(' ')[0];
      console.log("Incomming action '%s'", action);

      if(action == "REQUESTSTREAM")
        console.log("Sending init buffers");

        for (var i=0; i<self.initBuffer.length; i++) {
          console.log("Sending init buffer " + (i+1));
	  this.send(Buffer.concat([NALseparator, self.initBuffer[i]]), { binary: true}, function ack(error) {});
	}
        console.log("Ready for broadcast");
	this.isStreaming = true;
      if(action == "STOPSTREAM")
	this.isStreaming = false;
    });

    socket.on('close', function() {
      this.isStreaming = false;
      console.log("Client disconnect - now serving " + self.wss.clients.length + " clients");
    });
  }


};


module.exports = _Server;
