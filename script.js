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
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`view-${btn.dataset.view}`).classList.add("active");
  });
});

// ── 사이트 제목 (고정 텍스트) ─────────────────────────────
document.getElementById("siteName").textContent = SITE_TITLE;
document.title = SITE_TITLE;

// ── Main: 대문 이미지 + 공지사항 ───────────────────────────
fetchTab(TABS.main).then(rows => {
  const heroEl = document.getElementById("heroImage");
  const ledger = document.getElementById("noticesLedger");
  ledger.innerHTML = "";

  const heroRow = rows.find(r => (r.image || "").trim());
  if (heroRow) {
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
          <h3 class="ledger-title">${escapeHtml(r.title || "")}</h3>
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
          <img class="link-banner-img" src="${bannerUrl}" alt="" loading="lazy">
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
