//////////////////// BODY INPUT //////////////////////
// faceMesh  → where your head points (the headlamp) + are your eyes open?
// handPose  → which hand sign you make (to change rooms)
//
// No camera / testing? Press M for MOUSE MODE:
//   mouse = where you look, hold SPACE = eyes closed,
//   keys 1–5 = rooms, H = hallway

let faceMesh, handPose; // the two ml5 models: one finds the face, one finds the hands
let faces = []; // list of faces found in the latest camera picture (we only use faces[0])
let hands = []; // list of hands found in the latest camera picture (0, 1 or 2)

let MOUSE_MODE = false; // true = play with the mouse instead of the camera (backup for testing)

// MIRRORING
// The video is drawn mirrored (like a real mirror). The face/hand points must be
// mirrored the same way, or they move opposite to you. We do that ourselves
// (instead of ml5's "flipped" option) so it's one clear switch:
let MIRROR_POINTS = false; // true = flip every face/hand point left↔right (press F to toggle)
let LIGHT_DIR = 1; // 1 = light follows head normally, -1 = reversed (press L to toggle)
let SWAP_HANDS = false; // true = treat the left hand as right and vice versa (press S)

// what the game reads every frame
let lookX = 320; // x position of the headlamp on the canvas (starts in the middle of 640)
let lookY = 240; // y position of the headlamp (starts in the middle of 480)
let eyesOpen = true; // are the eyes open right now? (false = light off)
let justBlinked = false; // true for ONE frame only, at the moment the eyes close → creature steps
let faceFound = false; // is a face currently detected?
let headX = 320; // x of your nose in the camera picture (used by the bathroom mirror)
let headY = 240; // y of your nose in the camera picture

// calibration: we learn your "looking straight" pose and your open-eye size
let neutralYaw = 0; // how much your head is turned left/right when you look straight
let neutralPitch = 0; // how much your head is tilted up/down when you look straight
let openEyeSize = 0.3; // your normal open-eye size (starts at a guess, then is learned)

// blink filtering: the camera is noisy, so the eyes must stay closed
// for a few frames before it counts (otherwise one bad frame = a blink)
let closedFrames = 0; // how many frames in a row the eyes have looked closed
let openFrames = 0; // how many frames in a row the eyes have looked open
const BLINK_CONFIRM = 3; // eyes must look closed 3 frames in a row to count as closed
const OPEN_CONFIRM = 2; // eyes must look open 2 frames in a row to count as open again

// if the camera loses your face for a moment, keep the last state
// instead of turning the light off (and counting it as a blink)
let lostFrames = 0; // how many frames in a row no face was found
const LOST_GRACE = 15; // after 15 frames (~0.25 s) without a face, we give up and turn the light off

// gesture holding
let gestureNow = "none"; // the hand sign seen right now (e.g. "RightOpen")
let gestureFrames = 0; // how many frames in a row that same sign has been held
const GESTURE_HOLD = 15; // frames a sign must be held before the room changes (raise to ~45 for the final game)

// how strongly head turning moves the light
const GAIN_X = 2.6; // bigger = a small head turn moves the light further left/right
const GAIN_Y = 3.2; // bigger = a small nod moves the light further up/down

// status, shown on the start screen so you can see what's working
let bodyStatus = { // one object that remembers what is working and what isn't
  ml5: false, // did the ml5 library load?
  camera: false, // is the webcam giving pictures?
  detecting: false, // has at least one model started detecting?
  handResults: 0, // how many times handPose has answered
  faceResults: 0, // how many times faceMesh has answered
  eyeRatio: 0, // your current eye-open number
  error: "", // a general error message (empty = no error)
  faceReady: false, // FaceMesh model finished downloading
  handReady: false, // HandPose model finished downloading
  faceDetecting: false, // has faceMesh.detectStart been called?
  handDetecting: false, // has handPose.detectStart been called?
  faceError: "", // error message if the face model failed to load
  handError: "", // error message if the hand model failed to load
};

