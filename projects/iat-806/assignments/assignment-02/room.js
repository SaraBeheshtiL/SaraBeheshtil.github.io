//////////////////// HAUNTED ROOM //////////////////////

// Back wall coordinates
let BACK = {
  x1: 245,
  y1: 150,
  x2: 395,
  y2: 262,
};

let doors = [];
let tablePosition;
let roomGraphics;

// Initialize the room once
function setupRoom() {
  doors = [
    new Door("left", 0.18, 0.36, 0.72, true),
    new Door("left", 0.5, 0.63, 0.72, false),
    new Door("left", 0.74, 0.84, 0.72, true),

    new Door("right", 0.3, 0.46, 0.72, false),
    new Door("right", 0.62, 0.74, 0.72, true),

    new Door("back", 0, 0, 0.75, false),
  ];

  tablePosition = floorPoint(0.35, 0.35);

  // Draw the static room once
  roomGraphics = createGraphics(width, height);
  drawRoom(roomGraphics);
}

//////////////////// PERSPECTIVE //////////////////////

// Find a point on the left or right wall
function wallPoint(side, t, h) {
  let x = side === "left" ? lerp(0, BACK.x1, t) : lerp(width, BACK.x2, t);

  let floorY = lerp(height, BACK.y2, t);
  let ceilingY = lerp(0, BACK.y1, t);

  return {
    x: x,
    y: lerp(floorY, ceilingY, h),
  };
}

// Find a point on the floor
function floorPoint(u, t) {
  let left = wallPoint("left", t, 0);
  let right = wallPoint("right", t, 0);

  return {
    x: lerp(left.x, right.x, u),
    y: left.y,
  };
}

//////////////////// DOOR CLASS //////////////////////

class Door {
  constructor(side, t1, t2, tall, ajar) {
    this.side = side;
    this.t1 = t1;
    this.t2 = t2;
    this.tall = tall;
    this.ajar = ajar;
  }

  corners() {
    if (this.side === "back") {
      let cx = (BACK.x1 + BACK.x2) / 2;
      let w = (BACK.x2 - BACK.x1) * 0.28;
      let top = lerp(BACK.y2, BACK.y1, this.tall);

      return [
        { x: cx - w / 2, y: top },
        { x: cx + w / 2, y: top },
        { x: cx + w / 2, y: BACK.y2 },
        { x: cx - w / 2, y: BACK.y2 },
      ];
    }

    return [
      wallPoint(this.side, this.t1, this.tall),
      wallPoint(this.side, this.t2, this.tall),
      wallPoint(this.side, this.t2, 0),
      wallPoint(this.side, this.t1, 0),
    ];
  }

  spawnPoint() {
    let c = this.corners();

    let x = (c[0].x + c[1].x + c[2].x + c[3].x) / 4;
    let floorY = (c[2].y + c[3].y) / 2;
    let topY = (c[0].y + c[1].y) / 2;

    return {
      x: x,
      y: lerp(floorY, topY, 0.45),
      scale: ((floorY - topY) * 0.9) / 150,
    };
  }

  display(g) {
    let c = this.corners();

    // Door frame
    g.stroke(75, 53, 37);
    g.strokeWeight(4);
    g.fill(5, 4, 6);

    g.quad(c[0].x, c[0].y, c[1].x, c[1].y, c[2].x, c[2].y, c[3].x, c[3].y);

    // Half-open door
    if (this.ajar) {
      let swing = this.side === "left" ? 18 : -18;

      if (this.side === "back") {
        swing = 10;
      }

      g.noStroke();
      g.fill(58, 39, 28);

      g.quad(
        c[0].x,
        c[0].y,
        c[0].x + swing,
        c[0].y + 6,
        c[3].x + swing,
        c[3].y - 2,
        c[3].x,
        c[3].y,
      );
    }
  }
}

//////////////////// DRAW ROOM //////////////////////

function drawRoom(g) {
  g.background(8, 7, 10);
  g.noStroke();

  let L0 = wallPoint("left", 0, 0);
  let L0t = wallPoint("left", 0, 1);
  let L1 = wallPoint("left", 1, 0);
  let L1t = wallPoint("left", 1, 1);

  let R0 = wallPoint("right", 0, 0);
  let R0t = wallPoint("right", 0, 1);
  let R1 = wallPoint("right", 1, 0);
  let R1t = wallPoint("right", 1, 1);

  // Ceiling
  g.fill(20, 18, 22);
  g.quad(L0t.x, L0t.y, R0t.x, R0t.y, R1t.x, R1t.y, L1t.x, L1t.y);

  // Floor
  g.fill(43, 29, 23);
  g.quad(L0.x, L0.y, R0.x, R0.y, R1.x, R1.y, L1.x, L1.y);

  // Left wall
  g.fill(51, 44, 40);
  g.quad(L0t.x, L0t.y, L1t.x, L1t.y, L1.x, L1.y, L0.x, L0.y);

  // Right wall
  g.fill(39, 34, 35);
  g.quad(R0t.x, R0t.y, R1t.x, R1t.y, R1.x, R1.y, R0.x, R0.y);

  // Back wall
  g.noStroke();
  g.fill(35, 32, 34);
  g.rect(BACK.x1, BACK.y1, BACK.x2 - BACK.x1, BACK.y2 - BACK.y1);

  drawFloorboards(g);
  drawWallpaper(g);

  // Room edges
  g.stroke(17, 13, 13);
  g.strokeWeight(3);

  g.line(0, 0, BACK.x1, BACK.y1);
  g.line(width, 0, BACK.x2, BACK.y1);
  g.line(0, height, BACK.x1, BACK.y2);
  g.line(width, height, BACK.x2, BACK.y2);

  // Doors
  for (let door of doors) {
    door.display(g);
  }

  // Furniture and staircase
  drawStairs(g);
  drawTable(g);
}

