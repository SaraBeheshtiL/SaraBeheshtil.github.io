//////////////////// BODY INPUT //////////////////////
// faceMesh  → where your head points (the headlamp) + are your eyes open?
// handPose  → which hand sign you make (to change rooms)
//
// No camera / testing? Press M for MOUSE MODE:
//   mouse = where you look, hold SPACE = eyes closed,
//   keys 1–5 = rooms, H = hallway

let faceMesh, handPose;
let faces = [];
let hands = [];

let MOUSE_MODE = false;

// MIRRORING
// The video is drawn mirrored (like a real mirror). The face/hand points must be
// mirrored the same way, or they move opposite to you. We do that ourselves
// (instead of ml5's "flipped" option) so it's one clear switch:
let MIRROR_POINTS = false; // press F if the face dots move opposite to your face
let LIGHT_DIR = 1; //       press L if the dots are right but the light still goes the wrong way
let SWAP_HANDS = false; // if left/right come out backwards, set this to true (or press S)

// what the game reads every frame
let lookX = 320; // where the headlamp points
let lookY = 240;
let eyesOpen = true;
let justBlinked = false; // true for ONE frame when the eyes close
let faceFound = false;
let headX = 320; // where your head is in the (mirrored) camera picture
let headY = 240; //   → handy for the bathroom mirror

// calibration: we learn your "looking straight" pose and your open-eye size
let neutralYaw = 0;
let neutralPitch = 0;
let openEyeSize = 0.3;

// blink filtering: the camera is noisy, so the eyes must stay closed
// for a few frames before it counts (otherwise one bad frame = a blink)
let closedFrames = 0;
let openFrames = 0;
const BLINK_CONFIRM = 3; // frames the eyes must be closed to count as closed
const OPEN_CONFIRM = 2; // frames they must be open again to count as open

// if the camera loses your face for a moment, keep the last state
// instead of turning the light off (and counting it as a blink)
let lostFrames = 0;
const LOST_GRACE = 15; // ~0.25 s

// gesture holding
let gestureNow = "none";
let gestureFrames = 0;
const GESTURE_HOLD = 15; // quick confirmation while debugging; raise later // ~0.75 s to confirm a sign

// how strongly head turning moves the light
const GAIN_X = 2.6;
const GAIN_Y = 3.2;

// status, shown on the start screen so you can see what's working
let bodyStatus = {
  ml5: false, // did the ml5 library load?
  camera: false, // is the webcam giving pictures?
  detecting: false, // have we started faceMesh + handPose?
  handResults: 0, // number of HandPose callbacks received
  faceResults: 0, // how many times faceMesh has answered
  eyeRatio: 0, // your current eye-open number
  error: "",
  faceReady: false, // FaceMesh model finished downloading
  handReady: false, // HandPose model finished downloading
  faceDetecting: false,
  handDetecting: false,
  faceError: "",
  handError: "",
};

// HOW ml5 LOADS (checked in the ml5 1.x source code):
//   ml5.faceMesh() returns the model object RIGHT AWAY, but the model itself
//   downloads in the background. Its .ready promise tells you when it's done.
//   detectStart() does NOT wait for that: if you call it too early it crashes
//   quietly inside ml5 and never tries again. So we wait for .ready first.

// Nothing to do in preload: if a model loaded there failed to download,
// p5 would wait forever and the game would never start.
function preloadBody() {}

// Create both models in setup. They download in the background while the
// rooms are drawn; detection starts by itself once they're ready.
function setupBody() {
  if (location.protocol === "file:") {
    bodyStatus.error =
      "Open this project via Live Server (http://localhost), not file://";
  }
  if (typeof ml5 === "undefined") {
    bodyStatus.error =
      "ml5 library unavailable: check the <script> tag / network";
    MOUSE_MODE = true; // no ml5: play with the mouse
    return;
  }
  bodyStatus.ml5 = true;
  // flipped: false → the models give raw camera points; mirrorPoints() flips them
  faceMesh = ml5.faceMesh({
    maxFaces: 1,
    refineLandmarks: false,
    flipped: false,
  });
  handPose = ml5.handPose({ maxHands: 2, flipped: false });

  // mark each model as ready only when it has REALLY finished loading
  faceMesh.ready
    .then(() => {
      bodyStatus.faceReady = true;
      console.log("FaceMesh model loaded");
    })
    .catch((err) => {
      bodyStatus.faceError = String((err && err.message) || err);
      console.error("FaceMesh model error:", err);
    });
  handPose.ready
    .then(() => {
      bodyStatus.handReady = true;
      console.log("HandPose model loaded");
    })
    .catch((err) => {
      bodyStatus.handError = String((err && err.message) || err);
      console.error("HandPose model error:", err);
    });
}

