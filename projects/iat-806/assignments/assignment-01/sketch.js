//Assignment 1: A Spider (Dunphy) Hunting a Fly (Jay)

//Creating the background flickering grids
// Number of columns and rows
let numCol = 50;
let numRow = 50;

// Width and height of each cell
let colWidth;
let rowHeight;

// The only two colors cells can have
let colors = ["gray", "darkgray "];

// The coordinates of the fly(jay)
let flyX = 900;
let flyY = 200;

///Spider(Dunphy)////////////
////////////////////////////
// Spider(Dunphy) position
let spiderX = 0;
let spiderY = 0;
//Spider (Dunphy) movement speed
let spiderSpeedX = 0;
let spiderSpeedY = 0;
// Gravity for returning the spider to the ground after a jump
let gravity = 1;
// Which stair Dunphy is currently standing on
let currentStep = 0;
// Where Dunphy should land
let targetX = 0;
let targetY = 0;
// Is Dunphy currently jumping? Defining a Boolean variable "spiderIsJumping"
let spiderIsJumping = false;
//Dunphy's direction for implementing backward movement
let spiderDirection = 1; // Normal direction
//Boolean variable to set the condition of Dunphy catching Jay
let catchFly = false;

function setup() {
  createCanvas(1000, 800);

  // Defining the grids' cells width and height
  colWidth = width / numCol;
  rowHeight = height / numRow;

  // Controls how fast the grid flickers
  //frameRate in P5.js controls how many times draw() function repeats per second (by default it is 60 times but we change it to 30 to make the flickering slower
  frameRate(30);
}

function draw() {
  background(0);

  //Creating flickering grids //////////
  //////////////////////////////////////
  for (i = 0; i < numCol; i = i + 1) {
    for (j = 0; j < numRow; j = j + 1) {
      // Randomly choose gray or dark gray
      let randomColor = random(colors);
      fill(randomColor);
      // Grid lines
      stroke(255);
      rect(i * colWidth, j * rowHeight, colWidth, rowHeight);
    }
  }

  // Drawing the steps by own defined drawStrairs() function
  drawStairs();

  //////// Specifying Dunphy the spider Movement //////////////
  ///////////////////////////////////////
  if (spiderIsJumping == true) {
    spiderX = spiderX + spiderSpeedX; //Forward Movement
    spiderY = spiderY + spiderSpeedY; // upward movement
    spiderSpeedY = spiderSpeedY + gravity; // Gravity pulls the spider down

    // Check if Dunphy reached the next stair so that it falls on that
    if (spiderSpeedY > 0 && spiderY >= targetY) {
      // this checks if the Spider moving upward
      if (spiderSpeedX > 0 && spiderX >= targetX) {
        // this checks if  spider moving forward while moving forwrad or to th eright
        //Now put Dunphy exactly on the stair
        spiderX = targetX;
        spiderY = targetY;
        // Stop movement
        spiderSpeedX = 0;
        spiderSpeedY = 0;
        // Dunphy has finished jumping
        spiderIsJumping = false;
      } else if (spiderSpeedX < 0 && spiderX <= targetX) {
        // this defines if spider moving backward or to the left
        //Now put Dunphy exactly on the stair
        spiderX = targetX;
        spiderY = targetY;
        // Stop movement
        spiderSpeedX = 0;
        spiderSpeedY = 0;
        // Dunphy has finished jumping
        spiderIsJumping = false;

        // now while moving backward or to the left
        //we need to identify if the step which the Spider falling onto, is step 2
        // then we need to define catchFly condition to be true
        if (currentStep == 2 && catchFly == false) {
          catchFly = true;
        }
      } else if (spiderSpeedX == 0) {
        // this defines the standing position on the step
        spiderX = targetX;
        spiderY = targetY;
        spiderSpeedY = 0;
        spiderIsJumping = false;
      }
    }
  }
  // Instead of defining the spider as an object & class
  // we use "translate" function, which moves the coordinate systme to a new postion
  push();
  translate(spiderX, spiderY); // Translate() moves the coordinate system to this new coordinates which is Dunphy's current position.
  // It means everything in drawSpider() moves spiderX pixels on the X axis and spiderY pixels on the Y axis
  // Mirror around approximately the center of Dunphy
  translate(125, 0);
  scale(spiderDirection, 1); // scale() is a predefined function which helps scaling shapes.
  // scale (x, y) means the amount to scale along the positive x-axis and the amount to scale along the positive y axis
  translate(-125, 0);
  drawSpider();
  pop();
  // Above command says that the coordinate system moves when spider moves to its new position
  // that way the entire spider works as an object and it does not need to change all of its body parts coordinates

  /// Let's check if Jay the fly is caught
  if (catchFly == true) {
    // jay follows Dunphy's tongue & because Dunphy is mirrored
    // his tongue are toward the left
    // but we want as long as catchFly is true have Jay attached to Dunphy's tongue
    flyY = spiderY + 600;
    if (spiderDirection == -1) {
      flyX = spiderX + 50;
    } // so if Dunphy is moving backward, Jay is attached to his tongue
    else {
      flyX = spiderX + 230;
    } // this keeps Jay attached to Dunphy's tongue when it is moving forward and the catchFly is true
  }
  // If mouse is pressed and Jay is not caught, jay moves with the mouse
  else {
    if (mouseIsPressed) {
      flyX = mouseX;
      flyY = mouseY;
    } else {
      // Jay has random vertical movement
      flyY = flyY + random(-20, 20);
      //creating constrain for the movement of fly(Jay)
      if (flyY < 50) {
        flyY = 50;
      }
      if (flyY > 400) {
        flyY = 400;
      }
    }
  }
  drawFly(flyX, flyY);
}

