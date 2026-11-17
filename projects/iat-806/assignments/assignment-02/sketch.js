//////////////////// THE HAUNTED HOUSE //////////////////////
// This is the game senario:
// Game starts.
// The camera catches the face of the player, and the light comes to the page (room) like there is a flashlight is on her forehead. So, the light should change the direction when the eyes of the player change direction. (It’s like that the player face is changing direction and moving toward spaces)
// Eyes open, the light is on // eyes closed the light is off// when the eyes move off the creature which the play faces/sees the creature gets one frame closer.
// So, when seeing a creature, the player should stare at it so that the creature doesn’t move.
// Then we have the hand pose, which helps the player to change the rooms.
// Right hand (open) >>>> Bedroom
// Right hand (close) >>>> Kitchen
// Left hand (open) >>>> Bathroom
// Left hand (close) >>>> Living room
// Two hands open >>>> Basement
// Two hands close >>>> Back to the first frame
// Bedroom: there is a creature under the bed
// Kitchen: there is a creature on the empty corner of the kitchen
// Bathroom: the player stands in front of the mirror, and the mirror shows the player’s face and the creature behind her.
// Living room: the creature is on top of the ceiling
// The basement: the play goes a few stairs down and see a creature crawling toward her from the basement.
// The player will survive when she escapes all these rooms and come back to the first frame if she does it in 2 mins. Otherwise in the last scene the creature catches her and she becomes a ghost.

// Files:  rooms.js    the Room class + all six rooms (hallway + five)
//         creature.js Creature
//         body.js     faceMesh + handPose
//         sketch.js   this file: game states

let gameState = "start"; // which screen we're on: "start", "hallway", "room", "caught", "ghost", "win"

let video; // the webcam
let currentRoom; // the room the player is in at the moment (the hallway is a room too)
let hallway; // the first frame and starting point of the game
let creatures = []; // the creature(s) in the current room (0 or 1)
let dust = []; // dust particles (not used any more, kept so nothing breaks)

/// this is the timer and the game loop
let TOTAL_TIME = 60; // seconds the player has to win
let startTime = 0; // millis() when the game started
let penalty = 0; // seconds lost when a creature gets you (now always 0: being caught = game over)
let timeLeft = TOTAL_TIME; // seconds left, updated every frame

let closedEyesFrames = 0; // old start-screen counter (not used any more; closedSince replaced it)
let closedSince = -1; // millis() when the eyes closed on the start screen (-1 = open)
let roomTitleTimer = 0; // frames left to show the big room name when you enter a room
let hurtFlash = 0; // strength of the red flash (counts down to 0)
let scareImg = null; // the creature picture used for the jump scare / caught screen
let scareTimer = 0; // frames left for the quick jump-scare flash
let caughtTimer = 0; // frames since the "caught" screen started

// CREATURE SPEED (frames between her steps when you look away; ~30–60 frames = 1 second)
const CREATURE_WAIT = 25; // at the start of the game (it was 55)
const CREATURE_WAIT_MIN = 10; // the fastest she can ever get (it was 22)

// ---------- creature pictures ----------
// Every creature has 8 transparent pictures, one for each step it takes toward you.
// Each room's pictures live in their own folder, numbered 0–7,
// e.g. bedroom-creature/underbed_0.png … bedroom-creature/underbed_7.png
const CREATURE_FILES = {
  // room name → start of its picture file names
  hallway: "hallway-creature/ghost_", // hallway-creature/ghost_0.png … ghost_7.png
  bedroom: "bedroom-creature/underbed_", // bedroom pictures
  kitchen: "kitchen-creature/kitchen_creature_", // kitchen pictures
  bathroom: "bathroom-creature/possessed_", // bathroom (mirror) pictures
  livingroom: "livingroom-creature/living_room_creature_", // living room pictures
  basement: "basement-creature/creature_", // basement pictures
};
let creatureNames = Object.keys(CREATURE_FILES); // list of the names: "hallway", "bedroom", …
const FRAMES = 8; // pictures per creature
let rawFrames = {}; // the pictures as loaded
let creatureFrames = {}; // the same pictures made grey and creepy
let grainFrames = []; // 4 pre-made film-grain noise layers

