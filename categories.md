---
layout: page
title: Categories
permalink: /categories/
---

<div id="categoryList">loading...</div>

<script>
fetch("/topping/posts.json", { cache: "no-store" })
  .then(res => res.json())
  .then(posts => {
    const categories = {};
    posts.forEach(p => {
      if (p.category) {
        if (!categories[p.category]) categories[p.category] = [];
        categories[p.category].push(p);
      }
    });

    const container = document.getElementById("categoryList");
    container.innerHTML = "";

    Object.keys(categories).sort().forEach(cat => {
      const section = document.createElement("div");
      section.style.marginBottom = "24px";
      section.innerHTML = `<h4>${cat}</h4>`;
      const ul = document.createElement("ul");
      categories[cat]
        .sort((a, b) => b.date.localeCompare(a.date))
        .forEach(p => {
          const li = document.createElement("li");
          li.innerHTML = `<a href="${p.url}">${p.date} - ${p.title}</a>`;
          ul.appendChild(li);
        });
      section.appendChild(ul);
      container.appendChild(section);
    });
  });
</script>
