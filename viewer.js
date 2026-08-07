// ══════════════════════════════════════════════════════
// Library: 드라이브 폴더 구조 기반 뷰어
// ══════════════════════════════════════════════════════
// ── Library: 드라이브 폴더 구조 기반 뷰어 ────────────────────
let libraryData = [];
let currentLibraryFolder = null;

function loadLibrary() {
  fetch(`${GUESTBOOK_WEBAPP_URL}?type=library`)
    .then(res => res.json())
    .then(data => {
      if (!data.success) throw new Error(data.error || "로드 실패");
      libraryData = data.folders;
      renderLibraryFolders();
    })
    .catch(err => {
      document.getElementById("libraryFolders").innerHTML =
        `<p style="color:red;">오류: ${escapeHtml(err.message)}</p>`;
    });
}

function renderLibraryFolders() {
  const wrap = document.getElementById("libraryFolders");
  const grid = document.getElementById("libraryGrid");
  wrap.innerHTML = "";
  grid.innerHTML = "";

  libraryData.forEach(folder => {
    const btn = document.createElement("button");
    btn.className = "library-folder-btn";
    btn.type = "button";
    btn.textContent = folder.folderName;
    btn.addEventListener("click", () => {
      document.querySelectorAll(".library-folder-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentLibraryFolder = folder;
      renderLibraryFiles(folder);
    });
    wrap.appendChild(btn);
  });
}

function renderLibraryFiles(folder) {
  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "";

  folder.files.forEach(file => {
    const card = document.createElement("div");
    card.className = "library-post-card";
    card.innerHTML = `
      <div class="library-post-title">${escapeHtml(file.title)}</div>
      <div class="library-post-date">${escapeHtml(file.dateCreated.slice(0, 10))}</div>`;
    card.addEventListener("click", () => openLibraryDoc(file.id));
    grid.appendChild(card);
  });
}

function openLibraryDoc(fileId) {
  document.getElementById("libraryFolders").style.display = "none";
  document.getElementById("libraryGrid").style.display = "none";
  document.getElementById("libraryViewerBox").style.display = "block";
  document.getElementById("libraryIframe").src = `https://docs.google.com/document/d/${fileId}/preview`;
}

document.getElementById("libraryBack").addEventListener("click", () => {
  document.getElementById("libraryIframe").src = "";
  document.getElementById("libraryViewerBox").style.display = "none";
  document.getElementById("libraryFolders").style.display = "flex";
  document.getElementById("libraryGrid").style.display = "grid";
});

loadLibrary();
