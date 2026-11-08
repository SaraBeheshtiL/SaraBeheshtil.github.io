// A pale, long-haired ghost girl that crawls toward your face.
// Everything is drawn in a 100x100 "design space" and scaled,
// so she gets BIGGER as she gets closer to you.
class Creature {
  constructor(speed) {
    // Spawn just outside a random edge of the screen
    let side = floor(random(4));
    let m = 70;
    if (side === 0) {
      this.x = random(width);
      this.y = -m;
    } else if (side === 1) {
      this.x = width + m;
      this.y = random(height);
    } else if (side === 2) {
      this.x = random(width);
      this.y = height + m;
    } else {
      this.x = -m;
      this.y = random(height);
    }

    this.size = random(70, 95);
    this.speed = speed;
    this.health = 100;
    this.lit = false;

    this.seed = random(1000); // makes each one move differently
    this.crawl = random(TWO_PI); // hand animation
    this.persp = 0.55; // perspective: small far away, big up close
    this.tilt = 0; // head tilt
    this.shakeX = 0;
    this.shakeY = 0;

    // If ghost images were loaded, each creature gets one of them.
    // If not, she falls back to the drawn ghost.
    this.img = ghostImages.length > 0 ? random(ghostImages) : null;
  }

  // Crawl toward the target (your face) in jerky stop-start bursts.
  // Light pushes her back.
  move(targetX, targetY) {
    let angle = atan2(targetY - this.y, targetX - this.x);
    let burst = noise(this.seed, frameCount * 0.04) > 0.45 ? 2 : 0.15;
    let s = this.lit ? -this.speed * 0.6 : this.speed * burst;
    this.x += cos(angle) * s;
    this.y += sin(angle) * s;

    this.crawl += this.lit ? 0.4 : burst * 0.15;
    this.tilt = (noise(this.seed + 50, frameCount * 0.012) - 0.5) * 1.4;

    if (this.lit) {
      this.shakeX = random(-3, 3);
      this.shakeY = random(-3, 3);
    } else {
      this.shakeX = 0;
      this.shakeY = 0;
    }

    let d = dist(this.x, this.y, targetX, targetY);
    this.persp = map(d, 0, 400, 1.4, 0.55, true);
  }

  // THIS is where your body touches the object:
  // is she inside the flashlight beam?
  checkLight(lightX, lightY, lightRadius) {
    this.lit = dist(this.x, this.y, lightX, lightY) < lightRadius * 0.6;
    if (this.lit) {
      this.health -= 2;
    }
  }

  isDead() {
    return this.health <= 0;
  }

  // Did she reach your face?
  reached(targetX, targetY, targetRadius) {
    return (
      dist(this.x, this.y, targetX, targetY) <
      targetRadius + 30 * this.currentScale()
    );
  }

  currentScale() {
    let burnShrink = map(this.health, 0, 100, 0.3, 1);
    return (this.size / 100) * this.persp * burnShrink;
  }

  // Full body — drawn BEFORE the darkness, so you only see her in the light
  display() {
    if (this.img) {
      this.displayImage();
      return;
    }
    push();
    translate(this.x + this.shakeX, this.y + this.shakeY);
    scale(this.currentScale());
    this.drawBody();
    push();
    translate(0, -10);
    rotate(this.tilt);
    this.drawHead();
    pop();
    pop();
  }

  // Just the eyes — drawn AFTER the darkness, so they glow in the dark
  displayEyes() {
    if (this.img) {
      this.displayGlimpse();
      return;
    }
    push();
    translate(this.x + this.shakeX, this.y + this.shakeY);
    scale(this.currentScale());
    translate(0, -10);
    rotate(this.tilt);
    noStroke();
    fill(255, 255, 255, 35); // soft glow
    ellipse(-9, -4, 14, 14);
    ellipse(9, -4, 14, 14);
    this.drawEyeballs();
    pop();
  }

  // ---------- photo ghost ----------

  imageSize() {
    let h = 240 * this.currentScale();
    let w = (h * this.img.width) / this.img.height;
    return [w, h];
  }

  // In the light: the full photo, flickering and glitching
  displayImage() {
    let [w, h] = this.imageSize();
    push();
    translate(this.x + this.shakeX, this.y + this.shakeY);
    rotate(this.tilt * 0.25);
    imageMode(CENTER);
    if (this.lit) {
      tint(255, 175, 165); // burning red
    } else {
      tint(255, random() < 0.05 ? 120 : 235); // flicker
    }

    let glitch = random() < (this.lit ? 0.35 : 0.06);
    if (glitch) {
      // cut the photo into horizontal slices and shift them sideways
      let slices = 5;
      for (let s = 0; s < slices; s++) {
        let sy = (s * this.img.height) / slices;
        let sh = this.img.height / slices;
        let dy = -h / 2 + (s + 0.5) * (h / slices);
        image(
          this.img,
          random(-12, 12),
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
    pop();
  }

  // In the dark: a faint glimpse of the face, now and then
  displayGlimpse() {
    if (this.lit) return;
    let [w, h] = this.imageSize();
    let n = noise(this.seed + 7, frameCount * 0.05);
    let alpha = n > 0.62 ? 70 : 14;
    push();
    translate(this.x, this.y);
    rotate(this.tilt * 0.25);
    imageMode(CENTER);
    tint(255, alpha);
    image(this.img, 0, 0, w, h);
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
