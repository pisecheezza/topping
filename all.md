---
layout: default
title: All Posts
permalink: /all/
---

<h1>All Posts</h1>

<ul class="post-list">
{% for post in site.posts %}
  <li>
    <span class="post-date">{{ post.date | date: "%Y.%m.%d" }}</span>
    {% if post.category %}<span class="post-category">[{{ post.category }}]</span>{% endif %}
    <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
  </li>
{% endfor %}
</ul>
