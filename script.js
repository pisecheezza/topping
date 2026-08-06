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

// ── 탭 전환 ────────────────────────────────────────────────
function activateView(viewName) {
  const btn = document.querySelector(`.tab-link[data-view="${viewName}"]`);
  document.querySelectorAll(".tab-link").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  if (btn) btn.classList.add("active");
  const viewEl = document.getElementById(`view-${viewName}`);
  if (viewEl) viewEl.classList.add("active");
  window.scrollTo(0, 0);
}

const dropdownMenu = document.getElementById("dropdownMenu");
const backdrop = document.getElementById("drawerBackdrop");
const menuIcon = document.getElementById("menuTriggerIcon");

function openMenu() {
  dropdownMenu.classList.add("open");
  backdrop.classList.add("show");
}
function closeMenu() {
  dropdownMenu.classList.remove("open");
  backdrop.classList.remove("show");
}

menuIcon.addEventListener("click", () => {
  dropdownMenu.classList.contains("open") ? closeMenu() : openMenu();
});
backdrop.addEventListener("click", closeMenu);

document.querySelectorAll(".tab-link").forEach(btn => {
  if (btn.classList.contains("reader-toggle")) return;
  if (btn.classList.contains("profile-toggle")) return;
  btn.addEventListener("click", () => {
    activateView(btn.dataset.view);
    location.hash = btn.dataset.view;
    closeMenu();

  if (btn.dataset.view === "gallery") {
      loadManorEntrance("gallery", "galleryEntrance", "galleryGrid");
  }
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
  const typeline = document.getElementById("noticestypeline");
  typeline.innerHTML = "";

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
      <div class="typeline-date">${escapeHtml(r.date || "")}</div>
      <p class="door-title">${escapeHtml(r.title || "")}</p>
    `;
    typeline.appendChild(row);
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
      row.className = "typeline-row";
      row.innerHTML = `
        <div class="typeline-header">
          <div class="typeline-date">${escapeHtml(formatDate(r.date))}</div>
          <h3 class="typeline-title">${escapeHtml(String(r.title || ""))}</h3>
        </div>
        <div class="typeline-content">${marked.parse(String(r.content || ""))}</div>`;
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

// ── Profile: 当主/年表 소분류 ──────────────────────────────
document.querySelector(".profile-toggle").addEventListener("click", () => {
  document.getElementById("profileSubmenu").classList.toggle("open");
});

let timelineLoaded = false;

document.querySelectorAll(".profile-sub-link").forEach(btn => {
  btn.addEventListener("click", () => {
    const profileType = btn.dataset.profileType;
    activateView("profile");
    location.hash = "profile";
    closeMenu();

    // 공통 박스 초기화 (상황에 맞게 display 처리)
    const markBox = document.getElementById("profileMarkBox");
    const historyBox = document.getElementById("profileHistoryBox");

    if (profileType === "mark") {
      // 1. 필요한 경우 박스 표시 상태 전환
      if (markBox) markBox.style.display = "block";
      if (historyBox) historyBox.style.display = "none";

      // 2. 당주(mark) 관련 로직 호출
      loadManorEntrance("profile", "profileEntrance", "profileGrid");
      
    } else if (profileType === "history") {
      document.getElementById("profileMarkBox").style.display = "none";
      document.getElementById("profileHistoryBox").style.display = "block";
      if (!timelineLoaded) {
        timelineLoaded = true;
        loadTimeline();
      }
    }
  });
});

function loadTimeline() {
  fetchTab("Timeline").then(rows => {
    const container = document.getElementById("timelineContainer");
    container.innerHTML = "";

    rows
      .filter(r => (r.date || r.title || r.content || "").trim())
      .forEach(r => {
        const side = (r.side || "left").trim().toLowerCase() === "right" ? "right" : "left";
        const row = document.createElement("div");
        row.className = "timeline-row";

        const leftHtml = side === "left"
          ? `<h3>${escapeHtml(r.title || "")}</h3><p>${escapeHtml(r.content || "")}</p>`
          : `<h3></h3><p></p>`;
        const rightHtml = side === "right"
          ? `<h3>${escapeHtml(r.title || "")}</h3><p>${escapeHtml(r.content || "")}</p>`
          : `<h3></h3><p></p>`;

        row.innerHTML = `
          <div class="timeline-content left">${leftHtml}</div>
          <div class="timeline-marker">
            <div class="timeline-title">${escapeHtml(r.date || "")}</div>
            <div class="timeline-dot"></div>
          </div>
          <div class="timeline-content right">${rightHtml}</div>`;
        container.appendChild(row);
      });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add("visible");
      });
    }, { threshold: 0.15 });

    document.querySelectorAll(".timeline-row").forEach(row => observer.observe(row));
  });
}

    document.addEventListener("DOMContentLoaded", function () {
    // Intersection Observer 설정
    const observerOptions = {
        root: null,          // 브라우저 뷰포트 기준
        rootMargin: '0px',
        threshold: 0.15      // 요소가 15% 정도 보일 때 애니메이션 실행
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 화면에 들어오면 visible 클래스 추가
                entry.target.classList.add('visible');
                
                // 애니메이션을 한 번만 실행하고 관찰을 멈추려면 아래 주석을 해제하세요.
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // 모든 .timeline-row 요소를 찾아 관찰 시작
    const rows = document.querySelectorAll('.timeline-row');
    rows.forEach(row => {
        observer.observe(row);
    });
});


// ── Gallery: 액자 프레임 렌더링 ──────────────────────────────
function renderGalleryFrames(gridEl, rows) {
  gridEl.innerHTML = "";

  rows
    .filter(r => (r.image || "").trim())
    .forEach(r => {
      const imageIds = r.image.split(",").map(s => s.trim()).filter(Boolean);
      imageIds.forEach(id => {
        const container = document.createElement("div");
        container.className = "frame-container";
        container.innerHTML = `<img src="${driveImageUrl(id)}" alt="">`;
        gridEl.appendChild(container);
      });
    });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  }, { root: null, rootMargin: "0px", threshold: 0.1 });

  gridEl.querySelectorAll(".frame-container").forEach(container => observer.observe(container));
}

// ── Gallery 시트 기반 입구/콘텐츠 공용 함수 ─────────────────
function renderCardGrid(gridEl, rows) {
  gridEl.innerHTML = "";
  rows
    .filter(r => (r.image || r.comment || "").trim())
    .forEach(r => {
      const imageIds = (r.image || "").split(",").map(s => s.trim()).filter(Boolean);
      const comment = (r.comment || "").trim();
      const imagesHtml = imageIds.map(id => `<img src="${driveImageUrl(id)}" alt="">`).join("");
      const card = document.createElement("article");
      card.className = "gallery-card";
      card.innerHTML = `
        ${imageIds.length ? `<div class="gallery-thumb">${imagesHtml}</div>` : ""}
        ${comment ? `<div class="gallery-body"><p class="gallery-comment">${escapeHtml(comment)}</p></div>` : ""}`;
      gridEl.appendChild(card);
    });
}

function loadManorEntrance(section, entranceElId, gridElId) {
  fetchTab("Gallery").then(allRows => {
    const entrance = document.getElementById(entranceElId);
    const grid = document.getElementById(gridElId);
    entrance.innerHTML = "";
    entrance.style.display = "flex";
    grid.style.display = "none";

    allRows
      .filter(r => (r.section || "").trim() === section && (r.type || "").trim() === "select")
      .forEach(r => {
        const btn = document.createElement("button");
        btn.className = "manor-entrance-item";
        btn.type = "button";
        btn.innerHTML = `<img src="${driveImageUrl(r.image)}" alt="">`;
        btn.addEventListener("click", () => {
          const label = (r.label || "").trim();
          const items = allRows.filter(row =>
            (row.section || "").trim() === section &&
            (row.type || "").trim() === "item" &&
            (row.label || "").trim() === label
          );
          entrance.style.display = "none";
          grid.style.display = section === "gallery" ? "flex" : "flex";

          if (section === "gallery") {
            renderGalleryFrames(grid, items);
          } else {
            renderCardGrid(grid, items);
          }
        });
        entrance.appendChild(btn);
      });
  });
}

// ── Gallery 탭: 진입 즉시 입구 화면 ──────────────────────────
loadManorEntrance("gallery", "galleryEntrance", "galleryGrid");


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

    const filtered = rows.filter(r => (r.message || "").trim());
    const pinned = filtered.filter(r => (r.pinned || "").toString().trim().toUpperCase() === "TRUE");
    const normal = filtered.filter(r => (r.pinned || "").toString().trim().toUpperCase() !== "TRUE").reverse();

    [...pinned, ...normal].forEach(r => {
      const isPinned = (r.pinned || "").toString().trim().toUpperCase() === "TRUE";
      const imgHtml = (r.imageId || "").trim()
        ? `<img class="guestbook-img" src="${driveImageUrl(r.imageId.trim())}" alt="">`
        : "";
      const replyHtml = (r.reply || "").trim()
        ? `<div class="guestbook-reply">↳ ${escapeHtml(r.reply)}</div>`
        : "";

      const row = document.createElement("div");
      row.className = "guestbook-entry" + (isPinned ? " pinned" : "");
      row.innerHTML = `
        ${isPinned ? `<span class="guestbook-pin-badge">お知らせ</span>` : ""}
        <p class="guestbook-meta">
          <span class="guestbook-name">${escapeHtml(r.name || "領民")}</span>
          <span class="guestbook-date">${escapeHtml(r.timestamp || "")}</span>
        </p>
        <p class="guestbook-message">${escapeHtml(r.message || "")}</p>
        ${imgHtml}
        ${replyHtml}`;
      list.appendChild(row);
    });
  });
}

document.getElementById("guestbookForm").addEventListener("submit", (e) => {
  e.preventDefault();
  console.log("1. 폼 제출 이벤트 발생!"); // 이 로그가 찍히는지 확인

  const name = document.getElementById("gbName").value.trim() || "領民";
  const message = document.getElementById("gbMessage").value.trim();
  const fileInput = document.getElementById("gbImage");
  
  if (!message) {
    console.log("메시지가 비어있음!");
    return;
  }

  const submitBtn = e.target.querySelector("button");
  submitBtn.disabled = true;
  submitBtn.textContent = "Wait...";

  function send(imageDataUrl, imageType) {
    console.log("3. fetch 전송 시작:", GUESTBOOK_WEBAPP_URL); // 이 로그가 찍히는지 확인
    fetch(GUESTBOOK_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, message, image: imageDataUrl || "", imageType: imageType || "" })
    })
      .then(res => res.json())
      .then(result => {
        console.log("4. 서버 응답 도착:", result);
        if (result.ok) {
          document.getElementById("gbName").value = "";
          document.getElementById("gbMessage").value = "";
          fileInput.value = "";
          loadGuestbook();
        }
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = "✒️";
      });
  }

  if (fileInput.files[0]) {
    console.log("2-1. 이미지 파일 있음, FileReader 실행");
    const reader = new FileReader();
    reader.onload = () => send(reader.result, fileInput.files[0].type);
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    console.log("2-2. 이미지 파일 없음, 바로 send 호출");
    send(null, null);
  }
});
loadGuestbook()
/* document.getElementById("guestbookForm").addEventListener("submit", (e) => {
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
}); */

// ── 도구 ───────────────────────────────────────────────────

      const startDate = new Date('1884-11-05T00:00:00'); // 시:분:초까지 명시 → 로컬 시간으로 해석됨
      function calculateDays() {
            const today = new Date();
            const diffTime = today.getTime() - startDate.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

            const ddayElement = document.getElementById('dday-count');
            
            if (diffDays > 0) {
                // 앞에 DAYS가 있으므로 '일'이라는 글자를 빼고 숫자만 출력합니다.
                ddayElement.innerText = `${diffDays}`; 
            } else if (diffDays < 0) {
                ddayElement.innerText = `D${diffDays}`;
            } else {
                ddayElement.innerText = `DAY`;
            }
        }

        calculateDays();

// ── 시간대별 테마 적용 ──────────────────────────────────
function getTimePeriod() {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

const currentPeriod = getTimePeriod();
document.body.classList.add(`time-${currentPeriod}`);
