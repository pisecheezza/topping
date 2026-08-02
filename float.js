/* ────────────────────────────────────────────────
   SHEET_API_BASE_URL 에 Apps Script 웹앱 배포 URL을 넣으세요.
   세 아이콘 모두 이 URL 하나를 공유하고, ?type=time / ?type=tea / ?type=tarot 만 다르게 붙습니다.
   시트: 한 스프레드시트 안에 Time / Tea / Tarot 탭(시트) 3개
   각 탭 형식: key(A열) | value(B열) — {date}, {name} 치환 지원
   ──────────────────────────────────────────────── */
const SHEET_API_BASE_URL = "https://script.google.com/macros/s/AKfycbwHou9yZgkYdvwYIkeFlJeJhvZ6BjYPWLQcl5GMcl6jhi7YzpKKo9o3HTHjpjskQup9/exec";
const USER_NAME = "坊っちゃん"; // used wherever {name} appears

function formatDate() {
  const d = new Date();
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function fillTemplate(raw) {
  const d = new Date();
  const weekdays = ["日","月","火","水","木","金","土"];
  return raw
    .replace("{date}", formatDate())
    .replace("{name}", USER_NAME)
    .replace("{weekday}", weekdays[d.getDay()])   // 새 플레이스홀더 예시
    .replace("{hour}", d.getHours());              // 또 다른 예시
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
  const grouped = groupByKey(timeRowsCache);
  const period = getCurrentPeriod();
  const candidates = grouped[period] || [];
  if (!candidates.length) return;
  document.getElementById('toastTagTime').textContent = period;
  document.getElementById('toastMsgTime').textContent = fillTemplate(pickFrom(candidates));
  document.getElementById('toastDotTime').style.background = TIME_TAG_COLORS[period] || "#8A8578";
}
function resetTimeTimer() {
  clearTimeout(timeHideTimer);
  timeHideTimer = setTimeout(() => toastTime.classList.remove('show'), 5000);
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

/* ============ ② お茶の時間のメッセージ（1日1回の"おやつ"ルール付き） ============ */

const TEA_COOLDOWN_HOURS = 4;
const TEA_TAG_COLORS = { "本日のお茶": "#8A5C3D" };
const TEA_KEY_WEIGHTS = {};

const TEA_LIMIT_TAG_COLOR = "#B4703F";
const TEA_LIMIT_MESSAGES = [
  "誠に恐れ入りますが、おやつは一日に一度までと定めております、{name}。",
  "本日はすでにお持ちいたしました。おやつは一日一度が心得でございます。"
];

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
  teaHideTimer = setTimeout(() => toastTea.classList.remove('show'), 5000);
}

async function fillTeaToast() {
  if (!teaRowsCache) teaRowsCache = await loadTeaRows();
  const grouped = groupByKey(teaRowsCache);
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
 // fab-tea 클릭 핸들러 맨 앞에 추가
  if (isTeaNightTime()) {
  if (Math.random() < TEA_NIGHT_NOTICE_CHANCE) {
    showTeaNightNotice();
    toastTea.classList.add('show');
    resetTeaTimer();
  }
  return; // 확률에 안 걸리면 조용히 아무 반응 없음 (의도된 동작)
}
  if (toastTea.classList.contains('show')) {
    toastTea.classList.remove('show');
    clearTimeout(teaHideTimer);
    return;
  }
  openTeaToast();
});

toastTea.addEventListener('click', () => {
  const cooldownMs = TEA_COOLDOWN_HOURS * 60 * 60 * 1000;
  const last = getLastTeaTime();
  const remaining = cooldownMs - (Date.now() - last);
  // toastTea 클릭 핸들러 맨 앞에도 동일하게 추가
  if (isTeaNightTime()) {
  if (Math.random() < TEA_NIGHT_NOTICE_CHANCE) showTeaNightNotice();
  resetTeaTimer();
  return;
  }
  if (last && remaining > 0) {
    showTeaLimitNotice(remaining);
  } else {
    fillTeaToast();
    setLastTeaTime(Date.now());
  }
  resetTeaTimer();
});

const TEA_NIGHT_START_HOUR = 20; // 오후 8시부터
const TEA_NIGHT_END_HOUR = 8;    // 오전 8시까지
const TEA_NIGHT_NOTICE_CHANCE = 0.3; // 밤에 눌렀을 때 문구가 뜰 확률 (30%)

function isTeaNightTime() {
  const h = new Date().getHours();
  return h >= TEA_NIGHT_START_HOUR || h < TEA_NIGHT_END_HOUR;
}

// 밤 전용 문구: 단호한 것 + "이번만" 느낌의 부드러운 것 섞어둠
const TEA_NIGHT_MESSAGES = [
  "夜も更けております。おやつのお時間は、また明日の朝に。",
  "この刻限は、些か遅うございます、{name}。",
  "……仕方ございませんね。今宵ばかりは、少しだけお持ちいたしましょうか。",
  "本日はもう店じまいといたしましょう。"
];

function showTeaNightNotice() {
  document.getElementById('toastTagTea').textContent = "夜分でございます";
  document.getElementById('toastDotTea').style.background = TEA_LIMIT_TAG_COLOR;
  document.getElementById('toastMsgTea').textContent = fillTemplate(pickFrom(TEA_NIGHT_MESSAGES));
}

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

async function loadTarotRows() {
  const res = await fetch(`${SHEET_API_BASE_URL}?type=tarot`);
  return res.json();
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
