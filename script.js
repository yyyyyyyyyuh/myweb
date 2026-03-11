const tabs = document.querySelectorAll('.menu-item');
const sections = document.querySelectorAll('.tab-content');
const todayDate = document.getElementById('todayDate');
const planGrid = document.getElementById('planGrid');
const careText = document.getElementById('careText');
const aiPlan = document.getElementById('aiPlan');
const nearbyVideos = document.getElementById('nearbyVideos');
const locationHint = document.getElementById('locationHint');
const watchTimer = document.getElementById('watchTimer');
const restModal = document.getElementById('restModal');

const state = {
  user: JSON.parse(localStorage.getItem('rehabUser') || 'null'),
  users: JSON.parse(localStorage.getItem('rehabUsers') || '[]'),
  posts: JSON.parse(localStorage.getItem('rehabPosts') || '[]'),
};

const defaultPlans = [
  ['晨间拉伸', '15分钟', '上肢放松 + 呼吸'],
  ['核心稳定', '20分钟', '坐姿平衡训练'],
  ['步态训练', '25分钟', '辅助步行 + 体态纠正'],
  ['睡前舒缓', '12分钟', '肩颈减压 + 正念放松'],
];

const therapistData = [
  { name: '李晨曦', skill: '神经康复理疗师', city: '上海', door: '支持上门', price: '¥180/次' },
  { name: '赵敏', skill: '运动损伤康复师', city: '杭州', door: '支持上门', price: '¥220/次' },
  { name: '何远', skill: '儿童康复指导师', city: '成都', door: '机构面诊', price: '¥160/次' },
];

const geoVideos = {
  default: [
    { title: '轮椅肩背放松课', area: '同城康复中心', dist: '2.1km' },
    { title: '社区无障碍球类体验', area: '市民体育公园', dist: '3.5km' },
  ],
  north: [
    { title: '北方冬季关节保暖训练', area: '北城康复站', dist: '1.8km' },
    { title: '居家平衡板训练', area: '邻里运动社', dist: '4.2km' },
  ],
  south: [
    { title: '湿热气候下肌群恢复课', area: '南城区康复学院', dist: '2.7km' },
    { title: '水中康复体验', area: '滨江运动中心', dist: '5.1km' },
  ],
};

function renderPlans(plans = defaultPlans) {
  planGrid.innerHTML = plans
    .map(
      (p) => `<div class="plan-item"><h4>${p[0]}</h4><p>${p[1]}</p><small>${p[2]}</small></div>`,
    )
    .join('');
}

function renderCareText() {
  const hour = new Date().getHours();
  let text = '愿你今天也被温柔以待。';
  if (hour < 10) text = '早安，记得先喝一杯温水，再开始今天的轻训练 ☀️';
  else if (hour < 18) text = '午间提醒：训练后补充蛋白质，身体会谢谢你的坚持。';
  else text = '晚安前做 10 分钟舒缓拉伸，睡眠质量会更好 🌙';
  careText.textContent = text;
  document.getElementById('greetingText').textContent = text;
}

function renderNearby(list) {
  nearbyVideos.innerHTML = list
    .map((v) => `<div class="video-card"><h4>${v.title}</h4><p>${v.area}</p><p>距离：${v.dist}</p></div>`)
    .join('');
}

function renderTherapists() {
  document.getElementById('serviceGrid').innerHTML = therapistData
    .map(
      (t) => `<div class="service-card"><h3>${t.name}</h3><p>${t.skill}</p><p>${t.city} · ${t.price}</p><span class="tag">${t.door}</span><br/><button class="pill-btn" style="margin-top:10px">预约对接</button></div>`,
    )
    .join('');
}

function savePosts() {
  localStorage.setItem('rehabPosts', JSON.stringify(state.posts));
}

function renderPosts() {
  const list = document.getElementById('postList');
  if (!state.posts.length) {
    list.innerHTML = '<p>还没有帖子，来发布第一条鼓励吧！</p>';
    return;
  }
  list.innerHTML = state.posts
    .map(
      (p, i) => `<div class="post-item"><h4>${p.author}</h4><div>${p.content}</div><div class="post-meta"><span>👍 ${p.likes}</span><span>💬 ${p.comments.length}</span></div><div class="post-actions"><button onclick="likePost(${i})">点赞</button></div><div>${p.comments.map((c) => `<p>— ${c}</p>`).join('')}</div><div class="comment-row"><input id="comment-${i}" placeholder="写下评论..."/><button class="pill-btn" onclick="addComment(${i})">评论</button></div></div>`,
    )
    .join('');
}

