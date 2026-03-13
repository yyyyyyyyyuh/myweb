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

const calendarWeek = document.getElementById('calendarWeek');
const calendarGrid = document.getElementById('calendarGrid');
const checkinBtn = document.getElementById('checkinBtn');
const checkinMinutes = document.getElementById('checkinMinutes');
const checkinType = document.getElementById('checkinType');
const checkinMsg = document.getElementById('checkinMsg');

const state = {
  user: JSON.parse(localStorage.getItem('rehabUser') || 'null'),
  users: JSON.parse(localStorage.getItem('rehabUsers') || '[]'),
  posts: JSON.parse(localStorage.getItem('rehabPosts') || '[]'),
  favorites: JSON.parse(localStorage.getItem('rehabFavorites') || '[]'),
  history: JSON.parse(localStorage.getItem('rehabHistory') || '[]'),
  checkins: JSON.parse(localStorage.getItem('rehabCheckins') || '[]'),
  followGraph: JSON.parse(localStorage.getItem('rehabFollowGraph') || '{}'),
  dmThreads: JSON.parse(localStorage.getItem('rehabDmThreads') || '{}'),
  profiles: JSON.parse(localStorage.getItem('rehabProfiles') || '{}'),
};

const knowledgeData = [
  '饮食管理：康复期优先高蛋白、低炎性饮食。',
  '睡眠恢复：固定睡眠时段有助于神经修复。',
  '疼痛干预：持续疼痛时优先寻求专业理疗评估。',
];
const sportsData = [
  '2026 全国残疾人社区运动会新增轮椅篮球体验组。',
  '多地体育馆完成无障碍升级并开放康复时段。',
  '公益机构联合高校举办“运动康复开放周”。',
];
const defaultPlans = [
  ['晨间拉伸', '15分钟', '呼吸与上肢放松'],
  ['核心稳定', '20分钟', '坐姿平衡训练'],
  ['步态辅助', '25分钟', '步态矫正与耐力'],
  ['睡前舒缓', '12分钟', '肩颈与情绪放松'],
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

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function ensureUserModel() {
  let changed = false;
  state.users = state.users.map((u, idx) => {
    if (!u.id) {
      changed = true;
      return { ...u, id: `U${1000 + idx}` };
    }
    return u;
  });
  const seed = [
    { id: 'U2001', username: '阳光小宇', password: '123456' },
    { id: 'U2002', username: '康复小林', password: '123456' },
  ];
  seed.forEach((u) => {
    if (!state.users.find((x) => x.id === u.id || x.username === u.username)) {
      state.users.push(u);
      changed = true;
    }
  });
  state.users.forEach((u) => {
    if (!state.profiles[u.id]) {
      state.profiles[u.id] = {
        bio: '热爱康复训练与互助交流。',
        avatar: `https://i.pravatar.cc/120?u=${u.id}`,
      };
      changed = true;
    }
  });
  if (state.user && !state.user.id) {
    const found = state.users.find((u) => u.username === state.user.username);
    if (found) {
      state.user = { id: found.id, username: found.username };
      changed = true;
    }
  }
  if (changed) {
    save('rehabUsers', state.users);
    save('rehabProfiles', state.profiles);
    save('rehabUser', state.user);
  }
}

function currentUser() {
  if (!state.user) return null;
  return state.users.find((u) => u.id === state.user.id) || null;
}

function switchTab(tabId) {
  tabs.forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
  sections.forEach((s) => s.classList.toggle('active', s.id === tabId));
}

function syncUserUI() {
  const user = currentUser();
  const name = user?.username || '朋友';
  document.getElementById('welcomeName').textContent = name;
  document.getElementById('sideName').textContent = user?.username || '访客用户';
  document.getElementById('sideState').textContent = user ? `ID:${user.id}` : '未登录';
}

function renderPlans(plans = defaultPlans) {
  planGrid.innerHTML = plans.map((p) => `<div class="plan-item"><h4>${p[0]}</h4><p>${p[1]}</p><small>${p[2]}</small></div>`).join('');
}

function renderCalendar() {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const today = now.getDate();
  const firstDay = new Date(y, m, 1);
  const lastDate = new Date(y, m + 1, 0).getDate();
  const weekLabels = ['一', '二', '三', '四', '五', '六', '日'];
  calendarWeek.innerHTML = weekLabels.map((w) => `<div>${w}</div>`).join('');

  const monthPrefix = `${y}-${String(m + 1).padStart(2, '0')}-`;
  const doneDays = new Set(state.checkins.filter((c) => c.date.startsWith(monthPrefix)).map((c) => Number(c.date.slice(-2))));

  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push('<div></div>');
  for (let d = 1; d <= lastDate; d += 1) {
    const isToday = d === today;
    const isDone = doneDays.has(d);
    cells.push(`<div class="day-cell ${isToday ? 'today' : ''} ${isDone ? 'done' : ''}"><div class="day-num">${d}</div><div class="day-mark"></div></div>`);
  }
  calendarGrid.innerHTML = cells.join('');
}

function renderList(elId, list, category) {
  document.getElementById(elId).innerHTML = list
    .map((item) => `<div>${item} <button class="hub-btn collect-btn" data-category="${category}" data-item="${item}">收藏</button></div>`)
    .join('');
}

function addFavorite(item, category) {
  state.favorites.unshift({ item, category, time: new Date().toLocaleString('zh-CN') });
  state.favorites = state.favorites.slice(0, 50);
  save('rehabFavorites', state.favorites);
  renderProfileData();
}

function addHistory(item) {
  state.history.unshift(`${new Date().toLocaleTimeString('zh-CN')} ${item}`);
  state.history = state.history.slice(0, 80);
  save('rehabHistory', state.history);
  renderProfileData();
}

function renderNearby(list) {
  nearbyVideos.innerHTML = list
    .map((v) => `<div class="video-card"><h4>${v.title}</h4><p>${v.area}</p><p>距离：${v.dist}</p><button class="hub-btn play-nearby" data-title="${v.title}">观看并记录</button></div>`)
    .join('');
}

function renderPosts() {
  const list = document.getElementById('postList');
  if (!state.posts.length) {
    list.innerHTML = '<p>还没有帖子，来发布第一条鼓励吧！</p>';
    return;
  }
  list.innerHTML = state.posts
    .map((p, i) => `<div class="post-item"><h4>${p.author}</h4><div>${p.content}</div><div class="post-meta"><span>👍 ${p.likes}</span><span>💬 ${p.comments.length}</span></div><div class="post-actions"><button onclick="likePost(${i})">点赞</button><button onclick="favPost(${i})">收藏</button></div><div>${p.comments.map((c) => `<p>— ${c}</p>`).join('')}</div><div class="comment-row"><input id="comment-${i}" placeholder="写下评论..."/><button class="pill-btn" onclick="addComment(${i})">评论</button></div></div>`)
    .join('');
}

function getFollowingIds(uid) {
  return state.followGraph[uid] || [];
}

function followersCount(uid) {
  return Object.values(state.followGraph).filter((arr) => arr.includes(uid)).length;
}

function pairKey(a, b) {
  return [a, b].sort().join('__');
}

function renderProfileData() {
  const me = currentUser();
  const avatar = document.getElementById('profileAvatar');
  const name = document.getElementById('profileName');
  const idText = document.getElementById('profileIdText');
  const bioInput = document.getElementById('profileBioInput');
  const followingCount = document.getElementById('followingCount');
  const followers = document.getElementById('followersCount');
  const favList = document.getElementById('favList');
  const historyList = document.getElementById('historyList');
  const publishedList = document.getElementById('publishedList');
  const dmTarget = document.getElementById('dmTarget');

  if (!me) {
    avatar.src = 'https://i.pravatar.cc/120?u=guest';
    name.textContent = '访客用户';
    idText.textContent = 'ID: --';
    if (bioInput) bioInput.value = '登录后可查看完整个人中心功能。';
    followingCount.textContent = '0';
    followers.textContent = '0';
    favList.innerHTML = '<p>请登录后查看收藏内容</p>';
    historyList.innerHTML = '<p>请登录后查看历史记录</p>';
    publishedList.innerHTML = '<p>请登录后查看我的发布</p>';
    dmTarget.innerHTML = '<option value="">请先登录</option>';
    document.getElementById('dmThread').innerHTML = '<p>暂无私信</p>';
    return;
  }

  const profile = state.profiles[me.id] || { bio: '', avatar: '' };
  avatar.src = profile.avatar || `https://i.pravatar.cc/120?u=${me.id}`;
  name.textContent = me.username;
  idText.textContent = `ID: ${me.id}`;
  if (bioInput) bioInput.value = profile.bio || '这个人很神秘，什么都没有留下。';

  const following = getFollowingIds(me.id);
  followingCount.textContent = String(following.length);
  followers.textContent = String(followersCount(me.id));

  favList.innerHTML = state.favorites.length
    ? state.favorites.map((f) => `<p>${f.time} · [${f.category}] ${f.item}</p>`).join('')
    : '<p>暂无收藏内容</p>';

  historyList.innerHTML = state.history.length
    ? state.history.map((h) => `<p>${h}</p>`).join('')
    : '<p>暂无历史记录</p>';

  const myPosts = state.posts.filter((p) => p.author === me.username).map((p) => `社区帖子：${p.content}`);
  const myVideos = state.history.filter((h) => h.includes('观看附近视频')).map((h) => `视频记录：${h}`);
  const published = [...myPosts, ...myVideos];
  publishedList.innerHTML = published.length
    ? published.map((x) => `<div class="published-item">${x}</div>`).join('')
    : '<p>暂未发布内容</p>';

  const options = following
    .map((fid) => state.users.find((u) => u.id === fid))
    .filter(Boolean)
    .map((u) => `<option value="${u.id}">${u.username}（${u.id}）</option>`)
    .join('');
  dmTarget.innerHTML = options || '<option value="">暂无已关注用户</option>';
  renderDmThread();
}

function renderFriendResults(keyword = '') {
  const list = document.getElementById('friendResultList');
  const me = currentUser();
  if (!me) {
    list.innerHTML = '<p>请先登录后添加好友。</p>';
    return;
  }
  const kw = keyword.trim().toLowerCase();
  const candidates = state.users.filter((u) => u.id !== me.id && (!kw || u.id.toLowerCase().includes(kw) || u.username.toLowerCase().includes(kw)));
  if (!candidates.length) {
    list.innerHTML = '<p>未找到匹配用户。</p>';
    return;
  }
  const following = new Set(getFollowingIds(me.id));
  list.innerHTML = candidates.map((u) => {
    const p = state.profiles[u.id] || {};
    const isFollow = following.has(u.id);
    return `<div class="friend-row"><img src="${p.avatar || `https://i.pravatar.cc/120?u=${u.id}`}" alt="avatar"/><div><strong>${u.username}</strong><p class="muted">ID: ${u.id}</p><p>${p.bio || '暂无简介'}</p></div><div class="friend-actions"><button class="pill-btn follow-btn" data-uid="${u.id}">${isFollow ? '已关注' : '关注'}</button><button class="pill-btn ghost dm-open-btn" data-uid="${u.id}">私信</button></div></div>`;
  }).join('');
}

function toggleFollow(targetId) {
  const me = currentUser();
  if (!me) return;
  const following = new Set(getFollowingIds(me.id));
  if (following.has(targetId)) following.delete(targetId);
  else following.add(targetId);
  state.followGraph[me.id] = [...following];
  save('rehabFollowGraph', state.followGraph);
  renderProfileData();
  renderFriendResults(document.getElementById('friendKeyword').value);
}

function openDmWith(uid) {
  const me = currentUser();
  if (!me) return;
  const following = new Set(getFollowingIds(me.id));
  if (!following.has(uid)) {
    toggleFollow(uid);
  }
  renderProfileData();
  document.getElementById('dmTarget').value = uid;
  renderDmThread();
}

function renderDmThread() {
  const me = currentUser();
  const target = document.getElementById('dmTarget').value;
  const box = document.getElementById('dmThread');
  if (!me || !target) {
    box.innerHTML = '<p>选择一个已关注用户开始私信。</p>';
    return;
  }
  const key = pairKey(me.id, target);
  const msgs = state.dmThreads[key] || [];
  box.innerHTML = msgs.length
    ? msgs.map((m) => `<div class="dm-item ${m.from === me.id ? 'me' : ''}"><p>${m.from === me.id ? '我' : m.fromName}：${m.text}</p><small>${m.time}</small></div>`).join('')
    : '<p>还没有私信消息，发一条问候吧。</p>';
}

function renderCareText() {
  const hour = new Date().getHours();
  let text = '愿你今天也被温柔以待。';
  if (hour < 10) text = '早安，先喝温水再训练，今天也请慢慢变强。';
  else if (hour < 18) text = '午间提醒：训练后补充蛋白质，记得适度拉伸。';
  else text = '晚上好，建议做10分钟舒缓训练帮助睡眠。';
  if (careText) careText.textContent = text;
  document.getElementById('greetingText').textContent = text;
}

window.likePost = (i) => {
  state.posts[i].likes += 1;
  save('rehabPosts', state.posts);
  renderPosts();
};
window.favPost = (i) => addFavorite(state.posts[i].content, '社区话题');
window.addComment = (i) => {
  const input = document.getElementById(`comment-${i}`);
  if (!input.value.trim()) return;
  state.posts[i].comments.push(input.value.trim());
  save('rehabPosts', state.posts);
  renderPosts();
};

tabs.forEach((btn) => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const keyword = document.getElementById('search').value.trim();
  addHistory(`搜索：${keyword || '（空）'}`);
});

