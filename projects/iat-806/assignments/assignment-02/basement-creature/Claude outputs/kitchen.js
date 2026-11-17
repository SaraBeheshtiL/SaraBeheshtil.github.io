//////////////////// KITCHEN //////////////////////
// something stands in the empty corner
//
// Uses your existing helpers: emptyRoom, drawFloorboards, drawFurniture,
// floorPoint(u, t) and BackWall {x1, y1, x2, y2}.
// Assumes u = 0 left wall → 1 right wall, t = 0 back wall → 1 front.
//
// kPoint(u, t, h) = a point h units ABOVE floorPoint(u, t).
// With u = 0 or u = 1 it lands on the side walls, so we can hang
// shelves and windows there. If heights don't line up with
// drawFurniture's height, change K_H.

const K_H = 1.0;

function kPoint(u, t, h) {
  let p = floorPoint(u, t);
  let L = floorPoint(0, t);
  let R = floorPoint(1, t);
  let w = dist(L.x, L.y, R.x, R.y);
  return createVector(p.x, p.y - h * w * K_H);
}

function kQuad(hCanvas, a, b, c, d) {
  hCanvas.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
}

function drawKitchen(hCanvas) {
  let flicker = 0.75 + 0.25 * noise(frameCount * 0.08); // candle/lamp flicker

  emptyRoom(hCanvas, color(52, 48, 38), color(40, 38, 34), color(22, 21, 18));
  drawWallpaper(hCanvas);
  drawFloorboards(hCanvas, color(26, 24, 22));

  drawFireplace(hCanvas, flicker);
  drawBackWindow(hCanvas);
  drawRug(hCanvas);

  // ---- right side: counter, sink, shelves, window ----
  drawRightWindow(hCanvas);
  drawShelves(hCanvas);
  drawFurniture(hCanvas, 0.82, 1, 0.08, 0.8, 0.3,
                color(48, 40, 32), color(70, 60, 48)); // counter
  drawCounterDetails(hCanvas);

  // ---- dining set (far → near so near things cover far ones) ----
  drawChair(hCanvas, 0.44, 0.40);                 // back chair
  drawChair(hCanvas, 0.24, 0.58);                 // left chair
  drawChair(hCanvas, 0.70, 0.58);                 // right chair
  drawFurniture(hCanvas, 0.3, 0.66, 0.45, 0.72, 0.24,
                color(38, 32, 26), color(62, 50, 38)); // table + cloth
  drawTableTop(hCanvas, flicker);
  drawChair(hCanvas, 0.44, 0.80);                 // front chair

  // scratches in the empty corner (kept from your version)
  hCanvas.stroke(20, 16, 12);
  hCanvas.strokeWeight(1.5);
  for (let i = 0; i < 6; i++) {
    let x = BackWall.x2 - 30 + i * 4;
    hCanvas.line(x, BackWall.y2 - 90, x + 6, BackWall.y2 - 40);
  }

  drawChandelier(hCanvas, flicker);
  drawVignette(hCanvas);
}

// ---------------- back wall ----------------

function drawWallpaper(hCanvas) {
  hCanvas.stroke(0, 0, 0, 35);
  hCanvas.strokeWeight(1);
  for (let x = BackWall.x1; x < BackWall.x2; x += 6) {
    hCanvas.line(x, BackWall.y1, x, BackWall.y2);
  }
}

