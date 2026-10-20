// Create an array to put all the balls in it
let balls = [];
let numberOfBalls = 10;
//let myBall2;

// Object-orintaed programming
function setup() {
  createCanvas(800, 800);

  // Create n=numberOfBalls balls
  for (let i = 0; i < numberOfBalls; i = i + 1) {
    let ballX = random(200, 600);
    let ballY = 300;
    let ballColor = color(123, 0, 200 + random(0, 100));
    let ballR = 30;
    let ball = new Ball(ballX, ballY, ballColor, ballR);
    // Put the ball(s) in the balls array
    balls.push(ball);
  }
}
function draw() {
  background(20);

  //   for (let i = 0; i < numberOfBalls; i = i + 1) {
  //     balls[i].move();
  //     balls[i].show();
  //   }

  for (let ball of balls) {
    // ball.move(random(0, 10));
    // ball.changeSize(random(0, 10));
    // ball.show();
    ball.change(5);
  }
  //   myBall.move(); // the sequence of the functions are whatever we defined in the class
  //   myBall.show();
  //   /// the attributes which belongs to myBall
  //   myBall.x;
  //   myBall2.move();
  //   myBall2.show();
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
    this.x = 0;
    this.y += random(-byHowMuch, byHowMuch);
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
  constructor(x, y, speed) {
    this.x = x;
    this.y = y;
    this.speed = speed;
    this.direction = 1;
  }

  /////// Chasing the mouse

  move() {
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
  show() {
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

    stroke(0);

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
