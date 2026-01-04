// /js/nav.js
(() => {
  // Нормализация путей: /index.html -> /, убираем завершающий слэш (кроме корня)
  function normalizePath(pathname) {
    try {
      if (!pathname) return "/";
      if (pathname.length > 1 && pathname.endsWith("/")) {
        pathname = pathname.slice(0, -1);
      }
      if (pathname.endsWith("/index.html")) {
        pathname = pathname.slice(0, -"/index.html".length) || "/";
      }
      return pathname || "/";
    } catch {
      return "/";
    }
  }

  function samePath(a, b) {
    return normalizePath(a) === normalizePath(b);
  }

  // Подсветка активного пункта верхнего меню (aria-current="page")
  function highlightActiveNav() {
    const current = normalizePath(location.pathname || "/");
    const nav = document.getElementById("nav-menu");
    if (!nav) return;

    const links = nav.querySelectorAll('a[href]:not([rel~="external"])');
    links.forEach(a => {
      try {
        const href = a.getAttribute("href");
        if (!href || /^(tel:|mailto:)/i.test(href)) return;
        const url = new URL(href, location.origin);
        const path = normalizePath(url.pathname);
        if (samePath(path, current)) {
          a.setAttribute("aria-current", "page");
        } else {
          a.removeAttribute("aria-current");
        }
      } catch {
        // Пропускаем некорректные URL
      }
    });
  }

  // Подсветка активного языка (aria-current="true") в .lang-switcher
  function highlightActiveLanguage() {
    const langNav = document.querySelector(".lang-switcher");
    if (!langNav) return;

    const current = normalizePath(location.pathname || "/");
    const links = langNav.querySelectorAll("a[href]");
    links.forEach(a => {
      try {
        const href = a.getAttribute("href");
        if (!href) return;
        const url = new URL(href, location.origin);
        const path = normalizePath(url.pathname);
        if (samePath(path, current)) {
          a.setAttribute("aria-current", "true");
        } else {
          a.removeAttribute("aria-current");
        }
      } catch {
        // Пропускаем некорректные URL
      }
    });
  }

  // Вспомогательное: список фокусируемых селекторов
  const focusableSelectors = [
    'a[href]:not([tabindex="-1"])',
    'area[href]:not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([type="hidden"]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(",");

  function getFocusable(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => el.offsetParent !== null || el === document.activeElement);
  }

  // Бургер-меню, оверлей, фокус и блокировка прокрутки (только на мобильных)
  function setupBurgerMenu() {
    const toggle = document.querySelector(".nav-toggle");
    const navMenu = document.getElementById("nav-menu");
    const overlay = document.querySelector(".nav-overlay");
    const root = document.documentElement; // <html>
    const main = document.getElementById("content"); // опционально: добавьте id="content" на <main>

    if (!toggle || !navMenu || !overlay) return;

    let lastFocusedBeforeOpen = null;

    function isMobile() {
      try {
        return window.matchMedia("(max-width: 860px)").matches;
      } catch {
        return window.innerWidth <= 860;
      }
    }

    function lockScroll() {
      if (isMobile()) {
        document.body.classList.add("nav-lock");
      }
    }

    function unlockScroll() {
      document.body.classList.remove("nav-lock");
    }

    function setInertOnContent(inertOn) {
      // Используем inert, если поддерживается, иначе aria-hidden
      if (main) {
        if ("inert" in main) {
          main.inert = inertOn;
        } else {
          if (inertOn) {
            main.setAttribute("aria-hidden", "true");
          } else {
            main.removeAttribute("aria-hidden");
          }
        }
      }
    }

    function openMenu() {
      lastFocusedBeforeOpen = document.activeElement instanceof HTMLElement ? document.activeElement : null;

      root.classList.add("nav-open");
      toggle.setAttribute("aria-expanded", "true");
      overlay.hidden = false;
      navMenu.setAttribute("aria-hidden", "false");
      lockScroll();
      setInertOnContent(true);

      // Переводим фокус на первый фокусируемый элемент меню
      const focusables = getFocusable(navMenu);
      if (focusables.length) {
        focusables[0].focus({ preventScroll: true });
      } else {
        // Если нет фокусируемых — оставляем фокус на кнопке
        toggle.focus({ preventScroll: true });
      }
    }

    function closeMenu() {
      root.classList.remove("nav-open");
      toggle.setAttribute("aria-expanded", "false");
      overlay.hidden = true;
      navMenu.setAttribute("aria-hidden", "true");
      unlockScroll();
      setInertOnContent(false);

      // Возвращаем фокус на кнопку
      if (toggle instanceof HTMLElement) {
        toggle.focus({ preventScroll: true });
      }

      // Если фокус был внутри меню — сбрасываем
      if (document.activeElement && navMenu.contains(document.activeElement)) {
        toggle.focus({ preventScroll: true });
      }
    }

    function toggleMenu() {
      if (root.classList.contains("nav-open")) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    toggle.addEventListener("click", toggleMenu);
    overlay.addEventListener("click", closeMenu);

    // Закрытие по ESC + фокус-трап
    document.addEventListener("keydown", (e) => {
      if (!root.classList.contains("nav-open")) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key === "Tab") {
        // Простой focus trap внутри меню
        const focusables = getFocusable(navMenu);
        if (!focusables.length) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;

        if (e.shiftKey) {
          if (active === first || !navMenu.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last || !navMenu.contains(active)) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    });

    // Закрытие при клике по пункту меню (на мобильных)
    navMenu.addEventListener("click", (e) => {
      const link = e.target && e.target.closest("a[href]");
      if (!link) return;
      // Игнорируем "якорные" пустые ссылки
      const href = link.getAttribute("href") || "";
      if (href.startsWith("#")) return;
      closeMenu();
    });

    // Синхронизация aria-hidden начального состояния
    navMenu.setAttribute("aria-hidden", "true");
  }

  // IntersectionObserver для анимации появления .reveal
  function setupReveal() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    const reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      items.forEach(el => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      rootMargin: "0px 0px -10% 0px",
      threshold: 0.1
    });

    items.forEach(el => io.observe(el));
  }

  // Текущий год в футере (#year)
  function fillYear() {
    const y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());
  }

  // Инициализация
  function init() {
    highlightActiveNav();
    highlightActiveLanguage();
    setupBurgerMenu();
    setupReveal();
    fillYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
