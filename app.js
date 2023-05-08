/*
 * @Author: Mei Zhang micpearl@163.com
 * @Date: 2023-05-06 01:45:22
 * @LastEditors: Mei Zhang micpearl@163.com
 * @LastEditTime: 2023-05-06 02:05:25
 * @FilePath: \MY_OSC_SendReceive\app.js
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
// Import Libraries and Setup

const open = require("open");

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const osc = require("osc");
const os = require("os");

let staticServerPort = "4400";
let printEveryMessage = true; 

let oscRecievePort = "9000";
let sendIP = "127.0.0.1";//localhost
let oscSendPort = "9000";

// Tell our Node.js Server to host our P5.JS sketch from the public folder.
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections from chrome, and open chrome when it is ready
server.listen(staticServerPort, () => {
  console.log(`listening on *: ${staticServerPort}`);
  open("http://localhost:"+staticServerPort);
});

// Callback function for what to do when our P5.JS sketch connects and sends us messages
io.on("connection", (socket) => {
  console.log("a user connected");

  // Code to run every time we get a message from P5.JS
  socket.on("message", (_msg) => {
    
    //send it via OSC to another port, device or software (e.g. max msp)
    udpPort.send(_msg, sendIP, oscSendPort);

    // Print it to the Console
    if (printEveryMessage) {
      console.log(_msg);
    }
  });

});

function getIPAddresses() {
  let interfaces = os.networkInterfaces(),
    ipAddresses = [];

  for (let deviceName in interfaces) {
      let addresses = interfaces[deviceName];
      for (let i = 0; i < addresses.length; i++) {
          let addressInfo = addresses[i];
          if (addressInfo.family === "IPv4" && !addressInfo.internal) {
              ipAddresses.push(addressInfo.address);
          }
      }
  }

  return ipAddresses;
};

let udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: oscRecievePort
});

udpPort.on("ready", () => {
  let ipAddresses = getIPAddresses();

  console.log("Listening for OSC over UDP.");
  ipAddresses.forEach((address) => {
      console.log(" Host:", address + ", Port:", udpPort.options.localPort);
  });

});

udpPort.on("message", (oscMessage) => {

  //send it to the front-end so we can use it with our p5 sketch
  io.emit("message",oscMessage);

  // Print it to the Console
  if (printEveryMessage) {
    console.log(oscMessage);
  }
});

udpPort.on("error", (err) => {
  console.log(err);
});

udpPort.open();