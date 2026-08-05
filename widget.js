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

function getTeaContentPeriod() {
  const h = new Date().getHours();
  if (h >= 7 && h < 15) return "morning";
  if (h >= 15 && h < 18) return "snack";
  return "night"; // 18:00–07:00
}
function filterByTeaPeriod(rows, period) {
  return rows.filter(r => !r.period || r.period === "ALL" || r.period === period);
}
function isTeaDeepNight() {
  const h = new Date().getHours();
  return h >= TEA_NIGHT_START_HOUR || h < TEA_NIGHT_END_HOUR; // 20:00–06:00
}

const WEATHER_FALLBACK_LAT = 35.1565; // 위치 허용을 안 했을 때 쓸 기본 위도
const WEATHER_FALLBACK_LON = 126.8970; // 기본 경도
const WEATHER_REFRESH_MIN = 30; // 몇 분마다 갱신할지

let cachedWeather = null;

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

async function fetchWeather() {
  const { lat, lon } = await getVisitorLocation();
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await fetch(url);
  const data = await res.json();
  const temp = Math.round(data.current_weather.temperature);
  const desc = WEATHER_CODE_JP[data.current_weather.weathercode] || "—";
  return { temp, desc };
}

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
function getCurrentWeekdayKey() {
  const weekdays = ["日","月","火","水","木","金","土"];
  return weekdays[new Date().getDay()];
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
function getCurrentPeriod() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "朝";
  if (h >= 11 && h < 17) return "昼";
  if (h >= 17 && h < 21) return "夕";
  return "夜";
}
let dailyRowsCache = null;
async function loadDailyRows() {
  if (!dailyRowsCache) {
    const res = await fetch(`${SHEET_API_BASE_URL}?type=daily`);
    dailyRowsCache = await res.json();
  }
  return dailyRowsCache;
}

async function getTimePeriodLine() {
  const rows = await loadDailyRows();
  const grouped = groupByKey(filterByLocale(rows));
  const period = getCurrentPeriod();
  const candidates = grouped[period] || [];
  if (!candidates.length) return null;
  return fillTemplate(pickFrom(candidates));
}

/* ============ ② お茶の時間のメッセージ（1日1回の"おやつ"ルール + 夜間制限） ============ */

const TEA_COOLDOWN_HOURS = 4;
const TEA_TAG_COLORS = {
  "朝の一杯": "#8FA383",
  "おやつのご相伴": "#8A5C3D",
  "夜のやすらぎ": "#525C7A",
  "本日のお茶": "#8A5C3D" 
};
const TEA_KEY_WEIGHTS = {};

const TEA_LIMIT_TAG_COLOR = "#B4703F";
const TEA_LIMIT_MESSAGES = [
  "誠に恐れ入りますが、おやつは一日に一度までと定めております、{name}。",
  "本日はすでにお持ちいたしました。おやつは一日一度が心得でございます。"
];

const TEA_NIGHT_START_HOUR = 20;
const TEA_NIGHT_END_HOUR = 6;
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

function isTeaDeepNight() {
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
  teaHideTimer = setTimeout(() => toastTea.classList.remove('show'), 6000);
}

async function fillTeaToast() {
  if (!teaRowsCache) teaRowsCache = await loadTeaRows();
  const period = getTeaContentPeriod();
  const pool = filterByTeaPeriod(filterByLocale(teaRowsCache), period);
  const grouped = groupByKey(pool);
  const key = weightedPickKey(grouped, TEA_KEY_WEIGHTS);
  const content = { tag: key, text: fillTemplate(pickFrom(grouped[key])) };
  setLastTeaMessage(content);
  renderTeaMessage(content);
}

