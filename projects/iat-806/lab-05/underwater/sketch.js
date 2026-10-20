// Create an array to put all the balls in it
let balls = [];
let numberOfBalls = 20;
let fish;
let waterfish = [];

///// Preload all the media before starting creation
function preload() {
  for (let k = 0; k < 12; k = k + 1) {
    waterfish[k] = loadImage("different_fishes/fish_" + k + ".png");
  }
}

// Object-orintaed programming
function setup() {
  createCanvas(800, 800);

  // Create n=numberOfBalls balls
  // for (let i = 0; i < numberOfBalls; i = i + 1) {
  //   let ballX = random(width);
  //   let ballY = random(600, 800);
  //   let ballColor = color(0, 0, 200 + random(0, 55), 50);
  //   let ballR = 30;
  //   let ball = new Ball(ballX, ballY, ballColor, ballR);
  //   // Put the ball(s) in the balls array
  //   balls.push(ball);
  // }

  fish = new Fish(200, 200);
}
function draw() {
  background(20);

  // Create new bubbles continuously
  if (frameCount % 10 == 0) {
    let ballX = random(width);
    let ballY = height;
    let ballColor = color(10, 50, random(50, 100), 100);
    let ballR = random(10, 30);

    let ball = new Ball(ballX, ballY, ballColor, ballR);
    balls.push(ball);
  }

  // Move and show bubbles
  for (let ball of balls) {
    ball.change(5);
  }

  // Remove bubbles that leave the canvas
  for (let i = balls.length - 1; i >= 0; i = i - 1) {
    if (balls[i].y < -balls[i].r) {
      balls.splice(i, 1);
    }
  }

  // Move and show fish
  fish.moveFish();
  fish.showFish();
}

class Ball {
  // x xposition, y yposition, c color, r radius
  constructor(x, y, c, r) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.r = r;
  }
  change(byHowMuch) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch);
    this.show();
  }
  changeSize(byHowMuch) {
    this.r = this.r + random(-byHowMuch, byHowMuch);
  }
  ///methods are functions defined for a class
  /// Methods can also take attributes, like move(byHowMuch)

  move(byHowMuch) {
    this.x = this.x;
    this.y = this.y - random(0, byHowMuch);
  }

  show() {
    /// first object needs to exist
    fill(this.color);
    circle(this.x, this.y, this.r); // "this" mean this specific object
  }
}

/////// Creating a funny Fish almost the same procedure I did for my Assignment 1/////
///// This time I'm defining the fish as an object in a class/////
////////////////////////////////////////////////////////////////////
class Fish {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.direction = 1;
  }

  /////// Chasing the mouse

  moveFish() {
    if (mouseX > this.x) {
      this.x = this.x + 5; ///// I chose five for the speed
    }
    if (mouseX < this.x) {
      this.x = this.x - 5;
    }
    if (mouseY > this.y) {
      this.y = this.y + 5;
    }
    if (mouseY < this.y) {
      this.y = this.y - 5;
    }
    if (mouseX > this.x) {
      this.direction = 1;
    } else {
      this.direction = -1;
    }
  }

  /////// show/draw the fish
  showFish() {
    push();
    translate(this.x, this.y);
    scale(this.direction, 1);

    // TAIL
    fill(255, 120, 80);
    noStroke();
    triangle(-60, 0, -130, -45, -130, 45);

    // TOP FIN
    fill(255, 90, 60);
    triangle(-20, -35, 10, -90, 45, -30);

    // BOTTOM FIN

    fill(255, 100, 60);

    triangle(-10, 35, 15, 75, 40, 35);

    // BODY
    fill(255, 170, 70);
    stroke(0);
    strokeWeight(3);
    ellipse(0, 0, 160, 100);

    // MOUTH
    noFill();
    stroke(100, 0, 0);
    strokeWeight(3);
    arc(65, 15, 25, 20, 0, PI);

    // BIG FUNNY EYES

    fill(255);
    stroke(0);
    strokeWeight(3);
    ellipse(20, -35, 55, 65);
    ellipse(65, -30, 50, 60);

    // Draw pupils
    this.lookAtMouse();
    pop();
  }

  // METHOD 3: Pupils follow the mouse
  lookAtMouse() {
    let relativeMouseX = (mouseX - this.x) * this.direction;
    let relativeMouseY = mouseY - this.y;
    let pupilX = constrain(relativeMouseX * 0.1, -12, 12);
    let pupilY = constrain(relativeMouseY * 0.1, -15, 15);

    // PUPILS

    fill(0);
    noStroke();
    circle(20 + pupilX, -35 + pupilY, 20);
    circle(65 + pupilX, -30 + pupilY, 20);

    // WHITE REFLECTIONS
    fill(255);
    circle(16 + pupilX, -40 + pupilY, 7);
    circle(61 + pupilX, -35 + pupilY, 7);
  }
}
