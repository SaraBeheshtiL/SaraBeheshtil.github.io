//////////////////// HAUNTED ROOM //////////////////////

// Back wall coordinates
let BackWall = {
  x1: 245,
  y1: 150,
  x2: 395,
  y2: 265,
};

// doors is an array of objects from the Door class
let doors = [];
let roomGraphics;

// Creating the room with selfdefined function of setupRoom
function setupRoom() {
  doors = [
    new Door("left", 0.18, 0.36, 0.72, true),
    new Door("left", 0.5, 0.63, 0.72, false),
    new Door("left", 0.74, 0.84, 0.72, true),
    new Door("right", 0.3, 0.46, 0.72, false),
    new Door("right", 0.62, 0.74, 0.72, true),
    new Door("back", 0, 0, 0.75, false),
  ];

  // Draw the static room once
  roomGraphics = createGraphics(width, height);
  drawRoom(roomGraphics);
}

//////////////////// PERSPECTIVE //////////////////////

// Find a point on the left or right wall
function wallPoint(side, t, h) {
  /// side is left or right // t means the depth of the room between 0 to 1 (0 means close to viewer and 1 means the back wall
  // h means how height on the wall between 0 to 1, ero means the floor and one means the ceiling.
  let x;
  if (side === "left") {
    x = lerp(0, BackWall.x1, t); // lerp gives a number between two numbers at a specific increment. lerp(start, stop, amt)
  } else {
    x = lerp(width, BackWall.x2, t);
  }

  let floorY = lerp(height, BackWall.y2, t);
  let ceilingY = lerp(0, BackWall.y1, t);

  return {
    x: x,
    y: lerp(floorY, ceilingY, h),
  };
}

// Find a point on the floor
function floorPoint(u, t) {
  // u controls the horizontal position across the floor, from left (0) to right (1).
  let left = wallPoint("left", t, 0);
  let right = wallPoint("right", t, 0);

  return {
    x: lerp(left.x, right.x, u),
    y: left.y,
  };
}

//////////////////// DOOR CLASS //////////////////////
///// Using this class to create doors on each wall ///////
class Door {
  constructor(side, t1, t2, tall, ajar) {
    // side shows the wall where the door is located (left, or right or back)
    this.side = side;
    // depth wher ethe door begins
    this.t1 = t1;
    // depth where the door ends
    this.t2 = t2;
    // door height relative to the wall
    this.tall = tall;
    // whether the door is half open or not
    this.ajar = ajar;
  }

  corners() {
    // this method calculates the four points needed to draw a door.
    if (this.side === "back") {
      let cx = (BackWall.x1 + BackWall.x2) / 2;
      let w = (BackWall.x2 - BackWall.x1) * 0.28; //the width of the door as 28% of the back wall.
      let top = lerp(BackWall.y2, BackWall.y1, this.tall); // top calculate the top of the door.

      // Now it returns the four points of the back door
      return [
        { x: cx - w / 2, y: top },
        { x: cx + w / 2, y: top },
        { x: cx + w / 2, y: BackWall.y2 },
        { x: cx - w / 2, y: BackWall.y2 },
      ];
    }

    // here by using the wallPoint function we create the side doors
    return [
      wallPoint(this.side, this.t1, this.tall),
      wallPoint(this.side, this.t2, this.tall),
      wallPoint(this.side, this.t2, 0),
      wallPoint(this.side, this.t1, 0),
    ];
  }

  // This method calculates where the creature should appear
  spawnPoint() {
    // Here we are calling corners() method to get the four corners of the current door
    let c = this.corners();
    // average of the four corners x coordinates
    let x = (c[0].x + c[1].x + c[2].x + c[3].x) / 4;
    let floorY = (c[2].y + c[3].y) / 2;
    let topY = (c[0].y + c[1].y) / 2;

    return {
      x: x,
      y: lerp(floorY, topY, 0.45),
      scale: ((floorY - topY) * 0.9) / 150,
    };
  }
  /// This method draws the door on the canvas.
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

  // Left wall points
  let L0 = wallPoint("left", 0, 0);
  let L0t = wallPoint("left", 0, 1);
  let L1 = wallPoint("left", 1, 0);
  let L1t = wallPoint("left", 1, 1);

  // Right wall points
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
  g.fill(35, 32, 34);

  g.rect(
    BackWall.x1,
    BackWall.y1,
    BackWall.x2 - BackWall.x1,
    BackWall.y2 - BackWall.y1,
  );

  // Draw floorboards and wallpaper
  drawFloorboards(g);
  drawWallpaper(g);

  // Room corner edges
  g.stroke(17, 13, 13);
  g.strokeWeight(3);

  g.line(0, 0, BackWall.x1, BackWall.y1);
  g.line(width, 0, BackWall.x2, BackWall.y1);
  g.line(0, height, BackWall.x1, BackWall.y2);
  g.line(width, height, BackWall.x2, BackWall.y2);