checkinBtn.addEventListener('click', () => {
  const minutes = checkinMinutes.value.trim();
  const type = checkinType.value.trim();
  if (!minutes || !type) {
    checkinMsg.textContent = '请填写训练时长和训练类型后再打卡。';
    return;
  }
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  state.checkins = state.checkins.filter((c) => c.date !== date);
  state.checkins.push({ date, minutes, type, user: currentUser()?.username || '访客' });
  save('rehabCheckins', state.checkins);
  checkinMsg.textContent = `打卡成功：${type}，${minutes} 分钟。`;
  renderCalendar();
});

document.getElementById('locateBtn').addEventListener('click', () => {
  if (!navigator.geolocation) {
    locationHint.textContent = '浏览器不支持定位，已展示默认附近推荐。';
    renderNearby(geoVideos.default);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const zone = pos.coords.latitude > 30 ? 'north' : 'south';
      locationHint.textContent = `定位成功（纬度 ${pos.coords.latitude.toFixed(2)}），已切换附近推荐。`;
      renderNearby(geoVideos[zone]);
    },
    () => {
      locationHint.textContent = '定位失败，已展示默认附近推荐。';
      renderNearby(geoVideos.default);
    },
  );
});

document.getElementById('nearbyVideos').addEventListener('click', (e) => {
  if (!e.target.classList.contains('play-nearby')) return;
  addHistory(`观看附近视频：${e.target.dataset.title}`);
  document.getElementById('rehabVideo').scrollIntoView({ behavior: 'smooth' });
});

