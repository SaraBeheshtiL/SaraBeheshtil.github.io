/// FLASHLIGHT — a horror body game
// A dark room full of doors. Things come out of them.
// They only move when you are NOT looking at them.
//
// Version 1: the MOUSE is the flashlight.
// Later: handPose moves the light (see updateInputs()).

let gameState = "start"; // "start", "playing", "gameOver", "win"

let video;
let creatures = [];

let lives = 3;
let score = 0;
let gameLength = 60; // seconds to survive
let timeLeft = gameLength;
let startTime = 0;
let level = 1;

let lastSpawn = 0;
let spawnInterval = 3000; // ms between new creatures

let lightX, lightY; // the flashlight (later: your hand)
let lightRadius = 130;

let hurtFlash = 0;

// ---------- horror images ----------
// Put image files next to index.html with these names.
// Missing ones are skipped (then she falls back to the drawn ghost).
let ghostFiles = ["ghost1.png", "ghost2.png", "ghost3.png"];
let ghostRaw = [];
let ghostImages = [];

let grainFrames = [];
let scareImg = null; // the face that jumps at you
let scareTimer = 0;

function preload() {
  for (let f of ghostFiles) {
    loadImage(
      f,
      (img) => ghostRaw.push(img),
      () => console.log("Could not load " + f),
    );
  }
}

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  textFont("monospace");

  setupRoom(); // builds the doors and draws the room once (room.js)

  for (let img of ghostRaw) {
    ghostImages.push(prepareGhost(img));
  }

  // a few frames of film grain to flicker between
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

function draw() {
  background(0);
  updateInputs();

  if (gameState === "start") {
    drawStartScreen();
  } else if (gameState === "playing") {
    playGame();
  } else if (gameState === "gameOver") {
    drawEndScreen(false);
  } else if (gameState === "win") {
    drawEndScreen(true);
  }
}

// ---------- INPUT: swap the mouse for your body here ----------
function updateInputs() {
  lightX = mouseX;
  lightY = mouseY;
  // LATER (handPose): if (hands.length > 0) { lightX = hands[0].keypoints[9].x; lightY = hands[0].keypoints[9].y; }
}

// ---------- THE GAME ----------
function playGame() {
  displayRoom();

  // timer and levels — harder every 15 seconds
  let elapsed = (millis() - startTime) / 1000;
  timeLeft = max(0, gameLength - floor(elapsed));
  level = 1 + floor(elapsed / 15);
  spawnInterval = max(1000, 3000 - (level - 1) * 600);
  let maxCreatures = 2 + level;

  // ADD a creature at a random door
  if (millis() - lastSpawn > spawnInterval && creatures.length < maxCreatures) {
    creatures.push(new Creature(randomDoor(), 0.035 + level * 0.012));
    lastSpawn = millis();
  }

  // update (backwards, because we splice)
  for (let i = creatures.length - 1; i >= 0; i--) {
    let c = creatures[i];
    c.checkLight(lightX, lightY, lightRadius);
    c.move();

    if (c.isDead()) {
      creatures.splice(i, 1); // REMOVE: banished by the light
      score++;
    } else if (c.reachedYou()) {
      creatures.splice(i, 1); // REMOVE: she got you
      lives--;
      hurtFlash = 200;
      scareImg = c.img;
      scareTimer = 22;
    }
  }

  // far ones first, near ones on top
  creatures.sort((a, b) => a.p - b.p);
  for (let c of creatures) {
    c.display();
  }

  // darkness with a hole where the light is
  let flicker = random() < 0.05 ? random(-40, 0) : random(-4, 4);
  drawDarkness(lightX, lightY, lightRadius + flicker);

  for (let c of creatures) {
    c.displayGlimpse();
  }

  if (hurtFlash > 0) {
    noStroke();
    fill(150, 0, 0, hurtFlash);
    rect(0, 0, width, height);
    hurtFlash -= 8;
  }

  drawJumpScare();
  drawGrain();
  drawHUD();

  // win / lose (let the jump scare finish first)
  if (lives <= 0 && scareTimer <= 0) {
    gameState = "gameOver";
  } else if (timeLeft <= 0) {
    gameState = "win";
  }
}

function drawDarkness(x, y, r) {
  let ctx = drawingContext;
  let g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.95)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);

  // a faint warm glow inside the beam
  let glow = ctx.createRadialGradient(x, y, 0, x, y, r * 0.8);
  glow.addColorStop(0, "rgba(255,235,190,0.15)");
  glow.addColorStop(1, "rgba(255,235,190,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);
}

function drawHUD() {
  noStroke();
  fill(200, 0, 0);
  textSize(18);
  textAlign(LEFT, TOP);
  text("LIVES " + "♥".repeat(max(0, lives)), 15, 15);
  text("BANISHED " + score, 15, 40);
  textAlign(RIGHT, TOP);
  text(timeLeft + "s", width - 15, 15);
  text("LEVEL " + level, width - 15, 40);
}

// ---------- horror effects ----------

// turn a photo into a grey, high-contrast face that fades into the dark
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

function drawGrain() {
  push();
  tint(255, 160);
  image(random(grainFrames), 0, 0, width, height);
  pop();
}

function drawJumpScare() {
  if (scareTimer <= 0) return;
  if (scareImg) {
    push();
    translate(width / 2 + random(-15, 15), height / 2 + random(-15, 15));
    imageMode(CENTER);
    let h = height * 1.35;
    let w = (h * scareImg.width) / scareImg.height;
    tint(255, 245);
    image(scareImg, 0, 0, w, h);
    pop();
  }
  scareTimer--;
}

// ---------- SCREENS ----------
function drawStartScreen() {
  displayRoom();
  drawDarkness(mouseX, mouseY, 110);
  drawGrain();

  noStroke();
  textAlign(CENTER, CENTER);
  fill(200, 0, 0);
  textSize(56);
  text("FLASHLIGHT", width / 2, height / 2 - 70);
  fill(190);
  textSize(16);
  text("Something lives behind these doors.", width / 2, height / 2 - 10);
  text("They only move when you're not looking.", width / 2, height / 2 + 15);
  text("Hold your light on them to banish them.", width / 2, height / 2 + 40);
  text("Survive " + gameLength + " seconds.", width / 2, height / 2 + 65);
  fill(255);
  text("[ click to begin ]", width / 2, height / 2 + 115);
}

function drawEndScreen(won) {
  if (!won && scareImg) {
    push();
    imageMode(CENTER);
    tint(255, 45 + random(10));
    let h = height;
    image(
      scareImg,
      width / 2,
      height / 2,
      (h * scareImg.width) / scareImg.height,
      h,
    );
    pop();
  }
  drawGrain();
  noStroke();
  textAlign(CENTER, CENTER);
  if (won) {
    fill(230);
    textSize(44);
    text("DAWN BREAKS", width / 2, height / 2 - 40);
  } else {
    fill(200, 0, 0);
    textSize(44);
    text("THEY GOT YOU", width / 2, height / 2 - 40);
  }
  fill(180);
  textSize(18);
  text("Banished: " + score + "   Level: " + level, width / 2, height / 2 + 10);
  text("[ click to play again ]", width / 2, height / 2 + 60);
}

function mousePressed() {
  if (gameState !== "playing") {
    resetGame();
    gameState = "playing";
  }
}

function resetGame() {
  creatures = [];
  lives = 3;
  score = 0;
  level = 1;
  timeLeft = gameLength;
  startTime = millis();
  lastSpawn = millis() - spawnInterval + 600; // first one comes quickly
  hurtFlash = 0;
  scareTimer = 0;
}
