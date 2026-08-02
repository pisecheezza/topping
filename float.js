/* ────────────────────────────────────────────────
   SHEET_API_BASE_URL 에 Apps Script 웹앱 배포 URL을 넣으세요.
   세 아이콘 모두 이 URL 하나를 공유하고, ?type=time / ?type=tea / ?type=tarot 만 다르게 붙습니다.
   시트: 한 스프레드시트 안에 Time / Tea / Tarot 탭(시트) 3개
   각 탭 형식: key(A열) | value(B열) — {date}, {name} 치환 지원
   ──────────────────────────────────────────────── */
const SHEET_API_BASE_URL = "https://script.google.com/macros/s/AKfycbwHou9yZgkYdvwYIkeFlJeJhvZ6BjYPWLQcl5GMcl6jhi7YzpKKo9o3HTHjpjskQup9/exec";
function detectLocale() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Asia/Seoul") return "KR";
    if (tz === "Asia/Tokyo") return "JP";
  } catch (e) {}
  return "JP"; // それ以外は日本口調をデフォルトに
}
const USER_LOCALE = detectLocale();
const USER_NAME = USER_LOCALE === "KR" ? "旦那様" : "坊っちゃん";

function filterByLocale(rows) {
  return rows.filter(r => !r.locale || r.locale === "ALL" || r.locale === USER_LOCALE);
}

const WEATHER_FALLBACK_LAT = 35.1565; // 위치 허용을 안 했을 때 쓸 기본 위도
const WEATHER_FALLBACK_LON = 126.8970; // 기본 경도
const WEATHER_REFRESH_MIN = 30; // 몇 분마다 갱신할지

function getVisitorLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: WEATHER_FALLBACK_LAT, lon: WEATHER_FALLBACK_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve({ lat: WEATHER_FALLBACK_LAT, lon: WEATHER_FALLBACK_LON }), // 거절/실패 시 폴백
      { timeout: 5000 }
    );
  });
}

const WEATHER_CODE_JP = {
  0: "快晴 ☀️", 1: "晴れ ☀️", 2: "薄曇り ⛅", 3: "曇り ☁️",
  45: "霧 🌫️", 48: "霧 🌫️",
  51: "小雨 🌦️", 53: "小雨 🌦️", 55: "小雨 🌦️",
  61: "雨 🌧️", 63: "雨 🌧️", 65: "強い雨 🌧️",
  71: "雪 ❄️", 73: "雪 ❄️", 75: "強い雪 ❄️",
  95: "雷雨 ⛈️"
};

let cachedWeather = null;

async function fetchWeather() {
  const { lat, lon } = await getVisitorLocation();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  const data = await res.json();
  const temp = Math.round(data.current_weather.temperature);
  const desc = WEATHER_CODE_JP[data.current_weather.weathercode] || "—";
  return { temp, desc };
}

async function updateWeatherBadge() {
  try {
    cachedWeather = await fetchWeather();
    const badge = document.getElementById('weather-badge');
    badge.textContent = `${cachedWeather.desc}　${cachedWeather.temp}℃`;
    badge.classList.add('show');
  } catch (e) {
    // 실패 시 그냥 조용히 숨김 상태 유지 (에러를 화면에 노출하지 않음)
  }
}

const WEATHER_TAG_COLOR = "#5C7A8A";
let toastWeatherCache = null;
let weatherHideTimer = null;
const toastWeather = document.getElementById('toast-weather');

function resetWeatherTimer() {
  clearTimeout(weatherHideTimer);
}

async function fillWeatherToast() {
  if (!cachedWeather) {
    try { cachedWeather = await fetchWeather(); }
    catch (e) {
      document.getElementById('toastMsgWeather').textContent = "只今、お天気の取得ができぬようでございます。";
      return;
    }
  }
  document.getElementById('toastDotWeather').style.background = WEATHER_TAG_COLOR;
  document.getElementById('toastMsgWeather').textContent =
    `本日は${cachedWeather.desc}、${cachedWeather.temp}℃でございます。`;
}

document.getElementById('fab-weather').addEventListener('click', async () => {
  if (toastWeather.classList.contains('show')) {
    toastWeather.classList.remove('show');
    return;
  }
  await fillWeatherToast();
  toastWeather.classList.add('show');
  resetWeatherTimer();
});

toastWeather.addEventListener('click', async () => {
  cachedWeather = null; // 눌러서 다시 확인하고 싶을 때 새로 받아옴
  await fillWeatherToast();
  resetWeatherTimer();
});

