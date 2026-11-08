//////////////////// HAUNTED ROOM SKETCH ////////////////////

let faceMesh;
let options = {
  maxFaces: 1,
  refineLandmarks: false,
  flipped: false,
};

let video;
let faces = [];

async function setup() {
  let canvas = createCanvas(640, 480);
  canvas.parent("sketch-holder");

  // Initialize the haunted room
  setupRoom();

  // Face Mesh can be enabled later
  // faceMesh = await ml5.faceMesh(options);
  // video = createCapture(VIDEO);
  // video.size(640, 480);
  // video.hide();
  // faceMesh.detectStart(video, gotFaces);
}

function draw() {
  background(0);

  // Draw the haunted room
  displayRoom();
}

function gotFaces(results) {
  faces = results;
}