  // Draw all doors
  for (let door of doors) {
    door.display(g);
  }

  // Draw basement staircase in the middle of floor
  drawStairs(g);
}

//////////////////// FLOORBOARDS //////////////////////

function drawFloorboards(g) {
  g.stroke(23, 16, 13);
  g.strokeWeight(1.5);

  // Lines going toward the back wall
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
}

//////////////////// BASEMENT STAIRS //////////////////////

//////////////////// BASEMENT STAIRS //////////////////////

//////////////////// BASEMENT STAIRCASE //////////////////////

function drawStairs(g) {
  // Five connected stairs
  let numSteps = 5;

  // Center of the room
  let centerX = width / 2;

  // Position of the staircase opening
  let backY = height * 0.65;
  let frontY = height * 0.97;

  // Width of staircase at far and near ends
  let backWidth = width * 0.13;
  let frontWidth = width * 0.55;

  ////////////////// FLOOR OPENING //////////////////

  // Black hole in the floor
  g.noStroke();
  g.fill(2, 2, 4);

  g.quad(
    centerX - backWidth / 2,
    backY,
    centerX + backWidth / 2,
    backY,
    centerX + frontWidth / 2,
    frontY,
    centerX - frontWidth / 2,
    frontY,
  );

  ////////////////// DARK BACK WALL //////////////////

  // The vertical dark wall at the end of the stairs
  let backWallHeight = 30;

  g.fill(5, 4, 6);

  g.quad(
    centerX - backWidth / 2,
    backY,
    centerX + backWidth / 2,
    backY,
    centerX + backWidth / 2,
    backY + backWallHeight,
    centerX - backWidth / 2,
    backY + backWallHeight,
  );

  ////////////////// STAIRCASE GEOMETRY //////////////////

  // Each edge will be shared between two steps
  let edges = [];

  for (let i = 0; i <= numSteps; i++) {
    let t = i / numSteps;

    // Perspective makes distant steps closer together
    let p = pow(t, 1.5);

    // Position from far to near
    let y = lerp(backY + backWallHeight, frontY, p);

    // Width increases toward the viewer
    let w = lerp(backWidth * 0.85, frontWidth * 0.9, p);

    edges.push({
      left: centerX - w / 2,
      right: centerX + w / 2,
      y: y,
    });
  }

  ////////////////// CONNECTED STAIRS //////////////////

  // Draw from the far end toward the viewer
  for (let i = 0; i < numSteps; i++) {
    let far = edges[i];
    let near = edges[i + 1];

    let t = i / (numSteps - 1);

    // Far steps are darker
    let brightness = lerp(15, 85, pow(t, 1.5));

    // Height of the vertical step face
    let riser = lerp(3, 12, t);

    // Horizontal tread surface
    g.noStroke();
    g.fill(brightness, brightness * 0.68, brightness * 0.48);

    g.quad(
      far.left,
      far.y,
      far.right,
      far.y,
      near.right,
      near.y - riser,
      near.left,
      near.y - riser,
    );

    // Vertical face of the step
    g.fill(brightness * 0.48, brightness * 0.32, brightness * 0.24);

    g.quad(
      near.left,
      near.y - riser,
      near.right,
      near.y - riser,
      near.right,
      near.y,
      near.left,
      near.y,
    );

    // Subtle line on the wooden edge
    g.stroke(110, 78, 53, 90 * t);
    g.strokeWeight(1);

    g.line(near.left, near.y - riser, near.right, near.y - riser);
  }

  ////////////////// SIDE WALLS //////////////////

  // Left wall
  g.noStroke();
  g.fill(12, 9, 10, 190);

  g.quad(
    centerX - backWidth / 2,
    backY,
    centerX - frontWidth / 2,
    frontY,
    edges[numSteps].left,
    frontY,
    edges[0].left,
    edges[0].y,
  );

  // Right wall
  g.fill(9, 7, 8, 190);

  g.quad(
    centerX + backWidth / 2,
    backY,
    centerX + frontWidth / 2,
    frontY,
    edges[numSteps].right,
    frontY,
    edges[0].right,
    edges[0].y,
  );

  ////////////////// OUTER EDGES //////////////////

  g.noFill();
  g.stroke(38, 25, 20);
  g.strokeWeight(5);

  // Left diagonal edge
  g.line(centerX - backWidth / 2, backY, centerX - frontWidth / 2, frontY);

  // Right diagonal edge
  g.line(centerX + backWidth / 2, backY, centerX + frontWidth / 2, frontY);

  // Back horizontal edge
  g.line(centerX - backWidth / 2, backY, centerX + backWidth / 2, backY);
}

//////////////////// DISPLAY //////////////////////

function displayRoom() {
  image(roomGraphics, 0, 0);
}

// Select a random door for a creature
function randomDoor() {
  return random(doors);
}
