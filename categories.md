---
layout: page
title: Categories
permalink: /categories/
---

<div id="categoryList">loading...</div>

<style>
#categoryList a {
  text-decoration: none;
  color: var(--ink, #222);
}
#categoryList a:hover {
  color: var(--teal-deep, #0a7a6d);
}
#categoryList ul {
  list-style: none;
  margin: 0 0 24px;
  padding: 0;
}
#categoryList li {
  display: flex;
  gap: 16px;
  padding: 10px 0;
  border-bottom: 1px solid var(--ink, #222);
  font-family: "Tahoma", "Malgun Gothic", "Hiragino Kaku Gothic ProN", sans-serif;
}
#categoryList .cat-date {
  font-size: 12px;
  color: var(--ink, #222);
  flex-shrink: 0;
  width: 90px;
}
#categoryList h3 {
  font-family: "Tahoma", "Malgun Gothic", "Hiragino Kaku Gothic ProN", sans-serif;
  font-weight: 600;
  margin-bottom: 8px;
}
#categoryList .back-link {
  display: inline-block;
  margin-top: 12px;
}
</style>

<script>
fetch("{{ '/posts.json' | relative_url }}", { cache: "no-store" })
  .then(res => res.json())
  .then(posts => {
    const params = new URLSearchParams(window.location.search);
    const selectedCat = params.get('cat');
    const container = document.getElementById("categoryList");
    container.innerHTML = "";

    function formatDateDot(dateStr) {
      return String(dateStr || "").replace(/-/g, ".");
    }

    if (selectedCat) {
      const heading = document.createElement("h2");
      heading.textContent = selectedCat;
      container.appendChild(heading);

      const filtered = posts
        .filter(p => p.category === selectedCat)
        .sort((a, b) => b.date.localeCompare(a.date));

      const ul = document.createElement("ul");
      filtered.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="cat-date">${formatDateDot(p.date)}</span><a href="${p.url}">${p.title}</a>`;
        ul.appendChild(li);
      });
      container.appendChild(ul);

      const backLink = document.createElement("a");
      backLink.className = "back-link";
      backLink.href = "{{ '/categories/' | relative_url }}";
      backLink.textContent = "← All";
      container.appendChild(backLink);
    } else {
      const categories = {};
      posts.forEach(p => {
        if (p.category) {
          if (!categories[p.category]) categories[p.category] = [];
          categories[p.category].push(p);
        }
      });

      Object.keys(categories).sort().forEach(cat => {
        const section = document.createElement("div");
        section.innerHTML = `<h3><a href="?cat=${encodeURIComponent(cat)}">${cat} (${categories[cat].length})</a></h3>`;
        container.appendChild(section);
      });
    }
  });
</script>
