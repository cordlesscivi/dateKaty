/* ============================================================
   Лёгкий падающий снег на canvas (requestAnimationFrame).
   Не грузит браузер: количество снежинок подбирается по размеру экрана,
   DPR ограничен, рендер останавливается на свернутой вкладке (rAF).
   ============================================================ */
(function () {
  'use strict';

  const canvas = document.getElementById('snow-canvas');
  if (!canvas) return;

  // Уважаем настройку «уменьшить движение» — снег отключается.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = 1;
  let flakes = [];

  // Один снежок.
  function newFlake(anywhere) {
    return {
      x: Math.random() * width,
      y: anywhere ? Math.random() * height : -10,
      r: 0.8 + Math.random() * 2.4,
      speed: 0.4 + Math.random() * 1.1,
      drift: (Math.random() - 0.5) * 0.5,
      sway: Math.random() * Math.PI * 2,
      swaySpeed: 0.005 + Math.random() * 0.02,
      opacity: 0.35 + Math.random() * 0.55,
    };
  }

  function initFlakes() {
    // Число снежинок пропорционально площади экрана, но не больше 160.
    const count = Math.min(160, Math.max(20, Math.floor((width * height) / 14000)));
    flakes = Array.from({ length: count }, () => newFlake(true));
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initFlakes();
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#ffffff';

    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.sway += f.swaySpeed;
      f.y += f.speed;
      f.x += f.drift + Math.sin(f.sway) * 0.4;

      // Стартуем снег с верхнего края, если ушёл за нижний.
      if (f.y > height + 10) Object.assign(f, newFlake(false));
      // Уход за боковые края — зациклить.
      if (f.x < -10) f.x = width + 10;
      else if (f.x > width + 10) f.x = -10;

      ctx.globalAlpha = f.opacity;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(tick);
})();