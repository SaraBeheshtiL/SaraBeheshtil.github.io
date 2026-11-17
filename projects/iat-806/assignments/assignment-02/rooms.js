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
let BackWall = { x1: 240, y1: 150, x2: 400, y2: 265 };

// let currentRoom = 0;

// function setup() {
//   createCanvas(640, 480);
//   setupRooms();
// }

// function draw() {
//   background(0);
//   rooms[currentRoom].display();
// }

// function keyPressed() {
//   if (key >= "1" && key <= "6") {
//     currentRoom = Number(key) - 1;
//   }
// }

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

// Height of the room at a given depth (0 = near, 1 = far).
function wallHeightAt(t) {
  return lerp(height, BackWall.y2, t) - lerp(0, BackWall.y1, t);
}
// a point in the middle of the room, from the floor
// (u across, t depth, h height): used for drawing the furniture and the creature
function roomPoint(u, t, h) {
  let p = floorPoint(u, t); // this gives the point on the floor at depth t and across u
  let wallHeight = wallHeightAt(t); // this gives the height of the wall at depth t
  return { x: p.x, y: p.y - wallHeight * h }; // this gives the point in the room at depth t, across u, and height h
}

///////////////////////////////////////////////////////////
//////////////////// Drawing helpers //////////////////////
///////////////////////////////////////////////////////////

// whenever I want to draw a 4-cornered shape from 4 points
function drawQuad(hCanvas, a, b, c, d) {
  hCanvas.quad(a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y); // quad() draws a quadrilateral on the hCanvas(hiddenCanvas) using the coordinates of points a, b, c, and d.
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

//lines running toward the back wall to create the floorboards
function drawFloorboards(hCanvas, c) {
  //hCanvas is thee hidden canvas (p5.Graphics) where I draw the room. c is the color of the floorboard lines.
  hCanvas.stroke(c);
  hCanvas.strokeWeight(1.5);
  for (let u = 0; u <= 1; u = u + 0.1) {
    // this is th eloop which help me to draw the lines of floorboards by defining different points on the floorpoint closest and farthest sides.// the points move 10% across the floor
    let near = floorPoint(u, 0);
    let far = floorPoint(u, 1);
    hCanvas.line(near.x, near.y, far.x, far.y);
  }
}

// a box standing on the floor (bed, table, fridge…), seen from the front
// u1–u2 are left/right edges, t1–t2 are near/far edges, h is how tall
// bottom is where it starts (0 = on the floor)
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
  // front side
  hCanvas.fill(frontColor);
  drawQuad(
    hCanvas,
    roomPoint(u1, t1, bottom),
    roomPoint(u2, t1, bottom),
    roomPoint(u2, t1, h),
    roomPoint(u1, t1, h),
  );
  // top side
  hCanvas.fill(topColor);
  drawQuad(
    hCanvas,
    roomPoint(u1, t1, h),
    roomPoint(u2, t1, h),
    roomPoint(u2, t2, h),
    roomPoint(u1, t2, h),
  );
}

///////////////////////////////////////////////////////
////////////////////Class Door //////////////////////
///////////////////////////////////////////////////////
//I m going to use it especifically for the Hallway
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
        { x: 300, y: 180 },
        { x: 345, y: 180 },
        { x: 345, y: BackWall.y2 },
        { x: 300, y: BackWall.y2 },
      ];
    }
    //function wallPoint(side, t, h) {
    /// side is left or right // t means the depth of the room between 0 to 1 (0 means close to viewer and 1 means the back wall
    // h means how height on the wall, or height of the door between 0 to 1, zero means the floor and one means the ceiling. // below we are having thge four corners of the doors on each side of the room
    return [
      wallPoint(this.side, this.t1, 0.7),
      wallPoint(this.side, this.t2, 0.7),
      wallPoint(this.side, this.t2, 0),
      wallPoint(this.side, this.t1, 0),
    ];
  }

  display(hCanvas) {
    let c = this.corners(); // c is an array containg the four corners of this.door

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
      hCanvas.fill(58, 39, 28); // the light brown color
      drawQuad(
        hCanvas,
        c[0],
        { x: c[0].x + openness, y: c[0].y + 10 },
        { x: c[3].x + openness, y: c[3].y - 30 },
        c[3],
      );
    }
  }
}

//////////////////////////////////////////////////////
//////////////////// Class Room //////////////////////
///////////////////////////////////////////////////////
// I will use this class to define my six rooms (hallway, livingroom, bedroom, bathroom, kitchen and basement)
let rooms = []; // rooms is an array of six rooms
// This part I asked GPT to help me how can I define room datas to switch between them.
//roomData is a parameter containing all the information needed to create a specific room
class Room {
  constructor(roomData) {
    this.creatureName = roomData.creatureName; // key for the eight creature PNGs
    this.name = roomData.name; // reads th ename of the room
    this.sign = roomData.sign; // the hand sign that brings the player here
    this.signText = roomData.signText; // this will be the text shows th e gesture
    this.creator = roomData.creator; // the function that draws this room (storing a function inside a property.)
    this.isHallway = roomData.isHallway; // the first frame. I'm going to identify if this room is hallway
    ////////// properties which defines the creature associated with each room /////////////////////////////
    this.appearance = roomData.appearance; // where the creature starts {x, y, s, rot}
    this.end = roomData.end; // where the creature ends or it got you
    this.ghostFile = roomData.ghostFile;

    ///// this is flashlight effect, the radius of the flashlight effect for that room.
    this.lightRadius = roomData.lightRadius; // how far the headlamp reaches
    this.mirror = roomData.mirror; // only the bathroom has one
    this.escaped = false; // it is gonna help for the logic of the game

    // the room never changes, so draw it once on a hidden canvas
    this.hCanvas = createGraphics(width, height); // in p5.js, createGraphics() creates an extra drawing surface.
    this.creator(this.hCanvas); // this runs the room's drawing function on a new canvas(hCanvas).
  }