function preload() {
  // p5 runs this first and waits until everything is loaded
  for (let name of creatureNames) {
    // for each room's creature...
    rawFrames[name] = []; // ...make an empty list for its pictures
    for (let i = 0; i < FRAMES; i++) {
      // for pictures 0 to 7
      let file = CREATURE_FILES[name] + i + ".png"; // build the file name, e.g. "bedroom-creature/underbed_3.png"
      // store each picture in its own place (i), so the order stays right
      loadImage(
        file, // which file
        (img) => (rawFrames[name][i] = img), // if it loads: put it in slot i
        () => console.log("No " + file), // if it's missing: just print a message (game still runs)
      );
    }
  }
  preloadBody(); // body.js (empty now; the models load in setup)
}

function setup() {
  // runs once, after preload
  let cnv = createCanvas(640, 480); // the game canvas
  if (select("#sketch-holder")) cnv.parent("sketch-holder"); // show the game inside the page's #sketch-holder div
  video = createCapture(VIDEO, { flipped: true }); // start the webcam, mirrored like a real mirror
  video.size(640, 480); // same size as the canvas
  video.hide(); // hide the extra <video> element; we draw it ourselves
  textFont("monospace"); // font for all text

  setupBody(); // checks ml5 loaded; detection starts by itself once camera + models are ready
  setupRooms(); // build all six rooms, from rooms.js
  hallway = roomForSign("bothClosed"); // the hallway is the room for "both fists"
  currentRoom = hallway; // we start in the hallway

  // make every picture grey and creepy (skip any that didn't load)
  for (let name of creatureNames) {
    // for each creature...
    creatureFrames[name] = []; // ...an empty list for the creepy versions
    for (let img of rawFrames[name]) {
      // for each loaded picture
      if (img) creatureFrames[name].push(prepareGhost(img)); // if it exists, add a grey high-contrast copy
    }
  }
  makeGrain(); // make the film-grain layers once (used on the end screens)
}

function draw() {
  // runs every frame (~60 times a second)
  background(0); // clear to black
  updateBody(gameState === "start"); // read face + hands; calibrate "straight ahead" only on the start screen

  if (gameState === "start") {
    // choose which screen to draw
    drawStart(); // title + instructions
  } else if (gameState === "hallway" || gameState === "room") {
    playFrame(); // the actual game
  } else if (gameState === "caught") {
    drawCaught(); // the creature rushes at you
  } else if (gameState === "ghost") {
    drawGhostEnding(); // you become a ghost
  } else if (gameState === "win") {
    drawWin(); // you escaped
  }
}

//////////////////// PLAYING //////////////////////
function playFrame() {
  // one frame of gameplay
  // ---- the clock ----
  timeLeft = TOTAL_TIME - (millis() - startTime) / 1000 - penalty; // total − seconds passed − penalty
  if (timeLeft <= 0) {
    // time is up
    timeLeft = 0; // don't show negative time
    gameState = "caught"; // → game over
    caughtTimer = 0; // start the caught animation from the beginning
    return; // stop drawing this frame
  }

  // ---- hand signs change the room ----
  let sign = confirmedGesture(); // a sign, only once it's held long enough (body.js)
  if (sign !== "none") goTo(sign); // go to that sign's room

  let lightOn = eyesOpen && faceFound; // the light is on only if a face is found AND eyes are open
  let radius = currentRoom.lightRadius; // size of the light circle in this room

  // ---- the scene ----
  currentRoom.display(); // draw the room (rooms.js)
  updateRoom(lightOn, radius); // move + draw the creature

  // ---- darkness: a hole where your headlamp points, or total black ----
  if (lightOn) {
    // light on:
    let flicker = random() < 0.04 ? random(-30, 0) : random(-3, 3); // usually a tiny wobble, sometimes (4%) a bigger dip
    drawDarkness(lookX, lookY, radius + flicker); // dark everywhere except a circle where you look
  } else {
    // light off:
    noStroke();
    fill(0, 250); // almost fully black
    rect(0, 0, width, height); // cover the whole room
  }

  // ---- things you can see in the dark ----
  for (let c of creatures) if (!c.room.mirror) c.displayGlimpse(); // faint creature glimpse in the dark (not in the bathroom mirror)

  if (hurtFlash > 0) {
    // a red flash is active
    noStroke();
    fill(150, 0, 0, hurtFlash); // red, as strong as hurtFlash
    rect(0, 0, width, height); // over the whole screen
    hurtFlash -= 8; // fade it out a bit each frame
  }
  drawJumpScare(); // quick scare flash, if one is active
  //drawGrain(); // film grain turned off (you wanted a clean picture)
  drawHUD(); // timer, room list, hints
}

