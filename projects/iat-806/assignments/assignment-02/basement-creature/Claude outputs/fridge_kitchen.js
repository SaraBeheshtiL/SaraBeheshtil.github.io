//////////////////// FRIDGE KITCHEN //////////////////////
// Low, tilted view: fridge in the corner, cabinets on the left,
// a doorway on the right, and something clinging to the ceiling.
//
// Uses your helpers: emptyRoom, drawFloorboards, floorPoint(u, t), BackWall.
// Assumes u = 0 left → 1 right, t = 0 back wall → 1 front.

const TILT = -0.06;   // Dutch-angle tilt in radians (0 = straight)

// ---------- perspective helpers ----------

// A point h units above floorPoint(u, t). Height is scaled by the floor's
// width at that depth, so it shrinks with distance like everything else.
function kPoint(u, t, h) { // same as in kitchen.js — keep only one copy
  let p = floorPoint(u, t);
  let L = floorPoint(0, t);
  let R = floorPoint(1, t);
  let w = dist(L.x, L.y, R.x, R.y);
  return createVector(p.x, p.y - h * w);
}

// Ceiling height in kPoint units, worked out from your back wall's shape.
function ceilingH() {
  return (BackWall.y2 - BackWall.y1) / (BackWall.x2 - BackWall.x1);
}

function kPoly(g, q) {
  g.quad(q[0].x, q[0].y, q[1].x, q[1].y, q[2].x, q[2].y, q[3].x, q[3].y);
}

// Point inside a screen quad: a goes left→right, b goes bottom→top.
// Quads from kBox are ordered bottom-left, bottom-right, top-right, top-left.
function facePt(q, a, b) {
  let bottom = p5.Vector.lerp(q[0], q[1], a);
  let top = p5.Vector.lerp(q[3], q[2], a);
  return p5.Vector.lerp(bottom, top, b);
}

// Signed area: negative means the face points toward the camera.
function facingCamera(q) {
  let s = 0;
  for (let i = 0; i < 4; i++) {
    let a = q[i], b = q[(i + 1) % 4];
    s += a.x * b.y - b.x * a.y;
  }
  return s < 0;
}

// A 3D box. Only faces turned toward the camera are drawn, so it works
// anywhere in the room: above eye level, below it, left or right.
// Returns the screen quads so you can draw details on them.
function kBox(g, u1, u2, t1, t2, h1, h2, cFront, cSide, cTop) {
  const P = (u, t, h) => kPoint(u, t, h);
  let faces = {
    back:   [P(u2, t1, h1), P(u1, t1, h1), P(u1, t1, h2), P(u2, t1, h2)],
    left:   [P(u1, t1, h1), P(u1, t2, h1), P(u1, t2, h2), P(u1, t1, h2)],
    right:  [P(u2, t2, h1), P(u2, t1, h1), P(u2, t1, h2), P(u2, t2, h2)],
    bottom: [P(u1, t1, h1), P(u2, t1, h1), P(u2, t2, h1), P(u1, t2, h1)],
    top:    [P(u1, t2, h2), P(u2, t2, h2), P(u2, t1, h2), P(u1, t1, h2)],
    front:  [P(u1, t2, h1), P(u2, t2, h1), P(u2, t2, h2), P(u1, t2, h2)],
  };
  let fills = { back: cSide, left: cSide, right: cSide,
                bottom: lerpColor(cTop, color(0), 0.5), top: cTop, front: cFront };
  g.stroke(10, 12, 14);
  g.strokeWeight(1);
  for (let name in faces) {
    if (facingCamera(faces[name])) {
      g.fill(fills[name]);
      kPoly(g, faces[name]);
    }
  }
  return faces;
}

// ---------- the scene ----------