//Spider jumpint with pressing "space"
/////////////////////////////////////////////
/////////////////////////////////////////////
////////////////////////////////////////////
function keyPressed() {
  ////// defining when the space key is pressed the spider jumps
  if (key == " " && spiderIsJumping == false) {
    spiderSpeedY = -20;
    spiderSpeedX = 0;
    targetX = spiderX;
    targetY = spiderY;
    spiderIsJumping = true;
  }

  //////// Pressing the  "RIGHT_ARROW" then Dunphy jumps to the next stair ////
  if (keyCode == RIGHT_ARROW && spiderIsJumping == false) {
    spiderDirection = 1; // Face to the right
    // Start the jump
    spiderSpeedY = -20;
    // Move toward the right
    spiderSpeedX = 10;
    spiderIsJumping = true;

    // only three forward jumps
    if (currentStep < 3) {
      // Move to the next step
      currentStep = currentStep + 1;

      /////// step 1 //////////
      if (currentStep == 1) {
        targetX = 260;
        targetY = -50; // it is the amount we are translating the entire spider vertically.
      }
      /////// step 2 //////////
      else if (currentStep == 2) {
        targetX = 510;
        targetY = -150;
      }
      /////// step 3 //////////
      else if (currentStep == 3) {
        targetX = 760;
        targetY = -250;

        /// While moving toward step 3, Jay the fly should escape and
        /// there is a condition that as long as catchFly is not true
        /// this escape should happen
        if (catchFly == false) {
          flyX = 600;
          flyY = 100;
        }
      }
    }
  }

  //////// Pressing the  "LEFT_ARROW" then Dunphy turns around and chases Jay////
  if (keyCode == LEFT_ARROW && spiderIsJumping == false) {
    // Mirror Dunphy
    spiderDirection = -1;
    //Dunphy is on the last step
    if (currentStep > 0) {
      currentStep = currentStep - 1;
      // Start jump
      spiderSpeedY = -20;
      // Move left
      spiderSpeedX = -10;
      spiderIsJumping = true;

      //////// Back to step 2 ////////
      if (currentStep == 2) {
        targetX = 510;
        targetY = -150;
      }

      ////// Back to step 1 ////////
      else if (currentStep == 1) {
        targetX = 260;
        targetY = -50;
      }

      ////back to ground ////////
      else if (currentStep == 0) {
        targetX = 0;
        targetY = 0;
      }
    }
  }
}

//Defining a function which draws the stairs
/////////////////////////////////////////////
/////////////////////////////////////////////
////////////////////////////////////////////
function drawStairs() {
  fill("black");
  noStroke();
  rect(0, height - 50, 250, 50);
  rect(width / 4, height - 150, 250, 150);
  rect(width / 4 + 250, height - 250, 250, 250);
  rect(width / 4 + 500, height - 350, 250, 350);
  rect(width / 4 + 750, height - 450, 250, 450);
}

