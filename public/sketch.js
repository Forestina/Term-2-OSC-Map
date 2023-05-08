/*
 * @Author: Mei Zhang micpearl@163.com
 * @Date: 2023-05-06 01:45:22
 * @LastEditors: Mei Zhang micpearl@163.com
 * @LastEditTime: 2023-05-06 02:11:29
 * @FilePath: \MY_OSC_SendReceive\public\sketch.js
 * @Description: 【PORT 9000】
 */

// Create connection to Node.JS Server
const socket = io();
let canvas;
let canvas2;
let cvs_w = 400;
let cvs_h = 400;

let recievedMouseX = 0;
let recievedMouseY = 0;

function setup() {
  // 创建第一个画布
  canvas = createCanvas(cvs_w * 2, cvs_h*2);
  canvas.position(0, 0);

  // 创建第二个画布
  canvas2 = createGraphics(cvs_w, cvs_h);
  canvas.position(0, 0);//两个画布的绝对坐标


}

function draw() {
  // 在第一个画布上绘制内容
  background(150);
  noStroke();

  fill(0);
  text("Send OSC",10,20);
 
  fill(255,0,0);
  circle(mouseX,mouseY,50);

  // 在第二个画布上绘制内容

  canvas2.background(200);

  canvas2.fill(0);
  canvas2.text("Recieve OSC",10,20);

  canvas2.fill(0,255,0);
  canvas2.circle(recievedMouseX,recievedMouseY,50);

  // 将第二个画布绘制到主画布上
  image(canvas2, cvs_w/2, cvs_h/2);//两个画布的相对坐标
}

function mouseDragged() {
  // Send message back to Arduino

  if(mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height){
    socket.emit("message", {
      address: "/mousePos",
      args: [
          {
            type: "f",
            value: mouseX / width
          },
          {
            type: "f",
            value: mouseY / height
          }
      ]
    });
  }

}

//Events that we are listening for
// Connect to Node.JS Server
socket.on("connect", () => {
  console.log(socket.id);
});

// Callback function on the event we disconnect
socket.on("disconnect", () => {
  console.log(socket.id);
});

// Callback function to recieve message from Node.JS
socket.on("message", (_message) => {

  console.log(_message);

  //receive part
  if(_message.address == "/mousePos"){
    //1：1映射
    //recievedMouseX = _message.args[0] * width;
    //recievedMouseY = _message.args[1] * height;

    recievedMouseX = _message.args[0] * canvas.width * (cvs_w / canvas.width);
    recievedMouseY = _message.args[1] * canvas.height * (cvs_h / canvas.height);

  }

});