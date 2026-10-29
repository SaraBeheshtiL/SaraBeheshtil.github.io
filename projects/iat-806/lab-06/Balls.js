/////////////////////////////////////////////////
/////////////////////////////////////////////////
class Ball {
  constructor(x, y, d, c) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.color = c;
    this.originalColor = c;
    this.onBody = false;
  }

  show() {
    fill(this.color);
    stroke(120);
    let changingD = random(-1, 1);
    this.d = this.d + changingD;
    this.d = constrain(this.d + changingD, 20, 35);
    circle(this.x, this.y, this.d / 2);
  }

  move() {
    xposition = random(-0.5, 0.5);
    yposition = random(-0.5, 0.5);
    this.x = this.x + xposition;
    this.y = this.y + yposition;
    this.x = constrain(this.x + xposition, 0, width - 1);
    this.y = constrain(this.y + yposition, 0, height - 1);
  }

  red() {
    /// by this method I m defining when the mouse is on the ball, the color changes to red
    let distance = dist(this.x, this.y, mouseX, mouseY);
    if (distance < this.d / 2) {
      this.color = "red";
    }
  }
  ballsOnBody() {
    let px = floor(this.x);
    let py = floor(this.y);
    // Calculating the 1D index inside the mask's pixel array
    let index = 4 * (py * width + px);
    let maskAlpha = segmentation.mask.pixels[index + 3];
    let maskRed = segmentation.mask.pixels[index + 0];
    let maskGreen = segmentation.mask.pixels[index + 1];
    let maskBlue = segmentation.mask.pixels[index + 2];
    // If the mask pixel at this position is not black/transparent, it's a person : that is the definition of the BodyPix ML5.js when it finds a body
    // the body pixels get transparent and the rest becomes black
    if (maskAlpha !== 255) {
      // just giving a half-transparent black color to the circles which are on the body
      this.color = color(0, 0, 0, 100);
      this.onBody = true;
    } else {
      this.onBody = false;
      this.color = this.originalColor;
    }
  }
}

//////////// CrazyBall as a new object extended from Balls Class /////
///////////////////////////////////////////////////////////////
class CrazyBall extends Ball {
  ///// Every CrazyBall is a Ball, but it can have additional properties and behaviors.
  constructor(x, y, d, c) {
    super(x, y, d, c); ////super() calls the constructor of the parent class, Ball.
    //// giving new properties
    this.angle = random(TWO_PI); /// this angle is supposed to initiate the movement direction
    this.speed = random(1, 3);
  }

  move() {
    /// Defininh a new movemnet for CrazyBalls compared to the normal Balls
    // Change direction unpredictably
    this.angle += random(-0.2, 0.2);

    this.x += cos(this.angle) * this.speed; ///movment in x direction
    this.y += sin(this.angle) * this.speed; /// movement in y direction

    // // Keep it inside the canvas
    if (
      this.x > width - this.d / 2 ||
      this.x < this.d / 2 ||
      this.y > height - this.d / 2 ||
      this.y < this.d / 2
    ) {
      this.speed = random(-3, -1);
    }
  }
  // this.x = constrain(this.x, 0, width - 1);
  // this.y = constrain(this.y, 0, height - 1);

  show() {
    push();
    translate(this.x, this.y);

    // Crazy breathing effect
    this.breathing = 0;
    this.breathingSpeed = 0.5;
    this.breathing += this.breathingSpeed;

    if (this.breathing > 10 || this.breathing < -10) {
      this.breathingSpeed *= -1;
    }

    let size = this.d + this.breathing;
    // Draw the body
    this.color = color(0, 200, 100);
    fill(this.color);
    noStroke();
    circle(0, 0, size);

    pop();
  }

  respond() {
    if (this.onBody) {
      this.speed = 8;
      this.color = color(0, 0, 0, 100);
    } else {
      this.speed = 2;
      this.color = this.originalColor;
    }
  }
}
