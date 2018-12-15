"use strict";

const http               = require('http');
const express            = require('express');
const WSRelayFeed        = require('./lib/wsrelay');
const app                = express();


app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/vendor/dist'));

const server  = http.createServer(app);

const feed    = new WSRelayFeed(server, {

        // change this to match the URL of the remote Node server
        master_uri: "ws://192.168.0.2:8080/"
});


server.listen(8080);
