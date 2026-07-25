// ── 시트 → CSV → JSON ────────────────────────────────────
function sheetUrl(tabName) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tabName)}`;
}

function fetchTab(tabName) {
  return fetch(sheetUrl(tabName))
    .then(res => {
      if (!res.ok) throw new Error(`시트를 불러오지 못했습니다: ${tabName}`);
      return res.text();
    })
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

// ── Profile / 소개 ─────────────────────────────────────────
fetchTab(TABS.profile)
  .then(rows => {
    const map = {};
    rows.forEach(r => {
      const key = (r.key || "").trim();
      if (key) map[key] = (r.value || "").trim();
    });

    const name = map.name || SITE_DEFAULTS.name;
    const tagline = map.tagline || SITE_DEFAULTS.tagline;
    document.getElementById("siteName").textContent = name;
    document.getElementById("siteTagline").textContent = tagline;
    document.title = name;

    const bodyEl = document.getElementById("aboutBody");
    bodyEl.innerHTML = "";

    if (map.bio) {
      const p = document.createElement("p");
      p.textContent = map.bio;
      bodyEl.appendChild(p);
    }

    const skipKeys = new Set(["name", "tagline", "bio", "updated"]);
    const dl = document.createElement("dl");
    let hasKv = false;
    Object.keys(map).forEach(key => {
      if (skipKeys.has(key)) return;
      hasKv = true;
      const row = document.createElement("div");
      row.className = "about-kv";
      row.innerHTML = `<dt>${escapeHtml(key)}</dt><dd>${escapeHtml(map[key])}</dd>`;
      dl.appendChild(row);
    });
    if (hasKv) bodyEl.appendChild(dl);

    if (map.updated) {
      document.getElementById("aboutUpdated").textContent = map.updated;
    }
  })
  .catch(err => {
    document.getElementById("aboutBody").innerHTML =
      `<p class="loading">불러오기 실패: ${escapeHtml(err.message)}</p>`;
  });

// ── Works / 작업물 ─────────────────────────────────────────
fetchTab(TABS.works)
  .then(rows => {
    const grid = document.getElementById("worksGrid");
    grid.innerHTML = "";
    if (!rows.length) {
      grid.innerHTML = `<p class="loading">등록된 작업물이 없습니다.</p>`;
      return;
    }
    rows.forEach((r, i) => {
      const title = r.title || "제목 없음";
      const desc = r.description || "";
      const imgUrl = driveImageUrl(r.image);
      const link = r.link || "";
      const date = r.date || "";
      const tags = (r.tags || "").split(",").map(t => t.trim()).filter(Boolean);

      const card = document.createElement("article");
      card.className = "work-card";
      card.innerHTML = `
        ${imgUrl ? `<div class="work-thumb"><img src="${imgUrl}" alt="${escapeHtml(title)}" loading="lazy"></div>` : ""}
        <div class="work-body">
          <div class="work-topline">WK—${padNum(i)}${date ? " · " + escapeHtml(date) : ""}</div>
          <h3 class="work-title">${escapeHtml(title)}</h3>
          <p class="work-desc">${escapeHtml(desc)}</p>
          ${tags.length ? `<div class="work-tags">${tags.map(t => `<span class="work-tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
          ${link ? `<a class="work-link" href="${escapeHtml(link)}" target="_blank" rel="noopener">자세히 보기 →</a>` : ""}
        </div>`;
      grid.appendChild(card);
    });
  })
  .catch(err => {
    document.getElementById("worksGrid").innerHTML =
      `<p class="loading">불러오기 실패: ${escapeHtml(err.message)}</p>`;
  });

// ── Notices / 공지사항 ─────────────────────────────────────
fetchTab(TABS.notices)
  .then(rows => {
    const ledger = document.getElementById("noticesLedger");
    ledger.innerHTML = "";
    if (!rows.length) {
      ledger.innerHTML = `<p class="loading">등록된 공지사항이 없습니다.</p>`;
      return;
    }
    rows
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
  })
  .catch(err => {
    document.getElementById("noticesLedger").innerHTML =
      `<p class="loading">불러오기 실패: ${escapeHtml(err.message)}</p>`;
  });

// ── Links / 링크 모음 ───────────────────────────────────────
fetchTab(TABS.links)
  .then(rows => {
    const index = document.getElementById("linksIndex");
    index.innerHTML = "";
    if (!rows.length) {
      index.innerHTML = `<p class="loading">등록된 링크가 없습니다.</p>`;
      return;
    }
    rows.forEach(r => {
      const a = document.createElement("a");
      a.className = "link-row";
      a.href = r.url || "#";
      a.target = "_blank";
      a.rel = "noopener";
      a.innerHTML = `
        <span class="link-label">${escapeHtml(r.label || r.url || "")}</span>
        <span class="link-desc">${escapeHtml(r.description || "")}</span>`;
      index.appendChild(a);
    });
  })
  .catch(err => {
    document.getElementById("linksIndex").innerHTML =
      `<p class="loading">불러오기 실패: ${escapeHtml(err.message)}</p>`;
  });
