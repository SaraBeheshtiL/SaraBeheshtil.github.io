// Mirror creature — an original face drawn entirely in p5.js.
// drawMirrorFace(g, e) draws one expression on any canvas or p5.Graphics g.
// e = { blink, wide, grin, jaw, tilt, glitch }  (all 0..1 except tilt in radians)

const MIRROR_EXPRESSIONS = [
  { blink: 0,    wide: 0,    grin: 0,    jaw: 0,    tilt: 0,     glitch: 0 }, // 0 still stare
  { blink: 0.85, wide: 0,    grin: 0,    jaw: 0,    tilt: 0,     glitch: 0 }, // 1 slow blink
  { blink: 0,    wide: 0.9,  grin: 0.1,  jaw: 0,    tilt: 0,     glitch: 0 }, // 2 eyes snap wide
  { blink: 0,    wide: 0.6,  grin: 0.45, jaw: 0,    tilt: 0.05,  glitch: 0 }, // 3 smile begins
  { blink: 0,    wide: 0.7,  grin: 0.85, jaw: 0.1,  tilt: 0.12,  glitch: 0 }, // 4 grin spreads too far
  { blink: 0,    wide: 1,    grin: 1,    jaw: 0.25, tilt: 0.28,  glitch: 0 }, // 5 head tilts
  { blink: 0,    wide: 1,    grin: 0.7,  jaw: 1,    tilt: 0.1,   glitch: 0 }, // 6 jaw drops — scream
  { blink: 0,    wide: 1,    grin: 0.8,  jaw: 0.9,  tilt: -0.08, glitch: 1 }, // 7 glitch scream
];

function drawMirrorFace(g, e) {
  const cx = g.width / 2, cy = g.height * 0.52;
  const S = g.width / 439;            // scale so it works at any size
  const jawDrop = e.jaw * 55;

  g.push();
  g.translate(cx, cy);
  g.scale(S);
  g.rotate(e.tilt);

  randomSeed(11);                      // same hair and scars in every frame
  drawHairBack(g);
  drawFace(g, jawDrop);
  drawScars(g);
  drawEyes(g, e);
  drawNose(g);
  drawMouth(g, e, jawDrop);
  drawHairFront(g);
  g.pop();

  if (e.glitch > 0) glitchSlices(g, e.glitch);
  randomSeed(millis());
}

// ---------- hair ----------
function hairStrand(g, x0, y0, len, sway, col, w) {
  // wavy strand: a curve through points that wobble side to side
  g.stroke(col);
  g.noFill();
  let pts = 9, phase = random(TWO_PI), wav = random(4, 12);
  let prev = createVector(x0, y0);
  for (let k = 1; k <= pts; k++) {
    let t = k / pts;
    let x = x0 + sway * t * t + sin(t * 9 + phase) * wav * t;
    let y = y0 + len * t;
    g.strokeWeight(w * (1 - t * 0.6));          // thinner toward the tips
    g.line(prev.x, prev.y, x, y);
    prev.set(x, y);
  }
}

function drawHairBack(g) {
  // a dark mass behind the head, then lots of long tangled strands
  g.noStroke();
  g.fill(28, 22, 18);
  g.ellipse(0, 10, 290, 360);
  for (let i = 0; i < 140; i++) {
    let a = random(PI * 0.95, TWO_PI * 1.025);       // around the top of the head
    let x0 = cos(a) * 110, y0 = sin(a) * 140 - 10;
    let side = x0 < 0 ? -1 : 1;
    let len = random(180, 300);
    let c = random(30, 75);
    hairStrand(g, x0, y0, len, side * random(20, 70),
               g.color(c, c * 0.82, c * 0.66, 200), random(1, 3));
  }
}

function drawHairFront(g) {
  // matted strands falling across the forehead and one eye
  for (let i = 0; i < 38; i++) {
    let x0 = random(-80, 70), y0 = -150 + random(-10, 10);
    let c = random(40, 85);
    hairStrand(g, x0, y0, random(70, 150), random(-25, 35),
               g.color(c, c * 0.8, c * 0.64, 210), random(0.8, 2.4));
  }
  // a few long strands draped down the cheeks
  for (let i = 0; i < 14; i++) {
    let side = i % 2 ? 1 : -1;
    let c = random(35, 75);
    hairStrand(g, side * random(70, 100), random(-120, -60), random(200, 260),
               side * random(5, 30), g.color(c, c * 0.8, c * 0.64, 220), random(1.5, 3.5));
  }
}