// 페이지 열자마자 미리 한 번 받아두기 (다른 아이콘들처럼 즉시 뜨도록)
fetchWeather().then(w => cachedWeather = w).catch(() => {});

function formatDate() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function fillTemplate(raw) {
  const d = new Date();
  const weekdays = ["日","月","火","水","木","金","土"];
  const seasons = ["冬","冬","春","春","春","夏","夏","夏","秋","秋","秋","冬"]; // 월(0-11) 기준
  return raw
    .replace("{date}", formatDate())
    .replace("{name}", USER_NAME)
    .replace("{weekday}", weekdays[d.getDay()])
    .replace("{hour}", d.getHours())
    .replace("{period}", getCurrentPeriod())   // 아침/오후/저녁/밤
    .replace("{season}", seasons[d.getMonth()])
    .replace("{weather}", cachedWeather ? `${cachedWeather.desc}、${cachedWeather.temp}℃` : "");
}
function groupByKey(rows) {
  const grouped = {};
  rows.forEach(({ key, value }) => (grouped[key] ||= []).push(value));
  return grouped;
}
function pickFrom(values) {
  return values[Math.floor(Math.random() * values.length)];
}
// weights 예: { "The Fool": 2, "The Hermit": 0.5 } — 숫자가 클수록 더 자주 나옴, 미지정 key는 기본값 1
function weightedPickKey(grouped, weights = {}) {
  const keys = Object.keys(grouped);
  const total = keys.reduce((sum, k) => sum + (weights[k] ?? 1), 0);
  let r = Math.random() * total;
  for (const k of keys) {
    r -= (weights[k] ?? 1);
    if (r <= 0) return k;
  }
  return keys[keys.length - 1];
}

/* ============ ① 時間帯別メッセージ ============ */
const TIME_TAG_COLORS = { "朝": "#8FA383", "昼": "#C9A24B", "夕": "#B4703F", "夜": "#525C7A" };
function getCurrentPeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "朝";
  if (h >= 11 && h < 17) return "昼";
  if (h >= 17 && h < 21) return "夕";
  return "夜";
}
async function loadTimeRows() {
  const res = await fetch(`${SHEET_API_BASE_URL}?type=time`);
  return res.json();
}
let timeRowsCache = null, timeHideTimer = null;
const toastTime = document.getElementById('toast-time');

async function fillTimeToast() {
  if (!timeRowsCache) timeRowsCache = await loadTimeRows();
  const grouped = groupByKey(filterByLocale(timeRowsCache));
  const period = getCurrentPeriod();
  const candidates = grouped[period] || [];
  if (!candidates.length) return;
  document.getElementById('toastTagTime').textContent = period;
  document.getElementById('toastMsgTime').textContent = fillTemplate(pickFrom(candidates));
  document.getElementById('toastDotTime').style.background = TIME_TAG_COLORS[period] || "#8A8578";
}
function resetTimeTimer() {
  clearTimeout(timeHideTimer);
}
document.getElementById('fab-time').addEventListener('click', async () => {
  if (toastTime.classList.contains('show')) {
    toastTime.classList.remove('show');
    clearTimeout(timeHideTimer);
    return;
  }
  await fillTimeToast();
  toastTime.classList.add('show');
  resetTimeTimer();
});
toastTime.addEventListener('click', async () => {
  await fillTimeToast();
  resetTimeTimer();
});

/* ============ ② お茶の時間のメッセージ（1日1回の"おやつ"ルール + 夜間制限） ============ */

const TEA_COOLDOWN_HOURS = 4;
const TEA_TAG_COLORS = { "本日のお茶": "#8A5C3D" };
const TEA_KEY_WEIGHTS = {};

const TEA_LIMIT_TAG_COLOR = "#B4703F";
const TEA_LIMIT_MESSAGES = [
  "誠に恐れ入りますが、おやつは一日に一度までと定めております、{name}。",
  "本日はすでにお持ちいたしました。おやつは一日一度が心得でございます。"
];

const TEA_NIGHT_START_HOUR = 20;
const TEA_NIGHT_END_HOUR = 8;
const TEA_NIGHT_NOTICE_CHANCE = 0.3;
const TEA_NIGHT_OFFER_CHANCE = 0.1;

const TEA_NIGHT_MESSAGES = [
  "夜も更けております。おやつのお時間は、また明日の朝に。",
  "この刻限は、些か遅うございます、{name}。",
  "……仕方ございませんね。今宵ばかりは、少しだけお持ちいたしましょうか。",
  "本日はもう店じまいといたしましょう。"
];
const TEA_NIGHT_MENU = [
  "温かいホットミルクはいかがでしょう。",
  "カモミールティーで、心を落ち着けましょう、{name}。",
  "生姜湯を、少しだけご用意いたしましょうか。",
  "軽い温かいスープなど、いかがでしょう。"
];

