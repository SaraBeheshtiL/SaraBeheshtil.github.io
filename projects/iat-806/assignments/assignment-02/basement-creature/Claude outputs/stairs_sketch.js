// Perspective stairs in a corridor — p5.js
// Paste into the p5.js web editor (editor.p5js.org) as sketch.js.
//
// The idea: describe everything in simple 3D "world" units, then project
// each 3D point onto the 2D canvas with one formula. Because every step
// uses the same projection, they all line up with the vanishing point.

// ---------- Camera / projection ----------
let VP;              // vanishing point on screen (centre of the back wall)
const FOCAL = 400;   // focal length: bigger = more zoomed in
const EYE_H = 1.6;   // camera (eye) height above the floor

// ---------- Room ----------
const ROOM_W = 3.4;  // corridor width
const ROOM_H = 3.2;  // ceiling height
const NEAR_Z = 1.9;  // front edge of the room (distance from camera)
const FAR_Z  = 8;    // back wall distance

// ---------- Stairs (change these!) ----------
let NUM_STEPS = 5;
let RISE  = 0.2;     // height of each step
let RUN   = 0.55;    // depth of each step
let START_Z = 2.0;   // distance where the first step begins
let STAIR_W = 3.3;   // stair width (≤ ROOM_W)

function setup() {
  createCanvas(900, 780);
  VP = createVector(width / 2, 350);
}

function draw() {
  background(0);
  drawRoom();
  drawStairs();
}

// Project a 3D point (x = left/right, y = up, z = depth) to the screen.
// x is centred on 0, y = 0 is the floor.
function project(x, y, z) {
  const s = FOCAL / z;                 // things farther away get smaller
  return createVector(VP.x + x * s,    // spread sideways
                      VP.y + (EYE_H - y) * s); // above the eye goes up
}

// Draw a flat 4-sided face from four 3D points.
function face(p1, p2, p3, p4) {
  const pts = [p1, p2, p3, p4].map(p => project(p[0], p[1], p[2]));
  beginShape();
  for (const p of pts) vertex(p.x, p.y);
  endShape(CLOSE);
}

function drawStairs() {
  const hw = STAIR_W / 2;
  stroke(50, 60, 255);
  strokeWeight(3);
  fill(0); // black fill so closer steps hide the ones behind them

  // Draw from the farthest step to the nearest (painter's algorithm)
  for (let i = NUM_STEPS - 1; i >= 0; i--) {
    const zFront = START_Z + i * RUN;
    const zBack  = zFront + RUN;
    const yLow   = i * RISE;
    const yHigh  = (i + 1) * RISE;

    // Tread (the flat top you step on)
    face([-hw, yHigh, zFront], [hw, yHigh, zFront],
         [ hw, yHigh, zBack ], [-hw, yHigh, zBack]);

    // Riser (the vertical front face)
    face([-hw, yLow,  zFront], [hw, yLow,  zFront],
         [ hw, yHigh, zFront], [-hw, yHigh, zFront]);
  }
}

function drawRoom() {
  const hw = ROOM_W / 2;
  stroke(220, 80, 80);
  strokeWeight(2);
  noFill();

  // Back wall
  face([-hw, 0, FAR_Z], [hw, 0, FAR_Z], [hw, ROOM_H, FAR_Z], [-hw, ROOM_H, FAR_Z]);
  // Front frame
  face([-hw, 0, NEAR_Z], [hw, 0, NEAR_Z], [hw, ROOM_H, NEAR_Z], [-hw, ROOM_H, NEAR_Z]);

  // The four corner lines running from the front to the back
  for (const [x, y] of [[-hw, 0], [hw, 0], [hw, ROOM_H], [-hw, ROOM_H]]) {
    const a = project(x, y, NEAR_Z);
    const b = project(x, y, FAR_Z);
    line(a.x, a.y, b.x, b.y);
  }
}

// Optional: arrow keys add or remove steps while the sketch runs
function keyPressed() {
  if (keyCode === UP_ARROW) NUM_STEPS++;
  if (keyCode === DOWN_ARROW && NUM_STEPS > 1) NUM_STEPS--;
}