//////////////////// FLOORBOARDS //////////////////////

function drawFloorboards(g) {
  g.stroke(23, 16, 13);
  g.strokeWeight(1.5);

  for (let u = 0; u <= 1.001; u += 0.1) {
    let a = floorPoint(u, 0);
    let b = floorPoint(u, 1);

    g.line(a.x, a.y, b.x, b.y);
  }

  // Horizontal floorboard divisions
  for (let t = 0.1; t < 1; t += 0.12) {
    let a = floorPoint(0, t);
    let b = floorPoint(1, t);

    g.line(a.x, a.y, b.x, b.y);
  }
}

//////////////////// WALLPAPER //////////////////////

function drawWallpaper(g) {
  g.stroke(32, 29, 28);
  g.strokeWeight(2);

  for (let t = 0.05; t < 1; t += 0.07) {
    for (let side of ["left", "right"]) {
      let a = wallPoint(side, t, 0);
      let b = wallPoint(side, t, 1);

      g.line(a.x, a.y, b.x, b.y);
    }
  }

  // Random dark stains
  g.noStroke();

  for (let i = 0; i < 25; i++) {
    g.fill(18, 15, 16, 65);

    let side = random(["left", "right"]);
    let p = wallPoint(side, random(0.05, 0.9), random(0.3, 0.95));

    g.ellipse(p.x, p.y, random(10, 40), random(20, 70));
  }
}

//////////////////// STAIRCASE //////////////////////

function drawStairs(g) {
  // Staircase on the right side of the room
  // Wider steps are closer to the viewer

  let numSteps = 7;

  for (let i = numSteps - 1; i >= 0; i--) {
    let t = i / (numSteps - 1);

    let x = lerp(402, 548, t);
    let y = lerp(268, 455, t);

    let w = lerp(42, 165, t);
    let h = lerp(8, 25, t);
    let depth = lerp(8, 23, t);

    // Vertical front of step
    g.noStroke();
    g.fill(36, 24, 20);

    g.quad(x - w / 2, y, x + w / 2, y, x + w / 2, y + h, x - w / 2, y + h);

    // Wooden top surface
    g.fill(76, 53, 38);

    g.quad(
      x - w / 2,
      y,
      x + w / 2,
      y,
      x + w / 2 - 8,
      y - depth,
      x - w / 2 + 8,
      y - depth,
    );

    // Worn edge
    g.stroke(113, 82, 57, 140);
    g.strokeWeight(1.5);

    g.line(x - w / 2, y, x + w / 2, y);
  }
}

//////////////////// TABLE //////////////////////

function drawTable(g) {
  let x = tablePosition.x;
  let y = tablePosition.y;

  // Table legs
  g.stroke(39, 26, 19);
  g.strokeWeight(5);

  g.line(x - 50, y - 30, x - 50, y + 8);
  g.line(x + 50, y - 30, x + 50, y + 8);
  g.line(x - 36, y - 40, x - 36, y - 10);
  g.line(x + 36, y - 40, x + 36, y - 10);

  // Table surface
  g.noStroke();
  g.fill(70, 48, 33);

  g.quad(x - 40, y - 46, x + 40, y - 46, x + 58, y - 30, x - 58, y - 30);

  g.fill(49, 32, 24);
  g.rect(x - 58, y - 30, 116, 6);

  // Candle body
  g.fill(205, 192, 163);
  g.rect(x - 3, y - 58, 6, 14);

  // Dusty cloth
  g.fill(90, 84, 74, 120);
  g.triangle(x - 20, y - 46, x + 10, y - 46, x - 2, y - 24);
}

//////////////////// DISPLAY //////////////////////

function displayRoom() {
  image(roomGraphics, 0, 0);
}

function randomDoor() {
  return random(doors);
}

//////////////////// CANDLE //////////////////////

function candlePos() {
  return {
    x: tablePosition.x + 2,
    y: tablePosition.y - 62,
  };
}

function displayCandle() {
  let c = candlePos();
  let flicker = random(0.8, 1.2);

  let ctx = drawingContext;

  let glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, 45 * flicker);

  glow.addColorStop(0, "rgba(255,180,90,0.35)");
  glow.addColorStop(1, "rgba(255,180,90,0)");

  ctx.save();
  ctx.fillStyle = glow;
  ctx.fillRect(c.x - 55, c.y - 55, 110, 110);
  ctx.restore();

  // Flickering flame
  noStroke();
  fill(255, 210, 120);

  ellipse(c.x + random(-0.6, 0.6), c.y, 4 * flicker, 9 * flicker);
}
