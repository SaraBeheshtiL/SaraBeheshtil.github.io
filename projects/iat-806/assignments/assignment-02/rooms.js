//////////////////// THE ROOMS //////////////////////
// Six rooms, all made from ONE Room class.
// Every room has its own draw function: drawHallway(), drawBedroom() …
//I 'm drawing the rooms in separate canvas (hiddenCanvas) which I call hCanvas in every draw function.
// THis way, We draw all the rooms once, and the game shows that picture every frame, instead of drawing them again.
// it reduces the lag and time of drawing the rooms.

//////////////////// Perspective/////////////////////
// I decided to use perspective to draw the rooms, so I created some functions to make it easier to draw the walls, floor, ceiling, and furniture in perspective.
// Every room is a box seen from one end. Any point in it is described
// with numbers from 0 to 1:
//   t = depth   (0 = near, 1 = the back wall)
//   u = width  (0 = left wall, 1 = right wall)
//   h = height  (0 = floor, 1 = ceiling)

// the back wall: a rectangle in the middle of the screen for the hallway.
let BackWall = { x1: 245, y1: 150, x2: 395, y2: 265 };

// When I want to find a point on the left or right wall
function wallPoint(side, t, h) {
  /// side is left or right // t means the depth of the room between 0 to 1 (0 means close to viewer and 1 means the back wall
  // h means how height on the wall between 0 to 1, zero means the floor and one means the ceiling.
  let x;
  if (side === "left") {
    x = lerp(0, BackWall.x1, t); // lerp gives a number between two numbers at a specific increment which is a number betwee (0,1). lerp(start, stop, amt):
    // means a point at this location: start + (stop - start) * amt
  } else {
    x = lerp(width, BackWall.x2, t); // this gives the x coordinate of the point on the right wall at depth t
  }
  // now we need to find the y coordinate of the point on the wall at depth t and height h
  let floorY = lerp(height, BackWall.y2, t); // this gives the height of the floor at the depth of t
  let ceilingY = lerp(0, BackWall.y1, t); // this gives the height of the ceiling at the depth of t
  return {
    x: x,
    y: lerp(floorY, ceilingY, h),
  };
}

// when I want to finda point on the floor
function floorPoint(u, t) {
  // u = across the floor (0 = left wall, 1 = right wall), t = depth (0 = near , 1 = back wall)
  let left = wallPoint("left", t, 0); // this gives the point on the left wall at depth t and height 0 (floor)
  let right = wallPoint("right", t, 0); // this gives the point on the right wall at depth t and height 0 (floor)
  return { x: lerp(left.x, right.x, u), y: left.y };
}

// a point in the middle of the room, from the floor
// (u across, t depth, h height): used for drawing the furniture and the creature
function roomPoint(u, t, h) {
  let p = floorPoint(u, t); // this gives the point on the floor at depth t and across u
  let wallHeight = lerp(height, BackWall.y2, t) - lerp(0, BackWall.y1, t); // this gives the height of the wall at depth t
  return { x: p.x, y: p.y - wallHeight * h }; // this gives the point in the room at depth t, across u, and height h
}

//////////////////// DRAWING HELPERS //////////////////////

// whenever I want to draw a 4-cornered shape from 4 points
function drawQuad(hCanvas, a, b, c, d) {
  hCanvas.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y); // quad() draws a quadrilateral on the canvas hCanvas using the coordinates of points a, b, c, and d.
}

