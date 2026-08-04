// ── 탭 클릭 효과음 ────────────────────────────────────────
/* jconst clickAudio = new Audio("tab.wav");
clickAudio.preload = "auto";

function playClickSound() {
  clickAudio.currentTime = 0;
  clickAudio.play().catch(() => {});
} */

// ══════════════════════════════════════════════════════
// 스크롤 바 나비
// ══════════════════════════════════════════════════════
(function () {
  const morpho = document.getElementById("scrollMorpho");
  if (!morpho) return;

  function updateMorphoPosition() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = docHeight > 0 ? scrollTop / docHeight : 0;

    const trackHeight = window.innerHeight - 50; // 이미지 높이(50px)만큼 빼서 화면 밖으로 안 나가게
    const top = scrollPercent * trackHeight;

    morpho.style.top = `${top}px`;
  }

  window.addEventListener("scroll", updateMorphoPosition);
  window.addEventListener("resize", updateMorphoPosition);
  updateMorphoPosition();
})();

// ══════════════════════════════════════════════════════
// 모바일 터치 커서
// ══════════════════════════════════════════════════════
(function () {
  const cursor = document.getElementById("touchCursor");
  if (!cursor) return;

  function moveCursor(x, y) {
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    cursor.classList.add("active");
  }

  document.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    moveCursor(touch.clientX, touch.clientY);
  }, { passive: true });

  document.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    moveCursor(touch.clientX, touch.clientY);
  }, { passive: true });

  // touchend에서 숨기는 코드 삭제 — 이제 손을 떼도 그 자리에 남아있음
})();


// ══════════════════════════════════════════════════════
// 커서 효과
// ══════════════════════════════════════════════════════
// <![CDATA[
var colour="random"; // in addition to "random" can be set to any valid colour eg "#f0f" or "red"
var sparkles=50;

/****************************
*  Tinkerbell Magic Sparkle *
*(c)2005-13 mf2fm web-design*
*  http://www.mf2fm.com/rv  *
* DON'T EDIT BELOW THIS BOX *
****************************/
var x=ox=400;
var y=oy=300;
var swide=800;
var shigh=600;
var sleft=sdown=0;
var tiny=new Array();
var star=new Array();
var starv=new Array();
var starx=new Array();
var stary=new Array();
var tinyx=new Array();
var tinyy=new Array();
var tinyv=new Array();

window.onload=function() { if (document.getElementById) {
  var i, rats, rlef, rdow;
  for (var i=0; i<sparkles; i++) {
    var rats=createDiv(3, 3);
    rats.style.visibility="hidden";
    rats.style.zIndex="999";
    document.body.appendChild(tiny[i]=rats);
    starv[i]=0;
    tinyv[i]=0;
    var rats=createDiv(5, 5);
    rats.style.backgroundColor="transparent";
    rats.style.visibility="hidden";
    rats.style.zIndex="999";
    var rlef=createDiv(1, 5);
    var rdow=createDiv(5, 1);
    rats.appendChild(rlef);
    rats.appendChild(rdow);
    rlef.style.top="2px";
    rlef.style.left="0px";
    rdow.style.top="0px";
    rdow.style.left="2px";
    document.body.appendChild(star[i]=rats);
  }
  set_width();
  sparkle();
}}

function sparkle() {
  var c;
  if (Math.abs(x-ox)>1 || Math.abs(y-oy)>1) {
    ox=x;
    oy=y;
    for (c=0; c<sparkles; c++) if (!starv[c]) {
      star[c].style.left=(starx[c]=x)+"px";
      star[c].style.top=(stary[c]=y+1)+"px";
      star[c].style.clip="rect(0px, 5px, 5px, 0px)";
      star[c].childNodes[0].style.backgroundColor=star[c].childNodes[1].style.backgroundColor=(colour=="random")?newColour():colour;
      star[c].style.visibility="visible";
      starv[c]=50;
      break;
    }
  }
  for (c=0; c<sparkles; c++) {
    if (starv[c]) update_star(c);
    if (tinyv[c]) update_tiny(c);
  }
  setTimeout("sparkle()", 40);
}

function update_star(i) {
  if (--starv[i]==25) star[i].style.clip="rect(1px, 4px, 4px, 1px)";
  if (starv[i]) {
    stary[i]+=1+Math.random()*3;
    starx[i]+=(i%5-2)/5;
    if (stary[i]<shigh+sdown) {
      star[i].style.top=stary[i]+"px";
      star[i].style.left=starx[i]+"px";
    }
    else {
      star[i].style.visibility="hidden";
      starv[i]=0;
      return;
    }
  }
  else {
    tinyv[i]=50;
    tiny[i].style.top=(tinyy[i]=stary[i])+"px";
    tiny[i].style.left=(tinyx[i]=starx[i])+"px";
    tiny[i].style.width="2px";
    tiny[i].style.height="2px";
    tiny[i].style.backgroundColor=star[i].childNodes[0].style.backgroundColor;
    star[i].style.visibility="hidden";
    tiny[i].style.visibility="visible"
  }
}

function update_tiny(i) {
  if (--tinyv[i]==25) {
    tiny[i].style.width="1px";
    tiny[i].style.height="1px";
  }
  if (tinyv[i]) {
    tinyy[i]+=1+Math.random()*3;
    tinyx[i]+=(i%5-2)/5;
    if (tinyy[i]<shigh+sdown) {
      tiny[i].style.top=tinyy[i]+"px";
      tiny[i].style.left=tinyx[i]+"px";
    }
    else {
      tiny[i].style.visibility="hidden";
      tinyv[i]=0;
      return;
    }
  }
  else tiny[i].style.visibility="hidden";
}

