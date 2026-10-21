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
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  show() {
    /// first object needs to exist
    fill(this.color);
    circle(this.x, this.y, this.r); // "this" mean this specific object
  }
}