// HOW ml5 LOADS (checked in the ml5 1.x source code):
//   ml5.faceMesh() returns the model object RIGHT AWAY, but the model itself
//   downloads in the background. Its .ready promise tells you when it's done.
//   detectStart() does NOT wait for that: if you call it too early it crashes
//   quietly inside ml5 and never tries again. So we wait for .ready first.

// Nothing to do in preload: if a model loaded there failed to download,
// p5 would wait forever and the game would never start.
function preloadBody() {} // empty on purpose (kept so sketch.js can still call it)

// Create both models in setup. They download in the background while the
// rooms are drawn; detection starts by itself once they're ready.
function setupBody() { // called once from setup() in sketch.js
  if (location.protocol === "file:") { // the page was opened by double-clicking the file
    bodyStatus.error = // the camera and models don't work from file://, so warn
      "Open this project via Live Server (http://localhost), not file://";
  }
  if (typeof ml5 === "undefined") { // the ml5 <script> in index.html didn't load
    bodyStatus.error = // save a message explaining the problem
      "ml5 library unavailable: check the <script> tag / network";
    MOUSE_MODE = true; // no ml5: play with the mouse
    return; // stop here: there are no models to create
  }
  bodyStatus.ml5 = true; // ml5 is there
  // flipped: false → the models give raw camera points; mirrorPoints() flips them
  faceMesh = ml5.faceMesh({ // create the face model
    maxFaces: 1, // only look for one face (faster)
    refineLandmarks: false, // no extra iris points (we don't need them, faster)
    flipped: false, // don't let ml5 mirror the points; we do it in mirrorPoints()
  });
  handPose = ml5.handPose({ maxHands: 2, flipped: false }); // create the hand model, up to 2 hands

  // mark each model as ready only when it has REALLY finished loading
  faceMesh.ready // a promise that finishes when the face model is downloaded
    .then(() => { // when it worked:
      bodyStatus.faceReady = true; // remember it's ready → detection can start
      console.log("FaceMesh model loaded"); // message in the browser console
    })
    .catch((err) => { // when it failed:
      bodyStatus.faceError = String((err && err.message) || err); // keep the error text
      console.error("FaceMesh model error:", err); // show the error in the console
    });
  handPose.ready // same thing for the hand model
    .then(() => { // when it worked:
      bodyStatus.handReady = true; // remember it's ready
      console.log("HandPose model loaded"); // console message
    })
    .catch((err) => { // when it failed:
      bodyStatus.handError = String((err && err.message) || err); // keep the error text
      console.error("HandPose model error:", err); // show the error in the console
    });
}

// Called every frame. Starts each model's detection once BOTH
// the camera is giving pictures AND that model has finished loading.
function startDetectionWhenReady() {
  if (MOUSE_MODE || !video || !video.elt) return; // mouse mode, or no webcam object → nothing to do
  const el = video.elt; // the real HTML <video> element behind p5's video
  if (el.readyState < 2 || el.videoWidth === 0) return; // camera not ready yet
  bodyStatus.camera = true; // the camera is giving pictures

  if (bodyStatus.faceReady && !bodyStatus.faceDetecting) { // face model ready AND not started yet
    bodyStatus.faceDetecting = true; // remember we started (so this runs only once)
    faceMesh.detectStart(video, (results) => { // keep finding faces in the video; this function runs every answer
      faces = mirrorPoints(results || []); // save the faces (mirrored if needed)
      bodyStatus.faceResults++; // count the answers
    });
    console.log("FaceMesh detection started"); // console message
  }

  if (bodyStatus.handReady && !bodyStatus.handDetecting) { // hand model ready AND not started yet
    bodyStatus.handDetecting = true; // remember we started
    handPose.detectStart(video, (results) => { // keep finding hands in the video
      hands = mirrorPoints(results || []); // save the hands (mirrored if needed)
      bodyStatus.handResults++; // count the answers
    });
    console.log("HandPose detection started"); // console message
  }
  bodyStatus.detecting = bodyStatus.faceDetecting || bodyStatus.handDetecting; // true if at least one model is running
}

