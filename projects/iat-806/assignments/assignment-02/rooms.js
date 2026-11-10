////////////////////////// THE ROOMS//////////////////////
// ONE Room class for all six places:
// Hallway (the first frame), Bedroom, Kitchen, Bathroom, Living Room, Basement.
// Every place is an object made from the same class,
// and every place has its own creature and its own key and music.
//
// This file has, in order:
//   1. perspective helpers (wallPoint, floorPoint …)
//   2. the Door class (doors in the hallway)
//   3. the Room class + the data for all six rooms
//   4. one painter function per room (how each room is drawn)

// Back wall coordinates
let BackWall = {
  x1: 245,
  y1: 150,
  x2: 395,
  y2: 265,
};

// doors is an array of objects from the Door class
let doors = [];

//////////////////// Creating the Perspective//////////////////////

// Find a point on the left or right wall with a self-defined function, wallPoint()
function wallPoint(side, t, h) {
  /// side is left or right // t means the depth of the room between 0 to 1 (0 means close to viewer and 1 means the back wall
  // h means how height on the wall between 0 to 1, zero means the floor and one means the ceiling.
  let x;
  if (side === "left") {
    x = lerp(0, BackWall.x1, t); // lerp gives a number between two numbers at a specific increment which is a number betwee (0,1). lerp(start, stop, amt)
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

//////////////////////////////////////////////////////////////////////
////////////////////////////// DOOR CLASS ///////////////////////////
///// using this class to create doors on each wall /////////////////
//////////////////////////////////////////////////////////////////////
class Door {
  constructor(side, t1, t2, tall, ajar) {
    // side shows the wall where the door is located (left, or right or back).
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
    // this method gives the four points needed to draw a door.
    if (this.side === "back") {
      let cx = (BackWall.x1 + BackWall.x2) / 2;
      let w = (BackWall.x2 - BackWall.x1) * 0.25; //the width of the door as 25% of the back wall.
      let top = lerp(BackWall.y2, BackWall.y1, this.tall); // top calculate the top of the door.

      // Now we want it to return the four points of the back door.
      return [
        { x: cx - w / 2, y: top },
        { x: cx + w / 2, y: top },
        { x: cx + w / 2, y: BackWall.y2 },
        { x: cx - w / 2, y: BackWall.y2 },
      ];
    }

    // here by using the wallPoint function we create the side doors (when the side is left or right)
    return [
      wallPoint(this.side, this.t1, this.tall),
      wallPoint(this.side, this.t2, this.tall),
      wallPoint(this.side, this.t2, 0),
      wallPoint(this.side, this.t1, 0),
    ];
  }

  /// This method draws one door in two layers: first the dark doorway with its frame, then, if the door is half open (ajar), a wooden door panel appears in the door frame.
  display(picture) {
    let c = this.corners(); /// get the four corners of the door
    // Door frame
    picture.stroke(75, 53, 37); /// it give the brown outline of the door frame. /// I got this from google
    picture.strokeWeight(4); /// 4 pixel thikness of the outline .
    picture.fill(0, 0, 10); /// the black open door or frame.

    picture.quad(
      c[0].x,
      c[0].y,
      c[1].x,
      c[1].y,
      c[2].x,
      c[2].y,
      c[3].x,
      c[3].y,
    ); // quad() draws a quadrilateral (four-sided shape).
    //quad(x1, y1, x2, y2, x3, y3, x4, y4) the function is one of P5.js function

    // create ajar doors or half-open door if the ajar property is true. The ajar door is drawn as a quadrilateral that is slightly rotated to the left or right, depending on which wall the door is on.
    // In the hallway description, each door is made like new Door("left", 0.18, 0.36, 0.72, true), and that last true or false is ajar.
    if (this.ajar) {
      let openness; // how many pixels the door comes out

      if (this.side === "left") {
        openness = 18; // left wall: the door comes out to the right
      } else if (this.side === "right") {
        openness = -18; // right wall: the door comes out to the left
      } else {
        openness = 10; // back wall
      }

      // drawing ajar door
      picture.noStroke();
      picture.fill(58, 39, 28); ///I got this from google for dark brown
      picture.quad(
        c[0].x,
        c[0].y,
        c[0].x + openness,
        c[0].y + 6,
        c[3].x + openness,
        c[3].y - 2,
        c[3].x,
        c[3].y,
      );
    }
  }
}

//////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////// ROOM CLASS ///////////////////////////////////////
/////////////////////////////////////////////////////////////////////
let rooms = [];

class Room {
  constructor(roomData) {
    this.name = roomData.name;
    this.sign = roomData.sign; // the hand sign that brings you here.
    this.signText = roomData.signText;
    this.creator = roomData.creator; // function that draws the room.
    this.isHallway = roomData.isHallway; // the first frame: we start and finish here.
    this.appearance = roomData.appearance; // where the creature starts {x, y, s, rot}
    this.end = roomData.end; // where the creature ends = it got you
    this.ghostFile = roomData.ghostFile;
    this.lightRadius = roomData.lightRadius; // how far the flashlight reaches in this room.
    this.mirror = roomData.mirror; // only the bathroom has one
    this.escaped = false;

    // in order for the room to never change, we draw it once and same it as a picture: like the rooms is drawn in other hidden canvases with the same size
    // createGraphics akes a hidden drawing surface, like an invisible canvas, the same size as the main canvas (640 × 480).
    this.hiddenCanvas = createGraphics(width, height);
    //the function this.creator draws onto the hidden canvas, not onto the screen.
    this.creator(this.hiddenCanvas);
  }
  // draw the rooms
  display() {
    image(this.hiddenCanvas, 0, 0);
    if (this.mirror) {
      this.drawMirror();
    }
  }

  // When the player goes into the Bathroom, the mirror shows the real webcam
  drawMirror() {
    let m = this.mirror;
    push(); // push() & pop() begin & end a drawing group that contains its own styles and transformations. (p5.js)
    tint(200, 210, 215); // it tints the image with a light gray color, making it look like a reflection in the mirror.
    image(video, m.x, m.y, m.w, m.h);
    pop(); // end
    noStroke();
    fill(170, 180, 180, 45); // it draws a semi-transparent rectangle over the mirror area, giving it a reflective effect.
    rect(m.x, m.y, m.w, m.h);
  }
}

function setupRooms() {
  let roomData = [
    {
      name: "Hallway",
      sign: "bothClosed", // the hand signe which brings you here
      signText: "Both fists", // the text that appear on the screen for the gesture
      creator: paintHallway,
      isHallway: true,
      appearance: { x: 320, y: 226, s: 0.52 }, // where the creature should appere, the back door
      end: { x: width * 0.5, y: height * 0.6, s: 2.4 },
      ghostFile: "ghost6.png", // the image of the creature
      lightRadius: 125, // the size of the lamp
    },
    {
      name: "Bedroom",
      sign: "RightOpen",
      signText: "right hand OPEN",
      creator: paintBedroom,
      appearance: {
        x: floorPoint(0.75, 0.22).x,
        y: floorPoint(0.75, 0.22).y - wallH(0.22) * 0.04,
        s: 0.28,
        lightRadius: 125,
      },
      end: { x: width * 0.55, y: height * 0.68, s: 2.4 },
      ghostFile: "ghost1.png",
    },
    {
      name: "Kitchen",
      sign: "RightClosed",
      signText: "right hand FIST",
      creator: paintKitchen,
      appearance: { x: BackWall.x2 - 14, y: BackWall.y2 - 38, s: 0.32 },
      end: { x: width * 0.52, y: height * 0.64, s: 2.4 },
      ghostFile: "ghost2.png",
      lightRadius: 125,
    },
    {
      name: "Bathroom",
      sign: "LeftOpen",
      signText: "left hand OPEN",
      creator: paintBathroom,
      mirror: { x: 170, y: 40, w: 300, h: 225 },
      appearance: { x: 170 + 300 * 0.78, y: 40 + 225 * 0.38, s: 0.25 },
      end: { x: 170 + 300 * 0.27, y: 40 + 225 * 0.45, s: 1.15 },
      ghostFile: "ghost3.png",
      lightRadius: 125,
    },
    {
      name: "Living Room",
      sign: "LeftClosed",
      signText: "left hand FIST",
      creator: paintLivingRoom,
      appearance: { x: 370, y: 138, s: 0.3, rot: PI }, // upside down, on the ceiling
      end: { x: 300, y: 125, s: 2.2, rot: PI },
      ghostFile: "ghost4.png",
      lightRadius: 125,
    },
    {
      name: "Basement",
      sign: "bothOpen",
      signText: "BOTH hands OPEN",
      creator: paintBasement,
      appearance: { x: 320, y: 318, s: 0.3 },
      end: { x: 320, y: 392, s: 2.5 },
      ghostFile: "ghost5.png",
      lightRadius: 95, // it's darker down compared to the other rooms.
    },
  ];

  // make all six rooms with a loop
  for (let d of roomData) {
    rooms.push(new Room(d));
  }
}

// the rooms that have a creature (now that's all six)
function hauntedRooms() {
  return rooms.filter((r) => r.spawn);
}

function roomForSign(sign) {
  for (let r of rooms) {
    if (r.sign === sign) return r;
  }
  return null;
}

//////////////////// PERSPECTIVE HELPERS //////////////////////

// how tall the wall is at depth t
function wallH(t) {
  return lerp(height, BackWall.y2, t) - lerp(0, BackWall.y1, t);
}

// lift a floor point up by h (fraction of the wall height)
function raise(p, t, h) {
  return { x: p.x, y: p.y - wallH(t) * h };
}

// the empty box of a room: ceiling, floor, two walls, back wall
function paintBox(g, wallL, wallR, floorC, ceilC, backC) {
  let L0 = wallPoint("left", 0, 0),
    L0t = wallPoint("left", 0, 1);
  let L1 = wallPoint("left", 1, 0),
    L1t = wallPoint("left", 1, 1);
  let R0 = wallPoint("right", 0, 0),
    R0t = wallPoint("right", 0, 1);
  let R1 = wallPoint("right", 1, 0),
    R1t = wallPoint("right", 1, 1);
  g.background(0);
  g.noStroke();
  g.fill(ceilC);
  g.quad(L0t.x, L0t.y, R0t.x, R0t.y, R1t.x, R1t.y, L1t.x, L1t.y);
  g.fill(floorC);
  g.quad(L0.x, L0.y, R0.x, R0.y, R1.x, R1.y, L1.x, L1.y);
  g.fill(wallL);
  g.quad(L0t.x, L0t.y, L1t.x, L1t.y, L1.x, L1.y, L0.x, L0.y);
  g.fill(wallR);
  g.quad(R0t.x, R0t.y, R1t.x, R1t.y, R1.x, R1.y, R0.x, R0.y);
  g.fill(backC);
  g.rect(
    BackWall.x1,
    BackWall.y1,
    BackWall.x2 - BackWall.x1,
    BackWall.y2 - BackWall.y1,
  );
  g.stroke(10, 8, 8);
  g.strokeWeight(3);
  g.line(0, 0, BackWall.x1, BackWall.y1);
  g.line(width, 0, BackWall.x2, BackWall.y1);
  g.line(0, height, BackWall.x1, BackWall.y2);
  g.line(width, height, BackWall.x2, BackWall.y2);
}

// a box standing on the floor (bed, sofa, fridge…)
// u = left↔right, t = near↔far, h0..h1 = bottom↔top (fractions of wall height)
function floorBox(g, u1, u2, t1, t2, h0, h1, topC, frontC, sideC) {
  let p = (u, t, h) => raise(floorPoint(u, t), t, h);
  g.noStroke();
  // the side you can see (the one facing the middle of the room)
  let su = (u1 + u2) / 2 > 0.5 ? u1 : u2;
  g.fill(sideC);
  let a = p(su, t1, h0),
    b = p(su, t2, h0),
    c = p(su, t2, h1),
    d = p(su, t1, h1);
  g.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
  // front
  g.fill(frontC);
  a = p(u1, t1, h0);
  b = p(u2, t1, h0);
  c = p(u2, t1, h1);
  d = p(u1, t1, h1);
  g.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
  // top
  g.fill(topC);
  a = p(u1, t1, h1);
  b = p(u2, t1, h1);
  c = p(u2, t2, h1);
  d = p(u1, t2, h1);
  g.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
}

// a flat shape stuck on a side wall (window, cabinet, picture)
function wallRect(g, side, t1, t2, h1, h2, c) {
  let a = wallPoint(side, t1, h1),
    b = wallPoint(side, t2, h1);
  let cc = wallPoint(side, t2, h2),
    d = wallPoint(side, t1, h2);
  g.fill(c);
  g.quad(a.x, a.y, b.x, b.y, cc.x, cc.y, d.x, d.y);
}

function stains(g, n) {
  g.noStroke();
  for (let i = 0; i < n; i++) {
    g.fill(10, 8, 6, 50);
    let p = wallPoint(
      random(["left", "right"]),
      random(0.05, 0.9),
      random(0.2, 0.95),
    );
    g.ellipse(p.x, p.y, random(10, 40), random(20, 70));
  }
}

//////////////////// HALLWAY //////////////////////
// the first frame: a corridor with doors and the basement stairs

function paintHallway(g) {
  doors = [
    new Door("left", 0.18, 0.36, 0.72, true),
    new Door("left", 0.5, 0.63, 0.72, false),
    new Door("left", 0.74, 0.84, 0.72, true),

    new Door("right", 0.3, 0.46, 0.72, false),
    new Door("right", 0.62, 0.74, 0.72, true),

    new Door("back", 0, 0, 0.75, false),
  ];
  drawRoom(g);
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

//////////////////// BEDROOM //////////////////////
// a creature hides under the bed

function paintBedroom(g) {
  paintBox(
    g,
    color(44, 46, 56),
    color(36, 38, 48),
    color(42, 31, 25),
    color(18, 18, 24),
    color(34, 36, 46),
  );

  // floorboards
  g.stroke(26, 18, 14);
  g.strokeWeight(1.5);
  for (let u = 0; u <= 1.001; u += 0.1) {
    let a = floorPoint(u, 0),
      b = floorPoint(u, 1);
    g.line(a.x, a.y, b.x, b.y);
  }

  // window with moonlight on the back wall
  g.noStroke();
  g.fill(25, 38, 62);
  g.rect(288, 168, 64, 52);
  g.stroke(30, 25, 22);
  g.strokeWeight(3);
  g.noFill();
  g.rect(288, 168, 64, 52);
  g.line(320, 168, 320, 220);
  g.line(288, 194, 352, 194);
  g.noStroke();
  g.fill(200, 210, 255, 20);
  g.quad(288, 220, 352, 220, 420, 330, 300, 330);

  stains(g, 15);

  // nightstand (the key is on top)
  floorBox(
    g,
    0.02,
    0.14,
    0.35,
    0.45,
    0,
    0.18,
    color(70, 50, 36),
    color(55, 38, 28),
    color(45, 31, 23),
  );

  // the bed: black gap underneath, then frame, then mattress
  floorBox(g, 0.55, 0.95, 0.22, 0.65, 0, 0.07, color(0), color(0), color(0));
  floorBox(
    g,
    0.55,
    0.95,
    0.22,
    0.65,
    0.07,
    0.14,
    color(60, 42, 30),
    color(52, 36, 26),
    color(44, 30, 22),
  );
  // headboard
  let a = raise(floorPoint(0.55, 0.65), 0.65, 0.07);
  let b = raise(floorPoint(0.95, 0.65), 0.65, 0.07);
  let c = raise(floorPoint(0.95, 0.65), 0.65, 0.34);
  let d = raise(floorPoint(0.55, 0.65), 0.65, 0.34);
  g.fill(58, 40, 30);
  g.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
  floorBox(
    g,
    0.56,
    0.94,
    0.23,
    0.64,
    0.14,
    0.2,
    color(150, 144, 132),
    color(120, 114, 104),
    color(105, 100, 90),
  );
  // pillow
  let pl = raise(floorPoint(0.75, 0.6), 0.6, 0.22);
  g.fill(175, 170, 160);
  g.ellipse(pl.x, pl.y, 60, 16);
  // blanket hanging down over the gap a little
  let f1 = raise(floorPoint(0.55, 0.22), 0.22, 0.14);
  let f2 = raise(floorPoint(0.95, 0.22), 0.22, 0.14);
  g.fill(120, 114, 104);
  g.quad(f1.x, f1.y, f2.x, f2.y, f2.x, f2.y + 14, f1.x, f1.y + 8);
}

//////////////////// KITCHEN //////////////////////
// a creature stands in the empty corner

function paintKitchen(g) {
  paintBox(
    g,
    color(52, 48, 38),
    color(44, 40, 32),
    color(40, 38, 34),
    color(22, 21, 18),
    color(46, 42, 34),
  );

  // checkered floor tiles
  g.noStroke();
  let steps = 10;
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < steps; j++) {
      let u1 = i / 8,
        u2 = (i + 1) / 8;
      let t1 = j / steps,
        t2 = (j + 1) / steps;
      let a = floorPoint(u1, t1),
        b = floorPoint(u2, t1);
      let c = floorPoint(u2, t2),
        d = floorPoint(u1, t2);
      g.fill((i + j) % 2 === 0 ? color(58, 55, 50) : color(26, 24, 22));
      g.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y);
    }
  }

  // counters along the left wall
  floorBox(
    g,
    0,
    0.2,
    0.05,
    0.8,
    0,
    0.3,
    color(85, 80, 72),
    color(60, 50, 40),
    color(66, 55, 44),
  );
  // cabinet door lines
  g.stroke(35, 28, 22);
  g.strokeWeight(2);
  for (let t = 0.1; t < 0.8; t += 0.12) {
    let a = raise(floorPoint(0.2, t), t, 0.02);
    let b = raise(floorPoint(0.2, t), t, 0.27);
    g.line(a.x, a.y, b.x, b.y);
  }
  // upper cabinets
  g.noStroke();
  wallRect(g, "left", 0.05, 0.8, 0.55, 0.85, color(62, 52, 42));
  g.stroke(35, 28, 22);
  for (let t = 0.05; t < 0.8; t += 0.15) {
    let a = wallPoint("left", t, 0.55),
      b = wallPoint("left", t, 0.85);
    g.line(a.x, a.y, b.x, b.y);
  }
  // a hook for the key
  let hook = wallPoint("left", 0.3, 0.53);
  g.stroke(120, 110, 90);
  g.line(hook.x, hook.y - 6, hook.x, hook.y);

  // fridge on the right
  floorBox(
    g,
    0.8,
    1,
    0.12,
    0.32,
    0,
    0.82,
    color(90, 92, 88),
    color(150, 152, 145),
    color(120, 122, 116),
  );
  let h1 = raise(floorPoint(0.83, 0.12), 0.12, 0.45);
  let h2 = raise(floorPoint(0.83, 0.12), 0.12, 0.65);
  g.stroke(60);
  g.strokeWeight(4);
  g.line(h1.x, h1.y, h2.x, h2.y);

  // small dirty window on the back wall
  g.noStroke();
  g.fill(20, 24, 30);
  g.rect(262, 170, 50, 40);

  // the empty corner: something has scratched the wall
  g.stroke(20, 16, 12);
  g.strokeWeight(1.5);
  for (let i = 0; i < 6; i++) {
    let x = BackWall.x2 - 30 + i * 4;
    g.line(x, BackWall.y2 - 90, x + 6, BackWall.y2 - 40);
  }

  // hanging lamp (off)
  g.stroke(20);
  g.strokeWeight(2);
  g.line(320, 0, 320, 70);
  g.noStroke();
  g.fill(40, 38, 32);
  g.triangle(300, 90, 340, 90, 320, 68);

  stains(g, 12);
}