// drwaing the empty room with ceiling, floor, two walls, back wall
function emptyRoom(hCanvas, wallColor, floorColor, ceilingColor) {
  let leftNearFloor = wallPoint("left", 0, 0);
  let leftNearTop = wallPoint("left", 0, 1);
  let leftFarFloor = wallPoint("left", 1, 0);
  let leftFarTop = wallPoint("left", 1, 1);
  let rightNearFloor = wallPoint("right", 0, 0);
  let rightNearTop = wallPoint("right", 0, 1);
  let rightFarFloor = wallPoint("right", 1, 0);
  let rightFarTop = wallPoint("right", 1, 1);

  hCanvas.background(0);
  hCanvas.noStroke();
  hCanvas.fill(ceilingColor); // drawing the ceiling
  drawQuad(hCanvas, leftNearTop, rightNearTop, rightFarTop, leftFarTop);

  hCanvas.fill(floorColor); // drawing the floor
  drawQuad(hCanvas, leftNearFloor, rightNearFloor, rightFarFloor, leftFarFloor);

  hCanvas.fill(wallColor); // drawing the left wall
  drawQuad(hCanvas, leftNearTop, leftFarTop, leftFarFloor, leftNearFloor);

  hCanvas.fill(lerpColor(wallColor, color(0), 0.2)); // right wall a bit darker
  drawQuad(hCanvas, rightNearTop, rightFarTop, rightFarFloor, rightNearFloor);

  hCanvas.fill(lerpColor(wallColor, color(0), 0.1)); // back wall
  hCanvas.rect(
    // back wall is a rectangle,
    BackWall.x1,
    BackWall.y1,
    BackWall.x2 - BackWall.x1,
    BackWall.y2 - BackWall.y1,
  );

  // dark lines on the 4 corners of the room
  hCanvas.stroke(10, 8, 8);
  hCanvas.strokeWeight(3);
  hCanvas.line(0, 0, BackWall.x1, BackWall.y1);
  hCanvas.line(width, 0, BackWall.x2, BackWall.y1);
  hCanvas.line(0, height, BackWall.x1, BackWall.y2);
  hCanvas.line(width, height, BackWall.x2, BackWall.y2);
}

// floorboards: lines running toward the back wall
function drawFloorboards(hCanvas, c) {
  hCanvas.stroke(c);
  hCanvas.strokeWeight(1.5);
  for (let u = 0; u <= 1; u += 0.1) {
    let near = floorPoint(u, 0);
    let far = floorPoint(u, 1);
    hCanvas.line(near.x, near.y, far.x, far.y);
  }
}

// a box standing on the floor (bed, table, fridge…), seen from the front
// u1–u2 = left/right edges, t1–t2 = near/far edges, h = how tall
// bottom = where it starts (0 = on the floor; higher = stacked on something)
function drawFurniture(
  hCanvas,
  u1,
  u2,
  t1,
  t2,
  h,
  topColor,
  frontColor,
  bottom = 0,
) {
  hCanvas.noStroke();
  // front face
  hCanvas.fill(frontColor);
  drawQuad(
    hCanvas,
    roomPoint(u1, t1, bottom),
    roomPoint(u2, t1, bottom),
    roomPoint(u2, t1, h),
    roomPoint(u1, t1, h),
  );
  // top
  hCanvas.fill(topColor);
  drawQuad(
    hCanvas,
    roomPoint(u1, t1, h),
    roomPoint(u2, t1, h),
    roomPoint(u2, t2, h),
    roomPoint(u1, t2, h),
  );
}

//////////////////// DOOR CLASS //////////////////////

class Door {
  constructor(side, t1, t2, ajar) {
    this.side = side; // "left", "right" or "back"
    this.t1 = t1; // depth where the door starts
    this.t2 = t2; // depth where the door ends
    this.ajar = ajar; // half open?
  }

  // the four corners: top-left, top-right, bottom-right, bottom-left
  corners() {
    if (this.side === "back") {
      return [
        { x: 299, y: 179 },
        { x: 341, y: 179 },
        { x: 341, y: BackWall.y2 },
        { x: 299, y: BackWall.y2 },
      ];
    }
    return [
      wallPoint(this.side, this.t1, 0.72),
      wallPoint(this.side, this.t2, 0.72),
      wallPoint(this.side, this.t2, 0),
      wallPoint(this.side, this.t1, 0),
    ];
  }

  display(hCanvas) {
    let c = this.corners();

    // dark doorway with a wooden frame
    hCanvas.stroke(75, 53, 37);
    hCanvas.strokeWeight(4);
    hCanvas.fill(5, 4, 6);
    drawQuad(hCanvas, c[0], c[1], c[2], c[3]);

    // half-open door panel
    if (this.ajar) {
      let openness; // how many pixels the door sticks out
      if (this.side === "left") {
        openness = 18;
      } else if (this.side === "right") {
        openness = -18;
      } else {
        openness = 10;
      }
      hCanvas.noStroke();
      hCanvas.fill(58, 39, 28);
      drawQuad(
        hCanvas,
        c[0],
        { x: c[0].x + openness, y: c[0].y + 6 },
        { x: c[3].x + openness, y: c[3].y - 2 },
        c[3],
      );
    }
  }
}

