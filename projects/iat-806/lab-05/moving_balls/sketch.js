// Create an array to put all the balls in it
let balls = [];
let numberOfBalls = 1000;

/// gavity condition
let gravityOn = false;

// Object-orintaed programming
function setup() {
  createCanvas(800, 800);

  // Create n=numberOfBalls balls
  for (let i = 0; i < numberOfBalls; i = i + 1) {
    let ballX = random(200, 600);
    let ballY = 300;
    let ballColor = color(100, 100, 200 + random(0, 100));
    let ballR = 50;
    let ball = new Ball(ballX, ballY, ballColor, ballR);
    // Put the ball(s) in the balls array
    balls.push(ball);
  }
}

function draw() {
  background(20);

  for (let ball of balls) {
    ball.change(2, mouseX, mouseY);
  }
}

class Ball {
  // x xposition, y yposition, c color, r radius
  constructor(x, y, c, r) {
    this.x = x;
    this.y = y;
    this.color = c;
    this.originalColor = c; /// I want to save the origanl color to return it back in some methods
    this.r = r;
    this.speedY = 0;
  }

  change(byHowMuch, mouseX, mouseY) {
    this.changeSize(byHowMuch);
    this.move(byHowMuch);
    ///// When mouse is pressed the balls escape the mouse when it approches
    if (mouseIsPressed) {
      this.escapingTheMouse(5, mouseX, mouseY);
    }
    this.colorNearMouse();
    this.show();

    //// when you press the space button the gravity works. and the balls
    if (gravityOn == true) {
      this.gravity(0.2);
    }
  }

  /// This method changes the sizes of the balls by a random number in the (-byHowMuch, byHowMuch)  bracket
  changeSize(byHowMuch) {
    this.r = this.r + random(-byHowMuch, byHowMuch);
  }
  ///methods are functions defined for a class
  /// Methods can also take attributes, like move(byHowMuch)

  move(byHowMuch) {
    /// this method moves the balls in x and y direction by a random number in the (-byHowMuch, byHowMuch) bracket
    this.x += random(-byHowMuch, byHowMuch);
    this.y += random(-byHowMuch, byHowMuch);
  }

  show() {
    /// first object needs to exist
    fill(this.color);
    circle(this.x, this.y, this.r); // "this" mean this specific object
  }
  // This method makes the balls fall and bounce off the bottom
  gravity(byHowMuch) {
    this.speedY = this.speedY + byHowMuch; /// vertical speed chnages by gravity
    this.y = this.y + this.speedY; /// then vertical location changes by speed in Y direction

    if (this.y > height - this.r / 2) {
      // We are creating the condition when the ball's vertical position
      // go over the canvas it should return by the smaller speed and with a chnage in speed direction (-0.8)
      this.y = height - this.r / 2;
      this.speedY = this.speedY * -0.8;
    }
  }
  // This method makes the balls move away when the mouse gets closeer than 100 pixels
  escapingTheMouse(byHowMuch, mouseX, mouseY) {
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < this.r / 2 + 100) {
      if (this.x < mouseX) {
        this.x -= byHowMuch;
      } else {
        this.x += byHowMuch;
      }
      if (this.y < mouseY) {
        this.y -= byHowMuch;
      } else {
        this.y += byHowMuch;
      }
    }
  }
  // This method changes the ball's color when the mouse approaches them (in less than 120 pixels near them)
  colorNearMouse() {
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < 120 + this.r / 2) {
      this.color = color(random(255), random(255), random(255));
    } else {
      this.color = this.originalColor;
    }
  }
}

//// I want to defining a keyPressed function so when a key (in this case "space") pressed the gravity works
function keyPressed() {
  if (key === " ") {
    gravityOn = true;
  } else {
    gravityOn = false;
  }
}
