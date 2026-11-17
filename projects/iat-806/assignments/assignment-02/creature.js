//////////////////// Creature //////////////////////
// THE RULE:
//   While your headlamp is on her (eyes open, looking at her) → she FREEZES.
//   Look away, or close your eyes → she gets one step closer.
//   Every blink = one step closer, right away.
//   When she reaches her last (closest) picture → she got you: game over.
// Each creature has 8 transparent pictures. In most rooms the pictures already
// show her coming closer, so she is drawn in the same place every step.
// In the bathroom the pictures are all the same size, so she grows using
// room.appearance → room.end.

class Creature {
  // a blueprint: sketch.js makes one with "new Creature(room)" each time you enter a room
  constructor(room) {
    // runs once when the creature is made
    this.room = room; // the room she lives in

    // where the picture is drawn: x, y = centre, s = height as a fraction of the screen
    this.from = room.appearance; // where/how big she is at her first step (far away)
    this.to = room.end; // where/how big she is at her last step (in your face)

    this.frames = creatureFrames[room.creatureName] || []; // her 8 grey pictures (or an empty list if none loaded)
    this.totalSteps = max(1, this.frames.length); // one step per picture (8); at least 1 so we never divide by 0
    this.step = 0; // which step/picture she's on now (starts at 0 = far away)
    this.wait = 40; // frames before her FIRST step (after that, sketch.js sets the speed)
    this.nextMove = frameCount + this.wait; // the frame number when she's allowed to step next

    this.lit = false; // is the headlamp on her?
    this.updatePosition(); // work out her starting x, y and size
  }

  updatePosition() {
    // set x, y and size for the current step
    let t = this.step / max(1, this.totalSteps - 1); // 0 at the first step → 1 at the last step
    this.x = lerp(this.from.x, this.to.x, t); // x moves from "appearance" to "end"
    this.y = lerp(this.from.y, this.to.y, t); // y moves the same way
    this.sc = lerp(this.from.s, this.to.s, t); // size grows the same way
  }

  currentImage() {
    // the picture for the current step
    let index = min(this.step, this.frames.length - 1); // step number, but never past the last picture
    return this.frames[index]; // that picture (undefined if no pictures loaded)
  }

  // the rectangle the picture is drawn in
  drawBox() {
    let img = this.currentImage(); // current picture
    let h = height * this.sc; // height = screen height × size (e.g. 0.3 → 144 px)
    let w = img ? (h * img.width) / img.height : h; // width keeps the picture's shape (square if no picture)
    return { x: this.x - w / 2, y: this.y - h / 2, w: w, h: h }; // top-left corner + size (x, y are the centre)
  }

  // where she actually is on screen: the middle of the picture's visible pixels
  // (the pictures have lots of empty space, so the picture's centre isn't her)
  bodyOnScreen() {
    let img = this.currentImage(); // current picture
    let b = this.drawBox(); // where it is drawn
    let m = img ? measureFrame(img) : { cx: 0.5, cy: 0.5, size: 0.3 }; // her body inside the picture (0–1 values), or a guess
    return { x: b.x + m.cx * b.w, y: b.y + m.cy * b.h, size: m.size * b.h }; // turn those 0–1 values into screen pixels
  }

  checkLight(lightOn, lightX, lightY, radius) {
    // is your light on her? (sets this.lit)
    let body = this.bodyOnScreen(); // where her body is on screen
    let d = dist(body.x, body.y, lightX, lightY); // distance from her body to the light's centre
    this.lit = lightOn && d < radius + body.size * 0.35; // lit if the light is on AND close enough (bigger body = easier to hit)
  }

  update(blinked, waitFrames = 90) {
    // called every frame: should she step?
    this.wait = waitFrames; // she gets faster in later rooms (sketch.js sends a smaller number)
    if (blinked) {
      // you just blinked
      this.moveCloser(); // a blink always lets her move
      return; // done for this frame
    }
    if (this.lit) {
      // you're looking at her
      this.nextMove = frameCount + this.wait; // frozen while you stare: keep pushing her next step into the future
      return;
    }
    if (frameCount >= this.nextMove) this.moveCloser(); // not looked at and her wait is over → step
  }

  moveCloser() {
    // one step closer
    if (this.step >= this.totalSteps) return; // already past the end → do nothing
    this.step++; // next step / next picture
    if (this.step < this.totalSteps) this.updatePosition(); // new position and size (if still a real step)
    this.nextMove = frameCount + this.wait; // she must wait again before the next step
  }

  // she has got you as soon as she reaches her LAST picture (the closest one).
  // (looking at her then doesn't help any more: she's already in your face)
  caughtYou() {
    return this.step >= this.totalSteps - 1; // on step 7 of 0–7 → true → game over
  }

  display(alpha = 255) {
    // draw her (alpha = see-through amount, 255 = solid)
    let img = this.currentImage(); // current picture
    if (!img) return; // no picture → draw nothing
    let b = this.drawBox(); // where to draw it

    push(); // save drawing settings
    // bathroom: she only exists IN the mirror, behind you
    if (this.room.mirror) {
      // this room has a mirror
      let m = this.room.mirror; // the mirror rectangle
      drawingContext.save(); // save the canvas state (so the clip can be removed after)
      drawingContext.beginPath(); // start a shape
      drawingContext.rect(m.x, m.y, m.w, m.h); // the shape = the mirror rectangle
      drawingContext.clip(); // from now on, only draw INSIDE that rectangle
    }
    if (alpha < 255) tint(255, alpha); // make her see-through if asked
    image(img, b.x, b.y, b.w, b.h); // draw the picture
    if (this.room.mirror) drawingContext.restore(); // remove the mirror clip
    pop(); // restore drawing settings (removes the tint)
  }

  // drawn AFTER the darkness: a faint flicker of her, so the player knows
  // something is there even with the light pointed away
  displayGlimpse() {
    if (this.lit) return; // you can already see her → no glimpse needed
    if (random() < 0.03) this.display(35); // 3% of frames: draw her very faint (35 of 255)
  }
}

// Find the centre and size of the visible (non-transparent) part of a picture.
// Worked out once per picture and remembered.
function measureFrame(img) {
  if (img._measure) return img._measure; // already measured this picture → reuse the answer
  img.loadPixels(); // get access to the pixels
  let sx = 0, // sum of x of all visible pixels
    sy = 0, // sum of y of all visible pixels
    n = 0; // how many visible pixels
  let minY = img.height, // highest visible pixel (starts at the bottom, moves up)
    maxY = 0; // lowest visible pixel (starts at the top, moves down)
  let stepPx = 4; // check every 4th pixel, it's plenty (16× faster)
  for (let y = 0; y < img.height; y += stepPx) {
    // go down the rows
    for (let x = 0; x < img.width; x += stepPx) {
      // go across each row
      let a = img.pixels[(y * img.width + x) * 4 + 3]; // this pixel's alpha (transparency) value
      if (a > 128) {
        // more than half solid = part of her body
        sx += x; // add up its position
        sy += y;
        n++; // count it
        minY = min(minY, y); // track the top of her body
        maxY = max(maxY, y); // track the bottom of her body
      }
    }
  }
  img._measure = // save the result on the picture
    n === 0 // no visible pixels at all?
      ? { cx: 0.5, cy: 0.5, size: 0.3 } // → just guess: middle of the picture
      : {
          cx: sx / n / img.width, // average x, as 0–1 of the picture width
          cy: sy / n / img.height, // average y, as 0–1 of the picture height
          size: (maxY - minY) / img.height, // her height, as 0–1 of the picture height
        };
  return img._measure; // give back the answer
}
