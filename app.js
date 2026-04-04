import {
  DrawingUtils,
  FilesetResolver,
  PoseLandmarker,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const btnEnableCamera = document.getElementById("btnEnableCamera");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

const statusEl = document.getElementById("statusText");
const tipEl = document.getElementById("tipText");
const holdTimeEl = document.getElementById("holdTime");
const videoHintEl = document.getElementById("videoHint");

let poseLandmarker = null;
let drawingUtils = null;
let mediaStream = null;
let detecting = false;
let animationId = null;
let lastVideoTime = -1;

const holdTimer = {
  running: false,
  startMs: 0,
  elapsedMs: 0,
};

const THRESHOLDS = {
  validVisibility: 0.55,
  squatTooShallowKnee: 115,
  kneeMin: 75,
  kneeMax: 110,
  torsoVerticalMax: 15,
  thighHorizontalMaxDiff: 0.08,
  lrSymmetryMaxDiff: 0.06,
};

const POSE_CONNECTIONS = [
  [11, 13], [13, 15], [12, 14], [14, 16],
  [11, 12], [23, 24], [11, 23], [12, 24],
  [23, 25], [25, 27], [24, 26], [26, 28],
  [27, 31], [28, 32], [27, 29], [28, 30],
];

function setTip(text, type = "warn") {
  tipEl.textContent = `提示：${text}`;
  tipEl.classList.remove("ok", "warn");
  tipEl.classList.add(type);
}

function setStatus(text) {
  statusEl.textContent = text;
}

function updateHoldTimeText(ms) {
  holdTimeEl.textContent = `${(ms / 1000).toFixed(1)}s`;
}

/**
 * 计算 A-B-C 夹角（度）
 */
function calculateAngle(a, b, c) {
  const ab = { x: a.x - b.x, y: a.y - b.y };
  const cb = { x: c.x - b.x, y: c.y - b.y };
  const dot = ab.x * cb.x + ab.y * cb.y;
  const magAB = Math.hypot(ab.x, ab.y);
  const magCB = Math.hypot(cb.x, cb.y);
  if (!magAB || !magCB) return 180;

  const cosValue = Math.min(1, Math.max(-1, dot / (magAB * magCB)));
  return Math.acos(cosValue) * (180 / Math.PI);
}

/**
 * 是否检测到完整人体关键点
 */
function hasValidPose(landmarks) {
  const requiredIndexes = [11, 12, 23, 24, 25, 26, 27, 28];
  return requiredIndexes.every(
    (idx) => (landmarks[idx]?.visibility ?? 0) > THRESHOLDS.validVisibility,
  );
}

/**
 * 提取靠墙下蹲分析特征
 */
function extractWallSitFeatures(landmarks) {
  const leftKneeAngle = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightKneeAngle = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  const avgKneeAngle = (leftKneeAngle + rightKneeAngle) / 2;

  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const leftHip = landmarks[23];
  const rightHip = landmarks[24];
  const leftKnee = landmarks[25];
  const rightKnee = landmarks[26];

  // 躯干竖直程度（肩中点到髋中点与竖直方向夹角）
  const shoulderMid = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };
  const hipMid = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const torsoVec = { x: shoulderMid.x - hipMid.x, y: shoulderMid.y - hipMid.y };
  const vertical = { x: 0, y: -1 };
  const dot = torsoVec.x * vertical.x + torsoVec.y * vertical.y;
  const magTorso = Math.hypot(torsoVec.x, torsoVec.y);
  const torsoLeanDeg = magTorso
    ? Math.acos(Math.min(1, Math.max(-1, dot / magTorso))) * (180 / Math.PI)
    : 0;

  // 大腿水平程度（髋与膝 y 值差）
  const leftThighDiff = Math.abs(leftHip.y - leftKnee.y);
  const rightThighDiff = Math.abs(rightHip.y - rightKnee.y);
  const avgThighHorizontalDiff = (leftThighDiff + rightThighDiff) / 2;

  // 左右对称（膝与髋高度差）
  const kneeHeightDiff = Math.abs(leftKnee.y - rightKnee.y);
  const hipHeightDiff = Math.abs(leftHip.y - rightHip.y);

  return {
    leftKneeAngle,
    rightKneeAngle,
    avgKneeAngle,
    torsoLeanDeg,
    avgThighHorizontalDiff,
    kneeHeightDiff,
    hipHeightDiff,
  };
}

/**
 * 动作标准判定 + 纠错提示
 */
