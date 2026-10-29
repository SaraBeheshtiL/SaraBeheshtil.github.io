/////////////////////////////////////////////////
/////////////////////////////////////////////////
class Ball {
  constructor(x, y, d, c) {
    this.x = x;
    this.y = y;
    this.d = d;
    this.color = c;
    this.originalColor = c;
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
    } else {
      this.color = this.originalColor;
    }
  }
}
