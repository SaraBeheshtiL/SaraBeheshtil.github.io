//////////////////// CREATURE //////////////////////
// THE RULE:
//   While your headlamp is on her (eyes open, looking at her) → she FREEZES.
//   Look away, or close your eyes → she gets one step closer.
//   Every blink = one step closer, right away.
//   When she reaches her last (closest) picture → she got you: game over.
//
// Each creature has 8 transparent pictures. In most rooms the pictures already
// show her coming closer, so she is drawn in the same place every step.
// In the bathroom the pictures are all the same size, so she grows using
// room.appearance → room.end.

class Creature {
  constructor(room) {
    this.room = room;

    // where the picture is drawn: x, y = centre, s = height as a fraction of the screen
    this.from = room.appearance;
    this.to = room.end;

    this.frames = creatureFrames[room.creatureName] || [];
    this.totalSteps = max(1, this.frames.length); // one step per picture
    this.step = 0;
    this.wait = 40; // frames before her FIRST step (after that, sketch.js sets the speed)
    this.nextMove = frameCount + this.wait;

    this.lit = false; // is the headlamp on her?
    this.updatePosition();
  }

  updatePosition() {
    let t = this.step / max(1, this.totalSteps - 1);
    this.x = lerp(this.from.x, this.to.x, t);
    this.y = lerp(this.from.y, this.to.y, t);
    this.sc = lerp(this.from.s, this.to.s, t);
  }

  currentImage() {
    let index = min(this.step, this.frames.length - 1);
    return this.frames[index];
  }

  // the rectangle the picture is drawn in
  drawBox() {
    let img = this.currentImage();
    let h = height * this.sc;
    let w = img ? (h * img.width) / img.height : h;
    return { x: this.x - w / 2, y: this.y - h / 2, w: w, h: h };
  }

  // where she actually is on screen: the middle of the picture's visible pixels
  // (the pictures have lots of empty space, so the picture's centre isn't her)
  bodyOnScreen() {
    let img = this.currentImage();
    let b = this.drawBox();
    let m = img ? measureFrame(img) : { cx: 0.5, cy: 0.5, size: 0.3 };
    return { x: b.x + m.cx * b.w, y: b.y + m.cy * b.h, size: m.size * b.h };
  }

  checkLight(lightOn, lightX, lightY, radius) {
    let body = this.bodyOnScreen();
    let d = dist(body.x, body.y, lightX, lightY);
    this.lit = lightOn && d < radius + body.size * 0.35;
  }

  update(blinked, waitFrames = 90) {
    this.wait = waitFrames; // she gets faster in later rooms
    if (blinked) {
      this.moveCloser(); // a blink always lets her move
      return;
    }
    if (this.lit) {
      this.nextMove = frameCount + this.wait; // frozen while you stare
      return;
    }
    if (frameCount >= this.nextMove) this.moveCloser();
  }

  moveCloser() {
    if (this.step >= this.totalSteps) return;
    this.step++;
    if (this.step < this.totalSteps) this.updatePosition();
    this.nextMove = frameCount + this.wait;
  }

  // she has got you as soon as she reaches her LAST picture (the closest one).
  // (looking at her then doesn't help any more: she's already in your face)
  caughtYou() {
    return this.step >= this.totalSteps - 1;
  }

  display(alpha = 255) {
    let img = this.currentImage();
    if (!img) return;
    let b = this.drawBox();

    push();
    // bathroom: she only exists IN the mirror, behind you
    if (this.room.mirror) {
      let m = this.room.mirror;
      drawingContext.save();
      drawingContext.beginPath();
      drawingContext.rect(m.x, m.y, m.w, m.h);
      drawingContext.clip();
    }
    if (alpha < 255) tint(255, alpha);
    image(img, b.x, b.y, b.w, b.h);
    if (this.room.mirror) drawingContext.restore();
    pop();
  }

  // drawn AFTER the darkness: a faint flicker of her, so the player knows
  // something is there even with the light pointed away
  displayGlimpse() {
    if (this.lit) return;
    if (random() < 0.03) this.display(35);
  }
}

// Find the centre and size of the visible (non-transparent) part of a picture.
// Worked out once per picture and remembered.
function measureFrame(img) {
  if (img._measure) return img._measure;
  img.loadPixels();
  let sx = 0,
    sy = 0,
    n = 0;
  let minY = img.height,
    maxY = 0;
  let stepPx = 4; // check every 4th pixel, it's plenty
  for (let y = 0; y < img.height; y += stepPx) {
    for (let x = 0; x < img.width; x += stepPx) {
      let a = img.pixels[(y * img.width + x) * 4 + 3];
      if (a > 128) {
        sx += x;
        sy += y;
        n++;
        minY = min(minY, y);
        maxY = max(maxY, y);
      }
    }
  }
  img._measure =
    n === 0
      ? { cx: 0.5, cy: 0.5, size: 0.3 }
      : {
          cx: sx / n / img.width,
          cy: sy / n / img.height,
          size: (maxY - minY) / img.height,
        };
  return img._measure;
}

//////////////////// DUST //////////////////////
// little specks floating in the headlamp beam

class Dust {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.4, 0.1);
    this.life = random(40, 90);
    this.size = random(1, 2.5);
  }
  update() {
    this.x += this.vx + random(-0.2, 0.2);
    this.y += this.vy;
    this.life--;
  }
  display() {
    noStroke();
    fill(255, 240, 210, map(this.life, 0, 90, 0, 120));
    circle(this.x, this.y, this.size);
  }
  isGone() {
    return this.life <= 0;
  }
}
