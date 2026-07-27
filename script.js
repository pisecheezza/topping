// ── 탭 클릭 효과음 ────────────────────────────────────────
/* jconst clickAudio = new Audio("tab.wav");
clickAudio.preload = "auto";

function playClickSound() {
  clickAudio.currentTime = 0;
  clickAudio.play().catch(() => {});
} */

marked.setOptions({ breaks: true });

// ── 시트 → CSV → JSON ────────────────────────────────────
function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_ts=${Date.now()}`;
}

function fetchTab(tabName) {
  return fetch(sheetUrl(tabName), { cache: "no-store" })
    .then(res => res.arrayBuffer())
    .then(buffer => {
      const csv = new TextDecoder("utf-8").decode(buffer);
      return Papa.parse(csv, { header: true, skipEmptyLines: true }).data;
    });
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
// ── 장식 ───────────────────────────────────────────────────
// 1. 좌측 상단에 새로 만든 아이콘 가져오기
const triggerIcon = document.getElementById('menuTriggerIcon');

// 2. 방금 알려주신 기존 햄버거 버튼 가져오기
const originalMenuBtn = document.getElementById('menuToggle');

// 3. 새 아이콘을 클릭했을 때의 동작
triggerIcon.addEventListener('click', function() {
    // 기존 햄버거 버튼을 자바스크립트가 대신 클릭(실행)합니다.
    originalMenuBtn.click();
});


// 아이콘 요소를 가져옵니다.
const scrollIcon = document.getElementById('scrollIcon');

// 스크롤을 할 때마다 아래 함수를 실행합니다.
window.addEventListener('scroll', function() {
    
    // 1. 현재 스크롤된 높이 (얼마나 스크롤을 내렸는지)
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // 2. 전체 스크롤 가능한 높이 = (문서 전체의 높이) - (현재 화면에 보이는 창의 높이)
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    
    // 3. 스크롤 진행 비율 (0 ~ 1 사이의 값)
    // 문서 길이가 짧아서 스크롤이 없는 경우를 대비해 0으로 처리하는 방어 코드 추가
    const scrollPercentage = scrollHeight > 0 ? (scrollTop / scrollHeight) : 0;
    
    // 4. 아이콘이 움직일 수 있는 최대 범위 (화면 높이에서 아이콘 높이를 뺀 값)
    const iconHeight = scrollIcon.offsetHeight;
    const maxTop = window.innerHeight - iconHeight;
    
    // 5. 스크롤 비율에 맞춰 아이콘의 top 위치를 계산하여 적용합니다.
    const currentTop = scrollPercentage * maxTop;
    scrollIcon.style.top = currentTop + 'px';
    
});


// ── 탭 전환 ────────────────────────────────────────────────
function activateView(viewName) {
  const btn = document.querySelector(`.tab-link[data-view="${viewName}"]`);
  if (!btn) return;
  document.querySelectorAll(".tab-link").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  btn.classList.add("active");
  document.getElementById(`view-${viewName}`).classList.add("active");
}

const drawer = document.getElementById("siteDrawer");
const backdrop = document.getElementById("drawerBackdrop");
const menuToggle = document.getElementById("menuToggle");

function openDrawer() {
  drawer.classList.add("open");
  backdrop.classList.add("show");
}
function closeDrawer() {
  drawer.classList.remove("open");
  backdrop.classList.remove("show");
}

menuToggle.addEventListener("click", () => {
  if (drawer.classList.contains("open")) closeDrawer();
  else openDrawer();
});
backdrop.addEventListener("click", closeDrawer);

document.querySelectorAll(".tab-link").forEach(btn => {
  btn.addEventListener("click", () => {
    activateView(btn.dataset.view);
    location.hash = btn.dataset.view;
    closeDrawer();
  });
});

const initialView = location.hash.replace("#", "");
if (initialView) activateView(initialView);

// ── 사이트 제목 ─────────────────────────────
document.getElementById("siteName").textContent = SITE_TITLE;
document.title = SITE_TITLE;

// ── Main: 대문 이미지 + 공지사항 ───────────────────────────
fetchTab(TABS.main).then(rows => {
  const doorEl = document.getElementById("doorImage");
  const ledger = document.getElementById("noticesLedger");
  ledger.innerHTML = "";

  const doorRow = rows.find(r => (r.image || r.video || "").trim());
if (doorRow && (doorRow.video || "").trim()) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://drive.google.com/file/d/${doorRow.video.trim()}/preview`;
  iframe.allow = "autoplay";
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  doorEl.appendChild(iframe);
} else if (doorRow) {
  const img = document.createElement("img");
  img.src = driveImageUrl(doorRow.image);
  img.alt = "";
  img.loading = "lazy";
  doorEl.appendChild(img);
}

// 저작권 표기 추가
if (doorRow && (doorRow.credit || "").trim()) {
  const credit = document.createElement("span");
  credit.className = "door-credit";
  credit.textContent = doorRow.credit.trim();
  doorEl.appendChild(credit);
}

  const notices = rows.filter(r => String(r.date || r.title || "").trim());
notices
  .slice()
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
  .forEach(r => {
    const row = document.createElement("div");
    row.className = "door-notice"; // 'door-noticr'를 'door-notice'로 수정
    row.innerHTML = `
      <div class="ledger-date">${escapeHtml(r.date || "")}</div>
      <p class="door-title">${escapeHtml(r.title || "")}</p>
    `;
    ledger.appendChild(row);
  });


});