// ---------- face ----------
function drawFace(g, jawDrop) {
  g.noStroke();
  // face shape: forehead ellipse + jaw that stretches when the mouth opens
  g.fill(170, 166, 142);
  g.beginShape();
  for (let a = 0; a < TWO_PI; a += 0.05) {
    let r = 1 + 0.06 * sin(a * 3);                 // slightly lumpy, not perfect
    let y = sin(a) * 122 * r;
    let x = cos(a) * 92 * r * (y > 0 ? 1 - 0.28 * (y / 122) : 1);   // narrower chin
    if (y > 20) y += jawDrop * ((y - 20) / 102);   // stretch the lower face
    g.vertex(x, y);
  }
  g.endShape(CLOSE);

  // shading: darker rings toward the edge (loop of shrinking ellipses, reversed)
  // shadow under the hairline and around the edges
  for (let i = 0; i < 14; i++) {                   // shadow under the hairline
    g.fill(40, 38, 30, 11);
    g.ellipse(0, -100 + i * 2.5, 175 - i * 8, 70 - i * 4);
  }
  g.fill(190, 186, 160, 70);
  g.ellipse(0, -15, 110, 150);                     // pale lit centre
  for (let i = 0; i < 8; i++) {                    // hollow cheeks, soft layers
    g.fill(50, 45, 38, 9);
    g.ellipse(-60, 42, 44 - i * 4, 80 - i * 6);
    g.ellipse(60, 42, 44 - i * 4, 80 - i * 6);
  }

  // blotchy skin: loop of faint spots
  for (let i = 0; i < 70; i++) {
    let x = random(-75, 75), y = random(-100, 110);
    g.fill(random(90, 140), random(80, 120), random(70, 100), random(15, 40));
    g.ellipse(x, y, random(4, 14), random(3, 10));
  }
}

function drawScars(g) {
  // cuts: jagged polylines in dried red-brown
  const cuts = [[-70, 20, 1], [55, 15, -1], [-20, -95, 1], [10, 35, 1]];
  for (let [x, y, d] of cuts) {
    g.stroke(110, 40, 30, 200);
    g.strokeWeight(2);
    g.noFill();
    g.beginShape();
    for (let k = 0; k < 6; k++) g.vertex(x + k * 4 * d + random(-2, 2), y + k * 3 + random(-2, 2));
    g.endShape();
    g.stroke(160, 120, 100, 90);                  // pale swollen edge
    g.strokeWeight(4);
    g.line(x, y, x + 20 * d, y + 15);
  }
}

function drawEyes(g, e) {
  for (let side of [-1, 1]) {
    let x = side * 40, y = -18;
    // sunken, bruised sockets: layered soft ellipses
    g.noStroke();
    for (let i = 0; i < 9; i++) {
      g.fill(45, 28, 34, 38);
      g.ellipse(x, y + 2, 70 - i * 4, 52 - i * 3.5);
    }
    let open = (1 - e.blink);
    let w = 30 + e.wide * 8, h = (15 + e.wide * 9) * open;
    // eye white (sickly yellow)
    g.fill(196, 190, 150);
    g.ellipse(x, y, w, max(h, 1));
    if (open > 0.15) {
      // glow around the iris
      for (let r = 4; r > 0; r--) {
        g.fill(190, 200, 90, 18);
        g.circle(x, y, 12 + r * 5);
      }
      g.fill(150, 160, 70);                        // yellow-green iris
      g.circle(x, y, 13 - e.wide * 2);
      g.fill(10);
      g.circle(x, y, 4 - e.wide * 1.5);            // pupil shrinks when wide
      g.fill(255, 255, 230, 200);
      g.circle(x - 2, y - 2, 2);                   // wet highlight
      // red veins
      g.stroke(150, 40, 40, 120);
      g.strokeWeight(0.7);
      for (let k = 0; k < 4; k++) {
        let vx = x + side * (w / 2 - 2);
        g.line(vx, y + random(-h / 4, h / 4), vx - side * random(6, 10), y + random(-h / 3, h / 3));
      }
      g.noStroke();
    }
    // eyelid line
    g.stroke(60, 40, 40);
    g.strokeWeight(1.5);
    g.noFill();
    g.arc(x, y, w, max(h, 1), PI, TWO_PI);
    if (e.blink > 0.5) g.line(x - w / 2, y, x + w / 2, y);
    g.noStroke();
  }
}

