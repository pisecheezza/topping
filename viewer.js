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
  allBtn.textContent = "전체";
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
  let cleanDate = post['Released'] ? post['Released'] : (post['생성일'] ? post['생성일'].substring(0, 10) : '');
  list
    .slice()
    .sort((a, b) => (b["생성일"] || "").localeCompare(a["생성일"] || ""))
    .forEach(r => {
      const card = document.createElement("div");
      card.className = "library-post-card";
      card.innerHTML = `
        <div class="library-post-title">${escapeHtml(r["제목"] || "")}</div>
        <div class="library-post-date">${escapeHtml((r["생성일"] || "").slice(0, 10))}</div>`;
      card.addEventListener("click", () => openLibraryDoc(r));
      grid.appendChild(card);
    });
}

function openLibraryDoc(row) {
  document.getElementById("libraryFolders").style.display = "none";
  document.getElementById("libraryGrid").style.display = "none";
  document.getElementById("libraryViewerBox").style.display = "block";
  document.getElementById("libraryIframe").src = buildLibraryDocUrl(row["링크"]);
}

document.getElementById("libraryBack").addEventListener("click", () => {
  document.getElementById("libraryIframe").src = "";
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
