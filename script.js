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
(function () {
  const morpho = document.getElementById("scrollMorpho");
  if (!morpho) return;

  function updateMorphoPosition() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

    const trackHeight = window.innerHeight - 50; // 이미지 높이(50px)만큼 빼서 화면 밖으로 안 나가게
    const top = scrollPercent * trackHeight;

    morpho.style.top = `${top}px`;
  }

  window.addEventListener("scroll", updateMorphoPosition);
  window.addEventListener("resize", updateMorphoPosition);
  updateMorphoPosition();
})();

// ── 모바일 터치 커서 (hand.png) ────────────────────────────
(function () {
  const cursor = document.getElementById("touchCursor");
  if (!cursor) return;

  function moveCursor(x, y) {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.classList.add("active");
  }

  document.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    moveCursor(touch.clientX, touch.clientY);
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    moveCursor(touch.clientX, touch.clientY);
  }, { passive: true });

  // touchend에서 숨기는 코드 삭제 — 이제 손을 떼도 그 자리에 남아있음
})();

// <![CDATA[
var colour="random"; // in addition to "random" can be set to any valid colour eg "#f0f" or "red"
var sparkles=50;

/****************************
*  Tinkerbell Magic Sparkle *
*(c)2005-13 mf2fm web-design*
*  http://www.mf2fm.com/rv  *
* DON'T EDIT BELOW THIS BOX *
****************************/
var x=ox=400;
var y=oy=300;
var swide=800;
var shigh=600;
var sleft=sdown=0;
var tiny=new Array();
var star=new Array();
var starv=new Array();
var starx=new Array();
var stary=new Array();
var tinyx=new Array();
var tinyy=new Array();
var tinyv=new Array();

window.onload=function() { if (document.getElementById) {
  var i, rats, rlef, rdow;
  for (var i=0; i<sparkles; i++) {
    var rats=createDiv(3, 3);
    rats.style.visibility="hidden";
    rats.style.zIndex="999";
    document.body.appendChild(tiny[i]=rats);
    starv[i]=0;
    tinyv[i]=0;
    var rats=createDiv(5, 5);
    rats.style.backgroundColor="transparent";
    rats.style.visibility="hidden";
    rats.style.zIndex="999";
    var rlef=createDiv(1, 5);
    var rdow=createDiv(5, 1);
    rats.appendChild(rlef);
    rats.appendChild(rdow);
    rlef.style.top="2px";
    rlef.style.left="0px";
    rdow.style.top="0px";
    rdow.style.left="2px";
    document.body.appendChild(star[i]=rats);
  }
  set_width();
  sparkle();
}}

function sparkle() {
  var c;
  if (Math.abs(x-ox)>1 || Math.abs(y-oy)>1) {
    ox=x;
    oy=y;
    for (c=0; c<sparkles; c++) if (!starv[c]) {
      star[c].style.left=(starx[c]=x)+"px";
      star[c].style.top=(stary[c]=y+1)+"px";
      star[c].style.clip="rect(0px, 5px, 5px, 0px)";
      star[c].childNodes[0].style.backgroundColor=star[c].childNodes[1].style.backgroundColor=(colour=="random")?newColour():colour;
      star[c].style.visibility="visible";
      starv[c]=50;
      break;
    }
  }
  for (c=0; c<sparkles; c++) {
    if (starv[c]) update_star(c);
    if (tinyv[c]) update_tiny(c);
  }
  setTimeout("sparkle()", 40);
}

function update_star(i) {
  if (--starv[i]==25) star[i].style.clip="rect(1px, 4px, 4px, 1px)";
  if (starv[i]) {
    stary[i]+=1+Math.random()*3;
    starx[i]+=(i%5-2)/5;
    if (stary[i]<shigh+sdown) {
      star[i].style.top=stary[i]+"px";
      star[i].style.left=starx[i]+"px";
    }
    else {
      star[i].style.visibility="hidden";
      starv[i]=0;
      return;
    }
  }
  else {
    tinyv[i]=50;
    tiny[i].style.top=(tinyy[i]=stary[i])+"px";
    tiny[i].style.left=(tinyx[i]=starx[i])+"px";
    tiny[i].style.width="2px";
    tiny[i].style.height="2px";
    tiny[i].style.backgroundColor=star[i].childNodes[0].style.backgroundColor;
    star[i].style.visibility="hidden";
    tiny[i].style.visibility="visible"
  }
}