document.getElementById('generatePlanBtn')?.addEventListener('click', () => {
  aiPlan.innerHTML = '<p>已生成计划：每周5次轻中度训练 + 2次恢复拉伸；重点关注核心稳定、关节活动度与呼吸耐力。</p>';
});

document.getElementById('aiAsk')?.addEventListener('click', () => {
  const q = document.getElementById('aiInput').value.trim();
  document.getElementById('aiResponse').textContent = q
    ? `针对“${q}”，建议从RPE 3-4起步，每次20-30分钟，记录心率/疼痛/睡眠，7天后复盘微调。`
    : '请告诉我你的障碍情况、训练目标和可用时段，我会给你个性化建议。';
});

document.getElementById('postBtn').addEventListener('click', () => {
  const input = document.getElementById('postInput');
  const content = input.value.trim();
  if (!content) return;
  state.posts.unshift({ author: currentUser()?.username || '匿名朋友', content, likes: 0, comments: [] });
  input.value = '';
  save('rehabPosts', state.posts);
  renderPosts();
  renderProfileData();
});

const registerBtn = document.getElementById('registerBtn');
if (registerBtn) registerBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('authMessage') || { textContent: '' };
  if (!username || !password) return (msg.textContent = '请输入手机号/用户名和密码');
  if (state.users.find((u) => u.username === username)) return (msg.textContent = '用户已存在');
  const id = `U${Math.floor(1000 + Math.random() * 9000)}`;
  state.users.push({ id, username, password });
  state.profiles[id] = { bio: '这个人很神秘，什么都没有留下。', avatar: `https://i.pravatar.cc/120?u=${id}` };
  save('rehabUsers', state.users);
  save('rehabProfiles', state.profiles);
  msg.textContent = `注册成功，你的用户ID是 ${id}`;
});

