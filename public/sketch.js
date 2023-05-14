/*
 * @Author: Mei Zhang micpearl@163.com
 * @Date: 2023-05-06 01:45:22
 * @LastEditors: Mei Zhang micpearl@163.com
 * @LastEditTime: 2023-05-14 13:53:33
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
let randomOffset = 10;


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
let posX = [75.21, 75.04, 178.73, 283.9, 294.93, 403.27, 501.5];
let posY = [174.86, 61.04, 228.8, 230.03, 91.4, 312.38, 428.75];
let offset = 5;
let checkPoint = [false];

// 方块属性
let rotationX, rotationY, rotationZ;
let speedX, speedY, speedZ;
let currentState = ''; // 当前状态
let lastStateChangeTime = 0; // 上一次状态切换的时间，单位为毫秒
let transitionDuration = 2000; // 状态切换的最小持续时间，单位为毫秒

//连接线特效
let mytimer = 0;
let interval = 100;
let redrawFlag = true;
let c1x, c2x, c1y, c2y;

//star tail effect
let stars = [];
let dotRadius = 2; // 设置小白点的半径
let dotAmount = 7; // 设置小白点的半径

function setup() {

  colorMode(HSB, 360, 30, 50); // 降低饱和度和亮度的值
  // 创建第一个画布
  canvas = createCanvas(cvs_w * 2, cvs_h);
  canvas.position(0, 0);


  background(150);
  noStroke();




  // 创建第二个画布
  canvas2 = createGraphics(cvs_w, cvs_h);
  canvas2.position(0, 0);//两个画布的绝对坐标

  canvas2.background(254, 255, 208);//RGB
  //canvas2.background(220);//RGB


  // 创建图像缓冲区，大小与canvas2相同
  brushBuffer = createGraphics(cvs_w, cvs_h);
  brushBuffer.background(20, 90, 50);

}


function draw() {
  background(246, 21, 8);//HSB mode
  // 在第一个画布上绘制内容
  //frameRate(10);

  starTailEffect();

  fill(178, 72, 15); // 阴影
  rect(60, cvs_h - 200, 150, 150); // 左下角正方形
  fill(178, 72, 70); // 亮蓝色
  rect(55, cvs_h - 205, 150, 150); // 左下角正方形
  cubeEmo(60, cvs_h - 200, frameCount);//参数是正方形的位置坐标

  checkLine();
  rippleEffect();

  // 在第二个画布上绘制内容
  brushEffect(prevMouseX, prevMouseY, recievedMouseX, recievedMouseY, "Green");
  brushEffect(prevMouseX, prevMouseY + 30, recievedMouseX, recievedMouseY + 30, "Autumn");
  //brushEffect(2*prevMouseX + cos(random(2,10)), cvs_h - prevMouseY + sin(random(2,10)), 2*recievedMouseX, cvs_h - recievedMouseY, "Spring");
  //brushEffect(3*prevMouseX + sin(random(2,10)), 3*prevMouseY + cos(random(2,10)), 3*cvs_w - recievedMouseX, 3*recievedMouseY, "Summer");




  // 将第二个画布绘制到主画布上
  image(canvas2, cvs_w, 0);//两个画布的相对坐标


}
function starTailEffect() {

  // 添加新的流星
  if (frameCount % 30 === 0) { // 每隔30帧添加一个新流星
    let starCluster = new StarCluster();
    starCluster.addStars(3, 10); // 每个簇内包含3到10个流星
    stars.push(starCluster);
  }

  // 更新流星的位置并绘制
  for (let i = stars.length - 1; i >= 0; i--) { // 逆序遍历，以便在移除元素时不会影响索引
    let starCluster = stars[i];
    starCluster.update();
    starCluster.draw();
    if (starCluster.offscreen()) {
      stars.splice(i, 1); // 如果流星簇超出画布，就将其从数组中移除
    }
  }
}





function checkLine() {
  for (let i = 0; i < 7; i++) {
    if (checkPoint[i + 1] === true) {
      drawBezier(posX[i], posY[i] - 2, 60 + i * 2, cvs_h - 200);
    }
  }
}
function drawBezier(x1, y1, x2, y2) {
  push();
  noFill();
  stroke(255, 255, 255);
  strokeWeight(0.5);
  // 检查是否已经过了3秒
  if (millis() - mytimer > interval) {
    // 重置计时器
    mytimer = millis();
    redrawFlag = true;
  }
  else {
    redrawFlag = false;

  }
  if (redrawFlag) {
    c1x = random(x1, x2);
    c1y = random(y1, y2);
    c2x = random(x1, x2);
    c2y = random(y1, y2);
  }
  bezier(x1, y1, c1x, c1y, c2x, c2y, x2, y2);

  pop();
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
function brushEffect(px, py, nx, ny, hue) {
  // 清空缓冲区
  brushBuffer.clear();

  // 设置绘制模式
  //canvas2.blendMode(MULTIPLY); // 或者使用 DARKEST
  canvas2.blendMode(DARKEST); // 或者使用 DARKEST
  //canvas2.blendMode(BLEND);

  // 设置画笔的颜色和透明度，根据z值来调整
  let a = map(recievedMouseZ, 0, 100, 0, 100);
  let s = sizeCal(vilocity(px, py, nx, ny));
  let brushWeight = map(s, 0, 1200, brushSize, brushSize + 25);

  if (s > 0 && s < 100) {
    canvas2.strokeWeight(brushWeight);
  }

  //绘制笔刷
  if (hue == "Green") {
    canvas2.stroke(140, 160, 23, a);
  }
  else if (hue == "Spring") {
    canvas2.stroke(205, 73, 40, a);
  }
  else if (hue == "Autumn") {
    canvas2.stroke(161, 105, 22, a);
  }
  else if (hue == "Summer") {
    canvas2.stroke(151, 230, 228, a);
  }
  else if (hue == "Winter") {
    canvas2.stroke(7, 7, 50, a);
  }
  else if (hue == "Winter_plus") {
    canvas2.stroke(83, 83, 95, a);
  }

  canvas2.strokeWeight(brushSize);
  canvas2.strokeJoin(ROUND);

  //计算笔刷
  canvas2.beginShape();
  canvas2.fill(seasonExe(hue, "r"), seasonExe(hue, "g"), seasonExe(hue, "b"));
  canvas2.curveVertex(px + random(-randomOffset, randomOffset), py + random(-randomOffset, randomOffset));
  canvas2.curveVertex(px + random(-randomOffset, randomOffset), py + random(-randomOffset, randomOffset));
  canvas2.curveVertex(nx + random(-randomOffset, randomOffset), ny + random(-randomOffset, randomOffset));
  canvas2.curveVertex(nx + random(-randomOffset, randomOffset), ny + random(-randomOffset, randomOffset));
  canvas2.endShape();

  // 还原绘制模式
  canvas2.blendMode(BLEND);

}

function seasonExe(season, rgb) {

  var results;
  if (season == 'Spring') {
    if (rgb == 'r') results = Math.floor(random(150, 255));
    else if (rgb == 'g') results = Math.floor(random(90, 200));
    else if (rgb == 'b') results = Math.floor(random(0, 120));

  }
  else if (season == 'Summer') {
    if (rgb == 'r') results = Math.floor(random(0, 170));
    else if (rgb == 'g') results = Math.floor(random(130, 2000));
    else if (rgb == 'b') results = Math.floor(random(150, 255));

  }
  else if (season == 'Autumn') {
    if (rgb == 'r') results = Math.floor(random(150, 255));
    else if (rgb == 'g') results = Math.floor(random(90, 200));
    else if (rgb == 'b') results = Math.floor(random(0, 120));
  }
  else if (season == 'Winter') {
    if (rgb == 'r') results = Math.floor(random(0, 50));
    else if (rgb == 'g') results = Math.floor(random(0, 160));
    else if (rgb == 'b') results = Math.floor(random(100, 200));
  }
  else if (season == 'Winter_plus') {
    if (rgb == 'r') results = Math.floor(random(200, 255));
    else if (rgb == 'g') results = Math.floor(random(200, 255));
    else if (rgb == 'b') results = Math.floor(random(12, 30));

  }
  else if (season == 'Green') {
    if (rgb == 'r') results = Math.floor(random(12, 117));
    else if (rgb == 'g') results = Math.floor(random(100, 117));
    else if (rgb == 'b') results = Math.floor(random(200, 255));

  }
  return results;
}

//在draw里调用，作为canvas 1（同时也是鼠标控制发送坐标的那个画布）的效果
function particleEffect(x, y) {
  //粒子效果
  //background(0);

  // 创建新粒子
  let p = new Particle(x, y, color('hsl(47, 82.19%, 71.69%)'));
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
  for (let i = 0; i < 7; i++) {
    if ((recievedMouseX >= (posX[i] - offset) && recievedMouseX <= (posX[i] + offset)
      && recievedMouseY >= (posY[i] - offset) && recievedMouseY <= (posY[i] + offset))
      || checkPoint[i + 1] == true) {
      // 在范围内，执行触发操作
      let ripple = new Ripple(posX[i], posY[i], myColor(i));
      ripples.push(ripple);

      rippleEffectExe(ripples);
      checkPoint[i + 1] = true;

    }
  }
  // 创建新涟漪

  /*let boolx = recievedMouseX >= (posX[1] - offset) && recievedMouseX <= (posX[1] + offset);
  let booly = recievedMouseY >= (posY[1] - offset) && recievedMouseY <= (posY[1] + offset)
  console.log("checkPoint[1]==" + checkPoint[1]);
  console.log("recievedMouseX==" + recievedMouseX);
  console.log("recievedMouseY==" + recievedMouseY);
  console.log("(posY[1] - offset)==" + (posY[1] - offset));
  console.log(boolx);
  console.log(booly);*/


}
function myColor(i) {
  switch (i) {
    case 0: return color('hsl(270, 38%, 81%)');
    case 1: return color('hsl(58, 38%, 81%)');
    case 2: return color('hsl(145, 63%, 22%)');
    case 3: return color('hsl(75, 72%, 63%)');
    case 4: return color('hsl(293, 38%, 81%)');
    case 5: return color('hsl(331, 38%, 81%)');
    case 6: return color('hsl(185, 38%, 81%)');
  }

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

function cubeEmo(x, y, timer) {
  const currentTime = millis(); // 获取当前时间，单位为毫秒

  // 根据旋转速度判断表情
  if (speedX > 10 || speedY > 10 || speedZ > 10) {
    // 旋转速度过快，绘制晕脸（螺旋线）
    if (currentState !== 'dizzy') {
      // 如果当前状态不是晕脸状态，则切换到晕脸状态
      if (currentTime - lastStateChangeTime >= transitionDuration) {
        currentState = 'dizzy';
        lastStateChangeTime = currentTime;
      }
    }
  } else {
    // 旋转速度正常，绘制笑脸（眨眼睛）
    if (currentState !== 'smiley') {
      // 如果当前状态不是笑脸状态，则切换到笑脸状态
      if (currentTime - lastStateChangeTime >= transitionDuration) {
        currentState = 'smiley';
        lastStateChangeTime = currentTime;
      }
    }
  }

  // 绘制表情
  if (currentState === 'dizzy') {
    push();
    translate(x + 35, y + 40);
    rotate(-PI / 6 * timer);
    drawDizzyFace(x, y);
    pop();

    push();
    translate(x + 110, y + 45);
    rotate(-PI / 6 * timer);
    drawDizzyFace(x + 35, y + 45);
    pop();

    particleMouth(x + 35, y + 45);
  } else if (currentState === 'smiley') {
    drawSmileyFace(x + 35, y + 45);
  }
}
// 绘制笑脸表情
function drawSmileyFace(x, y) {
  // 绘制眼睛
  if (frameCount % 180 < 30) {//眨眼
    noFill();
    stroke(178, 72, 15); // HSB
    strokeWeight(2);

    arc(x, y, 35, 35, 0, PI);
    arc(x, y + 2, 35, 35, -0.1, PI + 0.1);

    arc(x + 75, y, 35, 35, 0, PI);
    arc(x + 75, y + 2, 35, 35, -0.1, PI + 0.1);

    line((x + 150) / 2, y + 50, (x + 150) / 2 + 20, y + 48);

  } else {//睁眼

    fill(255); // 白色
    stroke(178, 72, 15); // HSB
    strokeWeight(2);
    ellipse(x, y, 35, 35); // 左眼
    ellipse(x + 75, y, 40, 40); // 右眼

    line((x + 150) / 2, y + 50, (x + 150) / 2 + 20, y + 48);
  }

}

// 绘制晕脸表情（螺旋线）
function drawDizzyFace(x, y) {
  let radius = 5;
  let angle = 0;
  let angleSpeed = 0.1;
  let maxRadius = 30;
  noFill();
  stroke(178, 72, 15); // HSB
  strokeWeight(2);
  beginShape();
  while (radius <= maxRadius) {
    let the_x = cos(angle) * radius;
    let the_y = sin(angle) * radius;
    vertex(the_x, the_y);
    angle += angleSpeed;
    radius += 0.2;
  }
  endShape();
}
function particleMouth(x, y) {
  stroke(178, 72, 15); // HSB
  triangle((x + 150) / 2, y + 50, (x + 150) / 2 + 20, y + 48, (x + 175) / 2, y + 60);
  particleEffect((x + 150) / 2 + 16, y + 51);
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
  if (_message.address == "/localEulerAngles") {
    const rX = _message.args[0];
    const rY = _message.args[1];
    const rZ = _message.args[2];

    prX = rotationX;
    prY = rotationY;
    prZ = rotationZ;

    rotationX = rX;
    rotationY = rY;
    rotationZ = rZ;

    // 计算旋转速度
    speedX = Math.abs(rotationX - prX);//取绝对值
    speedY = Math.abs(rotationY - prY);
    speedZ = Math.abs(rotationZ - prZ);

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


class Star {
  constructor() {
    this.x = random(-50, 0); // 从画布左侧之外开始
    this.y = random(height);
    this.speed = random(3, 6);
    this.color = color(255);
    this.trail = [];
  }

  update() {
    
    // 更新流星的位置
    this.x += this.speed;
    this.y += map(noise(frameCount * 0.01, this.y * 0.01), 0, 1, -3, 3); // 使用frameCount和y坐标计算噪声，以确保不会往回飞


    // 添加当前坐标到尾巴数组中
    this.trail.push(createVector(this.x, this.y));

    // 限制尾巴长度
    if (this.trail.length > dotAmount) {
      this.trail.splice(0, 1);
    }
  }

  draw() {
    // 绘制流星尾巴
    noFill();
    stroke(this.color);
    strokeWeight(2);
    for (let i = 0; i < this.trail.length; i++) {
      let pos = this.trail[i];
      let radius = map(i, 0, this.trail.length - 1, 0, dotRadius);
      let nextPos = this.trail[i + 1];
      if (nextPos) {
        let lerpedPos = p5.Vector.lerp(pos, nextPos, 0.5);
        ellipse(lerpedPos.x, lerpedPos.y, radius, radius);
      }
    }

    // 绘制小白点
    fill(this.color);
    ellipse(this.x, this.y, dotRadius, dotRadius);
  }

  offscreen() {
    // 判断流星尾部是否超出画布
    return this.trail[this.trail.length - 1].x > cvs_w + 500;
  }
}

class StarCluster {
  constructor() {
    this.stars = [];
    this.x = random(-50, 0); // 从画布左侧之外开始
    this.y = random(height);
    this.speed = random(1, 3);
    this.color = color(255);
    this.clusterSize = 0; // 簇内流星数量
  }

  addStars(min, max) {
    this.clusterSize = floor(random(min, max + 1)); // 随机确定簇内流星数量
    for (let i = 0; i < this.clusterSize; i++) {
      let y = this.y + random(-10, 10); // 为每个流星分配不同的y值
      let star = new Star(this.x, y, this.speed, this.color);
      this.stars.push(star);
    }
  }

  update() {
    // 更新簇内流星的位置
    for (let i = 0; i < this.stars.length; i++) {
      let star = this.stars[i];
      star.update();
    }
  }

  draw() {
    // 绘制簇内流星
    for (let i = 0; i < this.stars.length; i++) {
      let star = this.stars[i];
      star.draw();
    }
  }

  offscreen() {
    // 判断簇内流星是否超出画布
    for (let i = 0; i < this.stars.length; i++) {
      let star = this.stars[i];
      if (star.trail[star.trail.length - 1].x > cvs_w + 500) {
        return true;
      }
    }
    return false;
  }
}

