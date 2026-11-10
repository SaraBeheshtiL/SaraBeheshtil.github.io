//////////////////// THE HAUNTED HOUSE //////////////////////
// A headlamp on your forehead. Turn your head to look around.
// Close your eyes = the light goes out.
// Things only move when you are not looking at them.
// Escape all six rooms (the hallway too) in 2 minutes.
//
// Files:  house.js    the Room class + all six rooms (hallway + five)
//         creature.js Creature, Key, Dust classes
//         body.js     faceMesh + handPose
//         sketch.js   this file: game states

let gameState = "start"; // "start", "hallway", "room", "caught", "ghost", "win"

let video;
let currentRoom; // the Room object you are in (the hallway is a room too)
let hallway; // the first frame
let creatures = [];
let dust = [];

const TOTAL_TIME = 120; // seconds
let startTime = 0;
let penalty = 0; // seconds lost when a creature gets you
let timeLeft = TOTAL_TIME;

let closedEyesFrames = 0; // on the start screen: close your eyes to enter
let roomTitleTimer = 0;
let hurtFlash = 0;
let scareImg = null;
let scareTimer = 0;
let caughtTimer = 0;

// ---------- horror images ----------
// One photo per room. Missing ones are replaced by another photo,
// or by a drawn face if there are none at all.
let ghostFiles = [
  "ghost1.png",
  "ghost2.png",
  "ghost3.png",
  "ghost4.png",
  "ghost5.png",
  "ghost6.png",
];
let ghostRaw = {};
let ghostImages = {};
let grainFrames = [];

function preload() {
  for (let f of ghostFiles) {
    loadImage(
      f,
      (img) => (ghostRaw[f] = img),
      () => console.log("No " + f + " (that's ok)"),
    );
  }
  preloadBody();
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  textFont("monospace");

  setupRooms(); // all six rooms, from house.js
  hallway = roomForSign("bothClosed");
  currentRoom = hallway;
  setupBody(); // start faceMesh + handPose

  for (let f in ghostRaw) {
    ghostImages[f] = prepareGhost(ghostRaw[f]);
  }
  makeGrain();
}

function draw() {
  background(0);
  updateBody(gameState === "start");

  if (gameState === "start") {
    drawStart();
  } else if (gameState === "hallway" || gameState === "room") {
    playFrame();
  } else if (gameState === "caught") {
    drawCaught();
  } else if (gameState === "ghost") {
    drawGhostEnding();
  } else if (gameState === "win") {
    drawWin();
  }
}

//////////////////// PLAYING //////////////////////

function playFrame() {
  // ---- the clock ----
  timeLeft = TOTAL_TIME - (millis() - startTime) / 1000 - penalty;
  if (timeLeft <= 0) {
    timeLeft = 0;
    gameState = "caught";
    caughtTimer = 0;
    return;
  }

  // ---- hand signs change the room ----
  let sign = confirmedGesture();
  if (sign !== "none") goTo(sign);

  let lightOn = eyesOpen && faceFound;
  let radius = currentRoom.lightRadius;

  // ---- the scene ----
  currentRoom.display();
  updateRoom(lightOn, radius); // creatures + key

  // ---- darkness: a hole where your headlamp points, or total black ----
  if (lightOn) {
    let flicker = random() < 0.04 ? random(-30, 0) : random(-3, 3);
    drawDarkness(lookX, lookY, radius + flicker);
  } else {
    noStroke();
    fill(0, 250);
    rect(0, 0, width, height);
  }

  // ---- things you can see in the dark ----
  for (let c of creatures) c.displayGlimpse();
  if (currentRoom.key) currentRoom.key.displayGlint();
  updateDust(lightOn, radius);

  if (hurtFlash > 0) {
    noStroke();
    fill(150, 0, 0, hurtFlash);
    rect(0, 0, width, height);
    hurtFlash -= 8;
  }
  drawJumpScare();
  drawGrain();
  drawHUD();
}