function updateRoom(lightOn, radius) {
  // move the creature, check if it caught you, draw it
  let room = currentRoom; // shorter name

  // how long she waits between steps while you're NOT looking at her
  // (in frames: lower = faster). She also speeds up with every room you escape.
  let waitFrames = max(CREATURE_WAIT_MIN, CREATURE_WAIT - escapedCount() * 3); // 25, then 22, 19… but never below 10

  for (let i = creatures.length - 1; i >= 0; i--) {
    // for each creature (backwards loop)
    let c = creatures[i];
    c.checkLight(lightOn, lookX, lookY, radius); // is your light on her? (sets c.lit)
    c.update(justBlinked, waitFrames); // she steps closer if you blinked or looked away long enough

    if (c.caughtYou()) {
      // she reached her last picture
      // she got you → GAME OVER: her last picture rushes at you, then the ghost ending
      scareImg = c.currentImage(); // use her closest picture for the scare
      gameState = "caught"; // → caught screen
      caughtTimer = 0; // start its animation
      return; // stop here
    }
  }

  // the bathroom draws its creature itself, inside the mirror BEHIND you (see drawMirror in rooms.js)
  if (!room.mirror) for (let c of creatures) c.display(); // every other room: draw her normally
}

//////////////////// CHANGING ROOMS //////////////////////

function goTo(sign) {
  // move to the room that matches a hand sign
  let room = roomForSign(sign); // which room is this sign for? (rooms.js)
  if (!room || room === currentRoom) return; // no room, or already there → do nothing

  // ESCAPE: you leave while your light is on the creature
  for (let c of creatures) {
    // for the creature in the room you're leaving
    if (c.lit) {
      // your light is on her right now
      currentRoom.escaped = true; // → this room counts as escaped
    }
  }

  // WIN: all five rooms escaped and you make it back to the hallway in time
  if (room.isHallway && allEscaped()) {
    // going to the hallway with every room done
    gameState = "win"; // → you win
    return;
  }

  currentRoom = room; // enter the new room
  gameState = room.isHallway ? "hallway" : "room"; // set the state name
  creatures = []; // remove the old room's creature
  if (!room.escaped) {
    // the new room isn't escaped yet
    creatures.push(new Creature(room)); // ADD the creature that lives here (starts far away)
  }
  roomTitleTimer = 90; // show the big room name for 90 frames
}

// the five rooms you have to escape (the hallway is where you start and finish)
function roomsToEscape() {
  return rooms.filter((r) => !r.isHallway); // every room except the hallway
}

function allEscaped() {
  // are all five rooms escaped?
  return escapedCount() === roomsToEscape().length; // escaped count equals 5
}

function escapedCount() {
  // how many rooms are escaped so far
  let n = 0; // counter
  for (let r of roomsToEscape()) if (r.escaped) n++; // add 1 for each escaped room
  return n;
}

//////////////////// SCREENS //////////////////////

