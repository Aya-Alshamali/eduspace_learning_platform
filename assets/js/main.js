/**
 * ============================================================
 * FILE: assets/js/main.js
 * ============================================================
 *
 * 1. PURPOSE
 *    Shared helpers and the parts of the layout that every page has:
 *    sidebar (active item, tooltips, animated mobile drawer), the
 *    student chip in the top bar, the "Sample data" badge, the Messages
 *    panel, dialogs, toasts, reduced-motion handling and soft page
 *    transitions.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. Small helpers (escapeHtml, icon, formatDuration, ...)
 *    B. Motion preference (system setting OR the switch in Settings)
 *    C. Sidebar + mobile drawer
 *    D. Student chip, sample badge
 *    E. Dialogs, Messages panel, toast
 *    F. Soft page transitions
 *    G. initMain() - runs on every page
 *
 * 3. DEPENDENCIES
 *    config.js, course-data.js, analytics.js, progress.js.
 *
 * 4. HOW TO CUSTOMIZE IT
 *    Sidebar links are in the HTML (generated identically on every page).
 *    Transition length: PAGE_LEAVE_MS below.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    This file sends NO custom events. Navigation between pages creates
 *    page_view hits through GTM's Google tag (one per page load). The page
 *    transition only delays navigation by PAGE_LEAVE_MS and never creates
 *    an extra page view.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// No events here. Opening the sidebar, tooltips, the Messages panel and
// toasts are interface actions without analytics (documented in
// BUTTON_GUIDE.md). Add a trackAnalyticsEvent() call in openMessages()
// if you ever want to measure it.

var PAGE_LEAVE_MS = 160;

/* ============================================================
 * A. SMALL HELPERS (no analytics)
 * ============================================================ */

/** FUNCTION: escapeHtml(text) - makes text safe to insert as HTML. Analytics: none. */
function escapeHtml(text) {
  return String(text === undefined || text === null ? "" : text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** FUNCTION: icon(name, className) - SVG markup using the sprite in each page. Analytics: none. */
function icon(name, className) {
  return '<svg class="' + (className || "icon") + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
}

/** FUNCTION: getQueryParam(name) - value from the address (?name=value) or "". Analytics: none. */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name) || "";
}

/**
 * FUNCTION: formatDuration(seconds)
 * PURPOSE: 0 -> "0 min", 754 -> "13 min", 4500 -> "1 h 15 min".
 * EXPECTED ANALYTICS RESULT: none.
 */
function formatDuration(seconds) {
  var minutes = Math.round((seconds || 0) / 60);
  if (minutes < 60) {
    return minutes + " min";
  }
  var hours = Math.floor(minutes / 60);
  var rest = minutes % 60;
  return hours + " h" + (rest ? " " + rest + " min" : "");
}

/** FUNCTION: formatClock(seconds) - 75 -> "1:15". Analytics: none. */
function formatClock(seconds) {
  var m = Math.floor(seconds / 60);
  var s = String(seconds % 60).padStart(2, "0");
  return m + ":" + s;
}

/** FUNCTION: categoryLabel(id) - "it-software" -> "IT & Software". Analytics: none. */
function categoryLabel(id) {
  var match = window.COURSE_CATEGORIES.filter(function (c) { return c.id === id; })[0];
  return match ? match.label : id;
}

