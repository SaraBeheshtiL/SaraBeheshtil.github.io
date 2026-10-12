//Assignment 1: A Spider (Dunphy) Hunting a Fly (Jay)

//Creating the background flickering grids
// Number of columns and rows
let numCol = 10;
let numRow = 10;

// Width and height of each cell
let colWidth;
let rowHeight;

// The only two colors cells can have
let colors = ["yellow", "black"];

function setup() {
  const canvas = createCanvas(800, 800);

  // puts the canvas inside <div id="sketch-holder"> in index.html
  canvas.parent("sketch-holder");

  // Defining the grids' cells width and height
  colWidth = Width / numCol;
  rowHeight = Height / numRow;

  // Controls how fast the grid flickers
  frameRate(10);
}

function draw() {
  background(0);
  for (i = 0; i < numCol; i = i + 1) {
    for (j = 0; j < numRow; j = j + 1) {
      // Randomly choose yellow or black
      fill(random(colors));
      // Grid lines
      stroke(255);
      strokeWeight(1);

      rect(i * colWidth, j * rowHeight, colWidth, rowHeight);
    }
  }
}
