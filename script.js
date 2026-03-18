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
const fatigueLevel = document.getElementById('fatigueLevel');
const checkinMsg = document.getElementById('checkinMsg');
const healthScoreValue = document.getElementById('healthScoreValue');

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
  userStore: JSON.parse(localStorage.getItem('rehabUserStore') || '{}'),
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

const therapyMap = {
  浙江: {
    杭州: [
      { name: '周晨', title: '神经康复理疗师', price: '¥198/次', mode: '支持上门' },
      { name: '林悦', title: '运动康复治疗师', price: '¥228/次', mode: '支持上门' },
    ],
    宁波: [{ name: '顾宁', title: '关节康复理疗师', price: '¥188/次', mode: '支持上门' }],
  },
  上海: {
    上海市: [
      { name: '陈峰', title: '脊柱康复理疗师', price: '¥260/次', mode: '支持上门' },
      { name: '徐晴', title: '儿童康复治疗师', price: '¥230/次', mode: '机构/上门' },
    ],
  },
  广东: {
    广州: [{ name: '黄杰', title: '术后康复理疗师', price: '¥210/次', mode: '支持上门' }],
    深圳: [{ name: '苏雅', title: '姿态矫正理疗师', price: '¥240/次', mode: '支持上门' }],
  },
};

const shopItems = [
  { category: '助行设备', name: '轻量助行器', price: '¥299', img: 'https://images.unsplash.com/photo-1542816417-0983678b9c7b?w=600' },
  { category: '康复训练', name: '弹力训练带套装', price: '¥69', img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600' },
  { category: '理疗器械', name: '便携筋膜放松仪', price: '¥199', img: 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=600' },
  { category: '康复训练', name: '平衡训练垫', price: '¥159', img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600' },
  { category: '理疗器械', name: '热敷理疗护膝', price: '¥129', img: 'https://images.unsplash.com/photo-1584467735871-10c1a977fd2c?w=600' },
  { category: '助行设备', name: '折叠防滑拐杖', price: '¥89', img: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=600' },
];

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function activeUserKey() {
  return currentUser()?.id || '__guest__';
}

function userBucket() {
  const k = activeUserKey();
  if (!state.userStore[k]) {
    state.userStore[k] = { posts: [], favorites: [], history: [], checkins: [], likedPostIds: [], daily: {} };
    save('rehabUserStore', state.userStore);
  }
  if (!state.userStore[k].daily) {
    state.userStore[k].daily = {};
    save('rehabUserStore', state.userStore);
  }
  return state.userStore[k];
}

function saveUserBucket() {
  save('rehabUserStore', state.userStore);
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
  if (!state.userStore.__guest__) {
    state.userStore.__guest__ = {
      posts: state.posts || [],
      favorites: state.favorites || [],
      history: state.history || [],
      checkins: state.checkins || [],
      likedPostIds: [],
      daily: {},
    };
    changed = true;
  }

  Object.keys(state.userStore).forEach((k) => {
    if (!state.userStore[k].daily) {
      state.userStore[k].daily = {};
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
    save('rehabUserStore', state.userStore);
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

function syncProfileAuthVisibility() {
  const block = document.getElementById('profileAuthBlock');
  const logout2 = document.getElementById('logoutBtn2');
  const loggedIn = Boolean(currentUser());
  if (block) block.classList.toggle('hidden', loggedIn);
  if (logout2) logout2.classList.toggle('hidden', !loggedIn);
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayMetrics() {
  const box = userBucket();
  box.daily[todayKey()] = box.daily[todayKey()] || { articleReads: [], videoReads: [], exercise: 0 };
  return box.daily[todayKey()];
}

function renderHealthScore() {
  const m = todayMetrics();
  const articleScore = Math.min(2, new Set(m.articleReads).size) * 5;
  const videoScore = Math.min(2, new Set(m.videoReads).size) * 5;
  const learningScore = articleScore + videoScore;
  const exerciseScore = Math.min(40, Number(m.exercise || 0));
  const total = Math.min(100, 40 + learningScore + exerciseScore);
  if (healthScoreValue) healthScoreValue.textContent = String(Math.round(total));
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
  const checkins = userBucket().checkins;
  const doneDays = new Set(checkins.filter((c) => c.date.startsWith(monthPrefix)).map((c) => Number(c.date.slice(-2))));

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
  const daily = todayMetrics();
  const scored = new Set(daily.articleReads);
  document.getElementById(elId).innerHTML = list
    .map((item, idx) => {
      const readId = `${category}-${idx}`;
      const readDone = scored.has(readId);
      return `<div>${item} <button class="hub-btn collect-btn" data-category="${category}" data-item="${item}">收藏</button> <button class="hub-btn read-btn" data-read-id="${readId}">${readDone ? '已计分' : '阅读1分钟计分'}</button></div>`;
    })
    .join('');
}

function addFavorite(item, category) {
  const box = userBucket();
  box.favorites.unshift({ item, category, time: new Date().toLocaleString('zh-CN') });
  box.favorites = box.favorites.slice(0, 50);
  saveUserBucket();
  renderProfileData();
}

function addHistory(item) {
  const box = userBucket();
  box.history.unshift(`${new Date().toLocaleTimeString('zh-CN')} ${item}`);
  box.history = box.history.slice(0, 80);
  saveUserBucket();
  renderProfileData();
}

function renderNearby(list) {
  nearbyVideos.innerHTML = list
    .map((v) => `<div class="video-card"><h4>${v.title}</h4><p>${v.area}</p><p>距离：${v.dist}</p><button class="hub-btn play-nearby" data-title="${v.title}">观看并记录</button></div>`)
    .join('');
}

function renderPosts() {
  const list = document.getElementById('postList');
  const posts = userBucket().posts;
  if (!posts.length) {
    list.innerHTML = '<p>还没有帖子，来发布第一条鼓励吧！</p>';
    return;
  }
  list.innerHTML = posts
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
    syncProfileAuthVisibility();
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

  const box = userBucket();
  favList.innerHTML = box.favorites.length
    ? box.favorites.map((f) => `<p>${f.time} · [${f.category}] ${f.item}</p>`).join('')
    : '<p>暂无收藏内容</p>';

  historyList.innerHTML = box.history.length
    ? box.history.map((h) => `<p>${h}</p>`).join('')
    : '<p>暂无历史记录</p>';

  const myPosts = box.posts.filter((p) => p.author === me.username).map((p) => `社区帖子：${p.content}`);
  const myVideos = box.history.filter((h) => h.includes('观看附近视频')).map((h) => `视频记录：${h}`);
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
  syncProfileAuthVisibility();
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


function initTherapyFilters() {
  const province = document.getElementById('provinceSelect');
  const city = document.getElementById('citySelect');
  if (!province || !city) return;
  const provinces = Object.keys(therapyMap);
  province.innerHTML = provinces.map((p) => `<option value="${p}">${p}</option>`).join('');
  function syncCities() {
    const p = province.value;
    const cities = Object.keys(therapyMap[p] || {});
    city.innerHTML = cities.map((c) => `<option value="${c}">${c}</option>`).join('');
  }
  province.addEventListener('change', syncCities);
  syncCities();
}

function renderTherapistsByRegion() {
  const province = document.getElementById('provinceSelect')?.value;
  const city = document.getElementById('citySelect')?.value;
  const list = document.getElementById('therapistList');
  if (!list || !province || !city) return;
  const data = therapyMap[province]?.[city] || [];
  if (!data.length) {
    list.innerHTML = '<p>当前地区暂无可预约理疗师。</p>';
    return;
  }
  list.innerHTML = data.map((t) => `<div class="therapist-item"><img src="https://i.pravatar.cc/90?u=${t.name}" alt="avatar"/><div><h4>${t.name}</h4><p>${t.title}</p><p>${province}·${city}｜${t.mode}</p></div><div><p class="price">${t.price}</p><button class="pill-btn">预约对接</button></div></div>`).join('');
}

function renderShop(category = '全部') {
  const wrap = document.getElementById('shopWaterfall');
  const chips = document.getElementById('shopCategory');
  if (!wrap || !chips) return;
  const categories = ['全部', ...new Set(shopItems.map((i) => i.category))];
  chips.innerHTML = categories.map((c) => `<button class="shop-chip ${c === category ? 'active' : ''}" data-category="${c}">${c}</button>`).join('');
  const list = category === '全部' ? shopItems : shopItems.filter((i) => i.category === category);
  wrap.innerHTML = list.map((i) => `<article class="shop-card"><img src="${i.img}" alt="${i.name}"/><div class="meta"><h4>${i.name}</h4><p>${i.category}</p><p class="price">${i.price}</p></div></article>`).join('');
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
  const posts = userBucket().posts;
  if (!posts[i]) return;
  posts[i].likes += 1;
  saveUserBucket();
  renderPosts();
};
window.favPost = (i) => { const posts = userBucket().posts; if (!posts[i]) return; addFavorite(posts[i].content, '社区话题'); };
window.addComment = (i) => {
  const input = document.getElementById(`comment-${i}`);
  if (!input.value.trim()) return;
  const posts = userBucket().posts;
  if (!posts[i]) return;
  posts[i].comments.push(input.value.trim());
  saveUserBucket();
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
  const minutes = Number(checkinMinutes.value.trim());
  const type = checkinType.value.trim();
  if (!minutes || !type) {
    checkinMsg.textContent = '请填写训练时长和训练类型后再打卡。';
    return;
  }
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const box = userBucket();
  box.checkins = box.checkins.filter((c) => c.date !== date);
  box.checkins.push({ date, minutes, type, user: currentUser()?.username || '访客' });
  const factor = Number(fatigueLevel?.value || 1);
  const exerciseScore = Math.min(40, minutes * factor);
  const metrics = todayMetrics();
  metrics.exercise = exerciseScore;
  saveUserBucket();
  checkinMsg.textContent = `打卡成功：${type}，${minutes} 分钟，运动分 ${exerciseScore.toFixed(1)}。`;
  renderCalendar();
  renderHealthScore();
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
  const title = e.target.dataset.title;
  e.target.textContent = '计时中...';
  e.target.disabled = true;
  setTimeout(() => {
    const metrics = todayMetrics();
    if (!metrics.videoReads.includes(title)) {
      metrics.videoReads.push(title);
      saveUserBucket();
      renderHealthScore();
    }
    e.target.textContent = '已计分';
  }, 60000);
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
  const box = userBucket();
  box.posts.unshift({ author: currentUser()?.username || '匿名朋友', content, likes: 0, comments: [] });
  input.value = '';
  saveUserBucket();
  renderPosts();
  renderProfileData();
  renderCalendar();
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
  renderPosts();
  renderCalendar();
  renderHealthScore();
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
  renderPosts();
  renderCalendar();
  renderHealthScore();
});


const logoutBtn2 = document.getElementById('logoutBtn2');
if (logoutBtn2) logoutBtn2.addEventListener('click', () => {
  state.user = null;
  localStorage.removeItem('rehabUser');
  const msg = document.getElementById('authMessage');
  if (msg) msg.textContent = '已退出登录';
  syncUserUI();
  renderProfileData();
  renderPosts();
  renderCalendar();
  renderHealthScore();
});

document.body.addEventListener('click', (e) => {
  if (e.target.classList.contains('collect-btn')) addFavorite(e.target.dataset.item, e.target.dataset.category);
  if (e.target.classList.contains('read-btn')) {
    const readId = e.target.dataset.readId;
    e.target.textContent = '阅读计时中...';
    e.target.disabled = true;
    setTimeout(() => {
      const metrics = todayMetrics();
      if (!metrics.articleReads.includes(readId)) {
        metrics.articleReads.push(readId);
        saveUserBucket();
      }
      e.target.textContent = '已计分';
      renderHealthScore();
    }, 60000);
  }
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

const noDisturbEl = document.getElementById('noDisturb');
const limitMinutesEl = document.getElementById('limitMinutes');
if (noDisturbEl && limitMinutesEl) {
  const syncLimitEditable = () => { limitMinutesEl.disabled = !noDisturbEl.checked; };
  noDisturbEl.addEventListener('change', syncLimitEditable);
  syncLimitEditable();
}

document.getElementById('closeRestModal').addEventListener('click', () => restModal.classList.add('hidden'));

const video = document.getElementById('rehabVideo');
let watchedSeconds = 0;
let warned = false;
let currentVideoScored = false;
setInterval(() => {
  if (!video.paused && !video.ended) {
    watchedSeconds += 1;
    if (!currentVideoScored && watchedSeconds >= 60) {
      const metrics = todayMetrics();
      const videoKey = video.currentSrc || '主视频';
      if (!metrics.videoReads.includes(videoKey)) {
        metrics.videoReads.push(videoKey);
        saveUserBucket();
        renderHealthScore();
      }
      currentVideoScored = true;
    }
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
    currentVideoScored = false;
  }
}, 1000);

const aiFloatBtn = document.getElementById('aiFloatBtn');
const aiFloatOverlay = document.getElementById('aiFloatOverlay');
const aiFloatPanel = document.getElementById('aiFloatPanel');
const closeAiFloat = document.getElementById('closeAiFloat');
const closeMapPopupBtn = document.getElementById('closeMapPopup');
const mapPopup = document.getElementById('mapPopup');
const mapPopupTitle = document.getElementById('mapPopupTitle');
const mapPopupBody = document.getElementById('mapPopupBody');

const mapBuildingContent = {
  board: {
    title: '资讯公告栏',
    body: `
      <ul>
        <li>本周推荐阅读：肩颈放松、居家核心稳定、春季关节保护。</li>
        <li>无障碍体育资讯：社区轮椅健身课本周五开放报名。</li>
        <li>政策提示：多地辅助器具补贴已开启线上申领。</li>
      </ul>
      <div class="map-popup-tags"><span>政策科普</span><span>健康知识</span><span>体育资讯</span></div>
    `,
  },
  cinema: {
    title: '影音放映屋',
    body: `
      <ul>
        <li>推荐视频 1：15 分钟肩背舒展课。</li>
        <li>推荐视频 2：20 分钟轻快稳定训练。</li>
        <li>推荐视频 3：居家低冲击有氧跟练。</li>
      </ul>
      <div class="map-popup-tags"><span>附近推荐</span><span>官方视频</span><span>学习积分</span></div>
    `,
  },
  practice: {
    title: '今日康复小练习',
    body: `
      <ul>
        <li>15 分钟肩周拉伸</li>
        <li>20 分钟核心稳定</li>
        <li>10 分钟呼吸放松 + 姿态觉察</li>
      </ul>
      <div class="map-popup-tags"><span>生成我的计划</span><span>动作视频</span><span>康复知识</span></div>
    `,
  },
  home: {
    title: '我的屋子',
    body: `
      <ul>
        <li>查看今日打卡、连续训练天数与成长记录。</li>
        <li>回看已收藏的资讯、视频与社区互动内容。</li>
        <li>进入个人中心同步更新头像、简介和私信。</li>
      </ul>
      <div class="map-popup-tags"><span>我的记录</span><span>训练日历</span><span>收藏历史</span></div>
    `,
  },
  communityTree: {
    title: '互助长椅 / 树下角落',
    body: `
      <ul>
        <li>看看别人今天的训练近况和暖心分享。</li>
        <li>发布你的康复心得、求助问题和鼓励留言。</li>
        <li>和关注的朋友发起私信，一起坚持。</li>
      </ul>
      <div class="map-popup-tags"><span>互助社区</span><span>暖心陪伴</span><span>发帖交流</span></div>
    `,
  },
};

function openAiFloat() {
  aiFloatOverlay.classList.remove('hidden');
  aiFloatOverlay.setAttribute('aria-hidden', 'false');
  closeMapPopup();
}

function closeAiFloatPanel() {
  aiFloatOverlay.classList.add('hidden');
  aiFloatOverlay.setAttribute('aria-hidden', 'true');
}

function openMapPopup(buildingKey) {
  const card = mapBuildingContent[buildingKey];
  if (!card || !mapPopup || !mapPopupTitle || !mapPopupBody) return;
  mapPopupTitle.textContent = card.title;
  mapPopupBody.innerHTML = card.body;
  mapPopup.classList.remove('hidden');
}

function closeMapPopup() {
  mapPopup?.classList.add('hidden');
}

closeAiFloat.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  closeAiFloatPanel();
});
aiFloatOverlay.addEventListener('click', (e) => {
  if (e.target === aiFloatOverlay) closeAiFloatPanel();
});

closeMapPopupBtn?.addEventListener('click', closeMapPopup);
aiFloatBtn?.addEventListener('click', openAiFloat);

document.querySelectorAll('.map-building').forEach((building) => {
  building.addEventListener('click', () => openMapPopup(building.dataset.building));
});

document.querySelectorAll('.map-jump-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = document.querySelector(`.map-building[data-building="${btn.dataset.targetBuilding}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    if (btn.dataset.targetBuilding) openMapPopup(btn.dataset.targetBuilding);
  });
});

function init() {
  ensureUserModel();
  todayDate.textContent = new Date().toLocaleDateString('zh-CN');
  renderPlans();
  renderCalendar();
  renderCareText();
  renderList('knowledgeList', knowledgeData, '健康知识');
  renderList('sportsList', sportsData, '体育资讯');
  renderNearby(geoVideos.default);
  initTherapyFilters();
  renderTherapistsByRegion();
  renderShop('全部');
  document.getElementById('searchTherapistBtn')?.addEventListener('click', renderTherapistsByRegion);
  document.getElementById('citySelect')?.addEventListener('change', renderTherapistsByRegion);
  document.getElementById('shopCategory')?.addEventListener('click', (e) => {
    if (!e.target.classList.contains('shop-chip')) return;
    renderShop(e.target.dataset.category);
  });
  renderPosts();
  syncUserUI();
  renderHealthScore();
  renderFriendResults();
  renderProfileData();
  syncProfileAuthVisibility();
}

init();
