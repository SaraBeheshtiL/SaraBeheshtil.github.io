// Making an animation

let frames = [];

async function setup() {
  createCanvas(600, 600);

  for (let i = 0; i < 8; i = i + 1) {
    frames[i] = await loadImage("dance-frames/frame_" + (i + 1) + ".png");
  }
}

function draw() {
  background(160);
  let speed = 10;
  let slowframe = floor(frameCount / speed);
  let index = slowframe % 8;
  image(frames[index], 100, 100, 100, 100);
}

// stop the animaation... Creating a Boolean conditional
let playing = true;
function mousePressed() {
  if (playing == true) {
    noLoop();
    playing = false;
  } else {
    loop();
    playing = true;
  }
}
