"use strict";


const net    = require('net');
const merge  = require('mout/object/merge');
const websocket = require('websocket-stream');

const Server = require('./_server');

class WSRelayFeed extends Server {

  constructor(server, opts) {
    super(server, merge({
        master_uri: "ws://127.0.0.1:8080/"
    }, opts));
  }

  get_feed() {

        const ws = websocket(this.options.master_uri, {binary: false});
        ws.write("REQUESTSTREAM", function() {
                console.log("Remote connection open");
        });
        return ws;
  }

}



module.exports = WSRelayFeed;
