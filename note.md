---
layout: default
title: 短文
permalink: /note/
---

<h1>Essay</h1>

<ul class="post-list">
{% assign filtered = site.posts | where: "category", "note" %}
{% for post in filtered %}
  <li>
    <span class="post-date">{{ post.date | date: "%Y.%m.%d" }}</span>
    <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>