// mirror every keypoint left↔right so it lines up with the mirrored video
function mirrorPoints(results) {
  if (!MIRROR_POINTS) return results; // mirroring off → give the points back unchanged
  let w = video.width; // the size the points are measured in (640)
  for (let r of results) { // for every face or hand found...
    for (let p of r.keypoints) p.x = w - p.x; // ...flip each point: left edge becomes right edge
  }
  return results; // give back the flipped points
}

//////////////////// FACE //////////////////////

// faceMesh keypoint numbers we use (faceMesh gives 468 numbered points on the face)
const NOSE = 1; // tip of the nose
const FOREHEAD = 10; // top middle of the forehead
const CHIN = 152; // bottom of the chin
const CHEEK_L = 234; // edge of the face on one side
const CHEEK_R = 454; // edge of the face on the other side
// eyes: upper lid, lower lid, two corners
const L_EYE = [159, 145, 33, 133]; // left eye: [top lid, bottom lid, corner, corner]
const R_EYE = [386, 374, 362, 263]; // right eye: [top lid, bottom lid, corner, corner]

function eyeSize(face, ids) { // how open is one eye? (a number, not pixels)
  let k = face.keypoints; // all the face points
  let open = dist(k[ids[0]].x, k[ids[0]].y, k[ids[1]].x, k[ids[1]].y); // distance top lid → bottom lid (eye height)
  let wide = dist(k[ids[2]].x, k[ids[2]].y, k[ids[3]].x, k[ids[3]].y); // distance corner → corner (eye width)
  return open / wide; // height ÷ width, so it stays the same when you move closer/further: ~0.3 open, ~0.1 closed
}

// head direction: where is the nose compared to the middle of the face?
function headTurn(face) {
  let k = face.keypoints; // all the face points
  let faceW = dist(k[CHEEK_L].x, k[CHEEK_L].y, k[CHEEK_R].x, k[CHEEK_R].y); // face width (cheek to cheek)
  let faceH = dist(k[FOREHEAD].x, k[FOREHEAD].y, k[CHIN].x, k[CHIN].y); // face height (forehead to chin)
  let midX = (k[CHEEK_L].x + k[CHEEK_R].x) / 2; // x of the middle of the face
  let midY = (k[FOREHEAD].y + k[CHIN].y) / 2; // y of the middle of the face
  return {
    yaw: (k[NOSE].x - midX) / faceW, // left / right: how far the nose is from the middle, as a share of face width
    pitch: (k[NOSE].y - midY) / faceH, // up / down: same idea, as a share of face height
  };
}

// EYE TUNING
// faceMesh never fully closes the eyelid points: open eyes are ~0.25–0.35,
// closed eyes are often ~0.12–0.2 (not 0). So instead of a fixed number we
// compare against YOUR open-eye size: closed = it dropped by about 30%.
const CLOSE_AT = 0.7; // closed when below 70% of your open size
const OPEN_AT = 0.8; //  open again when above 80% (the gap stops flickering)
let eyeSamples = []; // first readings, used to learn your open-eye size

// are the eyes open right now? (one frame)
function eyesLookOpen(size) {
  let limit = eyesOpen ? CLOSE_AT : OPEN_AT; // if open now, use the 70% line; if closed now, the 80% line
  return size > openEyeSize * limit; // open if the eye is bigger than that share of your normal size
}

// learn your open-eye size:
//  - first ~1.5 s with a face: take the typical (median) value
//  - after that: adjust slowly, ONLY from frames where the eyes are open,
//    and ignore odd spikes (head turned, bad frame)
function learnOpenEyes(size) {
  if (eyeSamples.length < 90) { // still in the first 90 readings
    eyeSamples.push(size); // store this reading
    let sorted = [...eyeSamples].sort((a, b) => a - b); // copy the readings and sort small → big
    openEyeSize = sorted[floor(sorted.length * 0.6)]; // take the value 60% of the way up (a typical, slightly-open value)
    return; // done for this frame
  }
  let open = size > openEyeSize * OPEN_AT; // is the eye clearly open in this frame?
  let spike = size > openEyeSize * 1.5; // is it a weird, too-big value (bad frame)?
  if (open && !spike) openEyeSize = lerp(openEyeSize, size, 0.01); // if it's a good open frame, move 1% toward it (slow adapting)
}