  //now we want to copy the hiddent canvas onto the main canvas by display() method
  display() {
    image(this.hCanvas, 0, 0);
    if (this.mirror) {
      // I m employing this function here because I need to connect video to my mirror in future and I want to define it as a method in my room class.
      this.drawMirror();
    }
  }

  // in bathroom I have a mirror which shows my real webcam
  drawMirror() {
    let m = this.mirror;
    push();
    tint(200, 210, 215); // this applies a bluish tint to the webcam image, making it feel colder and natural
    image(video, m.x, m.y, m.w, m.h); //the webcam video will appear inside the mirror rectangle.
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
      creatureName: "hallway",
      sign: "bothClosed", // the hand signe which brings you here
      signText: "Both fists", // the text that appear on the screen for the gesture
      creator: drawHallway,
      isHallway: true,
      appearance: { x: 320, y: 226, s: 0.52 }, // where the creature should appere, the back door
      end: { x: width * 0.5, y: height * 0.6, s: 2.4 },
      ghostFile: "ghost6.png", // the images of the creature
      lightRadius: 125, // the size of the lamp
    },
    {
      name: "Bedroom",
      creatureName: "bedroom",
      sign: "RightOpen",
      signText: "right hand OPEN",
      creator: drawBedroom,
      appearance: {
        x: floorPoint(0.75, 0.22).x,
        y: floorPoint(0.75, 0.22).y - wallHeightAt(0.22) * 0.04,
        s: 0.28,
      },
      end: { x: width * 0.55, y: height * 0.68, s: 2.4 },
      ghostFile: "ghost1.png",
      lightRadius: 125,
    },
    {
      name: "Kitchen",
      creatureName: "kitchen",
      sign: "RightClosed",
      signText: "right hand FIST",
      creator: drawKitchen,
      appearance: { x: BackWall.x2 - 14, y: BackWall.y2 - 38, s: 0.32 },
      end: { x: width * 0.52, y: height * 0.64, s: 2.4 },
      ghostFile: "ghost2.png",
      lightRadius: 125,
    },
    {
      name: "Bathroom",
      creatureName: "bathroom",
      sign: "LeftOpen",
      signText: "left hand OPEN",
      creator: drawBathroom,
      mirror: { x: 170, y: 40, w: 300, h: 225 },
      appearance: { x: 170 + 300 * 0.78, y: 40 + 225 * 0.38, s: 0.25 },
      end: { x: 170 + 300 * 0.27, y: 40 + 225 * 0.45, s: 1.15 },
      ghostFile: "ghost3.png",
      lightRadius: 125,
    },
    {
      name: "Living Room",
      creatureName: "livingroom",
      sign: "LeftClosed",
      signText: "left hand FIST",
      creator: drawLivingRoom,
      appearance: { x: 370, y: 138, s: 0.3, rot: PI }, // upside down, on the ceiling
      end: { x: 300, y: 125, s: 2.2, rot: PI },
      ghostFile: "ghost4.png",
      lightRadius: 125,
    },
    {
      name: "Basement",
      creatureName: "basement",
      sign: "bothOpen",
      signText: "BOTH hands OPEN",
      creator: drawBasement,
      appearance: { x: 320, y: 318, s: 0.3 },
      end: { x: 320, y: 392, s: 2.5 },
      ghostFile: "ghost5.png",
      lightRadius: 95, // it's darker down compared to the other rooms.
    },
  ];

  // make all six rooms with a loop ("for" loop for rooms array)
  for (let d of roomData) {
    rooms.push(new Room(d));
  }
}

/// function below gives the room corresponds to the hand sign I defined// sign is a property which represents a detected hand gesture, for example "RightOpen"
function roomForSign(sign) {
  for (let r of rooms) {
    if (r.sign === sign) return r; // === means strict equality
  }
}

