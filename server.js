'use strict';

const express = require('express');
var io = require('socket.io-client');
var socket = io.connect('ws://atintegration.herokuapp.com', {
    reconnect: true
});

var osc = require("osc");
const path = require('path');
const PORT = process.env.PORT || 4000;
const INDEX = path.join(__dirname, 'index.html');
var messages = {};

const server = express()
    .use((req, res) => res.sendFile(INDEX))
    .listen(PORT, () => {
      var art = require('ascii-art');
      art.font('ART & TECH  INTEGRATION', 'Doom', function(rendered){
          console.log(rendered);
          console.log("Check out https://atintegration.herokuapp.com for settings");
      });
    }) ;

// SOCKET IO Add a connect listener
socket.on('connect', function(socket) {
    console.log('Connected!');
});

socket.on('settings', function(data){
  const settings = data;
  console.log("[SETTINGS]");
  for (var variable in data) {
    if (data.hasOwnProperty(variable)) {
      if (variable == "params"){
        console.log("<--PARAMS-->");
        for (var param of data[variable]) {
          console.log(param);
        }
        console.log("\n");
      } else {
        console.log(variable + " :: " + data[variable]);
      }
    }
  }
  console.log("<--END-->");
  console.log("\n");

  var udpPort = new osc.UDPPort({
      localAddress: "0.0.0.0",
      localPort: settings.oscInputPort
  });

  //send osc message to server
  udpPort.on("message", function(oscMsg) {
      messages[oscMsg.address] = oscMsg.args;
      socket.emit(oscMsg.address, oscMsg.args)
  });

  setInterval(function () {
      console.log(messages);
  }, 300);

  for (let param of settings.params) {
    socket.on(param, (data) => {
        udpPort.send({
            address: param,
            args: data
        }, "127.0.0.1", settings.oscOutputPort);
    });
  }
  // Open the socket.
  udpPort.open();
});
