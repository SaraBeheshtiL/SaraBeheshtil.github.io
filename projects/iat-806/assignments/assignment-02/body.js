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
let SWAP_HANDS = false; // if left/right come out backwards, set this to true (or press S)

// what the game reads every frame
let lookX = 320; // where the headlamp points
let lookY = 240;
let eyesOpen = true;
let justBlinked = false; // true for ONE frame when the eyes close
let faceFound = false;

// calibration: we learn your "looking straight" pose and your open-eye size
let neutralYaw = 0;
let neutralPitch = 0;
let openEyeSize = 0.3;

// gesture holding
let gestureNow = "none";
let gestureFrames = 0;
const GESTURE_HOLD = 45; // ~0.75 s to confirm a sign

// how strongly head turning moves the light
const GAIN_X = 2.6;
const GAIN_Y = 3.2;

function setupBody() {
  if (typeof ml5 === "undefined") {
    MOUSE_MODE = true; // ml5 didn't load: play with the mouse
    return;
  }
  faceMesh.detectStart(video, (results) => (faces = results));
  handPose.detectStart(video, (results) => (hands = results));
}

function preloadBody() {
  if (typeof ml5 === "undefined") return;
  faceMesh = ml5.faceMesh({ maxFaces: 1, flipped: true });
  handPose = ml5.handPose({ maxHands: 2, flipped: true });
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

// call every frame. calibrate = true on the start screen (look straight ahead)
function updateBody(calibrate) {
  let wasOpen = eyesOpen;

  if (MOUSE_MODE) {
    faceFound = true;
    lookX = mouseX;
    lookY = mouseY;
    eyesOpen = !(keyIsPressed && key === " ");
  } else if (faces.length > 0) {
    faceFound = true;
    let face = faces[0];
    let turn = headTurn(face);
    let size = (eyeSize(face, L_EYE) + eyeSize(face, R_EYE)) / 2;

    if (calibrate) {
      neutralYaw = lerp(neutralYaw, turn.yaw, 0.1);
      neutralPitch = lerp(neutralPitch, turn.pitch, 0.1);
      if (size > openEyeSize * 0.7) openEyeSize = lerp(openEyeSize, size, 0.1);
    }

    // the headlamp: turn your head, the light moves
    let tx = width / 2 + (turn.yaw - neutralYaw) * width * GAIN_X;
    let ty = height / 2 + (turn.pitch - neutralPitch) * height * GAIN_Y;
    lookX = lerp(lookX, constrain(tx, 0, width), 0.25); // smooth out camera noise
    lookY = lerp(lookY, constrain(ty, 0, height), 0.25);

    eyesOpen = size > openEyeSize * 0.55;
  } else {
    faceFound = false;
    eyesOpen = false; // no face = no light
  }

  justBlinked = wasOpen && !eyesOpen;
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
  if (SWAP_HANDS) side = side === "Left" ? "Right" : "Left";
  return side;
}

// turn what the hands are doing into a sign name
function readGesture() {
  if (MOUSE_MODE || hands.length === 0) return "none";

  if (hands.length >= 2) {
    let a = isOpen(hands[0]);
    let b = isOpen(hands[1]);
    if (a && b) return "bothOpen";
    if (!a && !b) return "bothClosed";
    return "none";
  }

  let h = hands[0];
  let side = whichHand(h);
  return side + (isOpen(h) ? "Open" : "Closed"); // e.g. "RightOpen"
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
    return g;
  }
  return "none";
}

function gestureProgress() {
  return gestureNow === "none" ? 0 : min(1, gestureFrames / GESTURE_HOLD);
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