// Called every frame. Starts each model's detection once BOTH
// the camera is giving pictures AND that model has finished loading.
function startDetectionWhenReady() {
  if (MOUSE_MODE || !video || !video.elt) return;
  const el = video.elt;
  if (el.readyState < 2 || el.videoWidth === 0) return; // camera not ready yet
  bodyStatus.camera = true;

  if (bodyStatus.faceReady && !bodyStatus.faceDetecting) {
    bodyStatus.faceDetecting = true;
    faceMesh.detectStart(video, (results) => {
      faces = mirrorPoints(results || []);
      bodyStatus.faceResults++;
    });
    console.log("FaceMesh detection started");
  }

  if (bodyStatus.handReady && !bodyStatus.handDetecting) {
    bodyStatus.handDetecting = true;
    handPose.detectStart(video, (results) => {
      hands = mirrorPoints(results || []);
      bodyStatus.handResults++;
    });
    console.log("HandPose detection started");
  }
  bodyStatus.detecting = bodyStatus.faceDetecting || bodyStatus.handDetecting;
}

// mirror every keypoint left↔right so it lines up with the mirrored video
function mirrorPoints(results) {
  if (!MIRROR_POINTS) return results;
  let w = video.width; // the size the points are measured in (640)
  for (let r of results) {
    for (let p of r.keypoints) p.x = w - p.x;
  }
  return results;
}

//////////////////// FACE //////////////////////

// faceMesh keypoint numbers we use
const NOSE = 1;
const FOREHEAD = 10;
const CHIN = 152;
const CHEEK_L = 234;
const CHEEK_R = 454;
// eyes: upper lid, lower lid, two corners
const L_EYE = [159, 145, 33, 133];
const R_EYE = [386, 374, 362, 263];

function eyeSize(face, ids) {
  let k = face.keypoints;
  let open = dist(k[ids[0]].x, k[ids[0]].y, k[ids[1]].x, k[ids[1]].y);
  let wide = dist(k[ids[2]].x, k[ids[2]].y, k[ids[3]].x, k[ids[3]].y);
  return open / wide; // ~0.3 open, ~0.1 closed
}

// head direction: where is the nose compared to the middle of the face?
function headTurn(face) {
  let k = face.keypoints;
  let faceW = dist(k[CHEEK_L].x, k[CHEEK_L].y, k[CHEEK_R].x, k[CHEEK_R].y);
  let faceH = dist(k[FOREHEAD].x, k[FOREHEAD].y, k[CHIN].x, k[CHIN].y);
  let midX = (k[CHEEK_L].x + k[CHEEK_R].x) / 2;
  let midY = (k[FOREHEAD].y + k[CHIN].y) / 2;
  return {
    yaw: (k[NOSE].x - midX) / faceW, // left / right
    pitch: (k[NOSE].y - midY) / faceH, // up / down
  };
}

// EYE TUNING
// faceMesh never fully closes the eyelid points: open eyes are ~0.25–0.35,
// closed eyes are often ~0.12–0.2 (not 0). So instead of a fixed number we
// compare against YOUR open-eye size: closed = it dropped by about 30%.
const CLOSE_AT = 0.7; // closed when below 70% of your open size
const OPEN_AT = 0.8; //  open again when above 80% (gap = no flicker)
let eyeSamples = []; // first readings, used to learn your open-eye size

// are the eyes open right now? (one frame)
function eyesLookOpen(size) {
  let limit = eyesOpen ? CLOSE_AT : OPEN_AT;
  return size > openEyeSize * limit;
}

// learn your open-eye size:
//  - first ~1.5 s with a face: take the typical (median) value
//  - after that: adjust slowly, ONLY from frames where the eyes are open,
//    and ignore odd spikes (head turned, bad frame)
function learnOpenEyes(size) {
  if (eyeSamples.length < 90) {
    eyeSamples.push(size);
    let sorted = [...eyeSamples].sort((a, b) => a - b);
    openEyeSize = sorted[floor(sorted.length * 0.6)];
    return;
  }
  let open = size > openEyeSize * OPEN_AT;
  let spike = size > openEyeSize * 1.5;
  if (open && !spike) openEyeSize = lerp(openEyeSize, size, 0.01);
}

