// Create an array to put all the balls in it
let balls = [];
let numberOfBalls = 20;
let fish;
let waterfish = [];
let swimmingFish = [];
//let underwaterSound;

// Object-orintaed programming
async function setup() {
  createCanvas(800, 800);
  /////Load all 12 fish images
  for (let k = 0; k < 12; k++) {
    waterfish[k] = await loadImage("different_fishes/fish_" + k + ".png");
  }
  //underwaterSound = await loadSound("underwater-ambience.mp3"); // load once

  fish = new Fish(200, 200);
}

function draw() {
  background(0, 0, 50);
  if (frameCount % 20 == 0) {
    let ballX = random(50, 100);
    let ballX2 = random(350, 400);
    let ballX3 = random(650, 700);
    let ballY = height;
    let ballColor = color(10, 50, random(100, 200), 100);
    let ballR = random(10, 30);
    let ball = new Ball(ballX, ballY, ballColor, ballR);
    let ball2 = new Ball(ballX2, ballY, ballColor, ballR);
    let ball3 = new Ball(ballX3, ballY, ballColor, ballR);
    balls.push(ball);
    balls.push(ball2);
    balls.push(ball3);
  }

  // Move and show bubbles
  for (let ball of balls) {
    ball.change(5);
  }

  // Move and show fish
  fish.moveFish();
  fish.showFish();
  fish.eatFish();

  // Create a new fish every 60 frames
  if (frameCount % 20 == 0) {
    let fishX = 800; // Start outside the left side
    let fishY = random(200, 700); // Random vertical position
    // Choose one of the 12 fish images
    let fishImage = random(waterfish);
    // Create a new swimming fish
    let newFish = new SwimmingFish(fishX, fishY, fishImage);
    swimmingFish.push(newFish);
  }
  // Move and display swimming fish
  for (let newFish of swimmingFish) {
    newFish.move();
    newFish.show();
  }
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
    stroke("blue");
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

  /////// Chasing the mouse ///////////////////////////

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
    // translate(x, y), moves the coordinate system to (x,y) from its predefined location of (0,0)
    // now the origin of coordinate ststem is moved to the (xposition, yposition)of the fish and all the drawings will be done in
    translate(this.x, this.y);
    /// Scale(this.direction, 1) flips the entire fish horizontally depending on the direction of the fish
    scale(this.direction, 1);

    // Fish's tail
    fill(255, 90, 60);
    noStroke();
    triangle(-60, 0, -130, -45, -130, 45);

    // the body
    fill(255, 170, 70);
    stroke(0);
    strokeWeight(3);
    ellipse(0, 0, 160, 100);

    // its fin
    fill(255, 90, 60);
    triangle(-50, -30, -50, 30, 0, 0);

    // upper fin
    fill(255, 90, 60);
    noStroke();
    triangle(-55, -35, -35, -80, -10, -45);
    triangle(-20, -45, 0, -80, 20, -45);
    triangle(10, -45, 35, -70, 50, -35);

    //its mouth
    noFill();
    stroke(100, 0, 0);
    strokeWeight(3);
    arc(60, 15, 25, 20, 0, PI);

    // its big eyes
    fill(255);
    stroke(0);
    strokeWeight(3);
    ellipse(20, -35, 50, 60);
    ellipse(65, -30, 50, 60);

    ////// Draw retina & pupils
    this.lookAtMouse();
    pop();
  }
  /// I have learned this part from ChatGPT so to know how to simulate the movement of the eyes better (I did it before in my other assignments, but I asked CHATGPT to help for better movement structure)
  // defining method looking at mouse for pupils which follows the mouse
  lookAtMouse() {
    let relativeMouseX = (mouseX - this.x) * this.direction;
    let relativeMouseY = mouseY - this.y;
    let pupilX = constrain(relativeMouseX * 0.1, -12, 12);
    let pupilY = constrain(relativeMouseY * 0.1, -15, 15);

    ///// retina
    fill(0);
    noStroke();
    circle(20 + pupilX, -35 + pupilY, 20);
    circle(65 + pupilX, -30 + pupilY, 20);

    // pupils
    fill(255);
    circle(16 + pupilX, -35 + pupilY, 7);
    circle(61 + pupilX, -30 + pupilY, 7);
  }
  eatFish() {
    // Find the mouth position
    let mouthX = this.x + 60 * this.direction;
    let mouthY = this.y + 15;

    // Check every swimming fish
    for (let i = swimmingFish.length - 1; i >= 0; i--) {
      let f = swimmingFish[i];

      // Find the center of the swimming fish
      let fishCenterX = f.x + f.size / 2;
      let fishCenterY = f.y + f.size / 2;

      // Calculate distance between mouth and swimming fish
      let d = dist(mouthX, mouthY, fishCenterX, fishCenterY);

      // If the mouth touches the swimming fish
      if (d < f.size / 2 + 12) {
        // Remove the swimming fish
        swimmingFish.splice(i, 1);
      }
    }
  }
}

//////// Defining the class for swimming Fish //////////////////
class SwimmingFish {
  constructor(x, y, img) {
    this.x = x;
    this.y = y;
    this.img = img;
    this.speed = random(-4, -1);
    this.size = random(50, 120);
  }

  move() {
    this.x = this.x + this.speed;
  }
  show() {
    image(this.img, this.x, this.y, this.size, this.size);
  }
}
