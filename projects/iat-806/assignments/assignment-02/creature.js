/// A ghost that comes out of a door and creeps toward you.
// RULE: while the light is on her she FREEZES (and slowly burns).
//       In the dark she moves in sudden jumps — so when the light
//       comes back, she is somewhere else.
class Creature {
  constructor(door, speed) {
    let s = door.spawnPoint();
    this.startX = s.x;
    this.startY = s.y;
    this.startScale = s.scale;
    // where she ends up: right in front of you
    this.endX = random(width * 0.3, width * 0.7);
    this.endY = height * 0.62;

    this.p = 0; // progress: 0 = in the doorway, 1 = in your face
    this.speed = speed; // how far each jump goes
    this.health = 100;
    this.lit = false;

    this.seed = random(1000);
    this.tilt = random(-0.3, 0.3);
    this.crawl = random(TWO_PI);
    this.nextJump = frameCount + floor(random(20, 50));

    // a photo ghost if images were loaded, otherwise the drawn ghost
    this.img = ghostImages.length > 0 ? random(ghostImages) : null;

    this.updatePosition();
  }

  // Turn progress into a position and size on screen (perspective)
  updatePosition() {
    let t = pow(this.p, 1.4);
    this.x = lerp(this.startX, this.endX, t);
    this.y = lerp(this.startY, this.endY, t);
    this.sc = lerp(this.startScale, 2.6, this.p * this.p);
  }

  // THIS is where your body touches the object:
  // is she inside the flashlight beam?
  checkLight(lightX, lightY, lightRadius) {
    let d = dist(this.x, this.y, lightX, lightY);
    this.lit = d < lightRadius * 0.6 + 25 * this.sc;
    if (this.lit) {
      this.health -= 1.1; // hold the light on her ~1.5 s to banish her
    }
  }

  move() {
    if (this.lit) {
      return; // FROZEN while you look at her
    }
    // In the dark: lurch forward in a sudden jump, in a new pose
    if (frameCount >= this.nextJump) {
      this.p = min(1, this.p + this.speed * random(0.6, 1.4));
      this.tilt = random(-0.5, 0.5);
      this.crawl += PI / 2;
      this.nextJump = frameCount + floor(random(12, 35));
      this.updatePosition();
    }
  }

  reachedYou() {
    return this.p >= 1;
  }

  isDead() {
    return this.health <= 0;
  }

  // ---------- drawing ----------