// press C (or call this) to learn your eyes again, e.g. after moving the laptop
function recalibrateEyes() {
  eyeSamples = [];
  eyesOpen = true;
}

// call every frame. calibrate = true on the start screen (look straight ahead)
function updateBody(calibrate) {
  startDetectionWhenReady();
  let wasOpen = eyesOpen;

  if (MOUSE_MODE) {
    faceFound = true;
    lookX = mouseX;
    lookY = mouseY;
    headX = mouseX;
    headY = mouseY;
    eyesOpen = !keyIsDown(32); // 32 = SPACE
  } else if (faces.length > 0) {
    faceFound = true;
    lostFrames = 0;
    let face = faces[0];
    let k = face.keypoints;
    let turn = headTurn(face);
    // use the MORE open eye: both eyes must close to count as closed,
    // so one badly-tracked eye (hair, glasses, head turned) can't fake a blink
    let size = max(eyeSize(face, L_EYE), eyeSize(face, R_EYE));

    bodyStatus.eyeRatio = size;

    if (calibrate) {
      neutralYaw = lerp(neutralYaw, turn.yaw, 0.1);
      neutralPitch = lerp(neutralPitch, turn.pitch, 0.1);
    }
    learnOpenEyes(size);

    // the headlamp: turn your head, the light moves
    let tx = width / 2 + LIGHT_DIR * (turn.yaw - neutralYaw) * width * GAIN_X;
    let ty = height / 2 + (turn.pitch - neutralPitch) * height * GAIN_Y;
    lookX = lerp(lookX, constrain(tx, 0, width), 0.25); // smooth out camera noise
    lookY = lerp(lookY, constrain(ty, 0, height), 0.25);

    // where the head is in the picture (for the mirror)
    headX = lerp(headX, k[NOSE].x, 0.3);
    headY = lerp(headY, k[NOSE].y, 0.3);

    // eyes: only change state after a few frames in a row
    if (eyeSamples.length < 90) {
      eyesOpen = true; // still learning your eyes
    } else if (eyesLookOpen(size)) {
      openFrames++;
      closedFrames = 0;
      if (openFrames >= OPEN_CONFIRM) eyesOpen = true;
    } else {
      closedFrames++;
      openFrames = 0;
      if (closedFrames >= BLINK_CONFIRM) eyesOpen = false;
    }
  } else {
    // no face this frame: wait a moment before giving up
    lostFrames++;
    if (lostFrames > LOST_GRACE) {
      faceFound = false;
      eyesOpen = false; // no face = no light
    }
  }

  // a blink only counts if the face was really seen closing its eyes,
  // not when the camera simply lost the face
  justBlinked = wasOpen && !eyesOpen && faceFound;
}

//////////////////// HANDS //////////////////////

// a hand is "open" if most fingertips are far from the wrist
function isOpen(hand) {
  let k = hand.keypoints;
  let wrist = k[0];
  let extended = 0;
  for (let [tip, joint] of [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ]) {
    let dTip = dist(k[tip].x, k[tip].y, wrist.x, wrist.y);
    let dJoint = dist(k[joint].x, k[joint].y, wrist.x, wrist.y);
    if (dTip > dJoint * 1.1) extended++;
  }
  return extended >= 3;
}

function whichHand(hand) {
  let side = hand.handedness; // "Left" or "Right"
  if (side !== "Left" && side !== "Right") return "Unknown";
  if (SWAP_HANDS) side = side === "Left" ? "Right" : "Left";
  return side;
}

// ignore hands the model is unsure about (stops random signs from shadows)
function goodHands() {
  return hands.filter((h) => h && h.keypoints && h.keypoints.length >= 21);
}

// turn what the hands are doing into a sign name
function readGesture() {
  if (MOUSE_MODE) return "none";
  let hs = goodHands();
  if (hs.length === 0) return "none";

  if (hs.length >= 2) {
    // two different hands (sometimes the model finds the same hand twice)
    if (whichHand(hs[0]) !== whichHand(hs[1])) {
      let a = isOpen(hs[0]);
      let b = isOpen(hs[1]);
      if (a && b) return "bothOpen";
      if (!a && !b) return "bothClosed";
      return "none";
    }
  }

  let h = hs[0];
  if (whichHand(h) === "Unknown") return "none";
  return whichHand(h) + (isOpen(h) ? "Open" : "Closed"); // e.g. "RightOpen"
}