function drawFridgeKitchen(hCanvas) {
  let g = hCanvas;
  g.push();
  // Dutch angle: rotate around the centre and zoom slightly to hide the edges
  g.translate(g.width / 2, g.height / 2);
  g.rotate(TILT);
  g.scale(1.12);
  g.translate(-g.width / 2, -g.height / 2);

  emptyRoom(g, color(34, 38, 40), color(26, 30, 32), color(16, 18, 19));
  drawFloorboards(g, color(18, 20, 21));

  drawDoorway(g);
  drawLowerCabinets(g);
  drawUpperCabinet(g);
  drawFridge(g);
  drawCeilingThing(g);

  // cobwebs: between cabinet and fridge, and in the top-right corner
  let web1 = kPoint(0, 0.14, ceilingH() * 0.55);
  drawCobweb(g, web1.x, web1.y, 50, 0, HALF_PI);
  let web2 = kPoint(1, 0, ceilingH());
  drawCobweb(g, web2.x, web2.y, 60, PI * 0.5, PI);

  g.pop();

  drawDustAndScratches(g);
  drawColdVignette(g);
}

// ---------- pieces ----------

function drawDoorway(g) {
  let H = ceilingH() * 0.82;
  // frame (on the back wall, t = 0)
  g.noStroke();
  g.fill(70, 80, 84);
  kPoly(g, [kPoint(0.66, 0, 0), kPoint(0.9, 0, 0), kPoint(0.9, 0, H), kPoint(0.66, 0, H)]);
  // dark opening
  let inner = [kPoint(0.69, 0, 0), kPoint(0.87, 0, 0),
               kPoint(0.87, 0, H * 0.93), kPoint(0.69, 0, H * 0.93)];
  g.fill(8, 9, 10);
  kPoly(g, inner);
  // a door left half-open inside, catching the cold light
  g.fill(46, 54, 58);
  kPoly(g, [facePt(inner, 0.05, 0), facePt(inner, 0.35, 0.03),
            facePt(inner, 0.35, 0.95), facePt(inner, 0.05, 1)]);
  // panel lines on that door
  g.stroke(20, 24, 26);
  g.strokeWeight(1);
  for (let b of [0.45, 0.5]) {
    let a = facePt(inner, 0.08, b), c = facePt(inner, 0.33, b + 0.02);
    g.line(a.x, a.y, c.x, c.y);
  }
  // pale light spilling down the right edge of the frame
  g.noStroke();
  for (let i = 0; i < 6; i++) {
    g.fill(140, 175, 190, 14);
    let w = 0.004 * (i + 1);
    kPoly(g, [kPoint(0.87, 0, 0), kPoint(0.87 + w, 0, 0),
              kPoint(0.87 + w, 0, H), kPoint(0.87, 0, H)]);
  }
}

function drawLowerCabinets(g) {
  let front = color(52, 60, 62), side = color(38, 44, 46), top = color(80, 90, 92);
  let f = kBox(g, 0, 0.32, 0, 0.2, 0, 0.27, front, side, top).front;
  kBox(g, 0, 0.33, 0, 0.215, 0.27, 0.3, color(75, 84, 86), side, color(95, 106, 108)); // worktop

  // drawers on top, doors below, drawn with a loop across the front
  let cols = 2;
  g.stroke(22, 26, 28);
  g.strokeWeight(1.2);
  g.noFill();
  for (let i = 0; i < cols; i++) {
    let a1 = i / cols + 0.04, a2 = (i + 1) / cols - 0.04;
    kPoly(g, [facePt(f, a1, 0.72), facePt(f, a2, 0.72), facePt(f, a2, 0.94), facePt(f, a1, 0.94)]);
    kPoly(g, [facePt(f, a1, 0.06), facePt(f, a2, 0.06), facePt(f, a2, 0.64), facePt(f, a1, 0.64)]);
    // handles
    let hd = facePt(f, (a1 + a2) / 2, 0.83);
    g.stroke(150, 160, 160);
    g.line(hd.x - 6, hd.y, hd.x + 6, hd.y);
    let hc = facePt(f, i === 0 ? a2 - 0.06 : a1 + 0.06, 0.4);
    g.line(hc.x, hc.y - 6, hc.x, hc.y + 6);
    g.stroke(22, 26, 28);
  }
}