//////////////////// BATHROOM //////////////////////
// you stand at the mirror. you see yourself… and something behind you

function paintBathroom(g) {
  g.background(48, 54, 52);
  // tiles
  g.stroke(36, 40, 38);
  g.strokeWeight(2);
  for (let x = 0; x < width; x += 32) g.line(x, 0, x, 330);
  for (let y = 0; y < 330; y += 32) g.line(0, y, width, y);
  // floor
  g.noStroke();
  g.fill(30, 32, 31);
  g.rect(0, 330, width, 150);
  g.stroke(20);
  for (let i = -6; i <= 6; i++) {
    g.line(320 + i * 40, 330, 320 + i * 120, 480);
  }
  // mirror frame (the glass is drawn live, it shows the webcam)
  g.noStroke();
  g.fill(25, 22, 20);
  g.rect(160, 30, 320, 245, 6);
  // sink counter
  g.fill(150, 150, 142);
  g.rect(130, 290, 380, 26, 4);
  g.fill(70, 70, 66);
  g.rect(150, 316, 340, 90);
  g.fill(110, 112, 106);
  g.ellipse(320, 300, 150, 22);
  g.fill(40, 42, 40);
  g.ellipse(320, 302, 120, 14);
  // tap
  g.fill(120);
  g.rect(314, 276, 12, 16, 3);
  // shelf on the right (the key is here)
  g.fill(70, 55, 40);
  g.rect(520, 238, 100, 10);
  g.fill(140, 130, 110);
  g.rect(590, 205, 14, 33, 3);
  // towel
  g.fill(110, 100, 90);
  g.rect(30, 140, 70, 140, 4);
  g.stroke(80, 72, 64);
  g.strokeWeight(2);
  g.line(30, 150, 100, 150);
  // grime
  g.noStroke();
  for (let i = 0; i < 20; i++) {
    g.fill(20, 24, 20, 60);
    g.ellipse(random(width), random(0, 330), random(10, 40), random(20, 60));
  }
}