// press C (or call this) to learn your eyes again, e.g. after moving the laptop
function recalibrateEyes() {
  eyeSamples = []; // forget the old readings → learning starts over
  eyesOpen = true; // treat the eyes as open while learning
}

// call every frame. calibrate = true on the start screen (look straight ahead)
function updateBody(calibrate) {
  startDetectionWhenReady(); // start the models if they're ready and not started yet
  let wasOpen = eyesOpen; // remember last frame's eye state (to detect the moment of a blink)

  if (MOUSE_MODE) { // ---- testing without a camera ----
    faceFound = true; // pretend there is a face
    lookX = mouseX; // the light goes where the mouse is
    lookY = mouseY;
    headX = mouseX; // the "head" is at the mouse too
    headY = mouseY;
    eyesOpen = !keyIsDown(32); // 32 = SPACE: holding space = eyes closed
  } else if (faces.length > 0) { // ---- a face was found ----
    faceFound = true; // we have a face
    lostFrames = 0; // reset the "no face" counter
    let face = faces[0]; // use the first (only) face
    let k = face.keypoints; // its points
    let turn = headTurn(face); // how much the head is turned / tilted
    // use the MORE open eye: both eyes must close to count as closed,
    // so one badly-tracked eye (hair, glasses, head turned) can't fake a blink
    let size = max(eyeSize(face, L_EYE), eyeSize(face, R_EYE)); // the bigger of the two eye sizes

    bodyStatus.eyeRatio = size; // save it (was shown on the debug screen)

    if (calibrate) { // on the start screen:
      neutralYaw = lerp(neutralYaw, turn.yaw, 0.1); // slowly learn your "straight ahead" left/right
      neutralPitch = lerp(neutralPitch, turn.pitch, 0.1); // slowly learn your "straight ahead" up/down
    }
    learnOpenEyes(size); // keep learning your open-eye size

    // the headlamp: turn your head, the light moves
    let tx = width / 2 + LIGHT_DIR * (turn.yaw - neutralYaw) * width * GAIN_X; // target x: centre + head turn (compared to straight) × strength
    let ty = height / 2 + (turn.pitch - neutralPitch) * height * GAIN_Y; // target y: centre + head tilt × strength
    lookX = lerp(lookX, constrain(tx, 0, width), 0.25); // move 25% toward the target (smooth), kept inside the canvas
    lookY = lerp(lookY, constrain(ty, 0, height), 0.25); // same for y

    // where the head is in the picture (for the mirror)
    headX = lerp(headX, k[NOSE].x, 0.3); // follow the nose x smoothly
    headY = lerp(headY, k[NOSE].y, 0.3); // follow the nose y smoothly

    // eyes: only change state after a few frames in a row
    if (eyeSamples.length < 90) { // still learning your eyes
      eyesOpen = true; // count them as open meanwhile
    } else if (eyesLookOpen(size)) { // this frame looks OPEN
      openFrames++; // one more open frame in a row
      closedFrames = 0; // the closed streak is broken
      if (openFrames >= OPEN_CONFIRM) eyesOpen = true; // open long enough → eyes are open
    } else { // this frame looks CLOSED
      closedFrames++; // one more closed frame in a row
      openFrames = 0; // the open streak is broken
      if (closedFrames >= BLINK_CONFIRM) eyesOpen = false; // closed long enough → eyes are closed
    }
  } else { // ---- no face this frame ----
    // no face this frame: wait a moment before giving up
    lostFrames++; // count frames without a face
    if (lostFrames > LOST_GRACE) { // missing for too long
      faceFound = false; // no face
      eyesOpen = false; // no face = no light
    }
  }

  // a blink only counts if the face was really seen closing its eyes,
  // not when the camera simply lost the face
  justBlinked = wasOpen && !eyesOpen && faceFound; // open last frame + closed now + face is there = a blink
}