function drawUpperCabinet(g) {
  let C = ceilingH();
  let f = kBox(g, 0, 0.3, 0, 0.13, C * 0.55, C * 0.95,
               color(58, 66, 68), color(40, 46, 48), color(30, 34, 36)).front;
  // two doors with raised panels
  g.noFill();
  g.strokeWeight(1.5);
  for (let i = 0; i < 2; i++) {
    let a1 = i / 2 + 0.05, a2 = (i + 1) / 2 - 0.05;
    g.stroke(24, 28, 30);
    kPoly(g, [facePt(f, a1, 0.08), facePt(f, a2, 0.08), facePt(f, a2, 0.92), facePt(f, a1, 0.92)]);
    g.stroke(90, 100, 102, 120); // highlight edge of the panel
    let p = facePt(f, a2, 0.08), q = facePt(f, a2, 0.92);
    g.line(p.x, p.y, q.x, q.y);
  }
  // curved handle near the bottom of the right door
  let h = facePt(f, 0.56, 0.2);
  g.stroke(140, 150, 150);
  g.strokeWeight(2);
  g.arc(h.x, h.y, 6, 14, -HALF_PI, HALF_PI);
}

function drawFridge(g) {
  let C = ceilingH();
  let faces = kBox(g, 0.36, 0.6, 0, 0.2, 0, C * 0.72,
                   color(60, 70, 74), color(42, 50, 54), color(52, 60, 64));
  let f = faces.front;

  // freezer/fridge split line
  g.stroke(18, 22, 24);
  g.strokeWeight(2.5);
  let s1 = facePt(f, 0, 0.66), s2 = facePt(f, 1, 0.66);
  g.line(s1.x, s1.y, s2.x, s2.y);

  // long handles near the left edge (like the painting)
  g.strokeWeight(4);
  g.stroke(30, 36, 38);
  let a = facePt(f, 0.12, 0.7), b = facePt(f, 0.12, 0.92);
  g.line(a.x, a.y, b.x, b.y);
  a = facePt(f, 0.12, 0.25); b = facePt(f, 0.12, 0.62);
  g.line(a.x, a.y, b.x, b.y);

  // cold light: streaky highlight that fades across the front (loop of bands)
  g.noStroke();
  for (let i = 0; i < 12; i++) {
    let a1 = 0.55 + i * 0.035, a2 = a1 + 0.035;
    g.fill(150, 185, 200, map(i, 0, 11, 8, 40));
    kPoly(g, [facePt(f, a1, 0.02), facePt(f, a2, 0.02), facePt(f, a2, 0.98), facePt(f, a1, 0.98)]);
  }

  // deep shadow in the gap between fridge top and ceiling
  g.fill(0, 0, 0, 120);
  kPoly(g, [kPoint(0.34, 0.01, C * 0.72), kPoint(0.62, 0.01, C * 0.72),
            kPoint(0.62, 0.01, C), kPoint(0.34, 0.01, C)]);
}

