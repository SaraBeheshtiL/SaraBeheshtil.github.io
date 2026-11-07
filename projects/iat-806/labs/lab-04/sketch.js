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
let maxD; // the max
let mouseI; // the corresponding (i) for the cell which mouse is inside
let mouseJ; // the corresponding (j) for the cell which mouse is inside

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
      if (j % 2 == 0) {
        colors[i][j] = [28, 28, 28]; // I want the background of the first dance be gray
      } else {
        /// I want the second dance's background be blue color. I found the name of this color from Claude.
        colors[i][j] = [50, 90, 180];
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
  background(255);

  // Changing the number of columns based on the position the mouse
  if (mouseX < width) {
    numCols = Math.floor(map(mouseX, 0, width, 10, 20));
    colWidth = width / numCols;
  }

  for (let i = 0; i < numCols; i++) {
    for (let j = 0; j < numRows; j++) {
      // I want to check if mouse is inside this cell, I want to ask the program to show the couple_frames, Kiky & Bohoo, instead when mouse is inside a cell
      let mouseInside =
        mouseX >= i * colWidth &&
        mouseX < (i + 1) * colWidth &&
        mouseY >= j * rowHeight &&
        mouseY < (j + 1) * rowHeight;
      /// If mouse is inside cell (i,j), then let the variables of mouseI & mouseJ be i and j.
      if (mouseInside) {
        mouseI = i;
        mouseJ = j;
      }
      ///// we define doubelFrame for when the mouse is inside a cell and that frame becomes double size
      let doubleFrame =
        (i == mouseI || i == mouseI + 1) && (j == mouseJ || j == mouseJ + 1);
      /// distance is defined by the location of mouse compared to the center of that cell
      let d = dist(i * colWidth, j * rowHeight, mouseX, mouseY);
      let depth = Math.floor(map(d, 0, maxD, 230, 80)); // depth is the opacity of cell-color
      if (!doubleFrame) {
        // drawing normal cell
        fill(colors[i][j][0], colors[i][j][1], colors[i][j][2], depth);
        rect(i * colWidth, j * rowHeight, colWidth, rowHeight);
        // dist the mouse position and the position of the dancing profs
        // in the grid, and then use that number to map to the speed.
        speeds[i][j] = Math.floor(map(d, 0, maxD, 2, 50));
        if (j % 2 == 0) {
          // animating first dance frames in even rows
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
            // animating the second dance frames in odd rows
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
          ///// I want the mouseInside cell shows frames3 when mouse is inside
          frames3,
          10,
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