//////////////////// ROOM CLASS //////////////////////

let rooms = [];

class Room {
  constructor(roomData) {
    this.name = roomData.name;
    this.sign = roomData.sign; // the hand sign that brings you here
    this.signText = roomData.signText;
    this.creator = roomData.creator; // the function that draws this room
    this.isHallway = roomData.isHallway || false; // the first frame
    this.appearance = roomData.appearance; // where the creature starts {x, y, s, rot}
    this.end = roomData.end; // where the creature ends = it got you
    this.ghostFile = roomData.ghostFile;
    this.lightRadius = roomData.lightRadius || 125; // how far the headlamp reaches
    this.mirror = roomData.mirror; // only the bathroom has one
    this.escaped = false;

    // the room never changes, so draw it once on a hidden canvas
    this.hCanvas = createGraphics(width, height);
    this.creator(this.hCanvas);
  }

  display() {
    image(this.hCanvas, 0, 0);
    if (this.mirror) {
      this.drawMirror();
    }
  }

  // bathroom: the mirror shows your real webcam
  drawMirror() {
    let m = this.mirror;
    push();
    tint(200, 210, 215);
    image(video, m.x, m.y, m.w, m.h);
    pop();
    noStroke();
    fill(170, 180, 180, 45); // steam / dirty glass
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

  // make all six rooms with a loop (for loop for rooms array
  for (let d of roomData) {
    rooms.push(new Room(d));
  }
}

/// function below gives the room corresponds to the hand sign I defined
function roomForSign(sign) {
  for (let r of rooms) {
    if (r.sign === sign) return r;
  }
}

////////////////////////////////////////////////////
//////////////////// HALLWAY //////////////////////
/////////////////////////////////////////////////////////////
function drawHallway(hCanvas) {
  drawBox(hCanvas, color(51, 44, 40), color(43, 29, 23), color(20, 18, 22));
  drawFloorboards(hCanvas, color(23, 16, 13));

  // the doors
  let doors = [
    new Door("left", 0.18, 0.36, true),
    new Door("left", 0.5, 0.63, false),
    new Door("left", 0.74, 0.84, true),
    new Door("right", 0.3, 0.46, false),
    new Door("right", 0.62, 0.74, true),
    new Door("back", 0, 0, false),
  ];
  for (let door of doors) {
    door.display(hCanvas);
  }

  function drawStairs(hCanvas) {
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
    hCanvas.noStroke();
    hCanvas.fill(2, 2, 4);
    hCanvas.quad(
      centerX - backWidth / 2,
      backY,
      centerX + backWidth / 2,
      backY,
      centerX + frontWidth / 2,
      frontY,
      centerX - frontWidth / 2,
      frontY,
    );

    // // stairs down to the basement: a dark hole with steps
    // hCanvas.noStroke();
    // hCanvas.fill(2, 2, 4);
    // hCanvas.quad(278, 312, 362, 312, 496, 466, 144, 466);
    // for (let i = 1; i <= 5; i++) {
    //   let t = i / 5; // 0 = far step, 1 = nearest step
    //   let y = lerp(330, 466, t * t);
    //   let halfWidth = lerp(36, 160, t * t);
    //   let b = lerp(15, 85, t); // nearer steps are brighter
    //   hCanvas.stroke(b, b * 0.68, b * 0.48);
    //   hCanvas.strokeWeight(lerp(2, 8, t));
    //   hCanvas.line(320 - halfWidth, y, 320 + halfWidth, y);
    // }
  }

  /////////////////////////////////////////////////////////
  //////////////////// BEDROOM ///////////////////////////
  ////////////////////////////////////////////////////////////////////
  // something hides under the bed

  function drawBedroom(hCanvas) {
    drawBox(hCanvas, color(44, 46, 56), color(42, 31, 25), color(18, 18, 24));
    drawFloorboards(hCanvas, color(26, 18, 14));

    // window with moonlight
    hCanvas.noStroke();
    hCanvas.fill(25, 38, 62);
    hCanvas.rect(288, 168, 64, 52);
    hCanvas.fill(200, 210, 255, 20);
    hCanvas.quad(288, 220, 352, 220, 420, 330, 300, 330);

    // nightstand
    drawFurniture(
      hCanvas,
      0.02,
      0.14,
      0.35,
      0.45,
      0.18,
      color(70, 50, 36),
      color(55, 38, 28),
    );

    // the bed: black gap underneath, frame, mattress, pillow
    drawFurniture(hCanvas, 0.55, 0.95, 0.22, 0.65, 0.07, color(0), color(0));
    drawFurniture(
      hCanvas,
      0.55,
      0.95,
      0.22,
      0.65,
      0.14,
      color(60, 42, 30),
      color(52, 36, 26),
      0.07,
    );
    drawFurniture(
      hCanvas,
      0.56,
      0.94,
      0.23,
      0.64,
      0.2,
      color(150, 144, 132),
      color(120, 114, 104),
      0.14,
    );
    let pillow = roomPoint(0.75, 0.6, 0.22);
    hCanvas.fill(175, 170, 160);
    hCanvas.ellipse(pillow.x, pillow.y, 60, 16);
  }

  //////////////////// KITCHEN //////////////////////
  // something stands in the empty corner

  function drawKitchen(hCanvas) {
    drawBox(hCanvas, color(52, 48, 38), color(40, 38, 34), color(22, 21, 18));
    drawFloorboards(hCanvas, color(26, 24, 22));

    // counter along the left wall
    drawFurniture(
      hCanvas,
      0,
      0.2,
      0.05,
      0.8,
      0.3,
      color(85, 80, 72),
      color(60, 50, 40),
    );

    // fridge on the right
    drawFurniture(
      hCanvas,
      0.8,
      1,
      0.12,
      0.32,
      0.82,
      color(90, 92, 88),
      color(150, 152, 145),
    );

    // small dirty window
    hCanvas.noStroke();
    hCanvas.fill(20, 24, 30);
    hCanvas.rect(262, 170, 50, 40);

    // scratches in the empty corner
    hCanvas.stroke(20, 16, 12);
    hCanvas.strokeWeight(1.5);
    for (let i = 0; i < 6; i++) {
      let x = BackWall.x2 - 30 + i * 4;
      hCanvas.line(x, BackWall.y2 - 90, x + 6, BackWall.y2 - 40);
    }

    // hanging lamp (off)
    hCanvas.stroke(20);
    hCanvas.strokeWeight(2);
    hCanvas.line(320, 0, 320, 70);
    hCanvas.noStroke();
    hCanvas.fill(40, 38, 32);
    hCanvas.triangle(300, 90, 340, 90, 320, 68);
  }

  /////////////////////////////////////////////////////
  //////////////////// BATHROOM //////////////////////
  // you stand at the mirror and see something behind you
  // (seen straight on, so no perspective needed)

  function drawBathroom(hCanvas) {
    hCanvas.background(48, 54, 52);

    // wall tiles
    hCanvas.stroke(36, 40, 38);
    hCanvas.strokeWeight(2);
    for (let x = 0; x < width; x += 32) hCanvas.line(x, 0, x, 330);
    for (let y = 0; y < 330; y += 32) hCanvas.line(0, y, width, y);

    // floor
    hCanvas.noStroke();
    hCanvas.fill(30, 32, 31);
    hCanvas.rect(0, 330, width, 150);

    // mirror frame (the glass shows the webcam, drawn live in drawMirror)
    hCanvas.fill(25, 22, 20);
    hCanvas.rect(160, 30, 320, 245, 6);

    // sink
    hCanvas.fill(150, 150, 142);
    hCanvas.rect(130, 290, 380, 26, 4);
    hCanvas.fill(70, 70, 66);
    hCanvas.rect(150, 316, 340, 90);
    hCanvas.fill(40, 42, 40);
    hCanvas.ellipse(320, 302, 120, 14);

    // towel
    hCanvas.fill(110, 100, 90);
    hCanvas.rect(30, 140, 70, 140, 4);
  }

  //////////////////// LIVING ROOM //////////////////////
  // something crawls on the ceiling

  function drawLivingRoom(hCanvas) {
    drawBox(hCanvas, color(58, 30, 30), color(44, 34, 30), color(36, 32, 30));

    // cracks on the ceiling (that's where it lives)
    hCanvas.stroke(18, 15, 14);
    hCanvas.strokeWeight(1.5);
    hCanvas.noFill();
    for (let i = 0; i < 8; i++) {
      let x = random(80, 560);
      let y = random(10, 130);
      hCanvas.beginShape();
      for (let k = 0; k < 6; k++) {
        hCanvas.vertex(x, y);
        x += random(-25, 25);
        y += random(-10, 10);
      }
      hCanvas.endShape();
    }

    // rug
    hCanvas.noStroke();
    hCanvas.fill(70, 28, 26);
    drawQuad(
      hCanvas,
      floorPoint(0.25, 0.3),
      floorPoint(0.75, 0.3),
      floorPoint(0.75, 0.7),
      floorPoint(0.25, 0.7),
    );

    // sofa against the back wall
    drawFurniture(
      hCanvas,
      0.25,
      0.75,
      0.8,
      0.96,
      0.16,
      color(56, 66, 48),
      color(44, 52, 38),
    );

    // old TV on a small table
    drawFurniture(
      hCanvas,
      0.04,
      0.2,
      0.3,
      0.45,
      0.16,
      color(60, 42, 30),
      color(48, 34, 24),
    );
    drawFurniture(
      hCanvas,
      0.06,
      0.18,
      0.33,
      0.42,
      0.37,
      color(40, 38, 36),
      color(70, 80, 85),
      0.16,
    );

    // chandelier
    hCanvas.stroke(30);
    hCanvas.strokeWeight(2);
    hCanvas.line(320, 0, 320, 40);
    hCanvas.noFill();
    hCanvas.arc(320, 40, 60, 20, 0, PI);
  }

  /////////////////////////////////////////////////////////////////
  //////////////////// BASEMENT //////////////////////
  /////////////////////////////////////////////////////////////
  // you stand on the stairs looking down. something crawls up.
  // (its own shape: a stairwell, not a box)

  function drawBasement(hCanvas) {
    hCanvas.background(0);
    // the dark opening at the bottom of the stairs
    let x1 = 270;
    let x2 = 370;
    let y1 = 250;
    let y2 = 330;

    hCanvas.noStroke();
    hCanvas.fill(40, 30, 26);
    hCanvas.quad(0, 0, x1, y1, x1, y2, 0, height); // left wall
    hCanvas.fill(34, 26, 22);
    hCanvas.quad(width, 0, x2, y1, x2, y2, width, height); // right wall
    hCanvas.fill(16, 14, 13);
    hCanvas.quad(0, 0, width, 0, x2, y1, x1, y1); // ceiling
    hCanvas.fill(2);
    hCanvas.rect(x1, y1, x2 - x1, y2 - y1); // the basement, pitch black

    // the stairs going down (far ones darker)
    for (let i = 0; i < 9; i++) {
      let near = pow((i + 1) / 9, 0.7);
      let far = pow(i / 9, 0.7);
      let yFar = lerp(y2, height, far);
      let yNear = lerp(y2, height, near);
      let wFar = lerp(x2 - x1, width * 0.9, far);
      let wNear = lerp(x2 - x1, width * 0.9, near);
      let shade = lerp(12, 70, far);
      hCanvas.noStroke();
      hCanvas.fill(shade, shade * 0.75, shade * 0.6);
      hCanvas.quad(
        320 - wFar / 2,
        yFar,
        320 + wFar / 2,
        yFar,
        320 + wNear / 2,
        yNear,
        320 - wNear / 2,
        yNear,
      );
      hCanvas.stroke(shade * 0.3);
      hCanvas.strokeWeight(2);
      hCanvas.line(320 - wFar / 2, yFar, 320 + wFar / 2, yFar);
    }

    // dead light bulb
    hCanvas.stroke(30);
    hCanvas.strokeWeight(1.5);
    hCanvas.line(320, 0, 320, 120);
    hCanvas.noStroke();
    hCanvas.fill(60, 58, 50);
    hCanvas.ellipse(320, 128, 14, 18);
  }
}