function drawFireplace(hCanvas, flicker) {
  let bw = BackWall.x2 - BackWall.x1;
  let bh = BackWall.y2 - BackWall.y1;
  let fx1 = BackWall.x1 + bw * 0.04;
  let fx2 = BackWall.x1 + bw * 0.52;
  let mantelY = BackWall.y2 - bh * 0.62;

  // brick surround
  hCanvas.noStroke();
  hCanvas.fill(70, 38, 30);
  hCanvas.rect(fx1, mantelY, fx2 - fx1, BackWall.y2 - mantelY);

  // brick pattern: rows, every other row shifted half a brick
  let brickW = 12, brickH = 5;
  hCanvas.stroke(35, 20, 16);
  hCanvas.strokeWeight(0.7);
  let row = 0;
  for (let y = mantelY; y < BackWall.y2; y += brickH) {
    hCanvas.line(fx1, y, fx2, y);
    let offset = (row % 2) * brickW / 2;
    for (let x = fx1 + offset; x < fx2; x += brickW) {
      hCanvas.line(x, y, x, min(y + brickH, BackWall.y2));
    }
    row++;
  }

  // dark hearth opening (arch) with faint embers
  let ox1 = fx1 + (fx2 - fx1) * 0.18;
  let ox2 = fx2 - (fx2 - fx1) * 0.18;
  let oTop = mantelY + (BackWall.y2 - mantelY) * 0.3;
  hCanvas.noStroke();
  hCanvas.fill(8, 6, 5);
  hCanvas.rect(ox1, oTop, ox2 - ox1, BackWall.y2 - oTop);
  hCanvas.arc((ox1 + ox2) / 2, oTop, ox2 - ox1, (ox2 - ox1) * 0.4, PI, TWO_PI);
  for (let i = 0; i < 8; i++) {
    hCanvas.fill(160, 50, 20, 60 * flicker);
    hCanvas.ellipse(lerp(ox1 + 8, ox2 - 8, i / 7), BackWall.y2 - 3, 6, 3);
  }

  // wooden mantel beam + shelf
  hCanvas.fill(55, 40, 28);
  hCanvas.rect(fx1 - 6, mantelY - 18, fx2 - fx1 + 12, 18);
  hCanvas.fill(75, 56, 38);
  hCanvas.rect(fx1 - 12, mantelY - 22, fx2 - fx1 + 24, 5);

  // clocks and plates on the mantel
  let n = 6;
  for (let i = 0; i < n; i++) {
    let cx = lerp(fx1 + 10, fx2 - 10, i / (n - 1));
    let r = (i % 2 === 0) ? 16 : 11;
    let cy = mantelY - 22 - r / 2;
    hCanvas.stroke(40, 34, 26);
    hCanvas.strokeWeight(1);
    hCanvas.fill(150, 140, 115);
    hCanvas.ellipse(cx, cy, r, r);
    if (i % 2 === 0) { // clock hands
      let a = i * 1.3;
      hCanvas.line(cx, cy, cx + cos(a) * r * 0.35, cy + sin(a) * r * 0.35);
      hCanvas.line(cx, cy, cx + cos(a * 2.7) * r * 0.25, cy + sin(a * 2.7) * r * 0.25);
    }
  }
}

function drawBackWindow(hCanvas) {
  let bw = BackWall.x2 - BackWall.x1;
  let bh = BackWall.y2 - BackWall.y1;
  let x = BackWall.x1 + bw * 0.62;
  let y = BackWall.y1 + bh * 0.18;
  let w = bw * 0.16;
  let h = bh * 0.38;

  hCanvas.noStroke();
  hCanvas.fill(70, 64, 52);             // frame
  hCanvas.rect(x - 4, y - 4, w + 8, h + 8);
  hCanvas.fill(14, 18, 24);             // night glass
  hCanvas.rect(x, y, w, h);
  hCanvas.fill(90, 82, 66);             // sill
  hCanvas.rect(x - 7, y + h + 4, w + 14, 4);

  // panes: 2 columns × 3 rows
  hCanvas.stroke(70, 64, 52);
  hCanvas.strokeWeight(2);
  for (let i = 1; i < 2; i++) hCanvas.line(x + w * i / 2, y, x + w * i / 2, y + h);
  for (let j = 1; j < 3; j++) hCanvas.line(x, y + h * j / 3, x + w, y + h * j / 3);
}

// ---------------- floor ----------------

function drawRug(hCanvas) {
  hCanvas.noStroke();
  hCanvas.fill(48, 34, 26);
  kQuad(hCanvas, floorPoint(0.18, 0.38), floorPoint(0.8, 0.38),
                 floorPoint(0.8, 0.95), floorPoint(0.18, 0.95));
  hCanvas.noFill();
  hCanvas.stroke(80, 60, 40, 150);
  hCanvas.strokeWeight(1.5);
  kQuad(hCanvas, floorPoint(0.22, 0.42), floorPoint(0.76, 0.42),
                 floorPoint(0.76, 0.91), floorPoint(0.22, 0.91));
}

