/*
 * @Author: Mei Zhang micpearl@163.com
 * @Date: 2023-05-06 01:45:22
 * @LastEditors: Mei Zhang micpearl@163.com
 * @LastEditTime: 2023-05-13 16:41:07
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

//let z = 200;  // 当前z值，初始为0
let isDrawing = true;  // 是否正在画线的标志
let brushSize = 30;

let recievedMouseX = 0;
let recievedMouseY = 0;
let recievedMouseZ = 0;

let prevMouseX = 0;
let prevMouseY = 0;
let prevMouseZ = 0;

//图像缓冲区
let brushBuffer;


//粒子效果
let particles = [];
let noiseScale = 0.02; // 噪声函数的尺度
let r = 100; // 球体半径
let t = 0; // 时间

//涟漪效果
let ripples = [];
let posX = [50, 100, 150, 200, 250], posY = [50, 100, 150, 200, 250];
let offset = 20;
let checkPoint = [false, false, false, false, false];

// 方块属性

let brushTexture=[];

function preload() {
  brushTexture[0] = loadImage('antient01.jpg'); 
}

function setup() {

  colorMode(HSB, 360, 30, 50); // 降低饱和度和亮度的值
  // 创建第一个画布
  canvas = createCanvas(cvs_w * 2, cvs_h);
  canvas.position(0, 0);


  background(150);
  noStroke();

  fill(0);
  text("Send OSC", 10, 20);

  //cube = new Cube(cvs_w / 2, cvs_h / 2); // 初始化正方形对象并置于画布中央
  //expression = new Expression();


  // 创建第二个画布
  canvas2 = createGraphics(cvs_w, cvs_h);
  canvas2.position(0, 0);//两个画布的绝对坐标

  canvas2.background(200);

  canvas2.fill(0);
  canvas2.text("Recieve OSC", 10, 20);

  // 创建图像缓冲区，大小与canvas2相同
  brushBuffer = createGraphics(cvs_w, cvs_h);
  brushBuffer.background(200);

}


function draw() {
  background(0);
  // 在第一个画布上绘制内容

  //particleEffect();
  //rippleEffect();
  cubeEmo();


  // 在第二个画布上绘制内容
  brushEffect();


  // 将第二个画布绘制到主画布上
  image(canvas2, cvs_w, 0);//两个画布的相对坐标


}

function sizeCal(v) {
  var size;
  //y=kx+b
  size = brushSize * v;
  return size;
}

function vilocity(pX, pY, nX, nY) {
  var delta = sqrt(sq(nX - pX) + sq(nY - pY));
  if (delta === 0) {
    return 1; // 如果距离为零，返回一个默认速度值
  } else {
    var v = 1 / delta;
    return v;
  }
}
function brushEffect() {
  // 清空缓冲区
  brushBuffer.clear();

  // 设置绘制模式
  //canvas2.blendMode(MULTIPLY); // 或者使用 DARKEST
  canvas2.blendMode(DARKEST); // 或者使用 DARKEST
  // 使用贴图绘制笔刷效果
  canvas2.image(brushTexture[0], recievedMouseX, recievedMouseY, brushSize, brushSize);
  // 还原绘制模式
  canvas2.blendMode(BLEND);
  

  // 如果z值超出范围，则抬笔
  //if (recievedMouseZ < 0 || recievedMouseZ > 255) {
  // isDrawing = false;
  //}
  // 如果正在画线，则绘制
  //if (isDrawing) {
  // 设置画笔的颜色和透明度，根据z值来调整
  let a = map(recievedMouseZ, 0, 100, 0, 100);//【改】根据z坐标的实际取值进行map，改第一对0-255
  //brushBuffer.stroke(140, 160, 23, a);
  canvas2.stroke(140, 160, 23, a);//(140,160,23)很好看的一个绿色
  //brushBuffer.stroke(140, 160, 23, a);//(140,160,23)很好看的一个绿色
  let s = sizeCal(vilocity(prevMouseX, prevMouseY, recievedMouseX, recievedMouseY));
  //canvas2.strokeWeight(map(s, 0, 1200, brushSize, brushSize + 25));
  if (s > 0 && s < 100) {
    canvas2.strokeWeight(map(s, 0, 1200, brushSize, brushSize + 25));
  }

  canvas2.strokeWeight(brushSize);

  // 绘制线条
  canvas2.line(prevMouseX, prevMouseY, recievedMouseX, recievedMouseY);
  //}

}

//在draw里调用，作为canvas 1（同时也是鼠标控制发送坐标的那个画布）的效果
function particleEffect() {
  //粒子效果
  //background(0);

  // 创建新粒子
  let p = new Particle(recievedMouseX, recievedMouseY, color('hsl(160, 100%, 50%)'));
  particles.push(p);

  // 更新和绘制粒子
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.update();
    p.display();
    //删除超出边界的粒子
    if (p.isDead()) {
      particles.splice(i, 1);
    }
  }
}
function rippleEffect() {
  //background(0);

  // 创建新涟漪
  if ((recievedMouseX >= (posX[1] - offset) && recievedMouseX <= (posX[1] + offset) && recievedMouseY >= (posY[1] - offset) && recievedMouseY <= (posY[1] + offset))
    || checkPoint[1] == true) {
    // 在范围内，执行触发操作
    let ripple = new Ripple(posX[1], posY[1], color('hsl(182, 72%, 63%)'));
    ripples.push(ripple);

    rippleEffectExe(ripples);
    checkPoint[1] = true;

  }
  //console.log("checkPoint[1]==" + checkPoint[1]);
}
function rippleEffectExe(ripples) {

  // 更新和绘制涟漪
  for (let i = ripples.length - 1; i >= 0; i--) {
    let ripple = ripples[i];
    ripple.update();
    ripple.display();

    // 删除扩散完的涟漪
    if (ripple.isFinished()) {
      ripples.splice(i, 1);
    }
  }

}

function cubeEmo() {

}

//鼠标发送，测试用
/*function mouseDragged() {
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
}*/
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
  //if (_message.address == "/mousePos") {//测试用
  if (_message.address == "/position") {

    //1：1映射
    //recievedMouseX = _message.args[0] * width;
    //recievedMouseY = _message.args[1] * height;

    //将鼠标值按画布大小映射
    //const currentMouseX = _message.args[0] * cvs_w * 2;
    //const currentMouseY = _message.args[1] * cvs_h;
    //const currentMouseZ = _message.args[2];

    //将unity世界值按画布大小映射
    const currentMouseX = map(_message.args[0], 0, 500, 0, cvs_w);
    const currentMouseY = map(_message.args[2], -10, 400, 0, cvs_h);
    const currentMouseZ = map(_message.args[1], -10, 120, 0, 80);

    prevMouseX = recievedMouseX;
    prevMouseY = recievedMouseY;
    prevMouseZ = recievedMouseZ;

    recievedMouseX = currentMouseX;
    recievedMouseY = currentMouseY;
    recievedMouseZ = currentMouseZ;

    //console.log("prevMouseX = " + prevMouseX + "; recievedMouseX = " + recievedMouseX);
  }
});