const loginBtn = document.getElementById('loginBtn');
if (loginBtn) loginBtn.addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const msg = document.getElementById('authMessage') || { textContent: '' };
  const user = state.users.find((u) => u.username === username && u.password === password);
  if (!user) return (msg.textContent = '登录失败，请检查账号或密码');
  state.user = { id: user.id, username: user.username };
  save('rehabUser', state.user);
  msg.textContent = `登录成功，欢迎 ${username}`;
  syncUserUI();
  renderProfileData();
  switchTab('profile');
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) logoutBtn.addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('rehabUser');
  const msg = document.getElementById('authMessage');
  if (msg) msg.textContent = '已退出登录';
  syncUserUI();
  renderProfileData();
});

document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('collect-btn')) addFavorite(e.target.dataset.item, e.target.dataset.category);
  if (e.target.classList.contains('follow-btn')) toggleFollow(e.target.dataset.uid);
  if (e.target.classList.contains('dm-open-btn')) openDmWith(e.target.dataset.uid);
});

const openFriendSearchBtn = document.getElementById('openFriendSearch');
if (openFriendSearchBtn) openFriendSearchBtn.addEventListener('click', () => {
  document.getElementById('friendSearchBox').classList.toggle('hidden');
});

const friendSearchBtn = document.getElementById('friendSearchBtn');
if (friendSearchBtn) friendSearchBtn.addEventListener('click', () => {
  renderFriendResults(document.getElementById('friendKeyword').value);
});

