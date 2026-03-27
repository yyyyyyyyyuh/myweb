import {
  FilesetResolver,
  PoseLandmarker,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.15";

const video = document.getElementById("video");
const canvas = document.getElementById("overlay");
const ctx = canvas.getContext("2d");

const btnEnableCamera = document.getElementById("btnEnableCamera");
const btnStart = document.getElementById("btnStart");
const btnStop = document.getElementById("btnStop");

const counterEl = document.getElementById("counter");
const statusEl = document.getElementById("statusText");
const tipEl = document.getElementById("tipText");
const videoHintEl = document.getElementById("videoHint");

let poseLandmarker = null;
let drawingUtils = null;
let mediaStream = null;
let detecting = false;
let animationId = null;
let lastVideoTime = -1;

const squatState = {
  phase: "up", // up / down
  count: 0,
  minKneeAngleInRep: 180,
};

const THRESHOLDS = {
  upAngle: 160,
  downAngle: 95,
  validVisibility: 0.55,
  torsoLeanWarnDeg: 28,
  deepEnoughAngle: 100,
  smoothWindow: 5,
};

// 用移动平均降低抖动，避免重复计数
const kneeAngleHistory = [];

// 骨架连接（MediaPipe Pose 33点）
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

/**
 * 计算由 A-B-C 三点构成的夹角（单位：度）
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
 * 姿态识别前的完整性检查：是否有足够关键点可用
 */
function hasValidPose(landmarks) {
  const requiredIndexes = [11, 12, 23, 24, 25, 26, 27, 28];
  return requiredIndexes.every(
    (idx) => (landmarks[idx]?.visibility ?? 0) > THRESHOLDS.validVisibility,
  );
}

/**
 * 计算用于深蹲判断的特征：左右膝平均角度、躯干前倾角
 */
function extractSquatFeatures(landmarks) {
  const leftKnee = calculateAngle(landmarks[23], landmarks[25], landmarks[27]);
  const rightKnee = calculateAngle(landmarks[24], landmarks[26], landmarks[28]);
  const avgKnee = (leftKnee + rightKnee) / 2;

  // 计算躯干相对竖直方向偏离角（越大表示前倾越多）
  const shoulderMid = {
    x: (landmarks[11].x + landmarks[12].x) / 2,
    y: (landmarks[11].y + landmarks[12].y) / 2,
  };
  const hipMid = {
    x: (landmarks[23].x + landmarks[24].x) / 2,
    y: (landmarks[23].y + landmarks[24].y) / 2,
  };

  const torsoVec = {
    x: shoulderMid.x - hipMid.x,
    y: shoulderMid.y - hipMid.y,
  };
  const vertical = { x: 0, y: -1 };
  const dot = torsoVec.x * vertical.x + torsoVec.y * vertical.y;
  const magTorso = Math.hypot(torsoVec.x, torsoVec.y);
  const torsoLean = magTorso
    ? Math.acos(Math.min(1, Math.max(-1, dot / magTorso))) * (180 / Math.PI)
    : 0;

  return { avgKnee, torsoLean };
}

/**
 * 深蹲计数状态机：up -> down -> up 计数 +1
 */
function updateSquatCounter(smoothedKneeAngle) {
  if (squatState.phase === "up") {
    if (smoothedKneeAngle < THRESHOLDS.downAngle) {
      squatState.phase = "down";
      squatState.minKneeAngleInRep = smoothedKneeAngle;
    }
  } else {
    squatState.minKneeAngleInRep = Math.min(
      squatState.minKneeAngleInRep,
      smoothedKneeAngle,
    );

    if (smoothedKneeAngle > THRESHOLDS.upAngle) {
      // 确保本次下蹲足够深，减少浅蹲误计数
      if (squatState.minKneeAngleInRep <= THRESHOLDS.deepEnoughAngle) {
        squatState.count += 1;
        counterEl.textContent = String(squatState.count);
      }
      squatState.phase = "up";
      squatState.minKneeAngleInRep = 180;
    }
  }

  statusEl.textContent = squatState.phase === "up" ? "站立" : "下蹲";
}

/**
 * 输出纠正提示
 */
function generateFeedback({ hasPose, avgKnee, torsoLean }) {
  if (!hasPose) {
    return { text: "请站在摄像头中央", type: "warn" };
  }

  if (squatState.phase === "down" && avgKnee > THRESHOLDS.deepEnoughAngle + 5) {
    return { text: "请再下蹲一点", type: "warn" };
  }

  if (torsoLean > THRESHOLDS.torsoLeanWarnDeg) {
    return { text: "请保持背部更直", type: "warn" };
  }

  return { text: "动作良好，请继续", type: "ok" };
}

/**
 * 绘制关键点与骨架
 */
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
 * 封装姿态检测流程
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

    if (hasPose) {
      drawPose(landmarks);
      const { avgKnee, torsoLean } = extractSquatFeatures(landmarks);

      kneeAngleHistory.push(avgKnee);
      if (kneeAngleHistory.length > THRESHOLDS.smoothWindow) {
        kneeAngleHistory.shift();
      }
      const smoothedKneeAngle =
        kneeAngleHistory.reduce((sum, value) => sum + value, 0) /
        kneeAngleHistory.length;

      updateSquatCounter(smoothedKneeAngle);
      const feedback = generateFeedback({ hasPose, avgKnee, torsoLean });
      setTip(feedback.text, feedback.type);
      videoHintEl.textContent = `膝角: ${smoothedKneeAngle.toFixed(1)}° | 躯干前倾: ${torsoLean.toFixed(1)}°`;
    } else {
      statusEl.textContent = "站立";
      setTip("请站在摄像头中央", "warn");
      videoHintEl.textContent = "未识别到完整人体";
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

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720 },
      audio: false,
    });

    video.srcObject = mediaStream;
    await video.play();

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    await initPoseLandmarker();

    btnStart.disabled = false;
    btnEnableCamera.disabled = true;
    setTip("摄像头已就绪，点击“开始检测”", "ok");
    videoHintEl.textContent = "摄像头已开启";
  } catch (error) {
    console.error(error);
    setTip("无法访问摄像头，请检查浏览器权限", "warn");
    videoHintEl.textContent = "摄像头开启失败";
  }
}

function startDetect() {
  if (!mediaStream || !poseLandmarker) return;

  detecting = true;
  btnStart.disabled = true;
  btnStop.disabled = false;
  setTip("开始检测，请保持身体完整出现在画面中", "ok");

  if (!animationId) {
    animationId = requestAnimationFrame(detectPoseFrame);
  }
}

function stopDetect() {
  detecting = false;
  btnStart.disabled = false;
  btnStop.disabled = true;

  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  setTip("检测已停止", "warn");
  videoHintEl.textContent = "检测已停止";
}

btnEnableCamera.addEventListener("click", enableCamera);
btnStart.addEventListener("click", startDetect);
btnStop.addEventListener("click", stopDetect);
