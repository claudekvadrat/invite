/* ============================================================
   Приглашение · Юбилей Сапуры · 75 лет
   Обратный отсчёт · reveal-анимации · лепестки роз
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 0. Кинематографичный автоскролл вниз при заходе (≈5 сек) ── */
  (function autoScrollTour() {
    if (reduceMotion) return;

    // Не даём браузеру восстанавливать прежнюю позицию — тур всегда с верха
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    var DURATION = 15000;  // общая длительность прокрутки, мс (медленно и плавно)
    var START_DELAY = 1100; // пауза перед стартом, чтобы человек увидел «шапку»
    var cancelled = false;
    var rafId = null;

    // Плавное ускорение-замедление (ease-in-out)
    function easeInOut(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function stop() {
      if (cancelled) return;
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      removeListeners();
    }

    // Любое намерение пользователя прокрутить самому — сразу отдаём управление
    var events = ["wheel", "touchstart", "touchmove", "keydown", "mousedown", "pointerdown"];
    function addListeners() {
      events.forEach(function (ev) {
        window.addEventListener(ev, stop, { passive: true });
      });
    }
    function removeListeners() {
      events.forEach(function (ev) {
        window.removeEventListener(ev, stop, { passive: true });
      });
    }

    function run() {
      if (cancelled) return;
      var startY = window.scrollY || 0;
      var maxY = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight
      ) - window.innerHeight;
      var distance = maxY - startY;
      if (distance <= 8) return; // прокручивать нечего

      var startTime = null;
      addListeners();

      function frame(now) {
        if (cancelled) return;
        if (startTime === null) startTime = now;
        var p = Math.min((now - startTime) / DURATION, 1);
        window.scrollTo(0, startY + distance * easeInOut(p));
        if (p < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          removeListeners();
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    // Стартуем после загрузки картинок, чтобы высота страницы была финальной
    window.addEventListener("load", function () {
      setTimeout(run, START_DELAY);
    });
  })();

  /* ── 1. Плавное появление блоков при скролле ── */
  (function revealOnScroll() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    items.forEach(function (el, i) {
      // лёгкая каскадная задержка для соседних блоков
      el.style.transitionDelay = (Math.min(i, 6) * 90) + "ms";
      io.observe(el);
    });
  })();

  /* ── 2. Обратный отсчёт до 19 сентября 2026, 12:00 ── */
  (function countdown() {
    // Локальное время Казахстана (UTC+5) → задаём явный сдвиг, чтобы отсчёт был корректным везде
    var target = new Date("2026-09-19T12:00:00+05:00").getTime();

    var dEl = document.querySelector("[data-d]");
    var hEl = document.querySelector("[data-h]");
    var mEl = document.querySelector("[data-m]");
    var sEl = document.querySelector("[data-s]");
    if (!dEl) return;

    function pad(n) { return n < 10 ? "0" + n : "" + n; }

    // Лёгкий «подскок» ячейки при изменении значения
    function bump(el) {
      if (reduceMotion) return;
      el.classList.remove("bump");
      // reflow, чтобы перезапустить анимацию
      void el.offsetWidth;
      el.classList.add("bump");
    }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        dEl.textContent = hEl.textContent = mEl.textContent = sEl.textContent = "0";
        var title = document.querySelector(".countdown-title");
        if (title) title.textContent = "Мереке басталды! 🎉";
        clearInterval(timer);
        return;
      }
      var s = Math.floor(diff / 1000);
      dEl.textContent = Math.floor(s / 86400);
      hEl.textContent = pad(Math.floor((s % 86400) / 3600));
      mEl.textContent = pad(Math.floor((s % 3600) / 60));
      sEl.textContent = pad(s % 60);
      bump(sEl); // подскок секундной ячейки каждую секунду
    }
    tick();
    var timer = setInterval(tick, 1000);
  })();

  /* ── 3. Падающие лепестки роз на canvas ── */
  (function petals() {
    if (reduceMotion) return;
    var canvas = document.getElementById("petals");
    if (!canvas) return;
    var ctx = canvas.getContext("2d");

    var W, H, dpr;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      // clientWidth/Height — без полосы прокрутки, чтобы канвас не распирал страницу
      W = document.documentElement.clientWidth;
      H = document.documentElement.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      // размеры на экране задаёт CSS (inset:0), инлайновые px не ставим
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize);

    // количество зависит от площади экрана — на смартфоне лепестков немного
    var COUNT = Math.round(Math.min(48, Math.max(24, (W * H) / 16000)));
    var petalsArr = [];

    // палитра лепестков — оттенки алой розы и золота
    var colors = ["#C1121F", "#9C1420", "#A40E1A", "#7A0C15", "#C6A15B"];

    function rand(a, b) { return a + Math.random() * (b - a); }

    function Petal() { this.reset(true); }
    Petal.prototype.reset = function (initial) {
      this.x = rand(0, W);
      this.y = initial ? rand(-H, 0) : rand(-40, -10);
      this.size = rand(11, 22);
      this.speedY = rand(1.1, 2.6);
      this.speedX = rand(-0.5, 0.5);
      this.angle = rand(0, Math.PI * 2);
      this.spin = rand(-0.035, 0.035);
      this.sway = rand(0.6, 1.5);
      this.swayPhase = rand(0, Math.PI * 2);
      this.color = colors[(Math.random() * colors.length) | 0];
      this.opacity = rand(0.45, 0.9);
    };
    Petal.prototype.step = function (t) {
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(t * 0.001 + this.swayPhase) * this.sway * 0.4;
      this.angle += this.spin;
      if (this.y > H + 30) this.reset(false);
    };
    Petal.prototype.draw = function () {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      // форма лепестка — два скруглённых конца
      var s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.9, s * 0.6, 0, s);
      ctx.bezierCurveTo(-s * 0.9, s * 0.6, -s * 0.9, -s * 0.6, 0, -s);
      ctx.fill();
      ctx.restore();
    };

    for (var i = 0; i < COUNT; i++) petalsArr.push(new Petal());

    var running = true;
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(loop);
    });

    function loop(t) {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < petalsArr.length; i++) {
        petalsArr[i].step(t);
        petalsArr[i].draw();
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  })();

})();
