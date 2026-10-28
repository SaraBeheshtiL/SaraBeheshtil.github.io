let xposition, yposition;
let balls = [];
let numOfBalls = 5000;
let x, y, d, c;

////// Video ///////
let bodySegmentation; //Define a variable to store the BodySegmentation model.
let options = {
  maskType: "person",
};
let video;
let segmentation;
let pixels = [];

async function setup() {
  createCanvas(640, 480);
  bodySegmentation = await ml5.bodySegmentation("BodyPix", options);

  // Create the video and hide it

  video = createCapture(VIDEO);
  video.size(640, 480);
  video.hide();
  bodySegmentation.detectStart(video, gotResults);

  for (let i = 0; i < numOfBalls; i = i + 1) {
    x = random(0, width);
    y = random(0, height);
    d = 30 + random(-10, 10);
    c = color(0, 100, random([50, 255]), 100);
    balls[i] = new Ball(x, y, d, c);
  }
}
function gotResults(result) {
  segmentation = result;
}

function draw() {
  background(0);
  //image(video, 0, 0);
  if (segmentation) {
    // image(segmentation.mask, 0, 0, width, height);
    segmentation.mask.loadPixels(); //
    // read the mask's pixels once per frame
  }

  for (let i = 0; i < numOfBalls; i = i + 1) {
    balls[i].move();
    if (segmentation) {
      balls[i].ballsOnBody();
    }
    balls[i].show();
    balls[i].red();
  }
}