////////////////////////////////////////////////////
//////////////////// Drawing Hallway //////////////////////
/////////////////////////////////////////////////////////////
function drawHallway(hCanvas) {
  emptyRoom(hCanvas, color(51, 44, 40), color(43, 29, 23), color(20, 18, 22));
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

  /////////// Stair case in the middle containg five connected stairs ////////
  let numSteps = 6;
  // Center of the room
  let centerX = width / 2;
  // Position of the staircase opening
  let backY = height * 0.7;
  let frontY = height * 0.9;
  // Width of staircase at far and near ends
  let backWidth = width * 0.2;
  let frontWidth = width * 0.4;

  ////////////////// floor opening//////////////////
  // the black hole in the floor
  hCanvas.noStroke();
  hCanvas.fill(0);
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

  /////// stairs//////
  // where the stairs start and end (a bit narrower than the hole,
  // so the side walls show between the hole edge and the steps)
  let farWallHeight = (frontY - backY) * 0.3; // the wall with the doorway
  let stairsTopY = backY + farWallHeight; // the deepest step, at the doorway
  let stairsTopWidth = backWidth * 0.5;
  let stairsBottomWidth = frontWidth * 0.8;
  ////////// far wall //////////
  hCanvas.fill(0);
  hCanvas.quad(
    centerX - backWidth / 2,
    backY,
    centerX + backWidth / 2,
    backY,
    centerX + stairsTopWidth / 2,
    stairsTopY,
    centerX - stairsTopWidth / 2,
    stairsTopY,
  );

  // the beam above the doorway
  hCanvas.stroke(60, 50, 40);
  hCanvas.strokeWeight(4);
  hCanvas.line(
    centerX - backWidth / 2,
    backY + 4,
    centerX + backWidth / 2,
    backY + 4,
  );

  ////////// left wall////////// I asked this from GPT tp ask how I can add a gradient to a shape
  let gradient = hCanvas.drawingContext.createLinearGradient(
    0,
    stairsTopY, // Gradient starts here
    0,
    frontY, // Gradient ends here
  );
  gradient.addColorStop(0, "rgb(2, 2, 2)"); // Dark
  gradient.addColorStop(1, "rgb(60, 60, 60)"); // Lighter
  hCanvas.noStroke();
  hCanvas.drawingContext.fillStyle = gradient;
  hCanvas.quad(
    centerX - backWidth / 2,
    backY,
    centerX - stairsTopWidth / 2,
    stairsTopY,
    centerX - stairsBottomWidth / 2,
    frontY,
    centerX - frontWidth / 2,
    frontY,
  );

  ////////// right wall//////////
  hCanvas.noStroke();
  hCanvas.quad(
    centerX + backWidth / 2,
    backY,
    centerX + stairsTopWidth / 2,
    stairsTopY,
    centerX + stairsBottomWidth / 2,
    frontY,
    centerX + frontWidth / 2,
    frontY,
  );

  ////////// the steps, from the deepest (far) to the nearest //////////
  for (let i = 0; i < numSteps; i++) {
    let t1 = i / numSteps; // far edge of this step
    let t2 = (i + 1) / numSteps; // near edge of this step

    // perspective: far steps are squeezed together
    let d1 = pow(t1, 1.5);
    let d2 = pow(t2, 1.5);
    let y1 = lerp(stairsTopY, frontY, d1);
    let y2 = lerp(stairsTopY, frontY, d2);
    let w1 = lerp(stairsTopWidth, stairsBottomWidth, d1);
    let w2 = lerp(stairsTopWidth, stairsBottomWidth, d2);

    // deeper steps are darker (they go down into the dark)
    let b = lerp(14, 100, t2);

    // where the flat top of the step ends and its dark front face begins
    let edgeT = lerp(d1, d2, 0.62);
    let edgeY = lerp(stairsTopY, frontY, edgeT);
    let edgeW = lerp(stairsTopWidth, stairsBottomWidth, edgeT);

    // the TREAD: the flat top you step on (lit)
    hCanvas.noStroke();
    hCanvas.fill(b, b * 0.9, b * 0.8);
    hCanvas.quad(
      centerX - w1 / 2,
      y1,
      centerX + w1 / 2,
      y1,
      centerX + edgeW / 2,
      edgeY,
      centerX - edgeW / 2,
      edgeY,
    );
  }
}

/////////////////////////////////////////////////////////
//////////////////// BEDROOM ///////////////////////////  ////////////////////////////////////////////////////////////////////
// something hides under the bed

function drawBedroom(hCanvas) {
  emptyRoom(hCanvas, color(30, 30, 30), color(20, 20, 20), color(20, 20, 20));
  drawFloorboards(hCanvas, color(0));

  // the window & the moon and moonlight
  hCanvas.stroke(0);
  hCanvas.fill(25, 30, 60);
  hCanvas.rect(288, 170, 70, 90);
  hCanvas.noStroke();
  hCanvas.fill(255);
  hCanvas.circle(298, 190, 20);
  hCanvas.fill(255, 20);
  hCanvas.circle(298, 190, 30);
  hCanvas.stroke(0);
  hCanvas.line(323, 170, 323, 260);
  hCanvas.line(288, 215, 358, 215);
  hCanvas.noStroke();
  hCanvas.fill(200, 210, 255, 20);
  hCanvas.quad(288, 190, 310, 190, 420, 330, 300, 330);

  /// darwng a dresser ///
  //main body of the dresser
  let u11 = 0.01;
  let u22 = 0.2;
  let t11 = 0.3;
  let t22 = 0.5;
  let hh = 0.3;
  drawFurniture(
    hCanvas,
    u11,
    u22,
    t11,
    t22,
    hh,
    color(85, 58, 40), // Top
    color(60, 38, 28), // Front
  );
  // Four corners of the side face
  let topLeftDresser = roomPoint(u22, t11, hh);
  let topRightDresser = roomPoint(u22, t22, hh);
  let bottomLeftDresser = roomPoint(u22, t11, 0);
  let bottomRightDresser = roomPoint(u22, t22, 0);

  // Draw the side face before adding drawers
  hCanvas.noStroke();
  hCanvas.fill(55, 35, 25);
  drawQuad(
    hCanvas,
    topLeftDresser,
    topRightDresser,
    bottomRightDresser,
    bottomLeftDresser,
  );

  /////// THREE DRAWERS ///////
  let numDrawers = 3;
  for (let i = 0; i < numDrawers; i = i + 1) {
    let topDresser = i / numDrawers;
    let bottomDresser = (i + 1) / numDrawers;
    // Leave a small margin around each drawer
    let marginX = 0.1;
    let marginY = 0.08;
    let top = lerp(topDresser, bottomDresser, marginY);
    let bottom = lerp(topDresser, bottomDresser, 1 - marginY);
    // Positions along the depth of the side face
    let nearT = lerp(t11, t22, marginX);
    let farT = lerp(t11, t22, 1 - marginX);

    // Draw each drawer using four perspective points
    let p1 = roomPoint(u22, nearT, lerp(hh, 0, top));
    let p2 = roomPoint(u22, farT, lerp(hh, 0, top));
    let p3 = roomPoint(u22, farT, lerp(hh, 0, bottom));
    let p4 = roomPoint(u22, nearT, lerp(hh, 0, bottom));

    hCanvas.stroke(30, 20, 15);
    hCanvas.strokeWeight(2);
    hCanvas.fill(75, 48, 33);

    drawQuad(hCanvas, p1, p2, p3, p4);

    /////// DRAWER HANDLE ///////

    let handle = roomPoint(
      u22,
      (t11 + t22) / 2,
      lerp(hh, 0, (top + bottom) / 2),
    );

    hCanvas.noStroke();
    hCanvas.fill(150, 125, 85);

    hCanvas.ellipse(handle.x, handle.y, 12, 5);
  }

  // Four corners of the picture on the wall
  let side = "left";
  let t1 = 0.4;
  let t2 = 0.7;
  let h1 = 0.8;
  let h2 = 0.4;
  let topLeft = wallPoint(side, t1, h2);
  let topRight = wallPoint(side, t2, h2);
  let bottomRight = wallPoint(side, t2, h1);
  let bottomLeft = wallPoint(side, t1, h1);

  // Wooden picture frame
  hCanvas.stroke(70, 50, 35);
  hCanvas.strokeWeight(6);
  hCanvas.fill(55, 35, 25);

  drawQuad(hCanvas, topLeft, topRight, bottomRight, bottomLeft);

  // Dark painting inside the frame
  hCanvas.noStroke();
  hCanvas.fill(15, 22, 32);
  let margin = 0.15;

  drawQuad(
    hCanvas,
    wallPoint(side, lerp(t1, t2, margin), lerp(h1, h2, 1 - margin)),
    wallPoint(side, lerp(t1, t2, 1 - margin), lerp(h1, h2, 1 - margin)),
    wallPoint(side, lerp(t1, t2, 1 - margin), lerp(h1, h2, margin)),
    wallPoint(side, lerp(t1, t2, margin), lerp(h1, h2, margin)),
  );

  // the bed contains the black gap underneath, frame, mattress, pillow
  drawFurniture(hCanvas, 0.55, 0.95, 0.6, 0.9, 0.07, color(0), color(0));

  // wooden bed frame
  drawFurniture(
    hCanvas,
    0.55,
    0.95,
    0.6,
    0.9,
    0.14,
    color(60, 42, 30),
    color(52, 36, 26),
    0.07,
  );

  // Mattress
  drawFurniture(
    hCanvas,
    0.56,
    0.94,
    0.61,
    0.89,
    0.2,
    color(150, 144, 132),
    color(120, 114, 104),
    0.14,
  );

  // Pillow near the back of the bed
  let pillow = roomPoint(0.75, 0.85, 0.22);
  hCanvas.fill(175, 170, 160);
  hCanvas.ellipse(pillow.x, pillow.y, 60, 16);

  /// floor lamp /////
  //Position of the lamp on the floor
  let u = 0.1;
  let t = 0.9;
  let base = floorPoint(u, t);
  // top of the lamp
  let top = roomPoint(u, t, 0.65);

  // Lamp size changes with perspective
  let size = lerp(1, 0.35, t);

  hCanvas.noStroke();
  hCanvas.fill(35, 30, 28);
  hCanvas.ellipse(base.x, base.y, 55 * size, 15 * size);

  // lamp pole//
  hCanvas.stroke(65, 58, 50);
  hCanvas.strokeWeight(6 * size);
  hCanvas.line(base.x, base.y, top.x, top.y);

  // lamp shade //
  hCanvas.noStroke();
  hCanvas.fill(180, 160, 125);
  hCanvas.quad(
    top.x - 18 * size,
    top.y - 30 * size,
    top.x + 18 * size,
    top.y - 30 * size,
    top.x + 32 * size,
    top.y + 15 * size,
    top.x - 32 * size,
    top.y + 15 * size,
  );

  //lamp glow
  hCanvas.noStroke();
  hCanvas.fill(255, 210, 130, 25);
  hCanvas.quad(
    top.x + 32 * size,
    top.y + 15 * size,
    top.x - 32 * size,
    top.y + 15 * size,
    base.x - 30,
    base.y + 30 * size,
    base.x + 30,
    base.y + 30 * size,
  );
}

