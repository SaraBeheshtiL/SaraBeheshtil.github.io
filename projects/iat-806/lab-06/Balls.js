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
    // let opacity= random( [100, 200])
    fill(this.color);
    stroke(120);
    circle(this.x, this.y, this.d / 2);
  }

  move() {
    xposition = random(-1, 1);
    yposition = random(-1, 1);
    // this.x = this.x + xposition;
    // this.y = this.y + yposition;
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
    // 2. Calculate the 1D index inside the mask's pixel array
    let index = 4 * (py * width + px);
    let maskAlpha = segmentation.mask.pixels[index + 3];
    let maskRed = segmentation.mask.pixels[index + 0];
    let maskGreen = segmentation.mask.pixels[index + 1];
    let maskBlue = segmentation.mask.pixels[index + 2];
    // If the mask pixel at this position is not black/transparent, it's a person
    if (maskAlpha !== 255) {
      // this.color = "orange";
      this.color = color(0, 0, 0, 100);
      this.d = 25;
    } else {
      this.color = this.originalColor;
    }
  }
}
