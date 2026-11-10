/////////////////// CREATURE //////////////////////
// THE RULE:
//   While your headlamp is on her (eyes open, looking at her) → she FREEZES.
//   Look away, or close your eyes → she gets one step closer.
//   Every blink = one step closer, right away.
//   When she has taken all her steps → she got you.

class Creature {
  constructor(room) {
    this.room = room;
    // some rooms have several places it can start from (the hallway doors): pick one
    this.from = Array.isArray(room.spawn) ? random(room.spawn) : room.spawn;
    this.to = room.end;
    this.step = 0;
    this.totalSteps = 10;
    this.lit = false;
    this.seed = random(1000);
    this.tilt = random(-0.3, 0.3);
    this.nextMove = frameCount + 90; // a moment of quiet when you walk in

    // this room's photo; any photo if that one is missing; drawn face if none
    this.img =
      ghostImages[room.ghostFile] || random(Object.values(ghostImages)) || null;

    this.updatePosition();
  }

  // turn steps into a place and size on screen (perspective)
  updatePosition() {
    let t = this.step / this.totalSteps;
    let e = pow(t, 1.3);
    this.x = lerp(this.from.x, this.to.x, e);
    this.y = lerp(this.from.y, this.to.y, e);
    this.sc = lerp(this.from.s, this.to.s, t * t);
    this.rot = lerp(this.from.rot || 0, this.to.rot || 0, t);
  }

  // THIS is where your body touches the creature:
  // is your headlamp on, and pointing at her?
  checkLight(lightOn, lx, ly, radius) {
    this.lit =
      lightOn && dist(this.x, this.y, lx, ly) < radius * 0.6 + 25 * this.sc;
  }

  update(blinked, waitFrames) {
    if (this.lit) return; // FROZEN — you are watching her

    if (blinked || frameCount >= this.nextMove) {
      this.step++;
      this.tilt = random(-0.5, 0.5); // a new pose each step
      this.nextMove = frameCount + floor(waitFrames * random(0.7, 1.3));
      this.updatePosition();
    }
  }

  caughtYou() {
    return this.step >= this.totalSteps;
  }

  // ---------- drawing ----------

  clipToMirror() {
    let m = this.room.mirror;
    if (!m) return;
    drawingContext.save();
    drawingContext.beginPath();
    drawingContext.rect(m.x, m.y, m.w, m.h);
    drawingContext.clip();
  }

  unclip() {
    if (this.room.mirror) drawingContext.restore();
  }

  // drawn BEFORE the darkness: you only see her in your light
  display() {
    this.clipToMirror();
    push();
    translate(this.x, this.y);
    rotate(this.rot + this.tilt * 0.3);
    this.drawBody(this.lit && random() < 0.12, 255);
    pop();
    this.unclip();
  }

  // drawn AFTER the darkness: sometimes you catch a glimpse
  displayGlimpse() {
    if (this.lit) return;
    if (noise(this.seed, frameCount * 0.04) < 0.66) return;
    this.clipToMirror();
    push();
    translate(this.x, this.y);
    rotate(this.rot + this.tilt * 0.3);
    this.drawBody(false, 35);
    pop();
    this.unclip();
  }

  drawBody(glitch, alpha) {
    let h = 150 * this.sc;
    if (this.img) {
      let w = (h * this.img.width) / this.img.height;
      imageMode(CENTER);
      tint(255, alpha);
      if (glitch) {
        let slices = 5;
        for (let s = 0; s < slices; s++) {
          let sy = (s * this.img.height) / slices;
          let sh = this.img.height / slices;
          let dy = -h / 2 + (s + 0.5) * (h / slices);
          image(
            this.img,
            random(-10, 10),
            dy,
            w,
            h / slices,
            0,
            sy,
            this.img.width,
            sh,
          );
        }
      } else {
        image(this.img, 0, 0, w, h);
      }
    } else {
      drawFallbackGhost(h, alpha);
    }
  }
}

// if no photos are loaded: a simple pale face with long black hair
function drawFallbackGhost(h, alpha) {
  let u = h / 100;
  noStroke();
  fill(8, 6, 10, alpha);
  ellipse(0, 5 * u, 60 * u, 95 * u);
  fill(205, 205, 198, alpha);
  ellipse(0, 0, 40 * u, 54 * u);
  fill(15, 10, 12, alpha);
  ellipse(-9 * u, -5 * u, 14 * u, 11 * u);
  ellipse(9 * u, -5 * u, 14 * u, 11 * u);
  ellipse(0, 15 * u, 18 * u, 10 * u);
  fill(245, alpha);
  ellipse(-9 * u, -5 * u, 6 * u, 6 * u);
  ellipse(9 * u, -5 * u, 6 * u, 6 * u);
  fill(8, 6, 10, alpha);
  rect(-24 * u, -30 * u, 12 * u, 75 * u);
  rect(12 * u, -30 * u, 12 * u, 75 * u);
}

//////////////////// KEY //////////////////////
// Every room hides a key. Stare at it until you have it → you escape the room.
// But while you stare at the key, you are NOT watching the creature…

const KEY_SECONDS = 3;

class Key {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.charge = 0; // 0 → 1
    this.lit = false;
  }

  update(lightOn, lx, ly, radius) {
    this.lit = lightOn && dist(this.x, this.y, lx, ly) < radius * 0.55;
    if (this.lit && this.charge < 1) {
      this.charge += 1 / (KEY_SECONDS * 60);
    }
  }

  isFound() {
    return this.charge >= 1;
  }

  // the key itself — only visible in the light
  display() {
    if (this.isFound()) return;
    push();
    translate(this.x, this.y);
    rotate(-0.4);
    stroke(200, 165, 70);
    strokeWeight(3);
    noFill();
    circle(-8, 0, 12);
    line(-2, 0, 14, 0);
    line(10, 0, 10, 5);
    line(14, 0, 14, 6);
    pop();
  }

  // a faint glint in the dark + how much you've collected
  displayGlint() {
    if (this.isFound()) return;
    noStroke();
    if (noise(this.x, frameCount * 0.05) > 0.7) {
      fill(255, 220, 140, 90);
      circle(this.x, this.y, 5);
    }
    if (this.charge > 0) {
      noFill();
      stroke(255, 210, 110);
      strokeWeight(3);
      arc(this.x, this.y, 36, 36, -HALF_PI, -HALF_PI + TWO_PI * this.charge);
    }
  }
}

//////////////////// DUST //////////////////////
// little specks floating in your headlamp beam

class Dust {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.vx = random(-0.3, 0.3);
    this.vy = random(-0.2, 0.3);
    this.life = 255;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 3;
  }

  isGone() {
    return this.life <= 0;
  }

  display() {
    noStroke();
    fill(255, 240, 210, this.life * 0.4);
    circle(this.x, this.y, 2);
  }
}