//////////////////// HANDS //////////////////////

// a hand is "open" if most fingertips are far from the wrist
function isOpen(hand) {
  let k = hand.keypoints; // the 21 hand points
  let wrist = k[0]; // point 0 is the wrist
  let extended = 0; // how many fingers are stretched out
  for (let [tip, joint] of [ // pairs of [fingertip, middle joint] for 4 fingers:
    [8, 6], // index finger
    [12, 10], // middle finger
    [16, 14], // ring finger
    [20, 18], // little finger
  ]) {
    let dTip = dist(k[tip].x, k[tip].y, wrist.x, wrist.y); // wrist → fingertip distance
    let dJoint = dist(k[joint].x, k[joint].y, wrist.x, wrist.y); // wrist → middle joint distance
    if (dTip > dJoint * 1.1) extended++; // tip clearly further than the joint = finger is straight
  }
  return extended >= 3; // 3 or 4 straight fingers = open hand; fewer = fist
}

function whichHand(hand) { // is this the left or right hand?
  let side = hand.handedness; // ml5 says "Left" or "Right"
  if (side !== "Left" && side !== "Right") return "Unknown"; // ml5 isn't sure → ignore
  if (SWAP_HANDS) side = side === "Left" ? "Right" : "Left"; // swap if the switch is on
  return side; // "Left" or "Right"
}

// ignore hands the model is unsure about (stops random signs from shadows)
function goodHands() {
  return hands.filter((h) => h && h.keypoints && h.keypoints.length >= 21); // keep only hands with all 21 points
}

// turn what the hands are doing into a sign name
function readGesture() {
  if (MOUSE_MODE) return "none"; // no hand signs in mouse mode (use keys instead)
  let hs = goodHands(); // the usable hands
  if (hs.length === 0) return "none"; // no hands → no sign

  if (hs.length >= 2) { // two hands seen
    // two different hands (sometimes the model finds the same hand twice)
    if (whichHand(hs[0]) !== whichHand(hs[1])) { // really one left + one right
      let a = isOpen(hs[0]); // is the first hand open?
      let b = isOpen(hs[1]); // is the second hand open?
      if (a && b) return "bothOpen"; // both open → Basement
      if (!a && !b) return "bothClosed"; // both fists → Hallway
      return "none"; // one open, one fist → not a sign
    }
  }

  let h = hs[0]; // only one (real) hand: use it
  if (whichHand(h) === "Unknown") return "none"; // can't tell which hand → no sign
  return whichHand(h) + (isOpen(h) ? "Open" : "Closed"); // e.g. "RightOpen", "LeftClosed"
}

// returns a sign only once it has been held long enough
function confirmedGesture() {
  let g = readGesture(); // the sign this frame
  if (g === gestureNow && g !== "none") { // same sign as before (and a real sign)
    gestureFrames++; // held one more frame
  } else { // a different sign (or none)
    gestureNow = g; // start watching the new sign
    gestureFrames = 0; // restart the count
  }
  if (gestureFrames === GESTURE_HOLD) { // held exactly long enough
    return g; // fires once; keep holding = nothing more happens
  }
  return "none"; // not confirmed yet
}

function gestureProgress() { // 0 → 1: how far along the hold is (for a progress ring)
  return gestureNow === "none" ? 0 : min(1, gestureFrames / GESTURE_HOLD); // no sign = 0; else frames held ÷ needed, max 1
}