window.likePost = function likePost(i) {
  state.posts[i].likes += 1;
  savePosts();
  renderPosts();
};

window.addComment = function addComment(i) {
  const input = document.getElementById(`comment-${i}`);
  if (!input.value.trim()) return;
  state.posts[i].comments.push(input.value.trim());
  savePosts();
  renderPosts();
};

function syncUserUI() {
  const name = state.user?.username || '朋友';
  document.getElementById('welcomeName').textContent = name;
  document.getElementById('sideName').textContent = state.user?.username || '访客用户';
  document.getElementById('sideState').textContent = state.user ? '已登录' : '未登录';
}

tabs.forEach((btn) => {
  btn.addEventListener('click', () => {
    tabs.forEach((b) => b.classList.remove('active'));
    sections.forEach((s) => s.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab).classList.add('active');
  });
});

document.getElementById('generatePlanBtn').addEventListener('click', () => {
  aiPlan.innerHTML = '<p>已生成：根据你的体能评估，建议每周 5 次轻中度训练 + 2 次恢复放松，重点强化核心稳定、关节活动度与呼吸耐力。</p>';
});

document.getElementById('locateBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationHint.textContent = '浏览器不支持定位，已展示默认同城推荐。';
    renderNearby(geoVideos.default);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const zone = lat > 30 ? 'north' : 'south';
      locationHint.textContent = `已根据定位生成推荐（纬度 ${lat.toFixed(2)}）`; 
      renderNearby(geoVideos[zone]);
    },
    () => {
      locationHint.textContent = '定位失败，已切换为默认附近推荐。';
      renderNearby(geoVideos.default);
    },
  );
});

document.getElementById('aiAsk').addEventListener('click', () => {
  const q = document.getElementById('aiInput').value.trim();
  const answer = q
    ? `你提到“${q}”。建议从低强度训练起步（RPE 3-4），每次 20-30 分钟；记录心率、疼痛等级与睡眠，并每周复盘一次。需要我按 7 天拆解日程吗？`
    : '请告诉我你的身体情况与目标，我将为你生成个性化康复计划。';
  document.getElementById('aiResponse').textContent = answer;
});

document.getElementById('postBtn').addEventListener('click', () => {
  const input = document.getElementById('postInput');
  const content = input.value.trim();
  if (!content) return;
  state.posts.unshift({
    author: state.user?.username || '匿名朋友',
    content,
    likes: 0,
    comments: [],
  });
  input.value = '';
  savePosts();
  renderPosts();
});

document.getElementById('registerBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('authMessage');
  if (!username || !password) return (msg.textContent = '请输入用户名和密码');
  if (state.users.find((u) => u.username === username)) return (msg.textContent = '用户名已存在');
  state.users.push({ username, password });
  localStorage.setItem('rehabUsers', JSON.stringify(state.users));
  msg.textContent = '注册成功，请登录';
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('authMessage');
  const user = state.users.find((u) => u.username === username && u.password === password);
  if (!user) return (msg.textContent = '用户名或密码错误');
  state.user = { username };
  localStorage.setItem('rehabUser', JSON.stringify(state.user));
  msg.textContent = `登录成功，欢迎 ${username}`;
  syncUserUI();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('rehabUser');
  document.getElementById('authMessage').textContent = '已退出登录';
  syncUserUI();
});

document.getElementById('closeRestModal').addEventListener('click', () => {
  restModal.classList.add('hidden');
});

const video = document.getElementById('rehabVideo');
let watchedSeconds = 0;
let warned = false;
setInterval(() => {
  if (!video.paused && !video.ended) {
    watchedSeconds += 1;
    watchTimer.textContent = `已连续观看：${Math.floor(watchedSeconds / 60)} 分钟`;
    if (watchedSeconds >= 7200 && !warned) {
      warned = true;
      restModal.classList.remove('hidden');
    }
  } else {
    watchedSeconds = 0;
    warned = false;
  }
}, 1000);

function init() {
  todayDate.textContent = new Date().toLocaleDateString('zh-CN');
  renderPlans();
  renderCareText();
  renderNearby(geoVideos.default);
  renderTherapists();
  renderPosts();
  syncUserUI();
}

init();