// Definig a function which draws the Spider (Dunphy)
/////////////////////////////////////////////
/////////////////////////////////////////////
////////////////////////////////////////////
function drawSpider() {
  // Drawing left leg
  stroke("green");
  strokeWeight(9);
  line(90, 600, 20, 550);
  line(20, 550, 40, 700);
  ellipse(40, 700, 10, 3);

  line(100, 620, 50, 630);
  line(50, 630, 60, 700);
  fill("green");
  ellipse(60, 700, 10, 3);

  // Drwaing right leg
  line(140, 600, 210, 550);
  line(210, 550, 230, 700);
  ellipse(230, 700, 10, 3);

  line(130, 620, 180, 630);
  line(180, 630, 190, 700);
  fill("green");
  ellipse(190, 700, 10, 3);

  // Drawing the body
  fill("darkgreen");
  noStroke();
  circle(115, 600, 50);

  //Face being created by rounded rect() with different radius of 2 or 30(from P5.js library)
  fill(190, 225, 40);
  noStroke();
  rect(90, 490, 110, 110, 30, 20, 30, 20);

  //Creating teh Spider Eyes
  fill(255);
  stroke("green");
  strokeWeight(5);
  circle(135, 500, 55);
  circle(195, 490, 55);

  // Defining movements of retina and pupils by mouseX and mouseY
  // Since the movement should be inside the eyse only, we need to
  //map the movement of the mouse to the measures of the eyes
  let eyeMoveX = map(mouseX, 0, width, -10, 5);
  let eyeMoveY = map(mouseY, 0, height, -10, 5);

  // Creating the Pupils & retina
  fill(0);
  noStroke();
  // pupils
  circle(135 + eyeMoveX, 500 + eyeMoveY, 22);
  circle(195 + eyeMoveX, 490 + eyeMoveY, 22);

  // retina
  fill(255);
  circle(139 + eyeMoveX, 499 + eyeMoveY, 7);
  circle(199 + eyeMoveX, 488 + eyeMoveY, 7);

  //Creating the mouth
  fill(0);
  arc(155, 545, 85, 120, 0, PI);

  //Creating the teeth
  fill(255);
  noStroke();
  triangle(120, 545, 135, 545, 128, 555);
  triangle(138, 545, 153, 545, 146, 560);
  triangle(156, 545, 171, 545, 164, 555);
  triangle(174, 545, 185, 545, 180, 555);

  // Creating the tongue by beginShape/endShape function &
  //vertex(), bexierVertex() functions Which I found from the p5.js library

  fill("pink");
  noStroke();
  beginShape();

  // Start at left side of tongue
  vertex(115, 570);

  // Curve down the left side
  bezierVertex(115, 570, 130, 620, 200, 620);

  // Rounded bottom and right side
  bezierVertex(200, 620, 230, 620, 230, 605);

  // Back to mouth
  bezierVertex(230, 600, 200, 550, 150, 565);

  //  Rounded up
  bezierVertex(150, 565, 135, 560, 115, 570);

  endShape(CLOSE);
}

// Defining a function for drawing the fly(Jay)
/////////////////////////////////////////////
/////////////////////////////////////////////
////////////////////////////////////////////
function drawFly(x, y) {
  // Create the body
  fill("darkblue");
  ellipse(x, y, 100, 50);

  // Draw face
  fill("blue");
  circle(x - 50, y - 20, 50, 50);

  //Draw eyes
  fill("yellow");
  stroke("red");
  strokeWeight(1);
  circle(x - 70, y - 40, 20);
  circle(x - 50, y - 40, 20);

  // Defining movements of pupils by mouseX and mouseY
  let flyeyeMoveX = map(mouseX, 0, width, -3, 5);
  let flyeyeMoveY = map(mouseY, 0, height, -3, 5);

  //pupils
  fill("black");
  noStroke();
  circle(x - 75 + flyeyeMoveX, y - 40 + flyeyeMoveY, 10);
  circle(x - 55 + flyeyeMoveX, y - 40 + flyeyeMoveY, 10);

  //lips
  fill("red");
  stroke("red");
  strokeWeight(3);
  arc(x - 55, y - 5, 10, 10, 0, PI);

  //wings
  fill("lightblue");
  stroke(5);
  strokeWeight(2);
  ellipse(x + 20, y - 15, 90, 40);
  ellipse(x + 20, y - 5, 90, 40);
}