function updateRoom(lightOn, radius) {
  let room = currentRoom;
  let key = room.key;

  key.update(lightOn, lookX, lookY, radius);
  key.display();

  // creatures get faster with every room you escape
  let waitFrames = max(22, 55 - escapedCount() * 7);

  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.checkLight(lightOn, lookX, lookY, radius);
    c.update(justBlinked, waitFrames);

    if (c.caughtYou()) {
      creatures.splice(i, 1); // REMOVE: she got you…
      creatures.push(new Creature(room)); // ADD: …and another one starts over
      penalty += 15; // costs you 15 seconds
      hurtFlash = 200;
      scareImg = c.img;
      scareTimer = 22;
    }
  }

  // found the key → escaped!
  if (key.isFound() && !room.escaped) {
    room.escaped = true;
    creatures.splice(0, creatures.length); // REMOVE them all
    if (allEscaped()) {
      gameState = "win"; // that was the last one
    }
  }

  for (let c of creatures) c.display();
}

function updateDust(lightOn, radius) {
  if (lightOn && random() < 0.6) {
    dust.push(
      new Dust(
        lookX + random(-radius, radius) * 0.5,
        lookY + random(-radius, radius) * 0.5,
      ),
    );
  }
  for (let i = dust.length - 1; i >= 0; i--) {
    dust[i].update();
    dust[i].display();
    if (dust[i].isGone()) dust.splice(i, 1);
  }
}

//////////////////// CHANGING ROOMS //////////////////////

function goTo(sign) {
  let room = roomForSign(sign);
  if (!room || room === currentRoom) return;

  currentRoom = room;
  gameState = room.isHallway ? "hallway" : "room";
  creatures = [];
  if (!room.escaped) {
    creatures.push(new Creature(room)); // ADD the creature that lives here
  }
  roomTitleTimer = 90;
}

function allEscaped() {
  return escapedCount() === hauntedRooms().length;
}

function escapedCount() {
  let n = 0;
  for (let r of hauntedRooms()) if (r.escaped) n++;
  return n;
}

//////////////////// SCREENS //////////////////////

function drawStart() {
  // the camera "catches" your face
  push();
  tint(255, 60);
  image(video, 0, 0, width, height);
  pop();
  if (faces.length > 0) {
    noStroke();
    fill(200, 0, 0, 160);
    let k = faces[0].keypoints;
    for (let i = 0; i < k.length; i += 3) circle(k[i].x, k[i].y, 2);
  }
  drawGrain();

  noStroke();
  textAlign(CENTER, CENTER);
  fill(200, 0, 0);
  textSize(46);
  text("THE HOUSE", width / 2, 80);
  fill(200);
  textSize(15);
  text(
    "You wear a light on your forehead. Turn your head to look.",
    width / 2,
    140,
  );
  text("Close your eyes and the light goes out.", width / 2, 162);
  text("They only move when you're not looking at them.", width / 2, 184);
  text("Find the key in every room. Stare at it to take it.", width / 2, 206);
  text("Escape all 6 rooms, the hallway too, in 2:00.", width / 2, 228);

  textSize(13);
  fill(170);
  text(
    "RIGHT open: Bedroom   RIGHT fist: Kitchen   LEFT open: Bathroom",
    width / 2,
    290,
  );
  text(
    "LEFT fist: Living Room   BOTH open: Basement   BOTH fists: Hallway",
    width / 2,
    310,
  );

  fill(255);
  textSize(16);
  if (!faceFound) {
    text("Look at the camera…", width / 2, 380);
  } else {
    text(
      "Look straight ahead. Close your eyes for 2 seconds to enter.",
      width / 2,
      380,
    );
    if (!eyesOpen) closedEyesFrames++;
    else closedEyesFrames = 0;
    noFill();
    stroke(200, 0, 0);
    strokeWeight(4);
    arc(
      width / 2,
      425,
      40,
      40,
      -HALF_PI,
      -HALF_PI + TWO_PI * min(1, closedEyesFrames / 120),
    );
    if (closedEyesFrames >= 120) startGame();
  }
  noStroke();
  fill(120);
  textSize(11);
  text(
    "(testing without a camera? press M for mouse mode, then click)",
    width / 2,
    465,
  );
}

function startGame() {
  for (let r of rooms) {
    r.escaped = false;
    if (r.key) r.key.charge = 0;
  }
  currentRoom = hallway;
  creatures = [new Creature(hallway)]; // the hallway's creature is waiting for you
  dust = [];
  penalty = 0;
  startTime = millis();
  closedEyesFrames = 0;
  scareTimer = 0;
  hurtFlash = 0;
  roomTitleTimer = 90;
  gameState = "hallway";
}