const saveAvatarBtn = document.getElementById('saveAvatarBtn');
if (saveAvatarBtn) saveAvatarBtn.addEventListener('click', () => {
  const me = currentUser();
  if (!me) return;
  const url = document.getElementById('avatarUrlInput').value.trim();
  if (!url) return;
  state.profiles[me.id] = { ...(state.profiles[me.id] || {}), avatar: url };
  save('rehabProfiles', state.profiles);
  renderProfileData();
});

const dmTargetEl = document.getElementById('dmTarget');
if (dmTargetEl) dmTargetEl.addEventListener('change', renderDmThread);

const saveBioBtn = document.getElementById('saveBioBtn');
if (saveBioBtn) saveBioBtn.addEventListener('click', () => {
  const me = currentUser();
  if (!me) return;
  const bio = document.getElementById('profileBioInput').value.trim();
  state.profiles[me.id] = { ...(state.profiles[me.id] || {}), bio: bio || '这个人很神秘，什么都没有留下。' };
  save('rehabProfiles', state.profiles);
  renderProfileData();
});

const dmSendBtn = document.getElementById('dmSendBtn');
if (dmSendBtn) dmSendBtn.addEventListener('click', () => {
  const me = currentUser();
  const targetId = document.getElementById('dmTarget').value;
  const text = document.getElementById('dmInput').value.trim();
  if (!me || !targetId || !text) return;
  const key = pairKey(me.id, targetId);
  const target = state.users.find((u) => u.id === targetId);
  state.dmThreads[key] = state.dmThreads[key] || [];
  state.dmThreads[key].push({ from: me.id, to: targetId, fromName: me.username, toName: target?.username || targetId, text, time: new Date().toLocaleString('zh-CN') });
  save('rehabDmThreads', state.dmThreads);
  document.getElementById('dmInput').value = '';
  renderDmThread();
});

document.getElementById('closeRestModal').addEventListener('click', () => restModal.classList.add('hidden'));

