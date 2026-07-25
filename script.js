// ── 시트 → CSV → JSON ────────────────────────────────────
function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_ts=${Date.now()}`;
}

function fetchTab(tabName) {
  return fetch(sheetUrl(tabName))
    .then(res => res.text())
    .then(csv => Papa.parse(csv, { header: true, skipEmptyLines: true }).data);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function padNum(n) {
  return String(n + 1).padStart(3, "0");
}

// ── 탭 전환 ────────────────────────────────────────────────
function activateView(viewName) {
  const btn = document.querySelector(`.tab[data-view="${viewName}"]`);
  if (!btn) return;
  document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(`view-${viewName}`).classList.add("active");
}

document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    activateView(btn.dataset.view);
    location.hash = btn.dataset.view;
  });
});

// 새로고침 시 URL의 # 뒷부분으로 현재 탭 복원
const initialView = location.hash.replace("#", "");
if (initialView) activateView(initialView);

// ── 사이트 제목 (고정 텍스트) ─────────────────────────────
document.getElementById("siteName").textContent = SITE_TITLE;
document.title = SITE_TITLE;

// ── Main: 대문 이미지 + 공지사항 ───────────────────────────
fetchTab(TABS.main).then(rows => {
  const heroEl = document.getElementById("heroImage");
  const ledger = document.getElementById("noticesLedger");
  ledger.innerHTML = "";

  const heroRow = rows.find(r => (r.image || r.video || "").trim());
if (heroRow && (heroRow.video || "").trim()) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://drive.google.com/file/d/${heroRow.video.trim()}/preview`;
  iframe.allow = "autoplay";
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  heroEl.appendChild(iframe);
} else if (heroRow) {
  const img = document.createElement("img");
  img.src = driveImageUrl(heroRow.image);
  img.alt = "";
  img.loading = "lazy";
  heroEl.appendChild(img);
}

  const notices = rows.filter(r => (r.date || r.title || r.content || "").trim());
  notices
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .forEach(r => {
      const row = document.createElement("div");
      row.className = "ledger-row";
      row.innerHTML = `
        <div class="ledger-date">${escapeHtml(r.date || "")}</div>
        <div>
          <p class="ledger-content">${escapeHtml(r.content || "")}</p>
        </div>`;
      ledger.appendChild(row);
    });
});

// ── Profile: 인적사항 (균일한 key-value 목록) ───────────────
fetchTab(TABS.profile).then(rows => {
  const body = document.getElementById("profileBody");
  body.innerHTML = "";
  rows
    .filter(r => (r.key || "").trim())
    .forEach(r => {
      const row = document.createElement("div");
      row.className = "about-kv";
      row.innerHTML = `<dt>${escapeHtml(r.key)}</dt><dd>${escapeHtml(r.value || "")}</dd>`;
      body.appendChild(row);
    });
});

// ── Storage: 그림 + 코멘트 ──────────────────────────────────
fetchTab(TABS.storage).then(rows => {
  const grid = document.getElementById("storageGrid");
  grid.innerHTML = "";
  rows
    .filter(r => (r.image || r.comment || "").trim())
    .forEach((r, i) => {
      const imgUrl = driveImageUrl(r.image);
      const card = document.createElement("article");
      card.className = "storage-card";
      card.innerHTML = `
        ${imgUrl ? `<div class="storage-thumb"><img src="${imgUrl}" alt="" loading="lazy"></div>` : ""}
        <div class="storage-body">
          <p class="storage-comment">${escapeHtml(r.comment || "")}</p>
        </div>`;
      grid.appendChild(card);
    });
});

// ── Links: 링크 모음 (배너 이미지 지원) ─────────────────────
fetchTab(TABS.links).then(rows => {
  const index = document.getElementById("linksIndex");
  index.innerHTML = "";
  rows
    .filter(r => (r.label || r.url || "").trim())
    .forEach(r => {
      const bannerUrl = driveImageUrl(r.banner);
      const a = document.createElement("a");
      a.href = r.url || "#";
      a.target = "_blank";
      a.rel = "noopener";

      if (bannerUrl) {
        a.className = "link-banner-row";
        a.innerHTML = `
          <img class="link-banner-img" src="${bannerUrl}" alt="" loading="lazy" style="width: 120px; height: 80px; object-fit: cover;>
          <span class="link-banner-label">${escapeHtml(r.label || r.url || "")}</span>`;
      } else {
        a.className = "link-row";
        a.innerHTML = `
          <span class="link-label">${escapeHtml(r.label || r.url || "")}</span>
          <span class="link-desc">${escapeHtml(r.description || "")}</span>`;
      }
      index.appendChild(a);
    });
});

// ── Pages: 문서 목록 (날짜 + 제목) ────────
fetchTab(TABS.pages).then(rows => {
  const list = document.getElementById("pagesList");
  list.innerHTML = "";
  rows
    .filter(r => (r.title || "").trim())
    .slice()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .forEach(r => {
      const row = document.createElement("div");
      row.className = "ledger-row";
      row.innerHTML = `
        <div class="ledger-date">${escapeHtml(r.date || "")}</div>
        <div>
          <p class="ledger-content">${escapeHtml(r.content || "")}</p>
        </div>`;
      list.appendChild(row);
    });
});