function update_tiny(i) {
  if (--tinyv[i]==25) {
    tiny[i].style.width="1px";
    tiny[i].style.height="1px";
  }
  if (tinyv[i]) {
    tinyy[i]+=1+Math.random()*3;
    tinyx[i]+=(i%5-2)/5;
    if (tinyy[i]<shigh+sdown) {
      tiny[i].style.top=tinyy[i]+"px";
      tiny[i].style.left=tinyx[i]+"px";
    }
    else {
      tiny[i].style.visibility="hidden";
      tinyv[i]=0;
      return;
    }
  }
  else tiny[i].style.visibility="hidden";
}

document.onmousemove=mouse;
function mouse(e) {
  if (e) {
    y=e.pageY;
    x=e.pageX;
  }
  else {
    set_scroll();
    y=event.y+sdown;
    x=event.x+sleft;
  }
}

window.onscroll=set_scroll;
function set_scroll() {
  if (typeof(self.pageYOffset)=='number') {
    sdown=self.pageYOffset;
    sleft=self.pageXOffset;
  }
  else if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
    sdown=document.body.scrollTop;
    sleft=document.body.scrollLeft;
  }
  else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
    sleft=document.documentElement.scrollLeft;
    sdown=document.documentElement.scrollTop;
  }
  else {
    sdown=0;
    sleft=0;
  }
}

window.onresize=set_width;
function set_width() {
  var sw_min=999999;
  var sh_min=999999;
  if (document.documentElement && document.documentElement.clientWidth) {
    if (document.documentElement.clientWidth>0) sw_min=document.documentElement.clientWidth;
    if (document.documentElement.clientHeight>0) sh_min=document.documentElement.clientHeight;
  }
  if (typeof(self.innerWidth)=='number' && self.innerWidth) {
    if (self.innerWidth>0 && self.innerWidth<sw_min) sw_min=self.innerWidth;
    if (self.innerHeight>0 && self.innerHeight<sh_min) sh_min=self.innerHeight;
  }
  if (document.body.clientWidth) {
    if (document.body.clientWidth>0 && document.body.clientWidth<sw_min) sw_min=document.body.clientWidth;
    if (document.body.clientHeight>0 && document.body.clientHeight<sh_min) sh_min=document.body.clientHeight;
  }
  if (sw_min==999999 || sh_min==999999) {
    sw_min=800;
    sh_min=600;
  }
  swide=sw_min;
  shigh=sh_min;
}

function createDiv(height, width) {
  var div=document.createElement("div");
  div.style.position="absolute";
  div.style.height=height+"px";
  div.style.width=width+"px";
  div.style.overflow="hidden";
  return (div);
}

function newColour() {
  var c=new Array();
  c[0]=255;
  c[1]=Math.floor(Math.random()*256);
  c[2]=Math.floor(Math.random()*(256-c[1]/2));
  c.sort(function(){return (0.5 - Math.random());});
  return ("rgb("+c[0]+", "+c[1]+", "+c[2]+")");
}
// ]]>

// ── 탭 전환 ────────────────────────────────────────────────
function activateView(viewName) {
  const btn = document.querySelector(`.tab-link[data-view="${viewName}"]`);
  document.querySelectorAll(".tab-link").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    if (btn) btn.classList.add("active");
  const viewEl = document.getElementById(`view-${viewName}`);
  if (viewEl) viewEl.classList.add("active");
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
/* --- 프로필
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
}); */

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

    if (profileType === "mark") {
      document.getElementById("profileMarkBox").style.display = "block";
      document.getElementById("profileHistoryBox").style.display = "none";
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

// ── gallery: 그림 + 코멘트 ──────────────────────────────────
fetchTab(TABS.gallery).then(rows => {
  const grid = document.getElementById("galleryGrid");
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
      card.className = "gallery-card";
      card.innerHTML = `
        ${imageIds.length ? `<div class="gallery-thumb">${imagesHtml}</div>` : ""}
        ${comment ? `<div class="gallery-body"><p class="gallery-comment">${marked.parseInline(comment)}</p></div>` : ""}
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

// -- 리더 ----------------------------------------------------
/* const CONFIG = {
  GAS_URL: "https://script.google.com/macros/s/AKfycbwCQg6Gt5OMlErhETk-e2RkpLKkxyLDzlsSU7wv9_Y7S2HdjxleSeI26Z1VsC0guSTGmA/exec",
  GOOGLE_DOCS_URL: "https://docs.google.com/document/d/문서ID/edit?usp=sharing"
}; */

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

// ── 도구 ───────────────────────────────────────────────────

      const startDate = new Date('1884-11-05');

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
