function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}&_ts=${Date.now()}`;
}
function fetchTab(tabName) {
  return fetch(sheetUrl(tabName), { cache: "no-store" })
    .then(res => res.arrayBuffer())
    .then(buffer => Papa.parse(new TextDecoder("utf-8").decode(buffer), { header: true, skipEmptyLines: true }).data);
}
function escapeHtml(str) {
  if (str == null) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderMain() {
  fetchTab(TABS.main).then(rows => {
    const doorEl = document.getElementById("doorImage");
    const typeline = document.getElementById("noticestypeline");
    const doorRow = rows.find(r => (r.image || "").trim());
    if (doorRow) {
      const img = document.createElement("img");
      img.src = driveImageUrl(doorRow.image);
      doorEl.appendChild(img);
    }
    rows.filter(r => (r.date || r.content || "").trim())
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
      .forEach(r => {
        const row = document.createElement("div");
        row.className = "typeline-row";
        row.innerHTML = `<div class="typeline-date">${escapeHtml(r.date || "")}</div><div><p class="typeline-content">${escapeHtml(r.content || "")}</p></div>`;
        typeline.appendChild(row);
      });
  });
}

function renderProfile() {
  fetchTab(TABS.profile).then(rows => {
    const container = document.getElementById("profileSections");
    rows.filter(r => (r.key || "").trim()).forEach(r => {
      const row = document.createElement("div");
      row.className = "about-kv";
      row.innerHTML = `<dt>${escapeHtml(r.key)}</dt><dd>${escapeHtml(r.value || "")}</dd>`;
      container.appendChild(row);
    });
  });
}

function rendergallery() {
  fetchTab(TABS.gallery).then(rows => {
    const grid = document.getElementById("galleryGrid");
    rows.filter(r => (r.image || r.comment || "").trim()).forEach(r => {
      const imgUrl = driveImageUrl(r.image);
      const card = document.createElement("article");
      card.className = "gallery-card";
      card.innerHTML = `${imgUrl ? `<div class="gallery-thumb"><img src="${imgUrl}"></div>` : ""}<div class="gallery-body"><p class="gallery-comment">${escapeHtml(r.comment || "")}</p></div>`;
      grid.appendChild(card);
    });
  });
}

function renderLinks() {
  fetchTab(TABS.links).then(rows => {
    const index = document.getElementById("linksIndex");
    rows.filter(r => (r.label || r.url || "").trim()).forEach(r => {
      const a = document.createElement("a");
      a.href = r.url || "#";
      a.className = "link-row";
      a.innerHTML = `<span class="link-label">${escapeHtml(r.label || "")}</span><span class="link-desc">${escapeHtml(r.description || "")}</span>`;
      index.appendChild(a);
    });
  });
}

function renderGuestbook() {
  fetchTab(TABS.guestbook).then(rows => {
    const list = document.getElementById("guestbookList");
    rows.filter(r => (r.message || "").trim()).reverse().forEach(r => {
      const row = document.createElement("div");
      row.className = "guestbook-entry";
      row.innerHTML = `<p class="guestbook-meta"><span class="guestbook-name">${escapeHtml(r.name || "익명")}</span><span class="guestbook-date">${escapeHtml(r.timestamp || "")}</span></p><p class="guestbook-message">${escapeHtml(r.message || "")}</p>`;
      list.appendChild(row);
    });
  });

  document.getElementById("guestbookForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = document.getElementById("gbName").value.trim();
    const message = document.getElementById("gbMessage").value.trim();
    if (!message) return;
    fetch(GUESTBOOK_WEBAPP_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ name, message })
    }).then(() => location.reload());
  });
}