// small status lines for the start screen: tells you which step is failing
// (NOT USED any more: you removed its call from sketch.js. You can delete this whole function.)
function drawBodyStatus(x, y) {
  push(); // save drawing settings
  textAlign(LEFT, TOP); // text starts at its top-left corner
  textSize(11); // small text
  noStroke(); // no outline on text
  let lines = []; // list of [text, colour] to draw
  if (MOUSE_MODE) { // in mouse mode, just say so
    lines.push([
      "MOUSE MODE (press M to switch back to the camera)",
      color(255, 220, 120), // yellow
    ]);
  } else {
    lines.push([ // line: did ml5 load?
      (bodyStatus.ml5 ? "✓" : "✗") + " ml5 loaded",
      bodyStatus.ml5 ? color(120, 220, 120) : color(255, 90, 90), // green if yes, red if no
    ]);
    lines.push([ // line: is the camera on?
      (bodyStatus.camera ? "✓" : "…") +
        " camera " +
        (bodyStatus.camera ? "on" : "waiting (allow camera access?)"),
      bodyStatus.camera ? color(120, 220, 120) : color(255, 200, 90), // green or orange
    ]);
    let modelOk = bodyStatus.faceResults > 0; // has the face model answered at least once?
    lines.push([ // line: is the face model running?
      (modelOk ? "✓" : "…") +
        " face model " +
        (modelOk ? "running" : "loading…"),
      modelOk ? color(120, 220, 120) : color(255, 200, 90),
    ]);
    lines.push([ // line: is a face visible?
      faces.length > 0
        ? "✓ face found"
        : "✗ no face — face the camera, add light",
      faces.length > 0 ? color(120, 220, 120) : color(255, 90, 90),
    ]);
    if (faces.length > 0) { // if there's a face, show the eye numbers
      lines.push([
        "eyes: " +
          nf(bodyStatus.eyeRatio, 1, 2) + // current eye size, 2 decimals
          "  open ≈ " +
          nf(openEyeSize, 1, 2) + // learned open size
          "  closed below " +
          nf(openEyeSize * CLOSE_AT, 1, 2) + // the "closed" line
          " → " +
          (eyeSamples.length < 90
            ? "learning… keep eyes open" // still learning
            : eyesOpen
              ? "OPEN"
              : "CLOSED") +
          "   (C = relearn)",
        color(200), // grey
      ]);
    }
  }
  lines.push([ // line: the three mirror switches
    "mirror dots: " +
      (MIRROR_POINTS ? "on" : "off") +
      " (F)   light: " +
      (LIGHT_DIR > 0 ? "normal" : "reversed") +
      " (L)   hands swapped: " +
      (SWAP_HANDS ? "yes" : "no") +
      " (S)",
    color(160, 200, 255), // light blue
  ]);
  lines.push([ // line: are both models downloaded?
    "FaceMesh model: " +
      (bodyStatus.faceReady ? "ready" : "waiting") +
      " | HandPose model: " +
      (bodyStatus.handReady ? "ready" : "waiting"),
    color(255, 220, 120),
  ]);
  if (bodyStatus.faceError) // show the face model error, if any
    lines.push(["Face error: " + bodyStatus.faceError, color(255, 100, 100)]);
  if (bodyStatus.handError) // show the hand model error, if any
    lines.push(["Hand error: " + bodyStatus.handError, color(255, 100, 100)]);
  lines.push([ // line: hand info
    "Hands: " +
      hands.length +
      " | gesture: " +
      readGesture() +
      " | hand callbacks: " +
      bodyStatus.handResults,
    color(255, 220, 120),
  ]);
  if (bodyStatus.error) lines.push([bodyStatus.error, color(255, 90, 90)]); // general error, if any
  for (let i = 0; i < lines.length; i++) { // draw every line...
    fill(lines[i][1]); // ...in its colour
    text(lines[i][0], x, y + i * 14); // ...14 px below the previous one
  }
  pop(); // restore drawing settings
}

// keyboard shortcuts (always on — handy when testing or demoing)
function keyboardRoom() { // turns a key press into the same sign name a hand would give
  if (key === "1") return "RightOpen"; // 1 → Bedroom
  if (key === "2") return "RightClosed"; // 2 → Kitchen
  if (key === "3") return "LeftOpen"; // 3 → Bathroom
  if (key === "4") return "LeftClosed"; // 4 → Living Room
  if (key === "5") return "bothOpen"; // 5 → Basement
  if (key === "h" || key === "H") return "bothClosed"; // H → Hallway
  return "none"; // any other key does nothing
}
