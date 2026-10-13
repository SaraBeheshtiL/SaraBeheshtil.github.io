// IAT 806 · Lab 04 starter: the dancer grid from Week 4, ready for your website.
// Run with Live Server. Uses p5 2.x (async setup, await loadImage).

let frames = []; // the 8 dance poses
let frames2 = []; // twirk poses
let frames3 = []; // couple poses
let numFrames = 8;

let numCols = 20;
let numRows = 10;
let colWidth;
let rowHeight;
let maxD;
let mouseI;
let mouseJ;

// 2D arrays: one color and one speed for every cell in the grid
let colors = [];
let speeds = [];

async function setup() {
  const canvas = createCanvas(800, 800);

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");
  // I'm defining the possible maxiumum distance on canvas, I need it for later
  maxD = dist(0, 0, width, height);

  for (let i = 0; i < numCols; i++) {
    colors[i] = [];
    speeds[i] = [];
    for (let j = 0; j < numRows; j++) {
      if (frameCount % 10 == 0) {
        if (j % 2 == 0) {
          colors[i][j] = random(["gray", "darkgray"]);
        } else {
          /// I want the cats background be a random blue color. I found the name of these colors from Claude.
          colors[i][j] = random([
            "powderblue",
            "lightblue",
            "lightskyblue",
            "steelblue",
          ]);
        }
      }
    }
  }

  rowHeight = height / numRows;

  for (let i = 0; i < numFrames; i++) {
    let fileName = "dance_frames/frame_" + (i + 1) + ".png";
    frames.push(await loadImage(fileName));
    let fileName1 = "another_dance_frames/frame_" + (i + 1) + ".png";
    frames2.push(await loadImage(fileName1));
    let fileName2 = "couple_frames/frame_" + (i + 1) + ".png";
    frames3.push(await loadImage(fileName2));
  }
}

function draw() {
  background(120);

  // Changing the number of columns based on the position the mouse
  if (mouseX < width) {
    numCols = Math.floor(map(mouseX, 0, width, 10, 20));
    colWidth = width / numCols;
  }

  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      // I want to check if mouse is inside this cell, I want to ask the program to show the couple frames instead when mouse is inside a cell
      let mouseInside =
        mouseX >= i * colWidth &&
        mouseX < (i + 1) * colWidth &&
        mouseY >= j * rowHeight &&
        mouseY < (j + 1) * rowHeight;

      if (mouseInside) {
        mouseI = i;
        mouseJ = j;
      }

      let doubleFrame =
        (i == mouseI || i == mouseI + 1) && (j == mouseJ || j == mouseJ + 1);
      let d = dist(i * colWidth, j * rowHeight, mouseX, mouseY);
      let depth = Math.floor(map(d, 0, maxD, 255, 50));
      if (!doubleFrame) {
        // drawing normal cell
        fill(colors[i][j]);
        rect(i * colWidth, j * rowHeight, colWidth, rowHeight);
        // dist the mouse position and the position of the dancing profs
        // in the grid, and then use that number to map to the speed.
        speeds[i][j] = Math.floor(map(d, 0, maxD, 2, 50));
        if (j % 2 == 0) {
          animate(
            frames,
            speeds[i][j],
            i * colWidth,
            j * rowHeight,
            colWidth,
            rowHeight,
          );
        } else {
          animate(
            frames2,
            speeds[i][j],
            i * colWidth,
            j * rowHeight,
            colWidth,
            rowHeight,
          );
        }
      }
      // Check if mouse is inside a cell
      if (mouseInside) {
        fill(colors[i][j][0], colors[i][j][1], colors[i][j][2], depth);
        rect(
          mouseI * colWidth,
          mouseJ * rowHeight,
          2 * colWidth,
          2 * rowHeight,
        );
        animate(
          frames3,
          30,
          i * colWidth,
          j * rowHeight,
          2 * colWidth,
          2 * rowHeight,
        );
      }
    }
  }
}

// draws one dancer: which poses, how fast, where, and how big
function animate(frames, speed, xPosition, yPosition, imageWidth, imageHeight) {
  let index = getFrameIndex(speed);
  let currentFrame = frames[index];
  let origWidth = currentFrame.width;
  let origHeight = currentFrame.height;
  if (imageWidth && !imageHeight) {
    let scale = imageWidth / origWidth;
    imageHeight = scale * origHeight;
  }
  // TODO, complete the keeping scale correct logic.
  image(currentFrame, xPosition, yPosition, imageWidth, imageHeight);
}

// which pose to show right now. speed = draw-frames per pose: smaller = faster
function getFrameIndex(speed) {
  let slowFrame = Math.floor(frameCount / speed);
  let index = slowFrame % frames.length;
  return index;
}