//////////////////// LIVING ROOM //////////////////////
// the creature crawls on the ceiling

function paintLivingRoom(g) {
  paintBox(
    g,
    color(58, 30, 30),
    color(48, 25, 26),
    color(44, 34, 30),
    color(36, 32, 30),
    color(52, 28, 28),
  );

  // cracks and stains on the ceiling (that's where it lives)
  g.stroke(18, 15, 14);
  g.strokeWeight(1.5);
  for (let i = 0; i < 8; i++) {
    let x = random(80, 560),
      y = random(10, 130);
    g.noFill();
    g.beginShape();
    for (let k = 0; k < 6; k++) {
      g.vertex(x, y);
      x += random(-25, 25);
      y += random(-10, 10);
    }
    g.endShape();
  }
  g.noStroke();
  for (let i = 0; i < 6; i++) {
    g.fill(15, 12, 10, 70);
    g.ellipse(
      random(100, 540),
      random(20, 130),
      random(30, 80),
      random(15, 40),
    );
  }

  // wallpaper stripes
  g.stroke(40, 20, 22);
  g.strokeWeight(2);
  for (let t = 0.05; t < 1; t += 0.07) {
    for (let side of ["left", "right"]) {
      let a = wallPoint(side, t, 0),
        b = wallPoint(side, t, 1);
      g.line(a.x, a.y, b.x, b.y);
    }
  }

  // rug
  g.noStroke();
  let r1 = floorPoint(0.25, 0.3),
    r2 = floorPoint(0.75, 0.3);
  let r3 = floorPoint(0.75, 0.7),
    r4 = floorPoint(0.25, 0.7);
  g.fill(70, 28, 26);
  g.quad(r1.x, r1.y, r2.x, r2.y, r3.x, r3.y, r4.x, r4.y);

  // sofa against the back wall
  let sofaTop = color(56, 66, 48),
    sofaFront = color(44, 52, 38),
    sofaSide = color(38, 45, 33);
  floorBox(g, 0.25, 0.75, 0.8, 0.96, 0, 0.16, sofaTop, sofaFront, sofaSide);
  let a = raise(floorPoint(0.25, 0.96), 0.96, 0.16),
    b = raise(floorPoint(0.75, 0.96), 0.96, 0.16);
  g.fill(48, 57, 41);
  g.quad(a.x, a.y, b.x, b.y, b.x, b.y - 26, a.x, a.y - 26);
  floorBox(g, 0.25, 0.3, 0.8, 0.96, 0, 0.24, sofaTop, sofaFront, sofaSide);
  floorBox(g, 0.7, 0.75, 0.8, 0.96, 0, 0.24, sofaTop, sofaFront, sofaSide);

  // old TV on a little table (the key is on top of the TV)
  floorBox(
    g,
    0.04,
    0.2,
    0.3,
    0.45,
    0,
    0.16,
    color(60, 42, 30),
    color(48, 34, 24),
    color(42, 29, 21),
  );
  floorBox(
    g,
    0.06,
    0.18,
    0.33,
    0.42,
    0.16,
    0.37,
    color(40, 38, 36),
    color(32, 30, 28),
    color(28, 27, 25),
  );
  let s1 = raise(floorPoint(0.18, 0.34), 0.34, 0.19),
    s2 = raise(floorPoint(0.18, 0.41), 0.41, 0.19);
  let s3 = raise(floorPoint(0.18, 0.41), 0.41, 0.34),
    s4 = raise(floorPoint(0.18, 0.34), 0.34, 0.34);
  g.fill(70, 80, 85);
  g.quad(s1.x, s1.y, s2.x, s2.y, s3.x, s3.y, s4.x, s4.y);

  // picture frames on the right wall
  wallRect(g, "right", 0.3, 0.45, 0.5, 0.75, color(70, 55, 35));
  wallRect(g, "right", 0.32, 0.43, 0.53, 0.72, color(30, 28, 26));

  // chandelier
  g.stroke(30);
  g.strokeWeight(2);
  g.line(320, 0, 320, 40);
  g.noFill();
  g.arc(320, 40, 60, 20, 0, PI);
}