// time ran out: the creature comes for you
function drawCaught() {
  caughtTimer++;
  let img =
    scareImg ||
    ghostImages[random(ghostFiles)] ||
    random(Object.values(ghostImages));
  scareImg = img;
  if (img) {
    push();
    translate(width / 2 + random(-20, 20), height / 2 + random(-20, 20));
    imageMode(CENTER);
    let h = height * lerp(0.6, 1.6, min(1, caughtTimer / 40));
    image(img, 0, 0, (h * img.width) / img.height, h);
    pop();
  }
  noStroke();
  fill(150, 0, 0, random(60, 140));
  rect(0, 0, width, height);
  drawGrain();
  if (caughtTimer > 70) gameState = "ghost";
}

// …and you become one of them
function drawGhostEnding() {
  push();
  tint(190, 205, 255);
  image(video, 0, 0, width, height);
  pop();
  filter(GRAY);

  // hollow black eyes and mouth on YOUR face
  if (faces.length > 0) {
    let k = faces[0].keypoints;
    noStroke();
    fill(0);
    for (let eye of [L_EYE, R_EYE]) {
      let cx = (k[eye[2]].x + k[eye[3]].x) / 2;
      let cy = (k[eye[0]].y + k[eye[1]].y) / 2;
      let w = dist(k[eye[2]].x, k[eye[2]].y, k[eye[3]].x, k[eye[3]].y);
      ellipse(cx, cy, w * 1.5, w * 1.2);
      rect(cx - 2, cy, 4, w * 1.4 + 10 * sin(frameCount * 0.05) + 10); // dripping
    }
    let m1 = k[13],
      m2 = k[14];
    ellipse((m1.x + m2.x) / 2, m2.y + 8, 30, 45);
  }

  noStroke();
  fill(220, 230, 255, 50);
  rect(0, 0, width, height);
  if (random() < 0.08) {
    fill(0, 150);
    rect(0, random(height), width, random(5, 30)); // tracking glitch
  }
  drawGrain();

  textAlign(CENTER, CENTER);
  fill(200, 0, 0);
  textSize(36);
  text("YOU ARE ONE OF THEM NOW", width / 2, 60);
  fill(230);
  textSize(15);
  text(
    "Rooms escaped: " + escapedCount() + " / " + hauntedRooms().length,
    width / 2,
    420,
  );
  text("[ click or press R to try again ]", width / 2, 445);
}

function drawWin() {
  push();
  tint(255, 120);
  image(video, 0, 0, width, height);
  pop();
  noStroke();
  fill(255, 240, 200, 40);
  rect(0, 0, width, height);
  drawGrain();
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(40);
  text("YOU ESCAPED THE HOUSE", width / 2, height / 2 - 30);
  textSize(18);
  text("with " + formatTime(timeLeft) + " left", width / 2, height / 2 + 15);
  textSize(15);
  text("[ click or press R to play again ]", width / 2, height / 2 + 60);
}

//////////////////// HUD //////////////////////

function formatTime(t) {
  t = max(0, ceil(t));
  return floor(t / 60) + ":" + nf(t % 60, 2);
}

function drawHUD() {
  noStroke();
  textAlign(LEFT, TOP);
  textSize(26);
  fill(
    timeLeft < 20 && frameCount % 30 < 15
      ? color(255, 40, 40)
      : color(200, 0, 0),
  );
  text(formatTime(timeLeft), 15, 12);

  // escaped rooms
  textSize(12);
  let haunted = hauntedRooms();
  for (let i = 0; i < haunted.length; i++) {
    let r = haunted[i];
    fill(r.escaped ? color(230, 200, 120) : color(110));
    text((r.escaped ? "✓ " : "· ") + r.name, 15, 50 + i * 16);
  }

  // where am I + what to do
  textAlign(RIGHT, TOP);
  textSize(16);
  fill(200);
  text(currentRoom.name.toUpperCase(), width - 15, 14);
  textSize(12);
  fill(150);
  text(eyesOpen ? "eyes: open" : "eyes: CLOSED", width - 15, 36);
  if (!faceFound) {
    fill(255, 80, 80);
    text("can't see your face!", width - 15, 52);
  }

  // big room title when you walk in
  if (roomTitleTimer > 0) {
    textAlign(CENTER, CENTER);
    fill(255, map(roomTitleTimer, 0, 90, 0, 230));
    textSize(34);
    text(currentRoom.name.toUpperCase(), width / 2, height / 2 - 40);
    textSize(14);
    if (!currentRoom.escaped) text("find the key", width / 2, height / 2);
    roomTitleTimer--;
  }

  textAlign(CENTER, BOTTOM);
  textSize(13);
  if (currentRoom.escaped) {
    fill(230, 200, 120);
    text(
      "You escaped this room. Make a hand sign to leave.",
      width / 2,
      height - 12,
    );
  } else if (currentRoom.isHallway) {
    fill(170);
    textSize(11);
    text(
      "R open: Bedroom · R fist: Kitchen · L open: Bathroom",
      width / 2 - 55,
      height - 28,
    );
    text(
      "L fist: Living Room · both open: Basement · both fists: here",
      width / 2 - 55,
      height - 10,
    );
  }

  // hand sign being held
  if (gestureProgress() > 0) {
    let target = (roomForSign(gestureNow) || {}).name;
    if (target) {
      noFill();
      stroke(255);
      strokeWeight(3);
      arc(
        width / 2,
        60,
        34,
        34,
        -HALF_PI,
        -HALF_PI + TWO_PI * gestureProgress(),
      );
      noStroke();
      fill(255);
      textAlign(CENTER, TOP);
      textSize(12);
      text("→ " + target, width / 2, 82);
    }
  }

  // small camera preview so you can see your hands
  push();
  tint(255, 110);
  image(video, width - 112, height - 90, 104, 78);
  pop();
}

