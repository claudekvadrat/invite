/* ============================================================
   Приглашение · Юбилей Сапуры · 75 лет
   Обратный отсчёт · reveal-анимации · лепестки роз
   ============================================================ */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 0. Кинематографичный автоскролл вниз (запускается ПОСЛЕ заставки) ── */
  var startTour = (function autoScrollTour() {
    // Автоскролл работает всегда (даже при reduce-motion) — это ключевая фича приглашения

    // Не даём браузеру восстанавливать прежнюю позицию — тур всегда с верха
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    var DURATION = 19500;  // общая длительность прокрутки, мс (на 30% медленнее)
    var START_DELAY = 700;  // короткая пауза после клика перед стартом тура
    var cancelled = false;
    var rafId = null;
    var programmaticY = -1; // куда мы сами проскроллили в последнем кадре

    // Равномерная скорость: одинаково плавно от начала до конца (linear)
    function ease(t) { return t; }

    function stop() {
      if (cancelled) return;
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      removeListeners();
    }

    // Отменяем ТОЛЬКО при реальном намерении прокрутить самому.
    // touchstart НЕ слушаем — на телефоне простое касание не должно прерывать тур.
    var touchStartY = null;
    function onTouchStart(e) {
      touchStartY = e.touches && e.touches[0] ? e.touches[0].clientY : null;
    }
    function onTouchMove(e) {
      // отменяем, если палец сдвинулся заметно (реальный свайп прокрутки)
      if (touchStartY === null) { stop(); return; }
      var y = e.touches && e.touches[0] ? e.touches[0].clientY : touchStartY;
      if (Math.abs(y - touchStartY) > 8) stop();
    }
    // Скролл, который сделали НЕ мы (колесо мыши, трекпад, свайп) — отменяет тур
    function onScroll() {
      if (cancelled) return;
      var y = window.scrollY || document.documentElement.scrollTop || 0;
      // если позиция отличается от нашей программной больше чем на 4px — это пользователь
      if (programmaticY >= 0 && Math.abs(y - programmaticY) > 4) stop();
    }

    var wired = false;
    function addListeners() {
      if (wired) return;
      wired = true;
      window.addEventListener("wheel", stop, { passive: true });
      window.addEventListener("keydown", stop, { passive: true });
      window.addEventListener("touchstart", onTouchStart, { passive: true });
      window.addEventListener("touchmove", onTouchMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
    }
    function removeListeners() {
      if (!wired) return;
      wired = false;
      window.removeEventListener("wheel", stop, { passive: true });
      window.removeEventListener("keydown", stop, { passive: true });
      window.removeEventListener("touchstart", onTouchStart, { passive: true });
      window.removeEventListener("touchmove", onTouchMove, { passive: true });
      window.removeEventListener("scroll", onScroll, { passive: true });
    }

    // Кросс-браузерная прокрутка окна (некоторые мобильные хотят оба варианта)
    function scrollWindowTo(y) {
      window.scrollTo(0, y);
      // подстраховка для мобильных, где window.scrollTo внутри rAF иногда игнорится
      if (document.scrollingElement) document.scrollingElement.scrollTop = y;
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
        var y = Math.round(startY + distance * ease(p));
        programmaticY = y;      // запоминаем, куда скроллим сами
        scrollWindowTo(y);
        if (p < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          removeListeners();
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    // Возвращаем функцию запуска — её вызовет заставка после клика.
    var started = false;
    return function () {
      if (started) return;
      started = true;
      cancelled = false;
      setTimeout(run, START_DELAY);
    };
  })();

  /* ── 0б. Заставка + фоновая музыка ── */
  (function splashAndMusic() {
    var splash = document.getElementById("splash");
    var bgm = document.getElementById("bgm");
    var toggle = document.getElementById("musicToggle");
    var enterBtns = [
      document.getElementById("enterBtn"),
      document.getElementById("enterBtn2")
    ];
    if (!splash) { startTour(); return; }

    // Блокируем прокрутку страницы, пока показана заставка
    document.body.classList.add("locked");
    // Гарантируем старт сверху
    window.scrollTo(0, 0);

    var entered = false;

    function enter() {
      if (entered) return;
      entered = true;

      // 1) музыка — запуск именно в обработчике клика (иначе браузер заблокирует)
      if (bgm) {
        bgm.volume = 0;
        var pr = bgm.play();
        if (pr && pr.catch) pr.catch(function () {});
        // мягкое нарастание громкости
        fadeIn(bgm, 0.7, 1200);
        if (toggle) {
          toggle.hidden = false;
          toggle.classList.remove("muted");
        }
      }

      // 2) прячем заставку
      splash.classList.add("hidden");
      document.body.classList.remove("locked");

      // 3) запускаем тур-прокрутку после того, как заставка начала исчезать
      setTimeout(function () {
        window.scrollTo(0, 0);
        startTour();
      }, 350);
    }

    function fadeIn(audio, target, ms) {
      var steps = 24, i = 0;
      var iv = setInterval(function () {
        i++;
        audio.volume = Math.min(target, (target * i) / steps);
        if (i >= steps) clearInterval(iv);
      }, ms / steps);
    }

    enterBtns.forEach(function (b) {
      if (b) b.addEventListener("click", enter);
    });

    // Кнопка вкл/выкл музыки
    if (toggle && bgm) {
      toggle.addEventListener("click", function () {
        if (bgm.paused) {
          bgm.play().catch(function () {});
          toggle.classList.remove("muted");
        } else {
          bgm.pause();
          toggle.classList.add("muted");
        }
      });
    }
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
    // Лепестки падают всегда — это украшение приглашения
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
