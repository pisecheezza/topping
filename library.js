// ── Library: 폴더 기반 가벼운 뷰어 ──────────────────────────
let libraryRows = [];
let currentLibraryFolder = null;

function buildLibraryDocUrl(link) {
  const match = (link || "").match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return `https://docs.google.com/document/d/${match[1]}/preview`;
  }
  return link || "";
}

function renderLibraryFolders() {
  const folders = [...new Set(libraryRows.map(r => (r["메뉴"] || "").trim()).filter(Boolean))];
  const wrap = document.getElementById("libraryFolders");
  wrap.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className = "library-folder-btn active";
  allBtn.type = "button";
  allBtn.textContent = "本棚全体";
  allBtn.addEventListener("click", () => selectLibraryFolder(null, allBtn));
  wrap.appendChild(allBtn);

  folders.forEach(folder => {
    const btn = document.createElement("button");
    btn.className = "library-folder-btn";
    btn.type = "button";
    btn.textContent = folder;
    btn.addEventListener("click", () => selectLibraryFolder(folder, btn));
    wrap.appendChild(btn);
  });
}

function selectLibraryFolder(folder, btnEl) {
  currentLibraryFolder = folder;
  document.querySelectorAll(".library-folder-btn").forEach(b => b.classList.remove("active"));
  btnEl.classList.add("active");
  renderLibraryGrid();
}

function renderLibraryGrid() {
  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "";

  const list = currentLibraryFolder
    ? libraryRows.filter(r => (r["메뉴"] || "").trim() === currentLibraryFolder)
    : libraryRows;

  list
    .slice()
    .sort((a, b) => (b["생성일"] || "").localeCompare(a["생성일"] || ""))
    .forEach(r => {
      const card = document.createElement("div");
      card.className = "library-post-card";
  
      const tagHtml = currentLibraryFolder === null
        ? `<span class="library-post-tag">${escapeHtml(r["메뉴"] || "")}</span>`
        : "";
  
      const displayDate = (r["표시일"] || "").trim() || (r["생성일"] || "").slice(0, 10);
  
      card.innerHTML = `
        <div class="library-post-title">${escapeHtml(r["제목"] || "")}</div>
        <div class="library-post-meta">
          ${tagHtml}
          <span class="library-post-date">${escapeHtml(displayDate)}</span>
        </div>`;
      card.addEventListener("click", () => openLibraryDoc(r));
      grid.appendChild(card);
    });
}

function openLibraryDoc(row) {
  // row가 객체 형태로 들어올 경우를 대비해 파일ID 추출
  const fileId = typeof row === "object" ? row["파일ID"] : row;
  if (!fileId) {
    alert("파일 ID를 찾을 수 없습니다.");
    return;
  }

  const contentDiv = document.getElementById("libraryContent");
  contentDiv.innerHTML = `
    <div id="libraryLoading" style="text-align:center; padding:60px 0;">
      <div id="libraryLoadingText" style="font-size:13px; color:#888; font-weight:bold;">책을 가져오는 중...</div>
    </div>`;

  fetch(`${GUESTBOOK_WEBAPP_URL}?id=${fileId}`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) throw new Error(data.error || "로드 실패");
      renderLibraryBook(data.content);
    })
    .catch(err => {
      contentDiv.innerHTML = `<p style="color:red; text-align:center;">오류: ${escapeHtml(err.message)}</p>`;
    });
}

function renderLibraryBook(contentData) {
  const contentDiv = document.getElementById("libraryContent");
  let html = "";

  if (Array.isArray(contentData)) {
    contentData.forEach(item => {
      if (!item) return;
      if (item.type === "image") {
        html += `<div class="library-img-wrap"><img src="${item.value}"></div>`;
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
}

document.getElementById("libraryBack").addEventListener("click", () => {
  document.getElementById("libraryContent").innerHTML = "";
  document.getElementById("libraryViewerBox").style.display = "none";
  document.getElementById("libraryFolders").style.display = "flex";
  document.getElementById("libraryGrid").style.display = "grid";
});

function loadLibrary() {
  fetchTab("Library").then(rows => {
    libraryRows = rows.filter(r => (r["제목"] || "").toString().trim());
    renderLibraryFolders();
    renderLibraryGrid();
  });
}
loadLibrary();