// ---------------- right wall ----------------

function drawRightWindow(hCanvas) {
  // window on the right wall (u = 1), above the counter
  hCanvas.noStroke();
  hCanvas.fill(14, 18, 24);
  kQuad(hCanvas, kPoint(1, 0.45, 0.42), kPoint(1, 0.7, 0.42),
                 kPoint(1, 0.7, 0.72), kPoint(1, 0.45, 0.72));
  hCanvas.stroke(70, 64, 52);
  hCanvas.strokeWeight(2);
  for (let i = 0; i <= 3; i++) {
    let t = lerp(0.45, 0.7, i / 3);
    let a = kPoint(1, t, 0.42), b = kPoint(1, t, 0.72);
    hCanvas.line(a.x, a.y, b.x, b.y);
  }
  let m1 = kPoint(1, 0.45, 0.57), m2 = kPoint(1, 0.7, 0.57);
  hCanvas.line(m1.x, m1.y, m2.x, m2.y);

  // lace curtain: scalloped bottom edge along the top of the window
  hCanvas.noStroke();
  hCanvas.fill(120, 112, 90, 200);
  hCanvas.beginShape();
  let top1 = kPoint(1, 0.42, 0.8), top2 = kPoint(1, 0.73, 0.8);
  hCanvas.vertex(top1.x, top1.y);
  hCanvas.vertex(top2.x, top2.y);
  for (let i = 10; i >= 0; i--) {
    let t = lerp(0.42, 0.73, i / 10);
    let h = 0.66 + (i % 2) * 0.04;      // zig-zag = scallops
    let p = kPoint(1, t, h);
    hCanvas.vertex(p.x, p.y);
  }
  hCanvas.endShape(CLOSE);
}

function drawShelves(hCanvas) {
  // three shelves on the right wall with dishes
  for (let s = 0; s < 3; s++) {
    let h = 0.5 + s * 0.13;
    hCanvas.noStroke();
    hCanvas.fill(60, 48, 36);
    kQuad(hCanvas, kPoint(0.9, 0.08, h), kPoint(1, 0.08, h),
                   kPoint(1, 0.38, h), kPoint(0.9, 0.38, h));

    // dishes: loop along the shelf
    for (let i = 0; i < 6; i++) {
      let t = lerp(0.1, 0.36, i / 5);
      let p = kPoint(0.95, t, h);
      let size = 10 * (p.y / hCanvas.height + 0.3); // nearer = bigger
      hCanvas.fill(120 + (i * 17) % 40, 112, 95);
      if ((i + s) % 3 === 0) hCanvas.rect(p.x - size / 3, p.y - size, size * 0.66, size); // jar
      else hCanvas.ellipse(p.x, p.y - size / 2, size * 0.5, size);               // plate on edge
    }
  }
}

function drawCounterDetails(hCanvas) {
  // white farmhouse sink set into the counter top
  hCanvas.noStroke();
  hCanvas.fill(150, 146, 132);
  kQuad(hCanvas, kPoint(0.84, 0.48, 0.3), kPoint(0.97, 0.48, 0.3),
                 kPoint(0.97, 0.66, 0.3), kPoint(0.84, 0.66, 0.3));
  hCanvas.fill(60, 58, 52);
  kQuad(hCanvas, kPoint(0.86, 0.5, 0.3), kPoint(0.95, 0.5, 0.3),
                 kPoint(0.95, 0.64, 0.3), kPoint(0.86, 0.64, 0.3));

  // drawer/cabinet lines on the counter's front face
  hCanvas.stroke(25, 20, 16);
  hCanvas.strokeWeight(1);
  for (let i = 1; i < 6; i++) {
    let t = lerp(0.08, 0.8, i / 6);
    let a = kPoint(0.82, t, 0), b = kPoint(0.82, t, 0.3);
    hCanvas.line(a.x, a.y, b.x, b.y);
  }
}

// ---------------- dining set ----------------