function isTeaNightTime() {
  const h = new Date().getHours();
  return h >= TEA_NIGHT_START_HOUR || h < TEA_NIGHT_END_HOUR;
}
function showTeaNightNotice() {
  document.getElementById('toastTagTea').textContent = "夜分でございます";
  document.getElementById('toastDotTea').style.background = TEA_LIMIT_TAG_COLOR;
  document.getElementById('toastMsgTea').textContent = fillTemplate(pickFrom(TEA_NIGHT_MESSAGES));
}
function showTeaNightOffer() {
  document.getElementById('toastTagTea').textContent = "夜食のご提案";
  document.getElementById('toastDotTea').style.background = "#8A5C3D";
  document.getElementById('toastMsgTea').textContent = fillTemplate(pickFrom(TEA_NIGHT_MENU));
}

async function loadTeaRows() {
  const res = await fetch(`${SHEET_API_BASE_URL}?type=tea`);
  return res.json();
}

let teaLastShownMemory = 0;
function getLastTeaTime() {
  try { return parseInt(localStorage.getItem('teaLastShown') || '0', 10); }
  catch (e) { return teaLastShownMemory; }
}
function setLastTeaTime(ts) {
  try { localStorage.setItem('teaLastShown', String(ts)); }
  catch (e) { teaLastShownMemory = ts; }
}
function formatRemaining(ms) {
  const totalMin = Math.max(1, Math.ceil(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}時間${m}分` : `${m}分`;
}

let teaRowsCache = null, teaHideTimer = null;
const toastTea = document.getElementById('toast-tea');

let teaLastMessageMemory = null;
function getLastTeaMessage() {
  try { return JSON.parse(localStorage.getItem('teaLastMessage') || 'null'); }
  catch (e) { return teaLastMessageMemory; }
}
function setLastTeaMessage(msg) {
  try { localStorage.setItem('teaLastMessage', JSON.stringify(msg)); }
  catch (e) { teaLastMessageMemory = msg; }
}

function renderTeaMessage({ tag, text }) {
  document.getElementById('toastTagTea').textContent = tag;
  document.getElementById('toastMsgTea').textContent = text;
  document.getElementById('toastDotTea').style.background = TEA_TAG_COLORS[tag] || "#8A5C3D";
}
function showTeaLimitNotice(remainingMs) {
  document.getElementById('toastTagTea').textContent = "本日はここまで";
  document.getElementById('toastDotTea').style.background = TEA_LIMIT_TAG_COLOR;
  const notice = fillTemplate(pickFrom(TEA_LIMIT_MESSAGES));
  document.getElementById('toastMsgTea').textContent =
    `${notice} 次にお持ちできるのは、あと${formatRemaining(remainingMs)}ほどかと存じます。`;
}
function resetTeaTimer() {
  clearTimeout(teaHideTimer);
}

async function fillTeaToast() {
  if (!teaRowsCache) teaRowsCache = await loadTeaRows();
  const grouped = groupByKey(filterByLocale(teaRowsCache));
  const key = weightedPickKey(grouped, TEA_KEY_WEIGHTS);
  const content = { tag: key, text: fillTemplate(pickFrom(grouped[key])) };
  setLastTeaMessage(content);
  renderTeaMessage(content);
}

async function openTeaToast() {
  const cooldownMs = TEA_COOLDOWN_HOURS * 60 * 60 * 1000;
  const last = getLastTeaTime();
  const remaining = cooldownMs - (Date.now() - last);

  if (last && remaining > 0) {
    const cached = getLastTeaMessage();
    if (cached) renderTeaMessage(cached);
    else showTeaLimitNotice(remaining);
  } else {
    await fillTeaToast();
    setLastTeaTime(Date.now());
  }
  toastTea.classList.add('show');
  resetTeaTimer();
}

document.getElementById('fab-tea').addEventListener('click', () => {
  if (toastTea.classList.contains('show')) {
    toastTea.classList.remove('show');
    clearTimeout(teaHideTimer);
    return;
  }

  if (isTeaNightTime()) {
    const r = Math.random();
    if (r < TEA_NIGHT_OFFER_CHANCE) {
      showTeaNightOffer();
    } else if (r < TEA_NIGHT_OFFER_CHANCE + TEA_NIGHT_NOTICE_CHANCE) {
      showTeaNightNotice();
    } else {
      return;
    }
    toastTea.classList.add('show');
    resetTeaTimer();
    return;
  }

  openTeaToast();
});

toastTea.addEventListener('click', () => {
  if (isTeaNightTime()) {
    if (Math.random() < TEA_NIGHT_NOTICE_CHANCE) showTeaNightNotice();
    resetTeaTimer();
    return;
  }

  const cooldownMs = TEA_COOLDOWN_HOURS * 60 * 60 * 1000;
  const last = getLastTeaTime();
  const remaining = cooldownMs - (Date.now() - last);
  if (last && remaining > 0) {
    showTeaLimitNotice(remaining);
  } else {
    fillTeaToast();
    setLastTeaTime(Date.now());
  }
  resetTeaTimer();
});

/* ============ ③ タロットカード（普通の案内文） ============ */
// シート形式：key（A列）= カード名（英語のまま）、value（B列）= そのカードの案内文
// 同じカード名を複数行に分けて書くと、その中からランダムに選ばれます。
// key(カード名)ごとの出現しやすさ。大きいほど出やすく、未指定は既定値1として扱われます。
/* ============ ③ タロットカード（1日1回・注意文なし） ============ */
// key(カード名)ごとの出現しやすさ。大きいほど出やすく、未指定は既定値1として扱われます。
const TAROT_KEY_WEIGHTS = {
  "The Fool": 1.5,
  "The Star": 1,
  "The Moon": 1,
  "Strength": 1,
  "The Sun": 1,
  "The Hermit": 0.6
};

const TAROT_LOCAL_DATA = [
{ "key": "The Fool", "value": "【正位置】新しい始まりの兆しです。恐れず一歩踏み出しましょう。" },
{ "key": "The Fool", "value": "【逆位置】少し無謀になっている兆しです。慎重さを取り戻しましょう。" },

{ "key": "The Magician", "value": "【正位置】必要な力はすでに揃っています。行動に移す時です。" },
{ "key": "The Magician", "value": "【逆位置】力はあっても使い方が定まっていません。目的を見直しましょう。" },

{ "key": "The High Priestess", "value": "【正位置】内なる直感を信じてよい時です。" },
{ "key": "The High Priestess", "value": "【逆位置】直感より情報に振り回されている兆しです。" },

{ "key": "The Empress", "value": "【正位置】豊かさと安らぎが満ちている時です。" },
{ "key": "The Empress", "value": "【逆位置】頑張りすぎて余裕を失っている兆しです。" },

{ "key": "The Emperor", "value": "【正位置】秩序と安定を築くのに良い時です。" },
{ "key": "The Emperor", "value": "【逆位置】力の入れすぎ、頑固さに注意が必要です。" },

{ "key": "The Hierophant", "value": "【正位置】経験や教えに学ぶとよい時です。" },
{ "key": "The Hierophant", "value": "【逆位置】既存のやり方に縛られすぎている兆しです。" },

{ "key": "The Lovers", "value": "【正位置】心が定まる、良い選択ができる時です。" },
{ "key": "The Lovers", "value": "【逆位置】選択に迷いが生じている兆しです。" },

{ "key": "The Chariot", "value": "【正位置】勢いに乗って前進できる時です。" },
{ "key": "The Chariot", "value": "【逆位置】方向を見失いがちな兆しです。少し立ち止まっても。" },

{ "key": "Strength", "value": "【正位置】力ではなく、優しさが物事を動かす時です。" },
{ "key": "Strength", "value": "【逆位置】自信を失いがちな兆しです。無理はご無用です。" },

{ "key": "The Hermit", "value": "【正位置】一人の時間が、答えを与えてくれる時です。" },
{ "key": "The Hermit", "value": "【逆位置】一人で抱え込みすぎている兆しです。" },

{ "key": "Wheel of Fortune", "value": "【正位置】流れが良い方向に変わり始めている時です。" },
{ "key": "Wheel of Fortune", "value": "【逆位置】変化に戸惑いを感じている兆しです。" },

{ "key": "Justice", "value": "【正位置】公正な判断ができる時です。" },
{ "key": "Justice", "value": "【逆位置】判断に偏りが出ている兆しです。" },

{ "key": "The Hanged Man", "value": "【正位置】あえて動かず待つことが力になる時です。" },
{ "key": "The Hanged Man", "value": "【逆位置】停滞に焦りを感じている兆しです。" },

{ "key": "Death", "value": "【正位置】一つの区切りが、新たな始まりへつながる時です。" },
{ "key": "Death", "value": "【逆位置】変化を受け入れがたく感じている兆しです。" },

{ "key": "Temperance", "value": "【正位置】バランスがとれ、穏やかに進める時です。" },
{ "key": "Temperance", "value": "【逆位置】無理な調整で疲れが出ている兆しです。" },

{ "key": "The Devil", "value": "【正位置】自分を縛っているものに気づける時です。" },
{ "key": "The Devil", "value": "【逆位置】その縛りから、少しずつ抜け出せる兆しです。" },

{ "key": "The Tower", "value": "【正位置】急な変化がありますが、必要な崩れです。" },
{ "key": "The Tower", "value": "【逆位置】大きな崩れは免れ、小さな見直しで済む兆しです。" },

{ "key": "The Star", "value": "【正位置】癒しと希望が満ちてくる時です。" },
{ "key": "The Star", "value": "【逆位置】希望を見失いがちな兆しです。焦らず。" },

{ "key": "The Moon", "value": "【正位置】不確かさがあっても、ゆっくり進めば十分な時です。" },
{ "key": "The Moon", "value": "【逆位置】不安の正体が、少しずつ見えてくる兆しです。" },

{ "key": "The Sun", "value": "【正位置】努力に見合った、明るい実りがある時です。" },
{ "key": "The Sun", "value": "【逆位置】その明るさが、もう少し先に来る兆しです。" },

{ "key": "Judgement", "value": "【正位置】これまでの積み重ねが認められる時です。" },
{ "key": "Judgement", "value": "【逆位置】まだ評価を急ぐ時ではない兆しです。" },

{ "key": "The World", "value": "【正位置】一つの物事が、良い形で完成する時です。" },
{ "key": "The World", "value": "【逆位置】あと少しで完成という段階の兆しです。" }
]

async function loadTarotRows() {
  return TAROT_LOCAL_DATA; // fetch 없이 바로 반환
}

let tarotRowsCache = null, tarotHideTimer = null;
const toastTarot = document.getElementById('toast-tarot');

function resetTarotTimer() {
  clearTimeout(tarotHideTimer);
}

function getTodayDateKey() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000; // UTC로 변환
  const kst = new Date(utcMs + 9 * 60 * 60000); // UTC+9 적용
  return `${kst.getFullYear()}-${kst.getMonth() + 1}-${kst.getDate()}`;
}

let tarotLastDateMemory = null;
let tarotLastCardMemory = null;

function getTarotLastDate() {
  try { return localStorage.getItem('tarotLastDate'); }
  catch (e) { return tarotLastDateMemory; }
}
function setTarotLastDate(dateKey) {
  try { localStorage.setItem('tarotLastDate', dateKey); }
  catch (e) { tarotLastDateMemory = dateKey; }
}
function getTarotLastCard() {
  try { return JSON.parse(localStorage.getItem('tarotLastCard') || 'null'); }
  catch (e) { return tarotLastCardMemory; }
}
function setTarotLastCard(card) {
  try { localStorage.setItem('tarotLastCard', JSON.stringify(card)); }
  catch (e) { tarotLastCardMemory = card; }
}

async function drawNewTarotCard() {
  if (!tarotRowsCache) tarotRowsCache = await loadTarotRows();
  const grouped = groupByKey(tarotRowsCache);
  const card = weightedPickKey(grouped, TAROT_KEY_WEIGHTS);
  const text = fillTemplate(pickFrom(grouped[card]));
  setTarotLastCard({ card, text });
  document.getElementById('toastCardTarot').textContent = card;
  document.getElementById('toastMsgTarot').textContent = text;
}

async function openTarotToast() {
  const today = getTodayDateKey();
  const lastDate = getTarotLastDate();

  if (lastDate === today) {
    const cached = getTarotLastCard();
    if (cached) {
      document.getElementById('toastCardTarot').textContent = cached.card;
      document.getElementById('toastMsgTarot').textContent = cached.text;
    } else {
      await drawNewTarotCard();
    }
  } else {
    await drawNewTarotCard();
    setTarotLastDate(today);
  }
  toastTarot.classList.add('show');
  resetTarotTimer();
}

document.getElementById('fab-tarot').addEventListener('click', () => {
  if (toastTarot.classList.contains('show')) {
    toastTarot.classList.remove('show');
    clearTimeout(tarotHideTimer);
    return;
  }
  openTarotToast();
});

toastTarot.addEventListener('click', () => {
  resetTarotTimer();
});
 
 Promise.all([
  loadTimeRows().then(rows => timeRowsCache = rows).catch(() => {}),
  loadTeaRows().then(rows => teaRowsCache = rows).catch(() => {}),
  loadTarotRows().then(rows => tarotRowsCache = rows).catch(() => {})
]);
