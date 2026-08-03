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
