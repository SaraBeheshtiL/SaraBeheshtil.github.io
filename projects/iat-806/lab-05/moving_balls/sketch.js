// Create an array to put all the balls in it
let balls = [];
let numberOfBalls = 50;

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
    if (keyIsDown(DOWN_ARROW)) {
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
    this.speedY = this.speedY + byHowMuch;
    this.y = this.y + this.speedY;

    if (this.y > height - this.r / 2) {
      this.y = height - this.r / 2;
      this.speedY = this.speedY * -0.8;
    }
  }
  // This method makes the balls move away when the mouse gets close
  escapingTheMouse(byHowMuch, mouseX, mouseY) {
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < 100) {
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
  // This method changes the ball's color when the mouse approaches them (in less than 50 pixels near them)
  colorNearMouse() {
    let d = dist(this.x, this.y, mouseX, mouseY);
    if (d < 120) {
      this.color = color(random(255), random(255), random(255));
    } else {
      this.color = this.originalColor;
    }
  }
}