// ── Profile: 인적사항 ───────────────────────
fetchTab(TABS.profile).then(rows => {
  const container = document.getElementById("profileSections");
  container.innerHTML = "";

  // section 값 기준으로 그룹 묶기 (빈 section은 "" 그룹)
  const groups = [];
  rows
    .filter(r => (r.key || "").trim())
    .forEach(r => {
      const section = (r.section || "").trim();
      let group = groups.find(g => g.section === section);
      if (!group) {
        group = { section, items: [] };
        groups.push(group);
      }
      group.items.push(r);
    });

  groups.forEach(group => {
    const card = document.createElement("div");
    card.className = "index-card wide";

    if (group.section) {
      const heading = document.createElement("h3");
      heading.className = "profile-section";
      heading.textContent = group.section;
      card.appendChild(heading);
    }

    const dl = document.createElement("dl");
    dl.className = "about-kv-list";
    group.items.forEach(r => {
      const row = document.createElement("div");
      row.className = "about-kv";
      const valueHtml = (r.link || "").trim()
        ? `<a href="${escapeHtml(r.link.trim())}" target="_blank" rel="noopener">${escapeHtml(r.value || "")}</a>`
        : escapeHtml(r.value || "");
      row.innerHTML = `<dt>${escapeHtml(r.key)}</dt><dd>${valueHtml}</dd>`;
      dl.appendChild(row);
    });
    card.appendChild(dl);
    container.appendChild(card);
  });
});

// ── Storage: 그림 + 코멘트 ──────────────────────────────────
fetchTab(TABS.storage).then(rows => {
  const grid = document.getElementById("storageGrid");
  grid.innerHTML = "";
  rows
    .filter(r => (r.image || r.comment || "").trim())
    .forEach((r, i) => {
      const imageIds = (r.image || "").split(",").map(s => s.trim()).filter(Boolean);
      const comment = (r.comment || "").trim();
      const imagesHtml = imageIds
        .map(id => `<img src="${driveImageUrl(id)}" alt="" loading="lazy">`)
        .join("");

      const card = document.createElement("article");
      card.className = "storage-card";
      card.innerHTML = `
        ${imageIds.length ? `<div class="storage-thumb">${imagesHtml}</div>` : ""}
        ${comment ? `<div class="storage-body"><p class="storage-comment">${marked.parseInline(comment)}</p></div>` : ""}
      `;
      grid.appendChild(card);
    });
});

// ── Pages: 문서 목록 (날짜 + 제목) ────────
fetchTab(TABS.pages).then(rows => {
  const list = document.getElementById("pagesList");
  list.innerHTML = "";
  rows
    .filter(r => String(r.date || r.title || r.content || "").trim())
    .slice()
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .forEach(r => {
      const row = document.createElement("div");
      row.className = "ledger-row";
      row.innerHTML = `
        <div class="ledger-header">
          <div class="ledger-date">${escapeHtml(formatDate(r.date))}</div>
          <h3 class="ledger-title">${escapeHtml(String(r.title || ""))}</h3>
        </div>
        <div class="ledger-content">${marked.parse(String(r.content || ""))}</div>`;
      list.appendChild(row);
    });
});

function formatDate(str) {
  const s = String(str || "").trim().replace(/[-.\/]/g, ""); // 구분자 다 제거
  if (s.length === 8) {
    return `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}`;
  }
  return s; // 8자리가 아니면 원본 그대로
}

// ── Links: 링크 모음 (배너 이미지 지원) ─────────────────────
fetchTab(TABS.links).then(rows => {
  const index = document.getElementById("linksIndex");
  index.innerHTML = "";
  let lastCategory = null;

  rows
    .filter(r => (r.label || r.url || "").trim())
    .forEach(r => {
      const category = (r.category || "").trim();
      if (category && category !== lastCategory) {
        const heading = document.createElement("h3");
        heading.className = "link-category";
        heading.textContent = category;
        index.appendChild(heading);
        lastCategory = category;
      }

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

// ── Guestbook: 목록 불러오기 ─────────────────────────────
function loadGuestbook() {
  fetchTab(TABS.guestbook).then(rows => {
    const list = document.getElementById("guestbookList");
    list.innerHTML = "";
    rows
      .filter(r => (r.message || "").trim())
      .slice()
      .reverse()
      .forEach(r => {
        const row = document.createElement("div");
        row.className = "guestbook-entry";
        row.innerHTML = `
          <p class="guestbook-meta">
            <span class="guestbook-name">${escapeHtml(r.name || "Anonymous")}</span>
            <span class="guestbook-date">${escapeHtml(r.timestamp || "")}</span>
          </p>
          <p class="guestbook-message">${escapeHtml(r.message || "")}</p>`;
        list.appendChild(row);
      });
  });
}
loadGuestbook();

// ── Guestbook: 폼 제출 ───────────────────────────────────
document.getElementById("guestbookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = document.getElementById("gbName").value.trim();
  const message = document.getElementById("gbMessage").value.trim();
  if (!message) return;

  const submitBtn = e.target.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Wait...";

  fetch(GUESTBOOK_WEBAPP_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ name, message })
  })
    .then(res => res.json())
    .then(result => {
      if (result.ok) {
        document.getElementById("gbName").value = "";
        document.getElementById("gbMessage").value = "";
        loadGuestbook();
      }
    })
    .finally(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = "✒️";
    });
});