const video = document.getElementById('rehabVideo');
let watchedSeconds = 0;
let warned = false;
setInterval(() => {
  if (!video.paused && !video.ended) {
    watchedSeconds += 1;
    watchTimer.textContent = `已连续观看：${Math.floor(watchedSeconds / 60)} 分钟`;
    const limit = Number(document.getElementById('limitMinutes').value || 120) * 60;
    const noDisturb = document.getElementById('noDisturb').checked;
    const h = new Date().getHours();
    const inQuiet = h >= 22 || h < 7;
    if (watchedSeconds >= limit && !warned && !(noDisturb && inQuiet)) {
      warned = true;
      restModal.classList.remove('hidden');
    }
  } else {
    watchedSeconds = 0;
    warned = false;
  }
}, 1000);

const aiFloatBtn = document.getElementById('aiFloatBtn');
const aiFloatOverlay = document.getElementById('aiFloatOverlay');
const aiFloatPanel = document.getElementById('aiFloatPanel');
const aiFloatDrag = document.getElementById('aiFloatDrag');
const closeAiFloat = document.getElementById('closeAiFloat');
const aiFloatInput = document.getElementById('aiFloatInput');
const aiFloatSend = document.getElementById('aiFloatSend');
const aiFloatMessages = document.getElementById('aiFloatMessages');

function addFloatMessage(role, text) {
  const div = document.createElement('div');
  div.className = `msg ${role}`;
  div.textContent = text;
  aiFloatMessages.appendChild(div);
  aiFloatMessages.scrollTop = aiFloatMessages.scrollHeight;
}

function replyByPrompt(q) {
  if (q.includes('酸痛') || q.includes('疼')) return '建议今天以低强度拉伸和热敷为主，训练控制在20分钟内，疼痛加重请暂停并咨询理疗师。';
  if (q.includes('计划')) return '我为你建议：每周5天轻中度训练+2天恢复，先从核心稳定、关节活动度开始。';
  return '已收到你的问题。建议从低强度开始，关注心率、疼痛等级和睡眠，并按周复盘调整。';
}

function openAiFloat() {
  aiFloatOverlay.classList.remove('hidden');
  aiFloatOverlay.setAttribute('aria-hidden', 'false');
}

function closeAiFloatPanel() {
  aiFloatOverlay.classList.add('hidden');
  aiFloatOverlay.setAttribute('aria-hidden', 'true');
}

closeAiFloat.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeAiFloatPanel();
});
aiFloatOverlay.addEventListener('click', (e) => {
  if (e.target === aiFloatOverlay) closeAiFloatPanel();
});

aiFloatSend.addEventListener('click', () => {
  const q = aiFloatInput.value.trim();
  if (!q) return;
  addFloatMessage('user', q);
  addFloatMessage('ai', replyByPrompt(q));
  aiFloatInput.value = '';
});

function makeDraggable(handle, target, mode = 'free') {
  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let baseLeft = 0;
  let baseTop = 0;

  const onMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;

    let left = baseLeft + dx;
    let top = baseTop + dy;
    const maxLeft = window.innerWidth - target.offsetWidth;
    const maxTop = window.innerHeight - target.offsetHeight;
    left = Math.min(Math.max(0, left), Math.max(0, maxLeft));
    top = Math.min(Math.max(0, top), Math.max(0, maxTop));

    target.style.left = `${left}px`;
    target.style.top = `${top}px`;
    target.style.right = 'auto';
    target.style.bottom = 'auto';
  };

  const onUp = () => {
    dragging = false;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    if (mode === 'button' && !moved) openAiFloat();
  };

  handle.addEventListener('pointerdown', (e) => {
    if (e.target.closest('.mini-close')) return;
    dragging = true;
    moved = false;
    startX = e.clientX;
    startY = e.clientY;
    const rect = target.getBoundingClientRect();
    baseLeft = rect.left;
    baseTop = rect.top;
    target.setPointerCapture?.(e.pointerId);
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  });
}

makeDraggable(aiFloatBtn, aiFloatBtn, 'button');
makeDraggable(aiFloatDrag, aiFloatPanel, 'free');

function init() {
  ensureUserModel();
  todayDate.textContent = new Date().toLocaleDateString('zh-CN');
  renderPlans();
  renderCalendar();
  renderCareText();
  renderList('knowledgeList', knowledgeData, '健康知识');
  renderList('sportsList', sportsData, '体育资讯');
  renderNearby(geoVideos.default);
  renderPosts();
  syncUserUI();
  renderFriendResults();
  renderProfileData();
}

init();