async function openTeaToast() {
  if (USER_LOCALE === "KR") { // 한국은 쿨다운 없이 항상 새 메세지
    await fillTeaToast();
    toastTea.classList.add('show');
    resetTeaTimer();
    return;
  }

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

  if (isTeaDeepNight() && USER_LOCALE !== "KR") {
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
  if (USER_LOCALE === "KR") {
    fillTeaToast();
    resetTeaTimer();
    return;
  }

  if (isTeaDeepNight()) {
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
/* ============ ③ タロットカード（1日1回・注意文なし） ============ */
// key(カード名)ごとの出現しやすさ。大きいほど出やすく、未指定は既定値1として扱われます。

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
  tarotHideTimer = setTimeout(() => toastTarot.classList.remove('show'), 6000);
}

function getTodayDateKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
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
  const card = pickFrom(Object.keys(grouped));
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

/* ============ ④ 本日のご予定 ============ */
let scheduleHideTimer = null;
const toastSchedule = document.getElementById('toast-schedule');

function resetScheduleTimer() {
  clearTimeout(scheduleHideTimer);
  scheduleHideTimer = setTimeout(() => toastSchedule.classList.remove('show'), 6000);
}

function getWeatherLine() {
  if (!cachedWeather) return null;
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}現在　${cachedWeather.desc}　${cachedWeather.temp}℃`;
}

async function fillScheduleToast() {
  const rows = await loadDailyRows();
  const grouped = groupByKey(filterByLocale(rows));
  const today = getCurrentWeekdayKey();
  const tasks = grouped[today] || [];

  const weatherLine = getWeatherLine();
  const taskText = tasks.length
    ? tasks.map(t => `・${fillTemplate(t)}`).join("\n")
    : "本日のご予定は、特にございません。";
  const timeLine = await getTimePeriodLine();

  let fullText = weatherLine ? `${weatherLine}\n──────────\n${taskText}` : taskText;
  if (timeLine) fullText += `\n──────────\n${timeLine}`;

  document.getElementById('toastMsgSchedule').textContent = fullText;
}

document.getElementById('fab-schedule').addEventListener('click', async () => {
  if (toastSchedule.classList.contains('show')) {
    toastSchedule.classList.remove('show');
    clearTimeout(scheduleHideTimer);
    return;
  }
  await fillScheduleToast();
  toastSchedule.classList.add('show');
  resetScheduleTimer();
});

toastSchedule.addEventListener('click', async () => {
  await fillScheduleToast();
  resetScheduleTimer();
});

Promise.all([
  loadDailyRows(),
  loadTeaRows().then(rows => teaRowsCache = rows).catch(() => {}),
  loadTarotRows().then(rows => tarotRowsCache = rows).catch(() => {}),
  ]);


/* ============ 宝物探し ============ */
const TreasureHunt = (function() {
    const APPEAR_PROBABILITY = 0.3;
    const STORAGE_KEY = 'treasure_collected_items';
    const STORAGE_KEY_PENDING = 'treasure_pending_item';
    
    const STORAGE_KEY_FIRST_SEARCH = 'treasure_first_search_count'; 

    const itemsData = [
        { title: '赤い薔薇', icon: '🌹', desc: 'トランシー家の庭園に咲く、クリムゾンレッド色の薔薇。気高い気品を纏っている。' },
        { title: '謎の小瓶', icon: '🫙', desc: '不気味な液体が入った小瓶。開けると甘い香りと共に冷たい悪寒が走る。' },
        { title: '契約書', icon: '📜', desc: '悪魔と結ばれた血の契約。左目の刻印と同じ文様が不敵に輝いている。' },
        { title: '貝殻のペンダント', icon: '🐚', desc: '過去の記憶が封じ込められたかのような、どこか切なさを誘う貝殻。' },
        { title: '銀食器のセット', icon: '🧺', desc: 'ファントムハイヴ家執事が磨き上げた、完璧な手入れの行き届いたシルバーウェア。' },
        { title: 'ファントムハイヴの指輪', icon: '💍', desc: '代々当主だけに受け継がれる当主の証。圧倒的な重みと冷たさを感じる。' },
        { title: 'ブルーベルの花', icon: '💠', desc: '美しくも底知れない狂気を湛えた、アロイスの瞳を思わせる鮮やかな花。' },
        { title: 'ファントム社のタグ', icon: '🏷️', desc: 'ファントム社の商品に付いてるタグ。コレクターも居ると言う。' },
        { title: '革製の旅行鞄', icon: '👝', desc: '女王の番犬としてイギリス中を駆け巡る際、常に携帯している重厚な鞄。' },
        { title: '色んな柄の猫', icon: '🐈', desc: '執事セバスチャンの周りを何故かうろうろする猫。なついでくる。' },
        { title: '琥珀色のブランデー', icon: '🍸', desc: '大人の嗜みとして、夜な夜なグラスに注がれる芳醇で強いお酒。' },
        { title: 'セイロンティー', icon: '☕', desc: 'ファントムハイヴ邸で常に最高の淹れ方で提供される、香り高い紅茶。' },
        { title: 'ウィスキーグラス', icon: '🥃', desc: '氷がカランと音を立てる、冷たく澄んだクリスタルのグラス。' },
        { title: '領収書', icon: '🧾', desc: 'ファントム社のおもちゃや菓子の大口取引の記録。莫大な金額が並ぶ。' },
        { title: '調査報告書', icon: '📋', desc: '裏社会の事件やサーカス団の失踪事件に関する、極秘の調査データ。' },
        { title: '万年筆のメモ', icon: '📝', desc: 'シエルが鋭い筆跡で次なる命ずるべき事項を書き留めた紙片。' },
        { title: '特製オレンジジャム', icon: '🍊', desc: 'ルカと作ったとされる、甘酸っぱくも隠し味のありそうなジャム。' },
        { title: '英国貴族院の書類', icon: '📑', desc: '政治的謀略や裏の取引が記された、表に出せない極秘の公文書。' },
        { title: '特製アイシングクッキー', icon: '🍪', desc: '上品な甘さの中に、どこか毒っ気を感じさせる可愛らしいお菓子。' },
        { title: '輝くクラゲの標本', icon: '🪼', desc: 'トランシー邸の怪しげな部屋に飾られている、幻想的な海の生物。' },
        { title: '窓辺の鉢植え', icon: '🪴', desc: '手入れが行き届きながらも、静寂に包まれた部屋でひっそりと育つ植物。' },
        { title: 'スケジュール帳', icon: '🗒️', desc: '多忙な当主の分刻みのスケジュールと、死の予感が混ざり合う執事の手帳。' },
        { title: 'ガラスペン', icon: '🖋', desc: 'インクを吸い込み、冷たい文字を美しく紡ぎ出すための美しい筆記具。' },
        { title: 'ロンドンの地図', icon: '🗺️', desc: '霧深き裏社会の事件現場や、怪しげな館の位置が赤く記された地図。' },
        { title: 'ローストビーフのサンド', icon: '🥪', desc: '執事が手際よく用意した、英国の伝統的で上品な軽食。' },
        { title: '古びた羊皮紙', icon: '📃', desc: '悪魔との契約や呪術に関する古い言い伝えが記された難解な古文書。' },
        { title: '女王からの手紙', icon: '📄', desc: '「女王の番犬」へ下される、絶対不可避の極秘ミッションが記された書簡。' },
        { title: '満開の桜の枝', icon: '🌸', desc: 'どこか儚く、美しく散りゆく運命を暗示するかのような一枝。' },
        { title: 'アザラシのクッション', icon: '🦭', desc: 'アロイスの部屋に転がる抱き枕。名前は『シエル』。' },
        { title: '朝刊新聞', icon: '📰', desc: 'ロンドン市内の怪奇事件や、ジャック・ザ・リッパーの噂を伝える紙面。' },
        { title: '光り輝く宝石の王冠', icon: '👑', desc: '伯爵の気品あふれる高価なジュエリー。被ったことはないかも。' },
        { title: '古びた鍵', icon: '🗝️', desc: 'トランシー邸の開かずの扉、秘密の地下室を開ける鍵。' },
        { title: 'くまのぬいぐるみ', icon: '🧸', desc: 'ファントム社の商品を真似してクロードに作らせた海賊版。' },
        { title: '象牙の櫛', icon: '🪮', desc: '美しい髪を艶やかに整えるために使われる、職人技の光る高級な櫛。' },
        { title: '高級アロマオイル', icon: '🧴', desc: '甘い香りで心を惑わせる、トランシー邸の退廃的な雰囲気を象徴する小瓶。' },
        { title: '天蓋付きのベッド', icon: '🛏️', desc: '悪夢と孤独に苛まれながら、主が眠りにつくための重厚な寝具。' },
        { title: '深紅のマフラー', icon: '🧣', desc: '寒さを凌ぐためだけでなく、首元に纏う血の色を想起させる鮮烈な布。' },
        { title: 'ビジネス用アタッシュケース', icon: '💼', desc: 'ファントム社の一大事業の契約書や, 裏の資金が詰まった硬質な鞄。' },
        { title: 'ミントキャンディ', icon: '🍬', desc: 'ファントム社製の口に入れた瞬間、ピリッとした刺激と清涼感が広がる甘いお菓子。' },
        { title: '封蝋された手紙', icon: '✉️', desc: '漆黒のワックスでしっかりと封がされた、差出人不明の危険な予告状。' },
        { title: '甘い香りのラブレター', icon: '💌', desc: '純粋な恋心と、どこか歪んだ執着心が入り混じった秘密の恋文。' }
    ];

    let currentHiddenItem = null;
    const cornerWrapper = document.getElementById('corner-interaction-wrapper');
    const hiddenEmojiSpan = document.getElementById('hiddenEmoji');

    let startX = 0;
    let startY = 0;
    let isDragging = false;
    let hasTriggeredOpen = false; 

    function getSeenItems() {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    }

    function markItemAsSeen(title) {
        const seen = getSeenItems();
        if (!seen.includes(title)) {
            seen.push(title);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
        }
    }

function initHiddenItem() {
        const STORAGE_KEY_SKIP_NEXT = 'treasure_skip_next';

        window.addEventListener('beforeunload', function() {
            if (localStorage.getItem(STORAGE_KEY_PENDING)) {
                localStorage.setItem(STORAGE_KEY_SKIP_NEXT, 'true');
            }
            localStorage.removeItem(STORAGE_KEY_PENDING);
        });

        document.addEventListener('click', function(e) {
            const targetLink = e.target.closest('a');
            
            if (!targetLink || !targetLink.href || targetLink.target === '_blank' || targetLink.href.startsWith('javascript:')) return;

            if (cornerWrapper.classList.contains('show') && 
                !cornerWrapper.classList.contains('is-open') && 
                !cornerWrapper.classList.contains('is-flat')) {
                
                e.preventDefault(); 

                const emojiEl = document.getElementById('hiddenEmoji');
                if (emojiEl) emojiEl.classList.add('emoji-exit');
                flattenPaper();
                
                localStorage.setItem(STORAGE_KEY_SKIP_NEXT, 'true');
                localStorage.removeItem(STORAGE_KEY_PENDING);

                setTimeout(() => {
                    window.location.href = targetLink.href;
                }, 700);
            }
        });

        if (localStorage.getItem(STORAGE_KEY_SKIP_NEXT)) {
            localStorage.removeItem(STORAGE_KEY_SKIP_NEXT); 
            cornerWrapper.style.display = 'none';
            return; 
        }
        const pendingTitle = localStorage.getItem(STORAGE_KEY_PENDING);
        if (pendingTitle) {
            const found = itemsData.find(item => item.title === pendingTitle);
            if (found) {
                currentHiddenItem = found;
                displayItem(found);
                return;
            }
        }

let shouldAppear = true; // 항상 등장하도록 수정
        let currentSeenList = getSeenItems();

        // 만약 모든 아이템을 다 모았을 때 다시 처음부터 순환하게 만드는 기존 로직 유지
        if (currentSeenList.length >= itemsData.length) {
            currentSeenList = [];
            localStorage.removeItem(STORAGE_KEY);
        }

        if (currentSeenList.length >= itemsData.length) {
            currentSeenList = [];
            localStorage.removeItem(STORAGE_KEY);
        }

        const weightedPool = [];
        itemsData.forEach(item => {
            const isSeen = currentSeenList.includes(item.title);
            const weight = isSeen ? 1 : 100; 
            for(let i=0; i < weight; i++) weightedPool.push(item);
        });

        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        currentHiddenItem = weightedPool[randomIndex];

        localStorage.setItem(STORAGE_KEY_PENDING, currentHiddenItem.title);
        displayItem(currentHiddenItem);
    }

    function displayItem(item) {
        hiddenEmojiSpan.innerText = item.icon;
        cornerWrapper.style.display = 'block';
        
        addInteractionEvents();

        setTimeout(() => {
            cornerWrapper.classList.add('show');
        }, 100);
    }

function addInteractionEvents() {
        cornerWrapper.addEventListener('touchstart', handleStart, {passive: false});
        cornerWrapper.addEventListener('touchmove', handleMove, {passive: false});
        cornerWrapper.addEventListener('touchend', handleEnd);

        cornerWrapper.addEventListener('mousedown', handleStart);
        window.addEventListener('mousemove', handleMove); 
        window.addEventListener('mouseup', handleEnd);
        
        cornerWrapper.addEventListener('click', function(e) {
            if (!hasTriggeredOpen && isInsideCorner(e)) {
                togglePaper();
            }
        });
    }

        function isInsideCorner(e) {
        if (cornerWrapper.classList.contains('is-open') || cornerWrapper.classList.contains('is-flat')) return true;

        const rect = cornerWrapper.getBoundingClientRect();
        const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
        
     　 const localX = rect.right - clientX;
        const localY = rect.bottom - clientY;
     
        return (localX >= 0 && localY >= 0 && (localX + localY) <= 100);
    }

    function handleStart(e) {
        if (cornerWrapper.classList.contains('is-open')) return;

        if (!isInsideCorner(e)) return;

        isDragging = true;
        hasTriggeredOpen = false;

        if (e.type === 'touchstart') {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        } else {
            startX = e.clientX;
            startY = e.clientY;
        }
    }

    function handleMove(e) {
        if (!isDragging || hasTriggeredOpen) return;

        let currentX, currentY;

        if (e.type === 'touchmove') {
            if(e.cancelable) e.preventDefault(); 
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
        } else {
            currentX = e.clientX;
            currentY = e.clientY;
        }

        const moveX = currentX - startX;
        const moveY = currentY - startY;
        
        if ((-moveX + -moveY) > 50) {  
             togglePaper();
             hasTriggeredOpen = true; 
             isDragging = false; 
        }
    }

    function handleEnd(e) {
        isDragging = false;
    }

    function togglePaper() {
        if (cornerWrapper.classList.contains('is-open') || cornerWrapper.classList.contains('is-flat')) return;
        
        cornerWrapper.classList.add('is-open');

        if (currentHiddenItem) {
            markItemAsSeen(currentHiddenItem.title);
            localStorage.removeItem(STORAGE_KEY_PENDING);
        }

        setTimeout(() => {
            const emojiEl = document.getElementById('hiddenEmoji');
            if(emojiEl) emojiEl.classList.add('emoji-exit');
        }, 600);

        setTimeout(() => {
            if (currentHiddenItem) {
                const index = itemsData.indexOf(currentHiddenItem) + 1;
                const total = itemsData.length;
                openModal(currentHiddenItem.title, currentHiddenItem.icon, currentHiddenItem.desc, index, total);
            }
        }, 700);
    }

    function openModal(title, icon, desc, index, total) {
        const modal = document.getElementById('itemModal');
        document.getElementById('htModalTitle').innerText = title;
        document.getElementById('htModalIcon').innerText = icon;
        document.getElementById('htModalDesc').innerHTML = desc;

        document.getElementById('htItemCounter').innerText = `${index} / ${total} 番目の獲物`;
        modal.style.display = 'flex';
    }

    function closeModal() {
        document.getElementById('itemModal').style.display = 'none';
        flattenPaper(); 
    }

    function flattenPaper() {
        cornerWrapper.classList.remove('is-open'); 
        cornerWrapper.classList.add('is-flat');      
    }

    return {
        init: initHiddenItem,
        closeModal: closeModal
    };
})();

window.addEventListener('load', function() {
    TreasureHunt.init();
});