//////////////////// KITCHEN //////////////////////
// something stands in the empty corner

function drawKitchen(hCanvas) {
  hCanvas.push();
  // Use a 640 x 800 coordinate system
  hCanvas.scale(hCanvas.width / 640, hCanvas.height / 800);
  hCanvas.noStroke();
  hCanvas.background(12, 17, 17);

  /////// WALLS ///////
  let ctx = hCanvas.drawingContext;
  /////////// LEFT WALL ///////////
  let leftGradient = ctx.createLinearGradient(
    0,
    0, // Left side: lighter
    335,
    0, // Corner: darker
  );
  leftGradient.addColorStop(0, "rgb(55, 75, 72)");
  leftGradient.addColorStop(0.2, "rgb(25, 35, 34)");
  leftGradient.addColorStop(1, "rgb(2, 4, 4)");

  ctx.save();
  hCanvas.noStroke();
  ctx.fillStyle = leftGradient;

  hCanvas.quad(0, 100, 335, 190, 335, 700, 0, 800);

  ctx.restore();

  /////////// RIGHT WALL ///////////
  let rightGradient = ctx.createLinearGradient(
    640,
    0, // Right side: lighter
    335,
    0, // Corner: darker
  );

  rightGradient.addColorStop(0, "rgb(45, 60, 58)");
  rightGradient.addColorStop(0.3, "rgb(20, 28, 27)");
  rightGradient.addColorStop(1, "rgb(2, 4, 4)");
  ctx.save();
  hCanvas.noStroke();
  ctx.fillStyle = rightGradient;
  hCanvas.quad(335, 190, 640, 130, 640, 800, 335, 700);

  ctx.restore();

  /////// CEILING ///////
  hCanvas.fill(12, 17, 17);
  hCanvas.quad(0, 0, 640, 0, 640, 130, 335, 190);
  /////// FLOOR ///////
  hCanvas.fill(20, 28, 27);
  hCanvas.quad(0, 800, 335, 700, 640, 800, 640, 800);
  /////// LOWER COUNTER ///////
  hCanvas.noStroke();
  // Countertop
  hCanvas.fill(60, 70, 68);
  hCanvas.quad(0, 550, 260, 530, 290, 540, 0, 585);

  // Counter front
  hCanvas.fill(34, 45, 45);
  hCanvas.quad(0, 585, 290, 540, 290, 730, 0, 800);

  // Upper drawer
  hCanvas.fill(50, 64, 64);
  hCanvas.quad(20, 620, 210, 595, 210, 660, 20, 690);

  // Drawer handle
  hCanvas.stroke(125, 139, 135);
  hCanvas.strokeWeight(5);
  hCanvas.line(90, 650, 140, 642);

  // Lower cabinet
  hCanvas.noStroke();
  hCanvas.fill(37, 50, 50);
  hCanvas.quad(20, 710, 210, 680, 210, 750, 20, 790);

  hCanvas.stroke(17, 25, 25);
  hCanvas.strokeWeight(4);
  hCanvas.line(120, 700, 120, 770);

  //// left long Upper cabinet /////
  // long upper cabinet
  hCanvas.fill(25, 38, 40);
  hCanvas.noStroke();
  hCanvas.quad(
    210,
    200, // Top-left of side
    260,
    215, // Top-right of side
    260,
    529, // Bottom-right of side
    210,
    530, // Bottom-left of side
  );
  hCanvas.fill(25, 38, 40, 50);
  hCanvas.quad(
    190,
    190, // Top-left of side
    210,
    200, // Top-right of side
    210,
    533, // Bottom-right of side
    190,
    520, // Bottom-left of side
  );
  hCanvas.fill(25, 38, 40, 50);
  hCanvas.quad(
    190,
    190, // Top-left of side
    240,
    200, // Top-right of side
    260,
    215, // Bottom-right of side
    210,
    200, // Bottom-left of side
  );

  // Inner panel
  hCanvas.stroke(18, 29, 30);
  hCanvas.strokeWeight(5);
  hCanvas.noFill();
  hCanvas.quad(
    220,
    210, // Top-left of side
    255,
    219, // Top-right of side
    255,
    515, // Bottom-right of side
    220,
    514,
  );

  // Cabinet handle
  hCanvas.stroke(100, 116, 113);
  hCanvas.strokeWeight(5);
  hCanvas.line(255, 400, 255, 370);

  /////// LEFT UPPER CABINETS ///////
  // Cabinet side
  hCanvas.noStroke();
  hCanvas.fill(25, 38, 40);
  hCanvas.quad(
    20,
    181, // Top-left of side
    40,
    191, // Top-right of side
    40,
    371, // Bottom-right of side
    20,
    361, // Bottom-left of side
  );
  // upper cabinet
  hCanvas.fill(25, 38, 40);
  hCanvas.quad(
    20,
    181, // Top-left of side
    190,
    220, // Top-right of side
    210,
    230, // Bottom-right of side
    40,
    191, // Bottom-left of side
  );
  // Upper cabinet door
  hCanvas.fill(43, 59, 60);
  hCanvas.quad(
    40,
    191, // Top-left
    210,
    230, // Top-right
    210,
    380, // Bottom-right
    40,
    371, // Bottom-left
  );
  // Inner panel
  hCanvas.stroke(18, 29, 30);
  hCanvas.strokeWeight(5);
  hCanvas.noFill();
  hCanvas.quad(47, 200, 200, 235, 200, 373, 47, 365);
  hCanvas.noStroke();
  // Cabinet handle
  hCanvas.stroke(100, 116, 113);
  hCanvas.strokeWeight(5);
  hCanvas.line(190, 295, 190, 340);
  //////////////////////////////////////////
  /////// REFRIGERATOR ///////
  hCanvas.noStroke();

  // Refrigerator side
  hCanvas.fill(26, 39, 41);
  hCanvas.quad(480, 280, 530, 270, 530, 760, 480, 780);

  // Main refrigerator body
  hCanvas.fill(65, 84, 88);
  hCanvas.quad(360, 275, 480, 280, 480, 780, 360, 740);

  // Upper side
  hCanvas.fill(26, 39, 41);
  hCanvas.quad(400, 275, 530, 270, 480, 280, 360, 275);

  // Lower refrigerator door
  hCanvas.stroke(50, 77, 80, 100);
  hCanvas.fill(58, 77, 80);
  hCanvas.quad(365, 495, 470, 510, 470, 730, 365, 700);

  // Separation between doors
  hCanvas.stroke(20, 30, 32);
  hCanvas.strokeWeight(6);
  hCanvas.line(364, 491, 472, 513);

  // Metallic refrigerator handles
  hCanvas.stroke(126, 145, 147);
  hCanvas.strokeWeight(8);
  hCanvas.line(370, 345, 370, 445);
  hCanvas.line(370, 525, 370, 635);
  hCanvas.pop();
}

