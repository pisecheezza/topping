---
layout: page
title: Categories
permalink: /categories/
---
<a href="{{ '/blog/' | relative_url }}" style="display:inline-block; margin-bottom:16px; text-decoration:none; color:var(--ink, #222); font-family: 'Tahoma', 'Malgun Gothic', 'Hiragino Kaku Gothic ProN', sans-serif;">← All Pages</a>

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
  margin: 0 0 32px;
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
</style>

<script>
fetch("{{ '/posts.json' | relative_url }}", { cache: "no-store" })
  .then(res => res.json())
  .then(posts => {
    const container = document.getElementById("categoryList");
    container.innerHTML = "";

    function formatDateDot(dateStr) {
      return String(dateStr || "").replace(/-/g, ".");
    }

    const categories = {};
    posts.forEach(p => {
      if (p.category) {
        if (!categories[p.category]) categories[p.category] = [];
        categories[p.category].push(p);
      }
    });

    Object.keys(categories).sort().forEach(cat => {
      const section = document.createElement("div");
      section.innerHTML = `<h4>${cat} (${categories[cat].length})</h4>`;

      const ul = document.createElement("ul");
      categories[cat]
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(p => {
          const li = document.createElement("li");
          li.innerHTML = `<span class="cat-date">${formatDateDot(p.date)}</span><a href="${p.url}">${p.title}</a>`;
          ul.appendChild(li);
        });

      section.appendChild(ul);
      container.appendChild(section);
    });
  });
</script>