function drawStart() {
  // the start / title screen
  // the camera "catches" your face
  push();
  tint(255, 60); // very faint
  image(video, 0, 0, width, height); // draw the webcam in the background
  pop();
  if (faces.length > 0) {
    // a face is found
    noStroke();
    fill(200, 0, 0, 160); // red, see-through
    let k = faces[0].keypoints; // the face points
    for (let i = 0; i < k.length; i += 3) circle(k[i].x, k[i].y, 2); // draw every 3rd point as a small red dot
  }
  //drawGrain(); // grain off

  noStroke();
  textAlign(CENTER, CENTER); // text centred on its x, y
  fill(200, 0, 0); // red
  textSize(46);
  text("THE HOUSE", width / 2, 80); // title
  fill(200); // light grey
  textSize(15);
  text(
    // instruction lines, 22 px apart
    "You wear a light on your forehead. Turn your head to look.",
    width / 2,
    140,
  );
  text("Close your eyes and the light goes out.", width / 2, 162);
  text("They only move when you're not looking at them.", width / 2, 184);
  text(
    "Find it. Keep staring at it and make a hand sign to escape.",
    width / 2,
    206,
  );
  text(
    "Escape all 5 rooms and get back to the hallway in 1:00.",
    width / 2,
    228,
  );

  textSize(13);
  fill(170); // darker grey
  text(
    // the hand-sign list, line 1
    "RIGHT open: Bedroom   RIGHT fist: Kitchen   LEFT open: Bathroom",
    width / 2,
    290,
  );
  text(
    // line 2
    "LEFT fist: Living Room   BOTH open: Basement   BOTH fists: Hallway",
    width / 2,
    310,
  );

  fill(255); // white
  textSize(16);
  if (!faceFound) {
    // no face yet
    text("Look at the camera…", width / 2, 350);
  } else {
    // face found
    text(
      "Look straight ahead. Close your eyes for 2 seconds to enter.",
      width / 2,
      350,
    );
    // count real time, not frames: with two ml5 models running the frame rate
    // can drop to ~15 fps, and 120 frames would then take 8 seconds
    if (!eyesOpen) {
      // eyes are closed
      if (closedSince < 0) closedSince = millis(); // just closed → remember when
    } else closedSince = -1; // eyes open → reset
    let closedFor = closedSince < 0 ? 0 : millis() - closedSince; // milliseconds the eyes have been closed
    noFill();
    stroke(200, 0, 0); // red ring
    strokeWeight(4);
    arc(
      // a ring that fills up while your eyes are closed
      width / 2, // centre x
      395, // centre y
      40, // width
      40, // height
      -HALF_PI, // start at the top
      -HALF_PI + TWO_PI * min(1, closedFor / 2000), // end: full circle after 2000 ms
    );
    if (closedFor >= 2000) startGame(); // closed for 2 seconds → start
  }
}

function startGame() {
  // reset everything and begin
  for (let r of rooms) {
    // every room...
    r.escaped = false; // ...is not escaped yet
  }
  currentRoom = hallway; // start in the hallway
  creatures = [new Creature(hallway)]; // the hallway's creature is waiting for you
  dust = []; // clear dust (unused)
  penalty = 0; // no lost time
  startTime = millis(); // the clock starts now
  closedEyesFrames = 0; // reset (unused)
  closedSince = -1; // reset the eyes-closed timer
  scareTimer = 0; // no scare
  hurtFlash = 0; // no red flash
  roomTitleTimer = 90; // show "HALLWAY" big for 90 frames
  gameState = "hallway"; // → playing
}

// game over (a creature caught you, or time ran out): she comes for you
function drawCaught() {
  caughtTimer++; // one more frame of this screen
  let img = scareImg || anyCreaturePicture(); // the creature that caught you (or any creature if time ran out)
  scareImg = img; // remember it
  if (img) {
    // if we have a picture
    push();
    translate(width / 2 + random(-20, 20), height / 2 + random(-20, 20)); // centre of screen, shaking
    imageMode(CENTER); // draw the picture from its centre
    let h = height * lerp(0.6, 1.6, min(1, caughtTimer / 40)); // grows from 60% to 160% of screen height in 40 frames
    image(img, 0, 0, (h * img.width) / img.height, h); // draw it, keeping its shape
    pop();
  }
  noStroke();
  fill(150, 0, 0, random(60, 140)); // flickering red
  rect(0, 0, width, height); // over everything
  drawGrain(); // film grain
  if (caughtTimer > 70) gameState = "ghost"; // after 70 frames → ghost ending
}

// …and you become one of them
function drawGhostEnding() {
  push();
  tint(190, 205, 255); // cold bluish tint
  image(video, 0, 0, width, height); // your webcam
  pop();
  filter(GRAY); // make the whole canvas grey

  // hollow black eyes and mouth on YOUR face
  if (faces.length > 0) {
    // a face is found
    let k = faces[0].keypoints; // face points
    noStroke();
    fill(0); // black
    for (let eye of [L_EYE, R_EYE]) {
      // for each eye (point lists from body.js)
      let cx = (k[eye[2]].x + k[eye[3]].x) / 2; // eye centre x (between the corners)
      let cy = (k[eye[0]].y + k[eye[1]].y) / 2; // eye centre y (between the lids)
      let w = dist(k[eye[2]].x, k[eye[2]].y, k[eye[3]].x, k[eye[3]].y); // eye width
      ellipse(cx, cy, w * 1.5, w * 1.2); // big black hole over the eye
      rect(cx - 2, cy, 4, w * 1.4 + 10 * sin(frameCount * 0.05) + 10); // black drip that slowly grows and shrinks
    }
    let m1 = k[13], // top lip point
      m2 = k[14]; // bottom lip point
    ellipse((m1.x + m2.x) / 2, m2.y + 8, 30, 45); // black open mouth
  }

  noStroke();
  fill(220, 230, 255, 50); // pale blue haze
  rect(0, 0, width, height);
  if (random() < 0.08) {
    // 8% of frames:
    fill(0, 150);
    rect(0, random(height), width, random(5, 30)); // tracking glitch: a dark band at a random height
  }
  drawGrain(); // film grain

  textAlign(CENTER, CENTER);
  fill(200, 0, 0); // red
  textSize(36);
  text("YOU ARE ONE OF THEM NOW", width / 2, 60); // ending title
  fill(230);
  textSize(15);
  text(
    // how many rooms you escaped
    "Rooms escaped: " + escapedCount() + " / " + roomsToEscape().length,
    width / 2,
    420,
  );
  text("[ click or press R to try again ]", width / 2, 445); // restart hint
}