  // Drawn BEFORE the darkness, so you only see her in the light
  display() {
    let burn = map(this.health, 100, 0, 0, 150); // redder the longer you burn her
    push();
    translate(this.x, this.y);
    rotate(this.tilt * 0.4);
    if (this.img) {
      let h = 150 * this.sc;
      let w = (h * this.img.width) / this.img.height;
      imageMode(CENTER);
      tint(255, 245 - burn, 240 - burn);
      if (this.lit && random() < 0.15) {
        // glitch: slice her sideways
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
      scale(this.sc * 1.3);
      this.drawBody();
      translate(0, -10);
      this.drawHead();
    }
    pop();
  }

  // Drawn AFTER the darkness: every now and then you catch a glimpse
  displayGlimpse() {
    if (this.lit) return;
    let n = noise(this.seed, frameCount * 0.04);
    if (n < 0.66) return;
    push();
    translate(this.x, this.y);
    rotate(this.tilt * 0.4);
    if (this.img) {
      let h = 150 * this.sc;
      let w = (h * this.img.width) / this.img.height;
      imageMode(CENTER);
      tint(255, 40);
      image(this.img, 0, 0, w, h);
    } else {
      scale(this.sc * 1.3);
      translate(0, -10);
      this.drawEyeballs();
    }
    pop();
  }

  // ---------- drawn ghost (fallback) ----------

  drawBody() {
    let skin = this.lit ? color(225, 160, 150) : color(185, 185, 178);

    // white dress / shoulders
    noStroke();
    fill(this.lit ? color(200, 150, 140) : color(150, 150, 142));
    ellipse(0, 30, 70, 38);

    // arms reaching forward, hands on the ground, crawling
    let liftL = max(0, sin(this.crawl)) * 8;
    let liftR = max(0, sin(this.crawl + PI)) * 8;
    this.drawArm(-1, liftL, skin);
    this.drawArm(1, liftR, skin);
  }

  drawArm(side, lift, skin) {
    let sx = 24 * side;
    let sy = 26;
    let hx = 42 * side;
    let hy = 58 - lift;

    stroke(skin);
    strokeWeight(7);
    noFill();
    // bent elbow sticking out
    beginShape();
    vertex(sx, sy);
    quadraticVertex(52 * side, 34, hx, hy);
    endShape();

    // hand
    noStroke();
    fill(skin);
    ellipse(hx, hy, 13, 9);

    // long bony fingers
    stroke(skin);
    strokeWeight(2.5);
    for (let f = 0; f < 4; f++) {
      let fx = hx + (f - 1.5) * 4.5;
      let tipX = hx + (f - 1.5) * 7;
      let tipY = hy + 11 + (f === 1 || f === 2 ? 2 : 0);
      line(fx, hy + 2, tipX, tipY);
      // dark fingertips
      stroke(40, 30, 30);
      point(tipX, tipY + 1);
      stroke(skin);
    }
  }

  drawHead() {
    let hairColor = color(8, 6, 10);
    let sway = sin(frameCount * 0.05 + this.seed) * 4;

    // hair behind the head: a dark core plus stringy, wet-looking strands
    noStroke();
    fill(hairColor);
    ellipse(0, -8, 54, 66);
    noFill();
    stroke(hairColor);
    for (let i = 0; i < 44; i++) {
      strokeWeight(i % 3 === 0 ? 3.5 : 2);
      let a = map(i, 0, 43, -PI * 0.95, -PI * 0.05); // around the top of the head
      let sx = cos(a) * 26;
      let sy = -10 + sin(a) * 30;
      let len = 55 + noise(this.seed + i * 0.3) * 45;
      beginShape();
      for (let k = 0; k <= 6; k++) {
        let t = k / 6;
        let x =
          sx * (1 + t * 0.5) +
          sin(t * 4 + i + frameCount * 0.04) * 3 * t +
          sway * t;
        let y = sy + t * len;
        vertex(x, y);
      }
      endShape();
    }
    noStroke();

    // pale face
    fill(this.lit ? color(235, 175, 165) : color(208, 208, 200));
    ellipse(0, 2, 42, 56);

    // hollow cheeks
    fill(0, 0, 0, 35);
    ellipse(-13, 10, 10, 16);
    ellipse(13, 10, 10, 16);

    // dark sunken eye sockets, smudged at the edges
    for (let r = 20; r >= 12; r -= 4) {
      fill(25, 15, 20, map(r, 12, 20, 230, 70));
      ellipse(-9, -4, r, r * 0.85);
      ellipse(9, -4, r, r * 0.85);
    }
    this.drawEyeballs();

    // nose shadow
    fill(0, 0, 0, 70);
    triangle(0, 1, -3, 9, 3, 9);

    // mouth
    if (this.lit) {
      // screaming
      fill(20, 0, 0);
      ellipse(0, 18, 14, 20);
    } else {
      // too-wide grin
      fill(30, 0, 5);
      beginShape();
      vertex(-16, 11);
      bezierVertex(-8, 27, 8, 27, 16, 11);
      bezierVertex(8, 16, -8, 16, -16, 11);
      endShape(CLOSE);
      // yellow teeth
      stroke(215, 195, 110);
      strokeWeight(1.3);
      for (let tx = -10; tx <= 10; tx += 3.4) {
        line(tx, 15, tx, 18.5);
      }
      noStroke();
    }

    // fringe over the forehead
    fill(hairColor);
    ellipse(0, -30, 50, 22);

    // strands of hair hanging over the sides of the face
    noFill();
    stroke(hairColor);
    strokeWeight(2.4);
    for (let i = 0; i < 16; i++) {
      let x0 = map(i, 0, 15, -25, 25);
      if (abs(x0) < 12) continue; // leave the middle of the face visible
      beginShape();
      for (let k = 0; k < 7; k++) {
        let y = -30 + k * 15;
        let x =
          x0 * (1 + k * 0.07) + sin(k * 0.9 + frameCount * 0.04 + i) * k * 0.6;
        vertex(x, y);
      }
      endShape();
    }
  }

  drawEyeballs() {
    noStroke();
    fill(245);
    ellipse(-9, -4, 8, 8);
    ellipse(9, -4, 8, 8);
    // tiny pupils that twitch
    fill(0);
    let j = noise(this.seed + 99, frameCount * 0.1) * 2 - 1;
    ellipse(-9 + j, -4, 2.2, 2.2);
    ellipse(9 + j, -4, 2.2, 2.2);
  }
}