/////////////////////////////////////////////////////
//////////////////// BATHROOM //////////////////////
// you stand at the mirror and see something behind you
// (seen straight on, so no perspective needed)

function drawBathroom(hCanvas) {
  hCanvas.background(24, 24, 21);
  hCanvas.noStroke();
  /////// Old Wall ///////
  let ctx = hCanvas.drawingContext;
  let wallGradient = ctx.createLinearGradient(0, 0, 640, 400);

  wallGradient.addColorStop(0, "rgb(48, 44, 35)");
  wallGradient.addColorStop(0.5, "rgb(32, 30, 25)");
  wallGradient.addColorStop(1, "rgb(10, 11, 10)");
  ctx.save();
  ctx.fillStyle = wallGradient;
  hCanvas.rect(0, 0, 640, 300);
  ctx.restore();

  /////// tiles on the Wall ///////
  hCanvas.fill(43, 42, 36);
  hCanvas.rect(0, 270, 640, 140);
  hCanvas.stroke(13, 14, 12);
  hCanvas.strokeWeight(3);

  for (let x = 0; x <= 640; x += 35) {
    hCanvas.line(x, 270, x, 410);
  }

  for (let y = 270; y <= 410; y += 35) {
    hCanvas.line(0, y, 640, y);
  }

  /////// FLOOR IN PERSPECTIVE ///////
  hCanvas.noStroke();
  hCanvas.fill(35, 33, 29);
  hCanvas.quad(0, 410, 640, 410, 640, 480, 0, 480);

  /////// MIRROR FRAME ///////
  hCanvas.noStroke();

  // Outer shadow
  hCanvas.fill(5, 5, 4);
  hCanvas.rect(160, 30, 320, 245);

  // Wooden / metal frame
  hCanvas.fill(53, 47, 38);
  hCanvas.rect(164, 34, 312, 237);

  // Dark glass placeholder
  // Live webcam will be drawn over this
  hCanvas.fill(13, 16, 15);
  hCanvas.rect(170, 40, 300, 225);

  // Thin frame highlights
  hCanvas.noFill();
  hCanvas.stroke(90, 77, 58, 120);
  hCanvas.strokeWeight(2);
  hCanvas.rect(166, 36, 308, 233);

  /////// TOILET ON THE LEFT ///////
  hCanvas.noStroke();

  // Toilet tank
  hCanvas.fill(87, 84, 74);
  hCanvas.rect(30, 290, 105, 58, 5);

  // Tank lid
  hCanvas.fill(111, 106, 94);
  hCanvas.rect(25, 285, 115, 10, 3);

  // Toilet body
  hCanvas.fill(95, 92, 82);
  hCanvas.quad(53, 349, 127, 349, 115, 430, 65, 430);

  // Toilet bowl
  hCanvas.fill(119, 115, 104);
  hCanvas.ellipse(90, 356, 108, 40);

  hCanvas.fill(15, 17, 16);
  hCanvas.ellipse(90, 354, 78, 25);

  /////// SINK UNDER MIRROR ///////

  // Sink shadow
  hCanvas.fill(5, 5, 5, 150);
  hCanvas.rect(205, 312, 240, 130);

  // Sink pedestal
  hCanvas.fill(54, 52, 46);
  hCanvas.quad(260, 320, 390, 320, 375, 447, 275, 447);

  // Basin top
  hCanvas.fill(142, 138, 124);
  hCanvas.quad(195, 300, 445, 300, 465, 327, 175, 327);

  // Basin interior
  hCanvas.fill(68, 69, 62);
  hCanvas.ellipse(320, 313, 190, 27);

  hCanvas.fill(28, 30, 27);
  hCanvas.ellipse(320, 316, 95, 12);

  /////// FAUCET ///////
  hCanvas.noFill();
  hCanvas.stroke(126, 127, 116);
  hCanvas.strokeWeight(7);

  hCanvas.line(320, 299, 320, 281);
  hCanvas.line(320, 281, 345, 281);
  hCanvas.line(345, 281, 345, 294);

  // Faucet handles
  hCanvas.strokeWeight(4);
  hCanvas.line(290, 298, 308, 298);
  hCanvas.line(351, 298, 369, 298);

  /////// TOWEL ON RIGHT WALL ///////
  hCanvas.stroke(65, 61, 52);
  hCanvas.strokeWeight(5);
  hCanvas.line(515, 310, 610, 310);

  hCanvas.noStroke();
  hCanvas.fill(65, 61, 53);

  hCanvas.quad(530, 313, 595, 313, 585, 395, 535, 390);

  /////// CRACKS ON WALL ///////
  hCanvas.stroke(12, 12, 10);
  hCanvas.strokeWeight(1.5);
  hCanvas.noFill();

  hCanvas.beginShape();
  hCanvas.vertex(95, 0);
  hCanvas.vertex(100, 48);
  hCanvas.vertex(88, 86);
  hCanvas.vertex(115, 130);
  hCanvas.vertex(105, 175);
  hCanvas.endShape();

  hCanvas.beginShape();
  hCanvas.vertex(565, 0);
  hCanvas.vertex(550, 55);
  hCanvas.vertex(573, 92);
  hCanvas.vertex(560, 145);
  hCanvas.endShape();
}
///////////////////////////////////////////////////////
//////////////////// LIVING ROOM //////////////////////
///////////////////////////////////////////////////////
function drawLivingRoom(hCanvas) {
  hCanvas.push();

  // Coordinate system for the living room
  hCanvas.scale(hCanvas.width / 800, hCanvas.height / 600);
  hCanvas.background(12, 13, 14);
  hCanvas.noStroke();

  /// Walls & ceiling
  // Ceiling
  hCanvas.fill(14, 15, 16);
  hCanvas.quad(0, 0, 800, 0, 610, 85, 190, 85);

  // Left wall
  hCanvas.fill(23, 25, 26);
  hCanvas.quad(0, 0, 190, 85, 190, 365, 0, 490);

  // Back wall
  hCanvas.fill(28, 29, 29);
  hCanvas.quad(190, 85, 610, 85, 610, 365, 190, 365);

  // Right wall
  hCanvas.fill(21, 23, 24);
  hCanvas.quad(610, 85, 800, 0, 800, 490, 610, 365);

  /////// floor ///////
  hCanvas.fill(48, 34, 27);
  hCanvas.quad(0, 490, 190, 365, 610, 365, 800, 490);
  hCanvas.rect(0, 490, 800, 110);

  // Floorboard lines
  hCanvas.stroke(25, 19, 16);
  hCanvas.strokeWeight(2);

  for (let i = 0; i <= 10; i++) {
    let x = i * 80;
    let farX = lerp(190, 610, i / 10);

    hCanvas.line(x, 600, farX, 365);
  }
  hCanvas.noStroke();

  /////// BACK WINDOW ///////

  // Window frame
  hCanvas.fill(9, 12, 14);
  hCanvas.rect(275, 120, 185, 230);

  // Night sky
  hCanvas.fill(30, 47, 48);
  hCanvas.rect(285, 130, 165, 210);

  hCanvas.noStroke();

  // Window divisions
  hCanvas.fill(10, 12, 13);
  hCanvas.rect(362, 125, 7, 220);
  hCanvas.rect(280, 231, 175, 7);

  /////// CURTAINS ///////

  hCanvas.fill(18, 20, 21);

  // Left curtain
  hCanvas.quad(250, 110, 290, 110, 290, 370, 260, 370);

  // Right curtain
  hCanvas.quad(445, 110, 480, 110, 475, 370, 450, 370);

  // Curtain folds
  hCanvas.stroke(43, 43, 42);
  hCanvas.strokeWeight(2);
  hCanvas.line(270, 115, 275, 365);
  hCanvas.line(463, 115, 460, 365);
  hCanvas.noStroke();

  ///////TV and its cabinet ///////

  // Television frame on right wall
  hCanvas.fill(7, 8, 9);
  hCanvas.quad(652, 170, 785, 135, 785, 400, 652, 345);

  // TV screen
  hCanvas.fill(15, 20, 21);
  hCanvas.quad(662, 180, 775, 155, 775, 380, 662, 335);

  // some sort of reflection
  hCanvas.fill(48, 57, 55, 30);
  hCanvas.quad(670, 185, 705, 176, 705, 340, 670, 328);
  // Cabinet top
  hCanvas.fill(76, 51, 35);
  hCanvas.quad(652, 345, 785, 400, 700, 400, 620, 345);

  // Cabinet front
  hCanvas.fill(47, 33, 26);
  hCanvas.quad(700, 400, 785, 400, 785, 480, 700, 480);
  // Cabinet side
  hCanvas.fill(47, 33, 26);
  hCanvas.quad(620, 345, 700, 400, 700, 480, 620, 380);
  // Cabinet doors
  hCanvas.stroke(25, 19, 16);
  hCanvas.strokeWeight(3);
  hCanvas.line(660, 375, 660, 420);
  hCanvas.noStroke();

  /////// RUG ///////
  hCanvas.fill(78, 65, 51);
  hCanvas.quad(210, 400, 590, 400, 700, 550, 100, 550);
  // Inner rug
  hCanvas.fill(67, 55, 44);
  hCanvas.quad(230, 420, 580, 420, 650, 530, 150, 530);

  /////// SOFA ON LEFT ///////
  // side of sofa
  hCanvas.fill(31, 33, 34);
  hCanvas.quad(130, 420, 230, 420, 230, 500, 130, 500);
  hCanvas.quad(100, 300, 130, 300, 130, 500, 100, 500);

  // Sofa seat
  hCanvas.fill(40, 41, 42);
  hCanvas.quad(130, 420, 190, 360, 260, 360, 230, 420);
  // sofa back
  hCanvas.fill(40, 41, 42);
  hCanvas.quad(130, 420, 130, 300, 190, 270, 190, 360);
  hCanvas.quad(100, 300, 170, 270, 190, 270, 130, 300);

  hCanvas.quad(230, 420, 260, 360, 260, 410, 230, 500);

  /////// PLANT NEAR THE CORNER ///////

  // Pot
  hCanvas.fill(32, 35, 32);
  hCanvas.quad(570, 382, 610, 382, 605, 430, 575, 430);

  // Branches
  hCanvas.stroke(65, 56, 38);
  hCanvas.strokeWeight(3);

  hCanvas.line(590, 385, 590, 220);
  hCanvas.line(590, 300, 552, 245);
  hCanvas.line(590, 275, 635, 220);
  hCanvas.line(590, 330, 555, 305);
  hCanvas.line(590, 300, 620, 260);

  // Leaves
  hCanvas.stroke(49, 62, 43);
  hCanvas.strokeWeight(5);
  hCanvas.line(552, 245, 536, 225);
  hCanvas.line(635, 220, 647, 207);
  hCanvas.line(555, 305, 538, 298);
  hCanvas.line(620, 260, 638, 249);

  hCanvas.noStroke();

  /////// COFFEE TABLE ///////

  // Legs
  hCanvas.fill(22, 17, 15);
  hCanvas.quad(300, 480, 318, 480, 318, 520, 300, 520);
  hCanvas.quad(555, 480, 573, 480, 573, 520, 555, 520);

  // Table surface
  hCanvas.fill(58, 43, 33);
  hCanvas.quad(310, 430, 530, 430, 610, 480, 265, 480);

  // Table thickness
  hCanvas.fill(31, 23, 19);
  hCanvas.quad(265, 480, 610, 480, 610, 500, 265, 500);

  // Books on table
  hCanvas.fill(103, 98, 87);
  hCanvas.quad(345, 460, 420, 462, 438, 474, 350, 475);

  hCanvas.fill(65, 66, 64);
  hCanvas.quad(360, 451, 421, 448, 435, 462, 355, 467);

  // Bowl
  hCanvas.fill(78, 78, 70);
  hCanvas.ellipse(510, 450, 65, 20);
  hCanvas.fill(22, 22, 20);
  hCanvas.ellipse(510, 450, 43, 8);
  hCanvas.pop();
}