document.onmousemove=mouse;
function mouse(e) {
  if (e) {
    y=e.pageY;
    x=e.pageX;
  }
  else {
    set_scroll();
    y=event.y+sdown;
    x=event.x+sleft;
  }
}

window.onscroll=set_scroll;
function set_scroll() {
  if (typeof(self.pageYOffset)=='number') {
    sdown=self.pageYOffset;
    sleft=self.pageXOffset;
  }
  else if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
    sdown=document.body.scrollTop;
    sleft=document.body.scrollLeft;
  }
  else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
    sleft=document.documentElement.scrollLeft;
    sdown=document.documentElement.scrollTop;
  }
  else {
    sdown=0;
    sleft=0;
  }
}

window.onresize=set_width;
function set_width() {
  var sw_min=999999;
  var sh_min=999999;
  if (document.documentElement && document.documentElement.clientWidth) {
    if (document.documentElement.clientWidth>0) sw_min=document.documentElement.clientWidth;
    if (document.documentElement.clientHeight>0) sh_min=document.documentElement.clientHeight;
  }
  if (typeof(self.innerWidth)=='number' && self.innerWidth) {
    if (self.innerWidth>0 && self.innerWidth<sw_min) sw_min=self.innerWidth;
    if (self.innerHeight>0 && self.innerHeight<sh_min) sh_min=self.innerHeight;
  }
  if (document.body.clientWidth) {
    if (document.body.clientWidth>0 && document.body.clientWidth<sw_min) sw_min=document.body.clientWidth;
    if (document.body.clientHeight>0 && document.body.clientHeight<sh_min) sh_min=document.body.clientHeight;
  }
  if (sw_min==999999 || sh_min==999999) {
    sw_min=800;
    sh_min=600;
  }
  swide=sw_min;
  shigh=sh_min;
}

function createDiv(height, width) {
  var div=document.createElement("div");
  div.style.position="absolute";
  div.style.height=height+"px";
  div.style.width=width+"px";
  div.style.overflow="hidden";
  return (div);
}

function newColour() {
  var c=new Array();
  c[0]=255;
  c[1]=Math.floor(Math.random()*256);
  c[2]=Math.floor(Math.random()*(256-c[1]/2));
  c.sort(function(){return (0.5 - Math.random());});
  return ("rgb("+c[0]+", "+c[1]+", "+c[2]+")");
}
// ]]>


// ══════════════════════════════════════════════════════
// 시메지
// ══════════════════════════════════════════════════════

(function () {
  const el = document.getElementById('shimeji');
  if (!el) return;

  const SPRITES = { walk: '✨', idle: '🧚‍♂️', drag: '✨', climb: '🕷️' };
  el.textContent = SPRITES.idle;

  let x = 40;
  let y = 0;
  let vx = 0;
  let vy = 0;
  let state = 'idle';
  let stateTimer = 0;
  let dragging = false;
  let onWall = null;

  function rand(min, max) { return Math.random() * (max - min) + min; }

  function pickState() {
    const roll = Math.random();
    onWall = null;
    el.classList.remove('climbing');

    if (roll < 0.4) { state = 'idle'; vx = 0; }
    else if (roll < 0.85) { state = 'walk'; vx = rand(0.6, 1.4) * (Math.random() < 0.5 ? -1 : 1); }
    else { state = 'idle'; vx = 0; }

    stateTimer = rand(2000, 5000);
    el.textContent = SPRITES[state] || SPRITES.idle;
    el.classList.toggle('flip', vx < 0);
  }

  function startClimb(wall) {
    onWall = wall;
    state = 'climb';
    vy = -rand(0.6, 1.3);
    stateTimer = rand(2500, 5000);
    el.textContent = SPRITES.climb;
    el.classList.add('climbing');
  }

  function endClimb() {
    onWall = null;
    el.classList.remove('climbing');
    pickState();
  }

  function tick(dt) {
    if (dragging) return;

    stateTimer -= dt;

    if (state === 'climb' && onWall) {
      const maxY = window.innerHeight - el.offsetHeight;
      y += vy * (dt / 16);

      if (y >= maxY) { y = maxY; endClimb(); }
      else if (y <= 0) { y = 0; endClimb(); }
      else if (stateTimer <= 0) { endClimb(); }

      el.style.left = x + 'px';
      el.style.bottom = y + 'px';
      return;
    }

    if (stateTimer <= 0) pickState();

    const maxX = window.innerWidth - el.offsetWidth;
    x += vx * (dt / 16);

    if (x <= 0) {
      x = 0;
      if (state === 'walk' && Math.random() < 0.35) {
        startClimb('left');
      } else {
        vx = Math.abs(vx);
        el.classList.remove('flip');
      }
    }
    if (x >= maxX) {
      x = maxX;
      if (state === 'walk' && Math.random() < 0.35) {
        startClimb('right');
      } else {
        vx = -Math.abs(vx);
        el.classList.add('flip');
      }
    }

    el.style.left = x + 'px';
    el.style.bottom = y + 'px';
  }

  let last = performance.now();
  function loop(now) {
    const dt = now - last;
    last = now;
    tick(dt);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    onWall = null;
    el.classList.remove('climbing');
    el.classList.add('dragging');
    el.textContent = SPRITES.drag;
    el.setPointerCapture(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    x = e.clientX - el.offsetWidth / 2;
    y = window.innerHeight - e.clientY - el.offsetHeight / 2;
    y = Math.max(0, y);
    el.style.left = x + 'px';
    el.style.bottom = y + 'px';
  });

  el.addEventListener('pointerup', () => {
    dragging = false;
    el.classList.remove('dragging');
    pickState();
  });

  el.addEventListener('pointercancel', () => {
    dragging = false;
    el.classList.remove('dragging');
    pickState();
  });

  pickState();
})();
