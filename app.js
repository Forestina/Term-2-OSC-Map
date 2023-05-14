/*
 * @Author: Mei Zhang micpearl@163.com
 * @Date: 2023-05-06 01:45:22
 * @LastEditors: Mei Zhang micpearl@163.com
 * @LastEditTime: 2023-05-14 01:54:50
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

//地址：position
let oscRecievePort = "8002";
let oscRecievePort2 = "8001";
let sendIP = "172.16.2.112";//localhost
let oscSendPort = "8002";
let oscSendPort2 = "8001";




// Tell our Node.js Server to host our P5.JS sketch from the public folder.
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections from chrome, and open chrome when it is ready
server.listen(staticServerPort, () => {
  console.log(`listening on *: ${staticServerPort}`);
  open("http://localhost:" + staticServerPort);
});

// Callback function for what to do when our P5.JS sketch connects and sends us messages
io.on("connection", (socket) => {
  console.log("a user connected");

  // Code to run every time we get a message from P5.JS
  socket.on("message", (_msg) => {
    /*
    //send it via OSC to another port, device or software (e.g. max msp)
    udpPort.send(_msg, sendIP, oscSendPort);

    // Print it to the Console
    if (printEveryMessage) {
      console.log(_msg);
    }*/

    //我的代码
    // Split the received message into x, y, z components
    const [x, y, z] = _msg.split(",");

    // Create an object with the x, y, z values
    const data = {
      x: parseFloat(x),
      y: parseFloat(y),
      z: parseFloat(z)
    };

    // Send the data via OSC to another port, device, or software (e.g., Max/MSP)
    udpPort.send({ address: "/position", args: [data.x, data.y, data.z] }, sendIP, oscSendPort);
    udpPort2.send({ address: "/localEulerAngles", args: [data.x, data.y, data.z] }, sendIP, oscSendPort2);

    // Print the data to the console
    if (printEveryMessage) {
      console.log(data);
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
  localAddress: "172.16.2.112",
  localPort: oscRecievePort
});

//地址：localEulerAngles
let udpPort2 = new osc.UDPPort({
  localAddress: "172.16.2.112",
  localPort: oscRecievePort2
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
  io.emit("message", oscMessage);

  // Print it to the Console
  if (printEveryMessage) {
    console.log(oscMessage);
  }
});

udpPort.on("error", (err) => {
  console.log(err);
});

udpPort.open();

//2
udpPort2.on("ready", () => {
  let ipAddresses = getIPAddresses();

  console.log("Listening for OSC over UDP.");
  ipAddresses.forEach((address) => {
    console.log(" Host:", address + ", Port:", udpPort.options.localPort);
  });

});

udpPort2.on("message", (oscMessage) => {

  //send it to the front-end so we can use it with our p5 sketch
  io.emit("message", oscMessage);

  // Print it to the Console
  if (printEveryMessage) {
    console.log(oscMessage);
  }
});

udpPort2.on("error", (err) => {
  console.log(err);
});

udpPort2.open();