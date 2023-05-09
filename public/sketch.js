/*
 * @Author: Mei Zhang micpearl@163.com
 * @Date: 2023-05-06 01:45:22
 * @LastEditors: Mei Zhang micpearl@163.com
 * @LastEditTime: 2023-05-09 20:19:06
 * @FilePath: \MY_OSC_SendReceive\public\sketch.js
 * @Description: 【PORT 9000】
 */

// Create connection to Node.JS Server
const socket = io();
let canvas;
let canvas2;
let cvs_w = 600; // 画布宽度
let cvs_h = 600; // 画布高度
let cvs_z = 255; // 画布深度

let z = 200;  // 当前z值，初始为0
let isDrawing = true;  // 是否正在画线的标志

let recievedMouseX = 0;
let recievedMouseY = 0;
let recievedMouseZ = 0;

let prevMouseX = 0;
let prevMouseY = 0;
let prevMouseZ = 0;

function setup() {

  colorMode(HSB, 360, 100, 100);
  // 创建第一个画布
  canvas = createCanvas(cvs_w*2 , cvs_h );
  canvas.position(0, 0);


  background(150);
  noStroke();

  fill(0);
  text("Send OSC", 10, 20);




  // 创建第二个画布
  canvas2 = createGraphics(cvs_w, cvs_h);
  canvas2.position(0, 0);//两个画布的绝对坐标

  canvas2.background(200);

  canvas2.fill(0);
  canvas2.text("Recieve OSC", 10, 20);

}


function draw() {
  // 在第一个画布上绘制内容


  //fill(255, 0, 0);
  //circle(mouseX, mouseY, 50);

  effect();

  // 在第二个画布上绘制内容

  ///////////////////////////////////
  // 如果z值超出范围，则抬笔
  if (recievedMouseZ < 0 || recievedMouseZ > 255) {
    isDrawing = false;
  }
  // 如果正在画线，则绘制
  if (isDrawing) {
    // 设置画笔的颜色和透明度，根据z值来调整
    let c = color(0, 150, 255, map(z, 0, 255, 0, 255));
    canvas2.stroke(c);
    //canvas2.strokeWeight(map(z, 0, 255, 1, 5));
    canvas2.strokeWeight(3);

    //canvas2.fill(0, 255, 0);
    //canvas2.circle(recievedMouseX, recievedMouseY, 50);
    // 绘制线条
    canvas2.line(prevMouseX, prevMouseY, recievedMouseX, recievedMouseY);
  }

  //////////////////////////////////

  // 将第二个画布绘制到主画布上
  image(canvas2, cvs_w , 0);//两个画布的相对坐标
}

let noiseScale = 0.02; // 噪声函数的尺度
let r = 100; // 球体半径
let t = 0; // 时间

function effect(){
 // 更新三维坐标
 x = recievedMouseX;
 y = recievedMouseY;
 z = recievedMouseZ;
 
 // 计算上一个时刻的坐标与当前坐标之间的距离
 let d = dist(prevMouseX, prevMouseY, prevMouseZ, x, y, z);
 
 // 增加时间值
 t += d * 0.02;
 
 // 计算球体表面上的点的位置和颜色
 let noiseVal = noise(x * noiseScale, y * noiseScale, z * noiseScale, t);
 let rVal = map(noiseVal, 0, 1, 0, 360);
 let gVal = map(noiseVal, 0, 1, 0, 100);
 let bVal = map(noiseVal, 0, 1, 50, 100);
 let c = color(rVal, gVal, bVal);
 let px = x + r * cos(t);
 let py = y + r * sin(t);
 let pz = z + r * sin(t);
 
 // 绘制球体
 push();
 translate(px, py, pz);
 noStroke();
 fill(c);
 ellipsoid(r, r, r);
 pop();




}




function mouseDragged() {
  // Send message back to Arduino

  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
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
        },
        {
          type: "f",
          value: map(mouseX, 0, width, 0, 255)
        }
      ]
    });
  }
}
/*function mousePressed() {
  // 重置画布
  background(255);

  // 发送消息到服务器
  socket.emit("message", {
    address: "/resetCanvas",
    args: []
  });
}*/


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
  if (_message.address == "/mousePos") {
    //1：1映射
    //recievedMouseX = _message.args[0] * width;
    //recievedMouseY = _message.args[1] * height;

    //按画布大小映射
    recievedMouseX = _message.args[0] * cvs_w*2;
    recievedMouseY = _message.args[1] * cvs_h;
    recievedMouseZ = _message.args[2] ;

    // 存储前一个时刻的坐标
    prevMouseX = recievedMouseX;
    prevMouseY = recievedMouseY;
    prevMouseZ = recievedMouseZ;

  }

});