//粒子效果
class Particle {
  constructor(x, y, color) {
    this.position = createVector(x, y);
    this.velocity = createVector(random(-1, 1), random(-1, 1));
    this.acceleration = createVector(0, 0.1);
    this.lifespan = 255;
    this.color = color; // 使用传入的颜色值
  }

  update() {
    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    //this.acceleration.mult(0);//扩散效果
    this.lifespan -= 1;
  }
  //扩散效果
  /*applyForce(force) {
    this.acceleration.add(force);
  }*/

  display() {
    noStroke();
    fill(this.color, this.lifespan); // 使用粒子的颜色和透明度
    ellipse(this.position.x, this.position.y, 5, 5);
  }

  isDead() {
    return this.lifespan <= 0;
  }
}

//涟漪效果
class Ripple {
  constructor(x, y, color) {
    this.position = createVector(x, y);
    this.radius = 0;
    this.maxRadius = random(5, 40);
    this.speed = random(0.1, 1);
    this.color = color; // 接收传入的颜色值
  }

  update() {
    this.radius += this.speed;
  }

  display() {
    noFill();
    let alpha = map(this.radius, 0, this.maxRadius, 255, 0);
    //stroke(255, alpha);
    stroke(this.color, alpha); // 使用传入的颜色值
    ellipse(this.position.x, this.position.y, this.radius * 2, this.radius * 2);
  }

  isFinished() {
    return this.radius >= this.maxRadius;
  }
}

// 表情类
class Expression {
  constructor() {
    this.faceSize = 100; // 表情大小
  }

  update(rotationSpeed) {
    // 根据旋转速度调整表情
    if (rotationSpeed > 0.1) {
      this.expression = 'dizzy'; // 旋转速度较快时，晕脸表情
    } else {
      this.expression = 'smile'; // 旋转速度较慢时，笑脸表情
    }
  }

  display() {
    // 根据表情类型绘制表情
    const x = 0;
    const y = 0;
    const faceSize = this.faceSize;

    if (this.expression === 'dizzy') {
      // 绘制晕脸表情
      const radius = faceSize / 2;
      const eyeOffset = faceSize / 4;

      // 绘制脸部
      fill(255);
      ellipse(x, y, faceSize, faceSize);


      // 绘制眼睛
      fill(0);
      ellipse(x - eyeOffset, y - eyeOffset, radius / 4, radius / 4);
      ellipse(x + eyeOffset, y - eyeOffset, radius / 4, radius / 4);

      // 绘制嘴巴
      fill(0);
      ellipse(x, y + eyeOffset, radius / 2, radius / 2);
    } else if (this.expression === 'smile') {
      // 绘制笑脸表情
      const radius = faceSize / 2;
      const eyeOffset = faceSize / 4;

      // 绘制脸部
      fill(255);
      ellipse(x, y, faceSize, faceSize);

      // 绘制眼睛
      fill(0);
      ellipse(x - eyeOffset, y - eyeOffset, radius / 4, radius / 4);
      ellipse(x + eyeOffset, y - eyeOffset, radius / 4, radius / 4);

      // 绘制嘴巴
      fill(0);
      arc(x, y + eyeOffset, radius / 2, radius / 2, 0, PI);
    }
  }
}
