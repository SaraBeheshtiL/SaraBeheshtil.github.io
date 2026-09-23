console.log("Bohoo & Kiky!");

function setup() {
  createCanvas(1000, 1100);
}
//the measurement above is pixels for Canvas
// the origin(0,0) on Canvas is on the left up and the x axis goes to right and
//y axis to the bottom

function draw() {
  background(100);

  // BOHOO
  //sketching the face
  fill(255, 180, 130);
  noStroke();
  ellipse(400, 450, 200, 300);

  // Sketching the ears
  fill(255, 180, 130);
  noStroke();
  ellipse(277, 440, 70, 80);
  ellipse(524, 440, 70, 80);

  // sketching the glasses and the eyes
  fill(150);
  stroke(0);
  strokeWeight(3);
  rect(385, 420, 30, 20); // Middle of the glasses

  fill(100);
  stroke(0);
  circle(335, 420, 120);
  fill(225);
  circle(335, 420, 80);

  fill(100);
  stroke(0);
  circle(465, 420, 120);
  fill(225);
  circle(465, 420, 80);

  //Making points inside the eyes
  fill(0);
  noStroke();
  circle(355, 420, 30);
  circle(465, 410, 30);

  fill(200);
  noStroke();
  circle(358, 420, 10);
  circle(468, 410, 10);

  //sketching the eyebrows
  fill(0);
  stroke(0);
  strokeWeight(3);
  rect(290, 320, 90, 30); // left
  rect(420, 320, 90, 30); // right

  //sketching the nose
  noFill();
  arc(400, 500, 70, 50, PI, TWO_PI);
  fill(0);
  noStroke();
  circle(385, 500, 10);
  circle(415, 500, 10);

  //sketching the lips
  noFill();
  stroke(200, 0, 0);
  strokeWeight(6);
  arc(400, 550, 60, 20, PI, TWO_PI);

  // Curls
  noFill();
  stroke(0);
  strokeWeight(4);

  arc(300, 300, 80, 70, PI, TWO_PI);
  arc(260, 280, 60, 80, 0, PI);
  arc(350, 300, 70, 100, PI, TWO_PI);

  arc(450, 265, 70, 90, 0, PI);
  arc(500, 290, 90, 70, PI, TWO_PI);
  arc(550, 280, 60, 80, 0, PI);

  // Sketching the body
  // the Neck
  fill(255, 190, 140);
  noStroke();
  rect(385, 602, 30, 50);

  // Body & shirt
  fill(80, 140, 200);
  rect(350, 650, 100, 100);
  ///// Buttons
  fill(0);
  noStroke();
  circle(400, 660, 8);
  circle(400, 675, 8);
  circle(400, 690, 8);

  ///// the Arms
  stroke(80, 140, 200);
  strokeWeight(30);
  ////// Left arm
  line(350, 655, 300, 750);
  ////// Right arm
  line(450, 655, 500, 750);
  ////// Hands
  fill(255, 180, 130);
  noStroke();
  ellipse(295, 759, 40, 30);
  ellipse(505, 759, 40, 30);

  // Bottom
  fill(0, 100, 0);
  rect(350, 750, 100, 30);
  rect(350, 780, 45, 30);
  rect(405, 780, 45, 30);
  // Legs
  fill(255, 190, 140);
  noStroke();
  rect(370, 810, 15, 100);
  rect(415, 810, 15, 100);
  //the Feet
  fill(139, 69, 19);
  ellipse(365, 910, 50, 30);
  ellipse(430, 910, 50, 30);

  // Shoelaces
  noFill();
  stroke(0);
  strokeWeight(2);
  // Left shoe
  arc(355, 908, 20, 7, PI, TWO_PI);
  arc(360, 902, 18, 7, PI, TWO_PI);

  // Right shoe
  arc(440, 908, 20, 7, PI, TWO_PI);
  arc(437, 902, 18, 7, PI, TWO_PI);

  // KIKY, the Weird Cat
  // Cat body
  fill(0);
  ellipse(600, 800, 100, 150);

  // Cat head
  fill(40);
  circle(600, 735, 100);

  // Ears
  fill(0);
  triangle(555, 705, 565, 650, 590, 695);
  triangle(610, 695, 635, 650, 645, 705);

  // Eyes
  fill(255, 220, 0);
  ellipse(580, 730, 27, 20);
  ellipse(620, 730, 27, 20);

  // Pupils & Irris
  fill(0);
  circle(587, 730, 8);
  circle(613, 730, 8);

  fill(255);
  noStroke();
  circle(588, 730, 4);
  circle(612, 730, 4);

  // Eyebrows
  stroke(0);
  strokeWeight(5);
  line(565, 710, 590, 720);
  line(610, 720, 635, 710);

  // Nose
  fill(0);
  ellipse(600, 745, 17, 9);
  stroke(0);
  strokeWeight(3);
  line(600, 745, 600, 765);

  // MOUTH
  noFill();
  stroke(0);
  strokeWeight(3);
  arc(600, 755, 40, 25, 0, PI);

  // Whiskers
  line(575, 755, 535, 745);
  line(575, 760, 530, 760);
  line(625, 755, 665, 745);
  line(625, 760, 670, 760);

  // Legs
  stroke(40);
  strokeWeight(40);
  line(580, 820, 570, 880);
  line(625, 820, 635, 880);

  // Tail
  stroke(40);
  strokeWeight(30);
  arc(660, 770, 80, 100, 0, HALF_PI);

  //Teeth
  fill(255);
  stroke(0);
  strokeWeight(1);
  triangle(590, 767, 600, 769, 594, 779);
  triangle(603, 769, 613, 767, 610, 779);
}
