//////////////////// CREATURE //////////////////////
// THE RULE:
//   While your headlamp is on her (eyes open, looking at her) → she FREEZES.
//   Look away, or close your eyes → she gets one step closer.
//   Every blink = one step closer, right away.
//   When she has taken all her steps → she got you.

class Creature {
  constructor(room) {
    this.room = room;

    // Starting and ending positions of creature in this room
    this.from = room.appearance;
    this.to = room.end;

    // Creature movement
    this.step = 0;
    this.totalSteps = 8;
    this.nextMove = frameCount + 90; // when the creature will move next (if not frozen)

    // Is the player looking at the creature?
    this.lit = false;

    // Images for this creature
    this.frames = creatureFrames[room.creatureName];

    // Initial position
    this.updatePosition();
  }

  // Update position and size as creature approaches
  updatePosition() {
    let t = this.step / this.totalSteps;
    this.x = lerp(this.from.x, this.to.x, t);
    this.y = lerp(this.from.y, this.to.y, t);
    this.sc = lerp(this.from.s, this.to.s, t);
  }

  // Check whether the flashlight is pointing at the creature
  checkLight(lightOn, lightX, lightY, radius) {
    let d = dist(this.x, this.y, lightX, lightY);
    this.lit = lightOn && d < radius + 20 * this.sc;
  }

  // Control the creature's movement
  update(blinked, waitFrames = 90) {
    // A blink always moves the creature one step
    if (blinked) {
      this.moveCloser();
      return;
    }

    // Looking at the creature freezes it
    if (this.lit) return;

    // Looking away allows the creature to move
    if (frameCount >= this.nextMove) {
      this.moveCloser();
    }
  }

  // Move the creature one step forward
  moveCloser() {
    if (this.step >= this.totalSteps) return;

    this.step++;

    this.updatePosition();

    // Schedule the next movement
    this.nextMove = frameCount + 90;
  }

  // Check if the creature reached the player
  caughtYou() {
    return this.step >= this.totalSteps;
  }

  // Display the corresponding image
  display() {
    let index = min(this.step, this.frames.length - 1);
    let img = this.frames[index];

    if (!img) return;

    let h = 150 * this.sc;
    let w = (h * img.width) / img.height;

    push();
    imageMode(CENTER);
    image(img, this.x, this.y, w, h);
    pop();
  }
}