//////////////////// EFFECTS //////////////////////

function drawDarkness(x, y, r) {
  let ctx = drawingContext;
  let g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.96)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
  let glow = ctx.createRadialGradient(x, y, 0, x, y, r * 0.8);
  glow.addColorStop(0, "rgba(255,235,190,0.15)");
  glow.addColorStop(1, "rgba(255,235,190,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawJumpScare() {
  if (scareTimer <= 0) return;
  if (scareImg) {
    push();
    translate(width / 2 + random(-15, 15), height / 2 + random(-15, 15));
    imageMode(CENTER);
    let h = height * 1.35;
    image(scareImg, 0, 0, (h * scareImg.width) / scareImg.height, h);
    pop();
  }
  scareTimer--;
}

function prepareGhost(src) {
  let img = src.get();
  if (img.height > 320) img.resize(0, 320);
  img.loadPixels();
  for (let i = 0; i < img.pixels.length; i += 4) {
    let v =
      0.3 * img.pixels[i] + 0.59 * img.pixels[i + 1] + 0.11 * img.pixels[i + 2];
    v = constrain((v - 128) * 1.5 + 135, 0, 255);
    img.pixels[i] = v;
    img.pixels[i + 1] = v;
    img.pixels[i + 2] = v;
  }
  img.updatePixels();
  let m = createGraphics(img.width, img.height);
  m.pixelDensity(1);
  let ctx = m.drawingContext;
  ctx.translate(img.width / 2, img.height / 2);
  ctx.scale(1, img.height / img.width);
  let r = img.width / 2;
  let g = ctx.createRadialGradient(0, 0, r * 0.45, 0, 0, r);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(-r, -r, r * 2, r * 2);
  img.mask(m.get());
  m.remove();
  return img;
}

function makeGrain() {
  for (let i = 0; i < 4; i++) {
    let g = createGraphics(width / 2, height / 2);
    g.pixelDensity(1);
    g.loadPixels();
    for (let p = 0; p < g.pixels.length; p += 4) {
      let v = random(255);
      g.pixels[p] = v;
      g.pixels[p + 1] = v;
      g.pixels[p + 2] = v;
      g.pixels[p + 3] = random(45);
    }
    g.updatePixels();
    grainFrames.push(g);
  }
}

function drawGrain() {
  push();
  tint(255, 160);
  image(random(grainFrames), 0, 0, width, height);
  pop();
}

//////////////////// MOUSE + KEYS //////////////////////

function mousePressed() {
  if (gameState === "start" && MOUSE_MODE) startGame();
  else if (gameState === "ghost" || gameState === "win") gameState = "start";
}

function keyPressed() {
  if (key === "m" || key === "M") MOUSE_MODE = !MOUSE_MODE;
  if (key === "s" || key === "S") SWAP_HANDS = !SWAP_HANDS;
  if (
    (key === "r" || key === "R") &&
    (gameState === "ghost" || gameState === "win")
  )
    gameState = "start";
  if (gameState === "hallway" || gameState === "room") {
    let sign = keyboardRoom();
    if (sign !== "none") goTo(sign);
  }
}