/** FUNCTION: difficultyLabel(level) - "beginner" -> "Beginner". Analytics: none. */
function difficultyLabel(level) {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

/** FUNCTION: formatNumber(n) - 18450 -> "18,450". Analytics: none. */
function formatNumber(n) {
  return Number(n).toLocaleString("en-US");
}

/** FUNCTION: formatDate(iso) - "Nov 7, 2026". Analytics: none. */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** FUNCTION: initialsOf(name) - "Lina Haddad" -> "LH"; empty -> "S" (Student). Analytics: none. */
function initialsOf(name) {
  var parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "S";
  }
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/** FUNCTION: getStudentName() - the display name, or "Student". Analytics: none (never sent). */
function getStudentName() {
  return getProgress().profile.displayName || "Student";
}

/* ============================================================
 * B. MOTION PREFERENCE
 * ============================================================ */

/**
 * FUNCTION: applyMotionPreference()
 * PURPOSE: Adds html.reduce-motion when the operating system asks for
 *   reduced motion OR the student chose "Reduce" in Settings. All
 *   animations in animations.css switch off under that class.
 * EXPECTED ANALYTICS RESULT: none. Animations never send events, so
 *   reduced motion cannot change any event count.
 */
function applyMotionPreference() {
  var system = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var choice = getProgress().settings.motion;
  document.documentElement.classList.toggle("reduce-motion", system || choice === "reduce");
}

/** FUNCTION: prefersReducedMotion() - true when motion should be reduced. Analytics: none. */
function prefersReducedMotion() {
  return document.documentElement.classList.contains("reduce-motion");
}

/* ============================================================
 * C. SIDEBAR + MOBILE DRAWER
 * ============================================================ */

/**
 * FUNCTION: markActiveSidebarItem()
 * PURPOSE: Highlights the sidebar item of the current page
 *   (body data-page, plus "my-courses" when catalog.html?mine=1 and
 *   "calendar" when dashboard.html#calendar).
 * EXPECTED ANALYTICS RESULT: none.
 */
function markActiveSidebarItem() {
  var page = document.body.getAttribute("data-page");
  if (page === "catalog" && getQueryParam("mine") === "1") {
    page = "my-courses";
  }
  if (page === "dashboard" && window.location.hash === "#calendar") {
    page = "calendar";
  }
  if (page === "course") {
    page = "catalog";      // a course page belongs to the catalog
  }
  if (page === "lesson" || page === "quiz") {
    page = "my-courses";   // studying happens inside My Courses
  }
  document.querySelectorAll("[data-nav]").forEach(function (link) {
    var active = link.getAttribute("data-nav") === page;
    link.classList.toggle("is-active", active);
    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

/**
 * FUNCTION: setSidebarOpen(open)
 * PURPOSE: Opens/closes the animated sidebar drawer on small screens.
 * USER ACTION: menu button in the top bar, the close button, the dark
 *   overlay, or Escape.
 * EXPECTED WEBSITE RESULT: the drawer slides in with labels next to
 *   the icons; focus moves into it; page scrolling is locked.
 * EXPECTED ANALYTICS RESULT: none.
 */
function setSidebarOpen(open) {
  var sidebar = document.getElementById("sidebar");
  var toggle = document.getElementById("menu-toggle");
  if (!sidebar || !toggle) {
    return;
  }
  document.body.classList.toggle("sidebar-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  if (open) {
    var first = sidebar.querySelector("a, button");
    if (first) {
      first.focus();
    }
  } else if (sidebar.contains(document.activeElement)) {
    toggle.focus();
  }
}

/** FUNCTION: initSidebar() - connects the drawer buttons. Analytics: none. */
function initSidebar() {
  markActiveSidebarItem();
  window.addEventListener("hashchange", markActiveSidebarItem);
  var toggle = document.getElementById("menu-toggle");
  var close = document.getElementById("sidebar-close");
  var overlay = document.getElementById("sidebar-overlay");
  if (toggle) {
    toggle.addEventListener("click", function () {
      setSidebarOpen(!document.body.classList.contains("sidebar-open"));
    });
  }
  [close, overlay].forEach(function (el) {
    if (el) {
      el.addEventListener("click", function () { setSidebarOpen(false); });
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && document.body.classList.contains("sidebar-open")) {
      setSidebarOpen(false);
    }
  });
  // Close the drawer after a link inside it is used (for #calendar on the same page).
  document.querySelectorAll("#sidebar a").forEach(function (link) {
    link.addEventListener("click", function () { setSidebarOpen(false); });
  });
}

/* ============================================================
 * D. STUDENT CHIP + SAMPLE BADGE
 * ============================================================ */

/**
 * FUNCTION: renderStudentChip()
 * PURPOSE: Fills every [data-student-name] / [data-student-avatar] with
 *   the locally saved display name and avatar colour, and shows every
 *   [data-sample-badge] when the record is sample data.
 * EXPECTED ANALYTICS RESULT: none. The name is never sent to analytics.
 */
function renderStudentChip() {
  var state = getProgress();
  document.querySelectorAll("[data-student-name]").forEach(function (el) {
    el.textContent = getStudentName();
  });
  document.querySelectorAll("[data-student-avatar]").forEach(function (el) {
    el.textContent = initialsOf(state.profile.displayName);
    el.style.background = state.profile.avatarColor;
  });
  document.querySelectorAll("[data-sample-badge]").forEach(function (el) {
    el.hidden = !state.isSampleData;
  });
}

/* ============================================================
 * E. DIALOGS, MESSAGES, TOAST
 * ============================================================ */

/**
 * FUNCTION: openDialog(dialog) / closeDialog(dialog)
 * PURPOSE: Opens a native <dialog> (focus is trapped and Escape closes
 *   it) and closes it with a short fade.
 * EXPECTED ANALYTICS RESULT: none.
 */
function openDialog(dialog) {
  if (!dialog || dialog.open) {
    return;
  }
  dialog.classList.remove("is-closing");
  dialog.showModal();
}

function closeDialog(dialog) {
  if (!dialog || !dialog.open) {
    return;
  }
  if (prefersReducedMotion()) {
    dialog.close();
    return;
  }
  dialog.classList.add("is-closing");
  window.setTimeout(function () {
    dialog.classList.remove("is-closing");
    dialog.close();
  }, 200);
}

/** FUNCTION: initDialogs() - close buttons, backdrop click, animated Escape. Analytics: none. */
function initDialogs() {
  document.querySelectorAll("dialog").forEach(function (dialog) {
    dialog.addEventListener("click", function (event) {
      if (event.target === dialog || event.target.closest("[data-close-dialog]")) {
        closeDialog(dialog);
      }
    });
    dialog.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDialog(dialog);
    });
  });
}

/**
 * FUNCTION: openMessages()
 * PURPOSE: Shows the Messages panel with the DEMONSTRATION messages from
 *   config.js. Nothing is sent or received.
 * USER ACTION: "Messages" icon in the sidebar.
 * EXPECTED ANALYTICS RESULT: none.
 */
function openMessages() {
  var list = document.getElementById("messages-list");
  if (list) {
    list.innerHTML = window.DEMO_MESSAGES.map(function (message) {
      return '<li class="message">' +
        '<span class="avatar avatar--sm" style="background:#DCD5FA">' + escapeHtml(initialsOf(message.from)) + '</span>' +
        '<div><p class="message__head"><strong>' + escapeHtml(message.from) + '</strong><span>' + escapeHtml(message.time) + '</span></p>' +
        '<p>' + escapeHtml(message.text) + '</p></div></li>';
    }).join("");
  }
  openDialog(document.getElementById("messages-dialog"));
}

/**
 * FUNCTION: showToast(message, type)
 * PURPOSE: Short notice at the bottom of the screen ("Lesson completed").
 *   type: "success" | "error" | "info". Announced to screen readers.
 * EXPECTED ANALYTICS RESULT: none.
 */
function showToast(message, type) {
  var toast = document.getElementById("toast");
  if (!toast) {
    return;
  }
  toast.textContent = message;
  toast.className = "toast is-visible toast--" + (type || "info");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(function () {
    toast.classList.remove("is-visible");
  }, 3200);
}

/* ============================================================
 * F. SOFT PAGE TRANSITIONS
 * ============================================================ */

/**
 * FUNCTION: initPageTransitions()
 * PURPOSE: Internal links fade the window out for PAGE_LEAVE_MS before
 *   the next page loads (which fades in via animations.css).
 *   Skipped for new-tab clicks, downloads, same-page #links and when
 *   motion is reduced.
 * EXPECTED ANALYTICS RESULT: none. Click handlers that send events
 *   (e.g. course_selected) run BEFORE this delay, so the push is always
 *   in the dataLayer before the page changes. Page views are unchanged:
 *   still one per page load.
 */
function initPageTransitions() {
  document.addEventListener("click", function (event) {
    var link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || prefersReducedMotion()) {
      return;
    }
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    var href = link.getAttribute("href");
    if (link.target === "_blank" || link.hasAttribute("download") || href.charAt(0) === "#" ||
        /^(mailto:|tel:|https?:)/.test(href)) {
      return;
    }
    var url = new URL(link.href, window.location.href);
    if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) {
      return; // same page, different section
    }
    event.preventDefault();
    document.documentElement.classList.add("is-leaving");
    window.setTimeout(function () {
      window.location.href = link.href;
    }, PAGE_LEAVE_MS);
  });
  // Coming back with the browser's Back button may restore a faded page.
  window.addEventListener("pageshow", function () {
    document.documentElement.classList.remove("is-leaving");
  });
}

/* ============================================================
 * G. START
 * ============================================================ */

/**
 * FUNCTION: initMain()
 * PURPOSE: Runs once per page before the page-specific scripts.
 * EXPECTED ANALYTICS RESULT: none.
 */
function initMain() {
  loadProgress();
  applyMotionPreference();
  initSidebar();
  initDialogs();
  initPageTransitions();
  renderStudentChip();
  var messagesButton = document.getElementById("messages-btn");
  if (messagesButton) {
    messagesButton.addEventListener("click", openMessages);
  }
  if (!progressStorageOk) {
    showToast("Your browser blocks storage: progress will not be saved.", "error");
  }
  document.documentElement.classList.add("is-ready");
}

document.addEventListener("DOMContentLoaded", initMain);
