---
layout: page
title: Categories
permalink: /categories/
---

<div id="categoryList">loading</div>

<script>
fetch("{{ '/posts.json' | relative_url }}", { cache: "no-store" })
  .then(res => res.json())
  .then(posts => {
    const params = new URLSearchParams(window.location.search);
    const selectedCat = params.get('cat');
    const container = document.getElementById("categoryList");
    container.innerHTML = "";

    if (selectedCat) {
      // 특정 카테고리만 필터링해서 목록 표시
      const heading = document.createElement("h2");
      heading.textContent = selectedCat;
      container.appendChild(heading);

      const filtered = posts
        .filter(p => p.category === selectedCat)
        .sort((a, b) => b.date.localeCompare(a.date));

      const ul = document.createElement("ul");
      filtered.forEach(p => {
        const li = document.createElement("li");
        li.innerHTML = `<a href="${p.url}">${p.date} - ${p.title}</a>`;
        ul.appendChild(li);
      });
      container.appendChild(ul);

      const backLink = document.createElement("a");
      backLink.href = "{{ '/categories/' | relative_url }}";
      backLink.textContent = "← 전체 카테고리 보기";
      backLink.style.display = "block";
      backLink.style.marginTop = "20px";
      container.appendChild(backLink);
    } else {
      // 전체 카테고리 목록 표시
      const categories = {};
      posts.forEach(p => {
        if (p.category) {
          if (!categories[p.category]) categories[p.category] = [];
          categories[p.category].push(p);
        }
      });

      Object.keys(categories).sort().forEach(cat => {
        const section = document.createElement("div");
        section.style.marginBottom = "24px";
        section.innerHTML = `<h3><a href="?cat=${encodeURIComponent(cat)}">${cat} (${categories[cat].length})</a></h3>`;
        container.appendChild(section);
      });
    }
  });
</script>
