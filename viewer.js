// ══════════════════════════════════════════════════════
// Reader: 구글독스 실시간 뷰어
// ══════════════════════════════════════════════════════
const READER_COLUMN_GAP = 24;
let readerCurrentPage = 0;
let readerTotalPages = 1;
let readerViewerWidth = 0;

// ── Reader: Novel/Newspaper/Magazine 소분류 ───────────────
document.getElementById("readerSubmenu")
  ? null
  : console.warn("readerSubmenu 없음");

document.querySelector(".reader-toggle").addEventListener("click", () => {
  document.getElementById("readerSubmenu").classList.toggle("open");
});

let currentReaderType = "novel";

document.querySelectorAll(".reader-sub-link").forEach(btn => {
  btn.addEventListener("click", () => {
    currentReaderType = btn.dataset.readerType;
    loadReaderList(currentReaderType);
    activateView("reader");
    location.hash = "reader";
    closeMenu();   // 기존에 쓰시던 드롭다운 닫는 함수 이름에 맞춰주세요
  });
});

function loadReaderList(readerType) {
  const sheetName = READER_SHEETS[readerType];
  fetch(sheetUrl(sheetName), { cache: "no-store" })
    .then(res => res.arrayBuffer())
    .then(buffer => {
      const csv = new TextDecoder("utf-8").decode(buffer);
      const rows = Papa.parse(csv, { header: true, skipEmptyLines: true }).data;

      const list = document.getElementById("readerList");
      list.innerHTML = "";
      rows
        .filter(r => (r.title || "").trim())
        .forEach(r => {
          const row = document.createElement("div");
          row.className = "typeline-row";
          row.innerHTML = `<div><button class="typeline-title-link" type="button">${escapeHtml(r.title)}</button></div>`;
          row.querySelector("button").addEventListener("click", () => {
            document.getElementById("readerList").style.display = "none";
            document.getElementById("readerViewerBox").style.display = "block";
            loadReaderDoc((r.docId || "").trim());
          });
          list.appendChild(row);
        });
    });
}

document.getElementById("readerBack").addEventListener("click", () => {
  document.getElementById("readerViewerBox").style.display = "none";
  document.getElementById("readerList").style.display = "block";
  document.getElementById("reader-end-modal-overlay").classList.remove("show");
});

function loadReaderDoc(docId) {
  document.getElementById("reader-viewer-content").innerHTML = "";
  document.getElementById("reader-loading-container").style.display = "flex";

  fetch(`${GUESTBOOK_WEBAPP_URL}?id=${encodeURIComponent(docId)}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById("reader-loading-container").style.display = "none";
      if (!data.success) throw new Error(data.error || "로드 실패");
      renderReaderBook(data.content);
    })
    .catch(err => {
      document.getElementById("reader-loading-container").style.display = "none";
      document.getElementById("reader-viewer-content").innerHTML =
        `<p style="color:red;">오류: ${escapeHtml(err.message)}</p>`;
    });
}

function renderReaderBook(contentData) {
  const contentDiv = document.getElementById("reader-viewer-content");
  let html = "";

  if (Array.isArray(contentData)) {
    contentData.forEach(item => {
      if (!item) return;
      if (item.type === "image") {
        html += `<div class="reader-img-wrap"><img src="${item.value}"></div>`;
      } else if (item.type === "text") {
        const cleanText = (item.value || "").replace(/(<([^>]+)>)/gi, "").trim();
        if (cleanText === "") {
          html += `<p>&nbsp;</p>`;
        } else {
          const align = item.align || "justify";
          html += `<p style="text-align:${align};">${item.value}</p>`;
        }
      }
    });
  }

  contentDiv.innerHTML = html;
  readerCurrentPage = 0;
  setTimeout(calculateReaderPagination, 150);
}

function calculateReaderPagination() {
  const viewer = document.getElementById("reader-viewer");
  const contentDiv = document.getElementById("reader-viewer-content");
  readerViewerWidth = viewer.getBoundingClientRect().width;
  contentDiv.style.columnWidth = readerViewerWidth + "px";
  contentDiv.style.columnGap = READER_COLUMN_GAP + "px";

  setTimeout(() => {
    readerTotalPages = Math.round((contentDiv.scrollWidth + READER_COLUMN_GAP) / (readerViewerWidth + READER_COLUMN_GAP));
    if (readerTotalPages === 0) readerTotalPages = 1;
    document.getElementById("reader-progress-slider").disabled = false;
    changeReaderPage(0);
  }, 100);
}

function changeReaderPage(targetPage) {
  readerCurrentPage = targetPage;
  const contentDiv = document.getElementById("reader-viewer-content");
  contentDiv.style.transform = `translateX(-${readerCurrentPage * (readerViewerWidth + READER_COLUMN_GAP)}px)`;
  updateReaderSliderUI();
}

function goReaderNext() {
  if (readerCurrentPage < readerTotalPages - 1) {
    changeReaderPage(readerCurrentPage + 1);
  } else {
    document.getElementById("reader-end-modal-overlay").classList.add("show");
  }
}
function goReaderPrev() {
  if (readerCurrentPage > 0) changeReaderPage(readerCurrentPage - 1);
}

function updateReaderSliderUI() {
  const slider = document.getElementById("reader-progress-slider");
  const tooltip = document.getElementById("reader-slider-tooltip");
  const percent = readerTotalPages > 1 ? (readerCurrentPage / (readerTotalPages - 1)) : 1;
  slider.value = Math.floor(percent * 1000);
  slider.style.backgroundImage = `linear-gradient(to right, var(--ink) ${percent * 100}%, var(--rule, #ccc) ${percent * 100}%)`;
  tooltip.innerText = (percent * 100).toFixed(0) + "%";
}

document.getElementById("reader-next-btn").addEventListener("click", goReaderNext);
document.getElementById("reader-prev-btn").addEventListener("click", goReaderPrev);
document.getElementById("reader-touch-right").addEventListener("click", goReaderNext);
document.getElementById("reader-touch-left").addEventListener("click", goReaderPrev);

document.getElementById("reader-restart-btn").addEventListener("click", () => {
  document.getElementById("reader-end-modal-overlay").classList.remove("show");
});

document.getElementById("reader-progress-slider").addEventListener("change", (e) => {
  const percent = e.target.value / 1000;
  const targetPg = Math.round(percent * (readerTotalPages - 1));
  changeReaderPage(targetPg);
});

window.addEventListener("resize", () => {
  const contentDiv = document.getElementById("reader-viewer-content");
  if (contentDiv && contentDiv.innerHTML !== "") calculateReaderPagination();
});

// ── Reader: 텍스트 선택/드래그 방지 ───────────────────────
const readerWrapper = document.getElementById("reader-wrapper");
if (readerWrapper) {
  readerWrapper.addEventListener("contextmenu", (e) => e.preventDefault());
  readerWrapper.addEventListener("dragstart", (e) => {
    if (e.target.tagName && e.target.tagName.toUpperCase() === "INPUT") return;
    e.preventDefault();
  });
}