/////////////////////////////////////////////////////////////////
//////////////////// BASEMENT //////////////////////
/////////////////////////////////////////////////////////////
// When the player stand on the stairs looking down. something crawls up.
// (its own shape: a stairwell, not a box)
function drawBasement(hCanvas) {
  hCanvas.background(0);
  hCanvas.noStroke();
  let numSteps = 6;

  /////////// Ceiling///////////
  // Get the drawing context of the hidden canvas
  let ctx = hCanvas.drawingContext;

  // Create a linear gradient from top to bottom
  let gradient = ctx.createLinearGradient(
    0,
    0, // Starting position
    0,
    100, // Ending position
  );
  // Set the gradient colors
  gradient.addColorStop(0, "rgb(50, 50, 50)");
  gradient.addColorStop(1, "rgb(5, 5, 5)");

  // Save drawing settings
  ctx.save();
  // Remove the outline
  hCanvas.noStroke();
  // Apply the gradient
  ctx.fillStyle = gradient;

  // Draw the ceiling
  hCanvas.quad(
    0,
    0, // Top-left
    width,
    0, // Top-right
    500,
    100, // Bottom-right
    100,
    100, // Bottom-left
  );
  ctx.restore(); // restore drawing settings

  /////////// Left wall ///////////

  let leftGradient = ctx.createLinearGradient(0, 0, 200, 250);

  leftGradient.addColorStop(0, "rgb(50, 50, 50)");
  leftGradient.addColorStop(1, "rgb(5, 5, 5)");

  hCanvas.noStroke();
  ctx.fillStyle = leftGradient;
  hCanvas.quad(0, 0, 150, 100, 200, 250, 0, height);

  /////////// RIGHT WALL ///////////
  let rightGradient = ctx.createLinearGradient(width, 0, 440, 250);
  rightGradient.addColorStop(0, "rgb(40, 40, 45)");
  rightGradient.addColorStop(1, "rgb(5, 5, 8)");
  ctx.fillStyle = rightGradient;
  hCanvas.quad(width, 0, 490, 100, 440, 250, width, height);

  /////////// BACK WALL ///////////
  let backGradient = ctx.createLinearGradient(0, 100, 0, 250);
  backGradient.addColorStop(0, "rgb(40, 40, 45)");
  backGradient.addColorStop(1, "rgb(10, 10, 3)");
  ctx.fillStyle = backGradient;

  hCanvas.quad(150, 100, 490, 100, 440, 250, 200, 250);

  ///////// Door frame ///////////
  hCanvas.fill(8, 8, 10);
  hCanvas.stroke(45, 28, 18);
  hCanvas.strokeWeight(5);
  hCanvas.quad(250, 150, 350, 150, 330, 250, 270, 250);
  ///////// ajar door ///////////
  // Door is hinged on the left
  hCanvas.fill(40, 20, 18);
  hCanvas.noStroke();
  hCanvas.quad(250, 150, 290, 150, 300, 220, 270, 250);

  // Door panels
  hCanvas.noFill();
  hCanvas.stroke(0, 50);
  hCanvas.strokeWeight(3);
  hCanvas.line(265, 200, 255, 160);
  hCanvas.line(265, 200, 287, 173);
  hCanvas.line(287, 173, 283, 155);
  hCanvas.line(255, 160, 260, 153);
  hCanvas.quad(
    267,
    210, // Top-left
    289,
    182, // Top-right
    293,
    213, // Bottom-right
    272,
    235, // Bottom-left
  );
  // Door handle
  hCanvas.noStroke();
  hCanvas.fill(100, 95, 85);
  hCanvas.ellipse(290, 180, 6, 6);

  // /////////// seven stairs ///////////
  hCanvas.fill(109, 109, 109);
  hCanvas.quad(0, 480, 50, 430, 590, 430, 640, 480);

  for (let i = 1; i <= numSteps - 2; i = i + 1) {
    let t1 = i / numSteps + 0.05;
    let t2 = (i + 1) / numSteps + 0.05;
    let u1 = i / numSteps - 0.1 * i;
    let u2 = (6 - i) / numSteps + 0.1 * i;
    hCanvas.fill(109, 109, 109, 30 * (5 - i));
    hCanvas.quad(
      floorPoint(u1, t1).x,
      floorPoint(u1, t1).y,
      floorPoint(u1, t2).x,
      floorPoint(u1, t2).y,
      floorPoint(u2, t2).x,
      floorPoint(u2, t2).y,
      floorPoint(u2, t1).x,
      floorPoint(u2, t1).y,
    );
  }

  // /////////// Side Wall Bars ///////////
  // /////////// left bars ///////////
  let barGradientLeft = ctx.createLinearGradient(50, 230, 240, 240);

  barGradientLeft.addColorStop(0, "rgb(54, 33, 18)");
  barGradientLeft.addColorStop(1, "rgb(0, 0, 0)");

  ctx.save();

  // Draw directly with the canvas context
  ctx.strokeStyle = barGradientLeft;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(50, 230);
  ctx.lineTo(240, 240);
  ctx.stroke();
  ctx.restore();

  for (let i = 1; i <= numSteps - 2; i = i + 1) {
    let t1 = i / numSteps + 0.05;
    let t2 = (i + 1) / numSteps + 0.05;
    let u1 = i / numSteps - 0.1 * i;
    let u2 = (6 - i) / numSteps + 0.1 * i;
    //bars
    hCanvas.stroke(18 * (4 - i), 11 * (4 - i), 6 * (4 - i));
    hCanvas.strokeWeight(10 - i);
    hCanvas.line(
      floorPoint(u1, t1).x,
      floorPoint(u1, t1).y,
      floorPoint(u1, t1).x - 10,
      floorPoint(u1, t1).y - 40 * (6 - i),
    );
  }

  // /////////// right bars ///////////
  // Create a brown gradient along the line
  let barGradientRight = ctx.createLinearGradient(
    590,
    230, // Start of the line
    400,
    240, // End of the line
  );

  // Brown to dark brown
  barGradientRight.addColorStop(0, "rgb(54, 33, 18)");
  barGradientRight.addColorStop(1, "rgb(0, 0, 0)");

  // Apply gradient to stroke
  ctx.save();
  hCanvas.noFill();
  hCanvas.strokeWeight(12);
  ctx.strokeStyle = barGradientRight;

  // Draw the line
  hCanvas.line(400, 240, 590, 230);
  ctx.restore();
  for (let i = 1; i <= numSteps - 2; i = i + 1) {
    let t1 = i / numSteps + 0.05;
    let t2 = (i + 1) / numSteps + 0.05;
    let u1 = i / numSteps - 0.1 * i;
    let u2 = (6 - i) / numSteps + 0.1 * i;
    //bars
    hCanvas.stroke(18 * (4 - i), 11 * (4 - i), 6 * (4 - i));
    hCanvas.strokeWeight(10 - i);
    hCanvas.line(
      floorPoint(u2, t1).x,
      floorPoint(u2, t1).y,
      floorPoint(u2, t1).x + 10,
      floorPoint(u2, t1).y - 40 * (6 - i),
    );
  }
}