function evaluateWallSit(features) {
  const {
    leftKneeAngle,
    rightKneeAngle,
    avgKneeAngle,
    torsoLeanDeg,
    avgThighHorizontalDiff,
    kneeHeightDiff,
    hipHeightDiff,
  } = features;

  if (avgKneeAngle > THRESHOLDS.squatTooShallowKnee) {
    return { ok: false, tip: "蹲得不够低", status: "姿势调整中" };
  }

  if (
    leftKneeAngle < THRESHOLDS.kneeMin ||
    leftKneeAngle > THRESHOLDS.kneeMax ||
    rightKneeAngle < THRESHOLDS.kneeMin ||
    rightKneeAngle > THRESHOLDS.kneeMax
  ) {
    return { ok: false, tip: "膝角不合适", status: "姿势调整中" };
  }

  if (torsoLeanDeg > THRESHOLDS.torsoVerticalMax) {
    return { ok: false, tip: "身体前倾过多", status: "姿势调整中" };
  }

  if (avgThighHorizontalDiff > THRESHOLDS.thighHorizontalMaxDiff) {
    return { ok: false, tip: "大腿未接近水平", status: "姿势调整中" };
  }

  if (
    kneeHeightDiff > THRESHOLDS.lrSymmetryMaxDiff ||
    hipHeightDiff > THRESHOLDS.lrSymmetryMaxDiff
  ) {
    return { ok: false, tip: "左右高低不一致", status: "姿势调整中" };
  }

  return { ok: true, tip: "动作正确，请保持", status: "标准靠墙下蹲（保持中）" };
}

function updateHoldTimer(isStandardPose) {
  const now = performance.now();

  if (isStandardPose) {
    if (!holdTimer.running) {
      holdTimer.running = true;
      holdTimer.startMs = now;
      holdTimer.elapsedMs = 0;
    } else {
      holdTimer.elapsedMs = now - holdTimer.startMs;
    }
  } else if (holdTimer.running) {
    holdTimer.running = false;
  }

  updateHoldTimeText(holdTimer.elapsedMs);
}

function drawPose(landmarks) {
  drawingUtils = drawingUtils || new DrawingUtils(ctx);

  for (const [start, end] of POSE_CONNECTIONS) {
    const s = landmarks[start];
    const e = landmarks[end];
    if (!s || !e) continue;
    if ((s.visibility ?? 0) < 0.4 || (e.visibility ?? 0) < 0.4) continue;

    ctx.beginPath();
    ctx.moveTo(s.x * canvas.width, s.y * canvas.height);
    ctx.lineTo(e.x * canvas.width, e.y * canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#00e5ff";
    ctx.stroke();
  }

  landmarks.forEach((point) => {
    if ((point.visibility ?? 0) < 0.4) return;
    drawingUtils.drawLandmarks([point], {
      color: "#fffb00",
      fillColor: "#ff6f00",
      lineWidth: 1,
      radius: 4,
    });
  });
}

/**
 * 姿态检测主流程
 */
async function detectPoseFrame() {
  if (!detecting || !poseLandmarker || video.readyState < 2) {
    animationId = requestAnimationFrame(detectPoseFrame);
    return;
  }

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;

    const result = poseLandmarker.detectForVideo(video, performance.now());
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const landmarks = result.landmarks?.[0];
    const hasPose = Boolean(landmarks && hasValidPose(landmarks));

    if (!hasPose) {
      updateHoldTimer(false);
      setStatus("未检测到完整人体");
      setTip("请站在摄像头中央", "warn");
      videoHintEl.textContent = "未识别到完整人体";
    } else {
      drawPose(landmarks);
      const features = extractWallSitFeatures(landmarks);
      const evaluation = evaluateWallSit(features);

      updateHoldTimer(evaluation.ok);
      setStatus(evaluation.status);
      setTip(evaluation.tip, evaluation.ok ? "ok" : "warn");
      videoHintEl.textContent = `膝角: ${features.avgKneeAngle.toFixed(1)}° | 前倾: ${features.torsoLeanDeg.toFixed(1)}°`;
    }
  }

  animationId = requestAnimationFrame(detectPoseFrame);
}

async function initPoseLandmarker() {
  if (poseLandmarker) return;

  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15/wasm",
  );

  poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numPoses: 1,
  });
}

async function enableCamera() {
  if (mediaStream) return;

  mediaStream = await navigator.mediaDevices.getUserMedia({
    video: { width: 1280, height: 720 },
    audio: false,
  });

  video.srcObject = mediaStream;
  await video.play();
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  await initPoseLandmarker();
  btnEnableCamera.disabled = true;
  videoHintEl.textContent = "摄像头已开启";
}

async function startDetect() {
  try {
    // 满足新需求：点击“开始检测”后自动开启摄像头
    if (!mediaStream) {
      await enableCamera();
    }

    detecting = true;
    holdTimer.running = false;
    holdTimer.elapsedMs = 0;
    updateHoldTimeText(0);

    btnStart.disabled = true;
    btnStop.disabled = false;
    setStatus("检测中");
    setTip("请缓慢进入靠墙下蹲姿势", "ok");

    if (!animationId) {
      animationId = requestAnimationFrame(detectPoseFrame);
    }
  } catch (error) {
    console.error(error);
    setStatus("启动失败");
    setTip("无法访问摄像头，请检查权限", "warn");
  }
}

function stopDetect() {
  detecting = false;
  holdTimer.running = false;

  btnStart.disabled = false;
  btnStop.disabled = true;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setStatus("已停止");
  setTip("检测已停止", "warn");
  videoHintEl.textContent = "检测已停止";
}

btnEnableCamera.addEventListener("click", async () => {
  try {
    await enableCamera();
    setTip("摄像头已就绪，可点击开始检测", "ok");
  } catch (error) {
    console.error(error);
    setTip("无法访问摄像头，请检查权限", "warn");
  }
});

btnStart.addEventListener("click", startDetect);
btnStop.addEventListener("click", stopDetect);
