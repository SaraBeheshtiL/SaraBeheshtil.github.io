//Introducing and initiating variables for circle 1
let circleX1 = 50;
let circleY1 = 50;
let speedX1 = 5;
let speedY1 = 5;
let size1 = 100;
let sizeIncrement1 = 1;
let radius1 = size1 / 2;
let r = 10;
let g = 20;
let b = 30;
let op = 40;
let speedXX1;
let speedYY1;
let sizeIncrementt1;

// Introducing and initiating variables for circle 2
let circleX2 = 300;
let circleY2 = 300;
let speedX2 = -3;
let speedY2 = -3;
let size2 = 100;
let radius2 = size2 / 2;

function setup() {
  canvas = createCanvas(800, 600);
  canvas.parent("sketch-holder");
}

function draw() {
  background(255);

  ////////////////////////////////////////////////////////////
  //circle 1//
  ////////////////////////////////////////////////////////////

  // Fill the circle1 with varied red, blue, green and opacity
  fill(r, b, g, op);
  noStroke();
  // the color of circle 1 changes as it hits the top or bottom
  if (circleY1 == radius1 || circleY1 == height - radius1) {
    r = random(100, 255);
    b = random(0, 255);
    g = random(100, 255);
    op = random(100, 255);
  }

  // Movement of circle 1
  circleX1 = circleX1 + speedX1;
  circleY1 = circleY1 + speedY1;

  // grow (or shrink) for circle 1
  size1 = size1 + sizeIncrement1;
  radius1 = size1 / 2;

  // Bounce off the left and right walls, and flip growing/shrinking
  if (circleX1 >= width - radius1) {
    circleX1 = width - radius1;
    speedX1 = speedX1 * -1;
    sizeIncrement1 = sizeIncrement1 * -1;
  }

  if (circleX1 < radius1) {
    circleX1 = radius1;
    speedX1 = speedX1 * -1;
    sizeIncrement1 = sizeIncrement1 * -1;
  }

  // Bounce off the top and bottom walls
  if (circleY1 >= height - radius1) {
    circleY1 = height - radius1;
    speedY1 = speedY1 * -1;
  }
  if (circleY1 < radius1) {
    circleY1 = radius1;
    speedY1 = speedY1 * -1;
  }

  // Sometimes the size of the circle gets too small and it lags, I just want to keep it visible
  if (size1 <= 30) {
    size1 = 30;
  }
  circle(circleX1, circleY1, size1);

  ////////////////////////////////////////////////////////////
  //circle 2// I want to make a smiley face, which hits circle 1 and make it smiley
  ////////////////////////////////////////////////////////////

  fill(255, 220, 0, 255);
  noStroke();
  circle(circleX2, circleY2, size2);

  // Right eye
  fill(0);
  circle(circleX2 + 15, circleY2 - 10, 10);
  // Left eye
  circle(circleX2 - 15, circleY2 - 10, 10);
  // Smile
  noFill();
  stroke(200, 0, 0);
  strokeWeight(3);
  arc(circleX2, circleY2 + 5, 45, 30, 0, PI);

  // Movement of circle 2
  circleX2 = circleX2 + speedX2;
  circleY2 = circleY2 + speedY2;

  // Bounce off the left and right walls
  if (circleX2 >= width - radius2) {
    circleX2 = width - radius2;
    speedX2 = speedX2 * -1;
  }
  if (circleX2 < radius2) {
    circleX2 = radius2;
    speedX2 = speedX2 * -1;
  }
  // Bounce off the top and bottom wall
  if (circleY2 >= height - radius2) {
    circleY2 = height - radius2;
    speedY2 = speedY2 * -1;
  }
  if (circleY2 < radius2) {
    circleY2 = radius2;
    speedY2 = speedY2 * -1;
  }

  // Circle 1 turning to a smiley face whenever it passes circle 2
  let distance = dist(circleX1, circleY1, circleX2, circleY2); // (I have taken this from P5.js references)
  if (distance <= radius1 + radius2) {
    fill(r, g, b, op);
    r = 255;
    g = 220;
    b = 0;
    op = 255;
    noStroke();
    circle(circleX1, circleY1, size1);

    //eyes
    noStroke();
    fill(0);
    circle(circleX1 - radius1 / 3, circleY1 - radius1 / 3, radius1 / 4);
    circle(circleX1 + radius1 / 3, circleY1 - radius1 / 3, radius1 / 4);

    // smile
    noFill();
    stroke(200, 0, 0);
    strokeWeight(5);
    arc(circleX1, circleY1 + radius1 / 5, radius1, radius1 / 2, 0, PI);
  }
}
//By clicking the ball's speed changes on random number
function mousePressed() {
  //circleX = 100;
  speedY1 = speedY1 * -1;
  speedX1 = speedX1 * -1;
}

function keyPressed() {
  if (key === " ") {
    //first we define new variables as speedXX and speedYY, to save
    //the speed for later
    speedXX1 = speedX1;
    speedYY1 = speedY1;
    sizeIncrementt1 = sizeIncrement1;

    // then we set the value for the speedX and speedY, zero to pause the ball
    speedX1 = 0;
    speedY1 = 0;
    sizeIncrement1 = 0;
  }
  // this means that we pause the ball when we press the space button

  //now we want to push the "r" button  to restore the earlier speed back
  if (key === "r") {
    speedX1 = speedXX1;
    speedY1 = speedYY1;
    sizeIncrement1 = sizeIncrementt1;
  }
}