// The thing on the ceiling: a pale face with tendrils of hair
// fanning out across the ceiling, slowly writhing.
function drawCeilingThing(g) {
  let C = ceilingH();
  let c = kPoint(0.46, 0.1, C * 0.97);
  let time = frameCount * 0.01;
  let twitch = noise(time * 3) > 0.78 ? random(-2, 2) : 0; // rare jerk

  // tendrils: loop of curves radiating up/out from the head
  let n = 26;
  g.noFill();
  for (let i = 0; i < n; i++) {
    // fan upward, but each strand gets its own random-ish offset and length
    let ang = map(i, 0, n - 1, PI * 0.95, PI * 2.05) + (noise(i * 5.3) - 0.5) * 0.6;
    let len = 50 + 130 * noise(i * 3.1 + 10);
    let x = c.x, y = c.y;
    let segs = 10;
    for (let s = 0; s < segs; s++) {
      let k = s / segs;
      let bend = (noise(i * 0.7, s * 0.25, time) - 0.5) * 3.0;
      let nx = x + cos(ang + bend * k) * len / segs;
      let ny = y + sin(ang + bend * k) * len / segs * 0.7;
      g.stroke(70 + 50 * k, 72 + 50 * k, 70 + 50 * k, 220 * (1 - k * 0.6));
      g.strokeWeight(3.2 * (1 - k) + 0.4);   // thick at the root, thin at the tip
      g.line(x + twitch, y, nx + twitch, ny);
      x = nx; y = ny;
    }
  }

  // dark mass of hair around the head
  g.noStroke();
  g.fill(10, 10, 11);
  g.ellipse(c.x + twitch, c.y + 4, 46, 34);

  // pale, upside-down face
  g.fill(95, 96, 92);
  g.ellipse(c.x + twitch, c.y + 12, 16, 24);
  g.fill(5);
  g.ellipse(c.x - 4 + twitch, c.y + 16, 5, 7); // eye hollows
  g.ellipse(c.x + 4 + twitch, c.y + 16, 5, 7);
  g.ellipse(c.x + twitch, c.y + 6, 4, 3);      // mouth (it's upside down)

  // stray strands hanging down
  g.stroke(140, 140, 135, 150);
  g.strokeWeight(0.8);
  for (let i = 0; i < 9; i++) {
    let x0 = c.x - 10 + i * 2.5 + twitch;
    let sway = sin(time * 4 + i) * 3;
    g.line(x0, c.y + 18, x0 + sway, c.y + 30 + (i % 3) * 6);
  }
}

// Spokes from a corner, joined by sagging threads.
function drawCobweb(g, x, y, r, a1, a2) {
  let spokes = 6, rings = 4;
  g.noFill();
  g.stroke(190, 200, 205, 60);
  g.strokeWeight(0.6);
  let pts = [];
  for (let i = 0; i < spokes; i++) {
    let a = lerp(a1, a2, i / (spokes - 1));
    pts.push(a);
    g.line(x, y, x + cos(a) * r, y + sin(a) * r);
  }
  for (let j = 1; j <= rings; j++) {
    let rr = r * j / rings;
    for (let i = 0; i < spokes - 1; i++) {
      let p1 = createVector(x + cos(pts[i]) * rr, y + sin(pts[i]) * rr);
      let p2 = createVector(x + cos(pts[i + 1]) * rr, y + sin(pts[i + 1]) * rr);
      let mid = p5.Vector.lerp(p1, p2, 0.5);
      let toC = createVector(x - mid.x, y - mid.y).setMag(rr * 0.12); // sag inward
      g.bezier(p1.x, p1.y, mid.x + toC.x, mid.y + toC.y,
               mid.x + toC.x, mid.y + toC.y, p2.x, p2.y);
    }
  }
}

// Fixed specks of dust and long faint scratches, like the painting's texture.
function drawDustAndScratches(g) {
  randomSeed(7); // same pattern every frame
  g.noStroke();
  for (let i = 0; i < 160; i++) {
    g.fill(200, 220, 225, random(20, 90));
    g.circle(random(g.width), random(g.height), random(0.8, 2));
  }
  g.noFill();
  for (let i = 0; i < 7; i++) {
    g.stroke(200, 215, 220, random(15, 40));
    g.strokeWeight(0.7);
    let x = random(g.width), y = random(g.height);
    g.arc(x, y, random(150, 400), random(150, 400), random(TWO_PI), random(TWO_PI));
  }
  randomSeed(millis()); // give random() back its variety
}

function drawColdVignette(g) {
  g.noFill();
  let steps = 45;
  for (let i = 0; i < steps; i++) {
    g.stroke(0, 4, 6, map(i, 0, steps, 230, 0));
    g.strokeWeight(3);
    g.rect(i * 2, i * 2, g.width - i * 4, g.height - i * 4);
  }
}
