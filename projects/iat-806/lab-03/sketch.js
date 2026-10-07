// Making an animation

let frames = [];
let frames1 = [];
let frames2 = [];
let frames3 = [];
let frames4 = [];
let frames5 = [];
let frames6 = [];
let discoBall;

let dog1Frame = 0;
let dog2Frame = 0;
let dog3Frame = 0;
let dog4Frame = 0;
let dog5Frame = 0;

// the Chow Chow and Puddle
let chowFrame = 0;
let poodleFrame = 0;

let chowX = -150;
let poodleX = 600;

// Sound array
let sounds = [];
let soundIndex = 0;

//the soundtrack which is currently playing
let currentSound = 0;

async function setup() {
  createCanvas(600, 600);
  discoBall = await loadImage("discoBall/discoBall.png");

  for (let i = 0; i < 8; i = i + 1) {
    frames[i] = await loadImage("dance-frames/frame_" + (i + 1) + ".png");
    frames1[i] = await loadImage("dance-frames1/frame_" + (i + 1) + ".png");
    frames2[i] = await loadImage("dance-frames2/frame_" + (i + 1) + ".png");
    frames3[i] = await loadImage("dance-frames3/frame_" + (i + 1) + ".png");
    frames4[i] = await loadImage("dance-frames4/frame_" + (i + 1) + ".png");
    frames5[i] = await loadImage("dance-frames5/frame_" + (i + 1) + ".png");
    frames6[i] = await loadImage("dance-frames6/frame_" + (i + 1) + ".png");
  }

  for (let i = 0; i < 4; i = i + 1) {
    sounds[i] = await loadSound("sounds/sound" + i + ".mp3");
  }
}

function draw() {
  background(10);
  drawDiscoBall();
  drawDanceFloor();

  // Animating the dogs on floor

  let speed = 20;
  // Fast techno
  if (currentSound == 0) {
    speed = 7;
  }

  // Slow blues
  if (currentSound == 1) {
    speed = 25;
  }

  // Billie Jean
  if (currentSound == 2) {
    speed = 10;
  }

  // ABBA Dancing Queen
  if (currentSound == 3) {
    speed = 12;
  }

  // Change frame every 20 draw cycles
  if (frameCount % speed == 0) {
    if (dog1Playing) {
      dog1Frame = (dog1Frame + 1) % 8;
    }

    if (dog2Playing) {
      dog2Frame = (dog2Frame + 1) % 8;
    }

    if (dog3Playing) {
      dog3Frame = (dog3Frame + 1) % 8;
    }

    if (dog4Playing) {
      dog4Frame = (dog4Frame + 1) % 8;
    }

    if (dog5Playing) {
      dog5Frame = (dog5Frame + 1) % 8;
    }

    // Chow Chow dances only during song 2
    if (currentSound == 2) {
      chowFrame = (chowFrame + 1) % 8;
    }

    // Poodle dances only during song 3
    if (currentSound == 3) {
      poodleFrame = (poodleFrame + 1) % 8;
    }
  }

  // Drawing each dog with image function
  image(frames[dog1Frame], 100, 400, 100, 100);
  image(frames1[dog2Frame], 300, 400, 110, 110);
  image(frames2[dog3Frame], 400, 400, 110, 110);
  image(frames3[dog4Frame], 50, 450, 100, 100);
  image(frames4[dog5Frame], 155, 470, 100, 100);

  // BILLIE JEAN
  if (currentSound == 2) {
    // Chow Chow walks onto the floor
    if (chowX < 225) {
      chowX = chowX + 3;
    }
    image(frames5[chowFrame], chowX, 250, 150, 150);
  }

  // POODLE SONG
  if (currentSound == 3) {
    // Poodle enters from the right
    if (poodleX > 225) {
      poodleX = poodleX - 3;
    }
    image(frames6[poodleFrame], poodleX, 200, 150, 150);
  }

  // Have the chow chow outside of the dance floor when sound 0, 1 is playing
  if (currentSound != 2) {
    chowX = -150;
  }

  if (currentSound != 3) {
    poodleX = 600;
  }
}

function mousePressed() {
  // Turn on audio after user interaction
  userStartAudio();
  // Stop the previous song
  for (let i = 0; i < sounds.length; i = i + 1) {
    sounds[i].stop();
  }
  // Rememebr which songs is playing currently
  currentSound = soundIndex;

  // Play the current song
  sounds[currentSound].play();

  // Move to the next song
  soundIndex = (soundIndex + 1) % sounds.length;
}

// each dog is dancing or not, defining boolean variable
let dog1Playing = true;
let dog2Playing = true;
let dog3Playing = true;
let dog4Playing = true;
let dog5Playing = true;

function keyPressed() {
  // Spacebar pauses / restarts everything
  if (key == " ") {
    if (isLooping()) {
      noLoop();
    } else {
      loop();
    }
  }

  // 1 pauses / plays dog 1
  if (key == "1") {
    dog1Playing = !dog1Playing;
  }

  // 2 pauses / plays dog 2
  if (key == "2") {
    dog2Playing = !dog2Playing;
  }

  // 3 pauses / plays dog 3
  if (key == "3") {
    dog3Playing = !dog3Playing;
  }

  // 4 pauses / plays dog 4
  if (key == "4") {
    dog4Playing = !dog4Playing;
  }

  // 5 pauses / plays dog 5
  if (key == "5") {
    dog5Playing = !dog5Playing;
  }
}

// Defining my own function for Disco Ball
function drawDiscoBall() {
  let x = width / 2;

  // String
  stroke(180);
  strokeWeight(2);
  line(x, 0, x, 50);

  // disco ball
  image(discoBall, x - 65, 40, 130, 130);
}

// Defining my own function for Dance floor
function drawDanceFloor() {
  let tileSize = 12;
  let floorY = 270;
  // Nested loops
  for (let y = floorY; y < 400; y = y + tileSize) {
    for (let x = 0; x < width; x = x + tileSize) {
      // Makes each tile color changes in Sine waves
      let silver = 150 + 50 * sin(x + y);
      fill(silver);
      stroke(60);
      strokeWeight(1);
      rect(x, y, tileSize, tileSize);
    }
  }
}