function drawWin() {
  // the winning screen
  push();
  tint(255, 120); // half see-through
  image(video, 0, 0, width, height); // your webcam
  pop();
  noStroke();
  fill(255, 240, 200, 40); // warm light wash
  rect(0, 0, width, height);
  drawGrain(); // film grain
  textAlign(CENTER, CENTER);
  fill(255);
  textSize(40);
  text("YOU ESCAPED THE HOUSE", width / 2, height / 2 - 30); // win title
  textSize(18);
  text("with " + formatTime(timeLeft) + " left", width / 2, height / 2 + 15); // time left
  textSize(15);
  text("[ click or press R to play again ]", width / 2, height / 2 + 60); // restart hint
}

//////////////////// HUD //////////////////////

function formatTime(t) {
  // seconds → "m:ss"
  t = max(0, ceil(t)); // round up, never below 0
  return floor(t / 60) + ":" + nf(t % 60, 2); // minutes + ":" + seconds with 2 digits (e.g. 0:07)
}

function drawHUD() {
  // the on-screen info while playing
  noStroke();
  textAlign(LEFT, TOP);
  textSize(26);
  fill(
    // timer colour:
    timeLeft < 20 && frameCount % 30 < 15 // under 20 s → blink
      ? color(255, 40, 40) // bright red half the time
      : color(200, 0, 0), // dark red otherwise
  );
  text(formatTime(timeLeft), 15, 12); // the timer, top-left

  // escaped rooms
  textSize(12);
  let list = roomsToEscape(); // the five rooms
  for (let i = 0; i < list.length; i++) {
    // one line per room
    let r = list[i];
    fill(r.escaped ? color(230, 200, 120) : color(110)); // gold if escaped, grey if not
    text((r.escaped ? "✓ " : "· ") + r.name, 15, 50 + i * 16); // "✓ Bedroom" or "· Bedroom", 16 px apart
  }

  // where am I + what to do
  textAlign(RIGHT, TOP);
  textSize(16);
  fill(200);
  text(currentRoom.name.toUpperCase(), width - 15, 14); // current room name, top-right
  textSize(12);
  fill(150);
  text(eyesOpen ? "eyes: open" : "eyes: CLOSED", width - 15, 36); // eye state under it
  if (!faceFound) {
    // camera lost your face
    fill(255, 80, 80); // red
    text("can't see your face!", width - 15, 52); // warning
  }

  // big room title when you walk in
  if (roomTitleTimer > 0) {
    // still showing the title
    textAlign(CENTER, CENTER);
    fill(255, map(roomTitleTimer, 0, 90, 0, 230)); // white that fades out as the timer goes down
    textSize(34);
    text(currentRoom.name.toUpperCase(), width / 2, height / 2 - 40); // big room name
    textSize(14);
    if (!currentRoom.escaped) text("find it", width / 2, height / 2); // hint, only if not escaped yet
    roomTitleTimer--; // count down
  }

  textAlign(CENTER, BOTTOM); // bottom-of-screen messages
  textSize(13);
  if (allEscaped() && !currentRoom.isHallway) {
    // all rooms done, not in hallway yet
    fill(255, 220, 120);
    text(
      "All rooms escaped! BOTH FISTS to get back to the hallway.",
      width / 2,
      height - 12,
    );
  } else if (currentRoom.escaped) {
    // this room is done
    fill(230, 200, 120);
    text(
      "You escaped this room. Make a hand sign to leave.",
      width / 2,
      height - 12,
    );
  } else if (currentRoom.isHallway) {
    // in the hallway: show the sign list
    fill(170);
    textSize(11);
    text(
      "R open: Bedroom · R fist: Kitchen · L open: Bathroom",
      width / 2 - 55, // shifted left so it doesn't hit the camera preview
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
    // a sign is being held
    let target = (roomForSign(gestureNow) || {}).name; // name of the room it leads to (or undefined)
    if (target) {
      // it's a real room
      noFill();
      stroke(255);
      strokeWeight(3);
      arc(
        // white ring that fills while you hold the sign
        width / 2,
        60,
        34,
        34,
        -HALF_PI, // start at the top
        -HALF_PI + TWO_PI * gestureProgress(), // full when the sign is confirmed
      );
      noStroke();
      fill(255);
      textAlign(CENTER, TOP);
      textSize(12);
      text("→ " + target, width / 2, 82); // "→ Kitchen" under the ring
    }
  }

  // you're looking at it → tell the player they can escape now
  for (let c of creatures) {
    // for the creature in this room
    if (c.lit) {
      // your light is on it
      noStroke();
      fill(255, 220, 120);
      textAlign(CENTER, TOP);
      textSize(14);
      text(
        "You see it! Keep staring and make a hand sign to escape.",
        width / 2,
        140,
      );
      break; // one message is enough
    }
  }

  // small camera preview so you can see your hands
  push();
  tint(255, 110); // half see-through
  image(video, width - 112, height - 90, 104, 78); // small webcam picture, bottom-right
  pop();
}

// the last picture of any creature that has pictures (for the final scare)
function anyCreaturePicture() {
  for (let name of creatureNames) {
    // go through the creatures
    let f = creatureFrames[name]; // its pictures
    if (f.length > 0) return f[f.length - 1]; // first one that has pictures → its last (closest) picture
  }
  return null; // no pictures loaded at all
}

//////////////////// EFFECTS //////////////////////
const BEAM_CLEAR = 0.7; // how much of the beam shows your room exactly as drawn (0.7 = 70%)

function drawDarkness(x, y, r) {
  // darkness with a soft round hole at (x, y)
  let ctx = drawingContext; // the plain HTML canvas drawing tool (p5 has no radial gradient)

  // inside BEAM_CLEAR: nothing is drawn over your room (its true colours)
  // from there to the edge: fades to near black
  let g = ctx.createRadialGradient(x, y, r * BEAM_CLEAR, x, y, r); // gradient from 70% of r to r
  g.addColorStop(0, "rgba(0,0,0,0)"); // inner edge: fully transparent
  g.addColorStop(1, "rgba(0,0,0,0.96)"); // outer edge and beyond: 96% black
  ctx.fillStyle = g; // paint with this gradient
  ctx.fillRect(0, 0, width, height); // over the whole canvas
}

function drawJumpScare() {
  // a short flash of the creature
  if (scareTimer <= 0) return; // no scare active → nothing
  // a quick flash of the last picture, shaking
  if (scareImg) {
    push();
    translate(width / 2 + random(-15, 15), height / 2 + random(-15, 15)); // centre, shaking
    imageMode(CENTER);
    let h = height * 1.35; // bigger than the screen
    image(scareImg, 0, 0, (h * scareImg.width) / scareImg.height, h); // draw it, keeping its shape
    pop();
  }
  scareTimer--; // count down
}

// make a picture grey and high-contrast (it keeps its transparent background)
function prepareGhost(src) {
  let img = src.get(); // a copy, so the original isn't changed
  if (img.height > 480) img.resize(0, 480); // shrink big pictures to 480 tall (faster)
  img.loadPixels(); // get access to the pixels
  for (let i = 0; i < img.pixels.length; i += 4) {
    // every pixel (4 numbers: r, g, b, a)
    let v =
      0.3 * img.pixels[i] + 0.59 * img.pixels[i + 1] + 0.11 * img.pixels[i + 2]; // brightness (grey value)
    v = constrain((v - 128) * 1.5 + 135, 0, 255); // more contrast (×1.5 around the middle), a bit brighter
    img.pixels[i] = v; // red = grey
    img.pixels[i + 1] = v; // green = grey
    img.pixels[i + 2] = v; // blue = grey (alpha i+3 untouched → stays transparent)
  }
  img.updatePixels(); // save the changes
  return img;
}

function makeGrain() {
  // make 4 noise pictures once
  for (let i = 0; i < 4; i++) {
    let g = createGraphics(width / 2, height / 2); // half size (faster), stretched later
    g.pixelDensity(1); // 1 pixel = 1 pixel (also on retina screens)
    g.loadPixels();
    for (let p = 0; p < g.pixels.length; p += 4) {
      // every pixel
      let v = random(255); // random grey
      g.pixels[p] = v;
      g.pixels[p + 1] = v;
      g.pixels[p + 2] = v;
      g.pixels[p + 3] = random(45); // very see-through
    }
    g.updatePixels();
    grainFrames.push(g); // keep it
  }
}

function drawGrain() {
  // draw one random grain layer over the screen
  push();
  tint(255, 160);
  image(random(grainFrames), 0, 0, width, height); // pick one of the 4 → it looks like moving grain
  pop();
}

//////////////////// MOUSE + KEYS //////////////////////

function mousePressed() {
  // p5 calls this on every click
  if (gameState === "start" && MOUSE_MODE)
    startGame(); // mouse mode: click to start
  else if (gameState === "ghost" || gameState === "win") gameState = "start"; // end screens: click to restart
}

function keyPressed() {
  // p5 calls this on every key press
  // Debug entry: separates the start-screen eye test from gesture testing.
  if (keyCode === ENTER && gameState === "start") {
    // ENTER on the start screen
    startGame(); // start without closing your eyes
    return;
  }
  if (key === "m" || key === "M") MOUSE_MODE = !MOUSE_MODE; // M: mouse mode on/off
  if (key === "s" || key === "S") SWAP_HANDS = !SWAP_HANDS; // S: swap left/right hands
  if (key === "c" || key === "C") recalibrateEyes(); // C: learn your eyes again
  if (key === "f" || key === "F") MIRROR_POINTS = !MIRROR_POINTS; // F: mirror the face/hand points
  if (key === "l" || key === "L") LIGHT_DIR = -LIGHT_DIR; // L: reverse the light direction
  if (key === "d" || key === "D") SHOW_ML5_DEBUG = !SHOW_ML5_DEBUG; // D: debug box on/off (box isn't drawn any more)
  if (
    (key === "r" || key === "R") && // R...
    (gameState === "ghost" || gameState === "win") // ...on an end screen
  )
    gameState = "start"; // → back to the start
  if (gameState === "hallway" || gameState === "room") {
    // while playing
    let sign = keyboardRoom(); // keys 1–5 / H act like hand signs (body.js)
    if (sign !== "none") goTo(sign); // go to that room
  }
}

// Always-visible diagnostics while playing (press D to toggle).
// (NOT USED any more: you removed its call from playFrame. You can delete this whole section.)
let SHOW_ML5_DEBUG = true; // debug box on/off
function drawML5Debug() {
  // a box at the bottom with model / camera / hand info
  if (!SHOW_ML5_DEBUG) return; // switched off → nothing
  push();
  noStroke();
  fill(0, 205); // dark box
  rect(8, height - 91, width - 16, 73, 6); // rounded rectangle at the bottom
  fill(255);
  textAlign(LEFT, TOP);
  textSize(12);
  text(
    // line 1: are the models + camera working?
    "Face model: " +
      !!bodyStatus.faceReady +
      "   Hand model: " +
      !!bodyStatus.handReady +
      "   camera: " +
      bodyStatus.camera +
      "   face callbacks: " +
      bodyStatus.faceResults +
      "   hand callbacks: " +
      bodyStatus.handResults,
    16,
    height - 84,
  );
  text(
    // line 2: hands, which side, current sign, how long held
    "Hands: " +
      hands.length +
      "   raw: " +
      hands.map((h) => h.handedness).join(",") +
      "   gesture: " +
      readGesture() +
      "   held: " +
      gestureFrames +
      "/" +
      GESTURE_HOLD,
    16,
    height - 65,
  );
  let ml5Error = // the first error message, if any
    bodyStatus.error || bodyStatus.faceError || bodyStatus.handError;
  if (ml5Error) {
    fill(255, 120, 120); // red
    text(String(ml5Error).slice(0, 92), 16, height - 46); // line 3: the error (max 92 characters)
  }
  pop();
}