// returns a sign only once it has been held long enough
function confirmedGesture() {
  let g = readGesture();
  if (g === gestureNow && g !== "none") {
    gestureFrames++;
  } else {
    gestureNow = g;
    gestureFrames = 0;
  }
  if (gestureFrames === GESTURE_HOLD) {
    return g; // fires once; keep holding = nothing more happens
  }
  return "none";
}

function gestureProgress() {
  return gestureNow === "none" ? 0 : min(1, gestureFrames / GESTURE_HOLD);
}

// small status lines for the start screen: tells you which step is failing
function drawBodyStatus(x, y) {
  push();
  textAlign(LEFT, TOP);
  textSize(11);
  noStroke();
  let lines = [];
  if (MOUSE_MODE) {
    lines.push([
      "MOUSE MODE (press M to switch back to the camera)",
      color(255, 220, 120),
    ]);
  } else {
    lines.push([
      (bodyStatus.ml5 ? "✓" : "✗") + " ml5 loaded",
      bodyStatus.ml5 ? color(120, 220, 120) : color(255, 90, 90),
    ]);
    lines.push([
      (bodyStatus.camera ? "✓" : "…") +
        " camera " +
        (bodyStatus.camera ? "on" : "waiting (allow camera access?)"),
      bodyStatus.camera ? color(120, 220, 120) : color(255, 200, 90),
    ]);
    let modelOk = bodyStatus.faceResults > 0;
    lines.push([
      (modelOk ? "✓" : "…") +
        " face model " +
        (modelOk ? "running" : "loading…"),
      modelOk ? color(120, 220, 120) : color(255, 200, 90),
    ]);
    lines.push([
      faces.length > 0
        ? "✓ face found"
        : "✗ no face — face the camera, add light",
      faces.length > 0 ? color(120, 220, 120) : color(255, 90, 90),
    ]);
    if (faces.length > 0) {
      lines.push([
        "eyes: " +
          nf(bodyStatus.eyeRatio, 1, 2) +
          "  open ≈ " +
          nf(openEyeSize, 1, 2) +
          "  closed below " +
          nf(openEyeSize * CLOSE_AT, 1, 2) +
          " → " +
          (eyeSamples.length < 90
            ? "learning… keep eyes open"
            : eyesOpen
              ? "OPEN"
              : "CLOSED") +
          "   (C = relearn)",
        color(200),
      ]);
    }
  }
  lines.push([
    "mirror dots: " +
      (MIRROR_POINTS ? "on" : "off") +
      " (F)   light: " +
      (LIGHT_DIR > 0 ? "normal" : "reversed") +
      " (L)   hands swapped: " +
      (SWAP_HANDS ? "yes" : "no") +
      " (S)",
    color(160, 200, 255),
  ]);
  lines.push([
    "FaceMesh model: " +
      (bodyStatus.faceReady ? "ready" : "waiting") +
      " | HandPose model: " +
      (bodyStatus.handReady ? "ready" : "waiting"),
    color(255, 220, 120),
  ]);
  if (bodyStatus.faceError)
    lines.push(["Face error: " + bodyStatus.faceError, color(255, 100, 100)]);
  if (bodyStatus.handError)
    lines.push(["Hand error: " + bodyStatus.handError, color(255, 100, 100)]);
  lines.push([
    "Hands: " +
      hands.length +
      " | gesture: " +
      readGesture() +
      " | hand callbacks: " +
      bodyStatus.handResults,
    color(255, 220, 120),
  ]);
  if (bodyStatus.error) lines.push([bodyStatus.error, color(255, 90, 90)]);
  for (let i = 0; i < lines.length; i++) {
    fill(lines[i][1]);
    text(lines[i][0], x, y + i * 14);
  }
  pop();
}

// keyboard shortcuts (always on — handy when testing or demoing)
function keyboardRoom() {
  if (key === "1") return "RightOpen";
  if (key === "2") return "RightClosed";
  if (key === "3") return "LeftOpen";
  if (key === "4") return "LeftClosed";
  if (key === "5") return "bothOpen";
  if (key === "h" || key === "H") return "bothClosed";
  return "none";
}