function drawNose(g) {
  g.noFill();
  g.stroke(120, 100, 85, 160);
  g.strokeWeight(2);
  g.arc(-8, 30, 12, 10, HALF_PI, PI + 0.5);
  g.arc(8, 30, 12, 10, -0.5, HALF_PI);
  g.noStroke();
  g.fill(60, 40, 35, 180);
  g.ellipse(-7, 33, 5, 3);
  g.ellipse(7, 33, 5, 3);
}

// The mouth: grin widens the corners and lifts them; jaw opens it vertically.
function drawMouth(g, e, jawDrop) {
  let y = 62;
  let half = 30 + e.grin * 38;                 // grin spreads wide
  let lift = e.grin * 18;                      // corners curl up
  let open = 4 + e.jaw * 60 + e.grin * 8;

  // points along the upper and lower lip
  let n = 14, upper = [], lower = [];
  for (let i = 0; i <= n; i++) {
    let t = i / n, x = lerp(-half, half, t);
    let curve = sin(t * PI);                   // 0 at corners, 1 in the middle
    upper.push(createVector(x, y - lift * (1 - curve) - 2 * curve));
    lower.push(createVector(x, y - lift * (1 - curve) + open * curve + jawDrop * 0.5 * curve));
  }

  // dark inside of the mouth
  g.noStroke();
  g.fill(30, 8, 10);
  g.beginShape();
  for (let p of upper) g.vertex(p.x, p.y);
  for (let i = lower.length - 1; i >= 0; i--) g.vertex(lower[i].x, lower[i].y);
  g.endShape(CLOSE);

  // upper teeth: a loop of uneven, rotten blocks hanging from the lip
  for (let i = 1; i < n; i++) {
    let p = upper[i], q = upper[i + 1] || upper[i];
    let tw = (q.x - p.x) * 0.95;
    let th = random(6, 11) * (0.6 + e.grin * 0.6);
    let tc = random(0.75, 1);
    g.fill(175 * tc, 160 * tc, 110 * tc);
    g.rect(p.x, p.y, tw, th, 1, 1, 3, 3);
    g.fill(70, 50, 30, 120);                   // grime between teeth
    g.rect(p.x + tw - 1, p.y, 1.2, th);
  }
  // lower teeth when the jaw is open
  if (e.jaw > 0.2) {
    for (let i = 2; i < n - 1; i++) {
      let p = lower[i];
      let th = random(5, 9);
      let tc2 = random(0.7, 0.95);
      g.fill(170 * tc2, 152 * tc2, 105 * tc2);
      g.rect(p.x, p.y - th, (lower[i + 1].x - p.x) * 0.9, th, 3, 3, 1, 1);
    }
  }

  // lips: cracked, bloodless
  g.noFill();
  g.stroke(120, 70, 65);
  g.strokeWeight(2.5);
  g.beginShape(); for (let p of upper) g.vertex(p.x, p.y); g.endShape();
  g.beginShape(); for (let p of lower) g.vertex(p.x, p.y); g.endShape();
  // stretch lines at the corners when grinning
  if (e.grin > 0.5) {
    g.stroke(110, 80, 70, 150);
    g.strokeWeight(1.2);
    for (let s of [-1, 1]) {
      let c = s < 0 ? upper[0] : upper[n];
      g.line(c.x, c.y, c.x + s * 12, c.y - 10);
      g.line(c.x, c.y + 3, c.x + s * 10, c.y + 8);
    }
  }
  g.noStroke();
}

// Glitch: copy horizontal slices of the canvas sideways.
function glitchSlices(g, amt) {
  let img = g.get();
  for (let i = 0; i < 12 * amt; i++) {
    let y = floor(random(g.height * 0.15, g.height * 0.85));
    let h = floor(random(4, 18));
    let dx = random(-30, 30) * amt;
    g.image(img, dx, y, g.width, h, 0, y, g.width, h);
  }
}