//////////////////// BASEMENT //////////////////////
// you stand on the stairs looking down. something crawls up.

function paintBasement(g) {
  g.background(0);
  let fx1 = 270,
    fx2 = 370,
    fy1 = 250,
    fy2 = 330; // the dark opening at the bottom

  g.noStroke();
  g.fill(40, 30, 26);
  g.quad(0, 0, fx1, fy1, fx1, fy2, 0, height); // left wall
  g.fill(34, 26, 22);
  g.quad(width, 0, fx2, fy1, fx2, fy2, width, height); // right wall
  g.fill(16, 14, 13);
  g.quad(0, 0, width, 0, fx2, fy1, fx1, fy1); // ceiling
  g.fill(2);
  g.rect(fx1, fy1, fx2 - fx1, fy2 - fy1); // the basement, pitch black

  // bricks on the walls
  g.stroke(22, 16, 13);
  g.strokeWeight(1.5);
  for (let i = 1; i < 14; i++) {
    let h = i / 14;
    g.line(0, lerp(0, height, h), fx1, lerp(fy1, fy2, h));
    g.line(width, lerp(0, height, h), fx2, lerp(fy1, fy2, h));
  }
  for (let t = 0.1; t < 1; t += 0.15) {
    let xl = lerp(0, fx1, t),
      xr = lerp(width, fx2, t);
    g.line(xl, lerp(0, fy1, t), xl, lerp(height, fy2, t));
    g.line(xr, lerp(0, fy1, t), xr, lerp(height, fy2, t));
  }

  // the stairs going down
  let n = 9;
  for (let i = n - 1; i >= 0; i--) {
    let a = pow(i / n, 0.7),
      b = pow((i + 1) / n, 0.7);
    // i = 0 is the bottom (far), i = n-1 is right under your feet
    let yFar = lerp(fy2, height, a),
      yNear = lerp(fy2, height, b);
    let wFar = lerp(fx2 - fx1, width * 0.9, a),
      wNear = lerp(fx2 - fx1, width * 0.9, b);
    let shade = lerp(12, 70, a);
    g.noStroke();
    g.fill(shade, shade * 0.75, shade * 0.6);
    g.quad(
      320 - wFar / 2,
      yFar,
      320 + wFar / 2,
      yFar,
      320 + wNear / 2,
      yNear,
      320 - wNear / 2,
      yNear,
    );
    g.stroke(shade * 0.3);
    g.strokeWeight(2);
    g.line(320 - wFar / 2, yFar, 320 + wFar / 2, yFar);
  }

  // pipes along the ceiling
  g.stroke(50, 45, 40);
  g.strokeWeight(6);
  g.line(40, 20, fx1 + 10, fy1 - 8);
  g.strokeWeight(4);
  g.line(600, 30, fx2 - 10, fy1 - 6);

  // a nail for the key
  g.stroke(120);
  g.strokeWeight(3);
  g.point(88, 202);

  // dead light bulb
  g.stroke(30);
  g.strokeWeight(1.5);
  g.line(320, 0, 320, 120);
  g.noStroke();
  g.fill(60, 58, 50);
  g.ellipse(320, 128, 14, 18);
}