function drawChair(hCanvas, u, t) {
  let w = 0.1, d = 0.06;
  let wood = color(70, 52, 36), dark = color(45, 33, 24);
  // seat
  drawFurniture(hCanvas, u, u + w, t, t + d, 0.14, dark, wood);
  // spindle back: loop of thin vertical bars on the far edge
  hCanvas.stroke(wood);
  hCanvas.strokeWeight(2);
  for (let i = 0; i <= 4; i++) {
    let a = kPoint(u + w * i / 4, t, 0.14);
    let b = kPoint(u + w * i / 4, t, 0.36);
    hCanvas.line(a.x, a.y, b.x, b.y);
  }
  let r1 = kPoint(u - 0.005, t, 0.36), r2 = kPoint(u + w + 0.005, t, 0.36);
  hCanvas.strokeWeight(4);
  hCanvas.line(r1.x, r1.y, r2.x, r2.y); // top rail
}

function drawTableTop(hCanvas, flicker) {
  let H = 0.24;
  let c = kPoint(0.48, 0.58, H);

  // plates around the table
  hCanvas.noStroke();
  for (let [u, t] of [[0.36, 0.52], [0.6, 0.52], [0.36, 0.66], [0.6, 0.66]]) {
    let p = kPoint(u, t, H);
    hCanvas.fill(140, 132, 115);
    hCanvas.ellipse(p.x, p.y, 22, 8);
    hCanvas.fill(110, 104, 90);
    hCanvas.ellipse(p.x, p.y, 13, 4);
  }

  // fruit bowl
  hCanvas.fill(40, 52, 30);
  for (let i = 0; i < 9; i++) {
    hCanvas.ellipse(c.x - 14 + (i % 5) * 7, c.y - 10 - floor(i / 5) * 5, 8, 7);
  }
  hCanvas.fill(55, 50, 44);
  hCanvas.arc(c.x, c.y - 8, 44, 22, 0, PI);

  // three candles in tall holders, with flickering flames + glow
  for (let i = 0; i < 3; i++) {
    let x = c.x + 34 + i * 7;
    let base = c.y - 2 + i * 2;
    let candleH = 22 + i * 4;
    hCanvas.stroke(20);
    hCanvas.strokeWeight(2);
    hCanvas.line(x, base, x, base - 12);               // holder
    hCanvas.noStroke();
    hCanvas.fill(200, 190, 160);
    hCanvas.rect(x - 1.5, base - 12 - candleH, 3, candleH); // candle
    let fy = base - 14 - candleH;
    for (let g = 5; g > 0; g--) {                     // glow rings
      hCanvas.fill(255, 190, 90, 12 * flicker);
      hCanvas.ellipse(x, fy, g * 18 * flicker, g * 18 * flicker);
    }
    hCanvas.fill(255, 220, 140);
    hCanvas.ellipse(x + random(-0.5, 0.5), fy, 3, 7 * flicker);
  }
}

// ---------------- lights & atmosphere ----------------

function drawChandelier(hCanvas, flicker) {
  let cx = hCanvas.width * 0.42;
  let cy = 62;
  hCanvas.stroke(25, 22, 18);
  hCanvas.strokeWeight(2);
  hCanvas.line(cx, 0, cx, cy);
  hCanvas.noFill();
  hCanvas.arc(cx, cy, 70, 30, 0, PI);  // curved arms
  hCanvas.arc(cx, cy, 40, 18, 0, PI);

  for (let side of [-1, 1]) {
    let bx = cx + side * 35;
    let by = cy - 6;
    for (let g = 6; g > 0; g--) {      // soft glow
      hCanvas.noStroke();
      hCanvas.fill(255, 230, 170, 10 * flicker);
      hCanvas.ellipse(bx, by, g * 22, g * 22);
    }
    hCanvas.fill(240, 230, 200);
    hCanvas.rect(bx - 5, by - 12, 10, 12, 2); // lamp shade
  }
}

function drawVignette(hCanvas) {
  // dark frame that fades inward: many thin borders with rising alpha
  hCanvas.noFill();
  let steps = 40;
  for (let i = 0; i < steps; i++) {
    hCanvas.stroke(0, 0, 0, map(i, 0, steps, 200, 0));
    hCanvas.strokeWeight(3);
    hCanvas.rect(i * 2, i * 2, hCanvas.width - i * 4, hCanvas.height - i * 4);
  }
}
