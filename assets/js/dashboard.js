/**
 * ============================================================
 * FILE: assets/js/dashboard.js
 * ============================================================
 *
 * 1. PURPOSE
 *    The learning analytics shown to the STUDENT: the right-hand panel
 *    on the home page and the full Learning Analytics page
 *    (dashboard.html) with statistics, the weekly study chart, course
 *    progress, quiz history and the Learning Calendar.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. renderWeeklyChart()     seven-day bar chart (no library)
 *    B. getUpcomingActivities() next lessons, quizzes, planned sessions
 *    C. Home panel: renderSidePanel()
 *    D. Dashboard page: initDashboardPage(), renderStats(), ...
 *    E. Learning Calendar: renderCalendar(), handlePlanSubmit()
 *
 * 3. DEPENDENCIES
 *    config.js, course-data.js, analytics.js, progress.js, main.js,
 *    courses.js (findNextLesson).
 *
 * 4. HOW TO CUSTOMIZE IT
 *    CHART_MIN_SCALE_MINUTES = the smallest top value of the chart.
 *    Chart.js was NOT used: seven CSS bars are lighter and easier to read
 *    for beginners; swap in Chart.js here if you need axes and zooming.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    learning_dashboard_viewed (once per dashboard.html load). Charts,
 *    calendar navigation and planning sessions send NO events.
 *
 * DATA HONESTY
 *    Every number is calculated from the saved record (progress.js).
 *    Study minutes are MEASURED active time; days without activity show
 *    0. Sample data (Settings) is labelled with a "Sample data" badge.
 *    "Demo connections" are sample people from config.js.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// learning_dashboard_viewed - once per dashboard.html page load.
// Parameters: enrolled_courses, completed_lessons, completed_courses,
// course_progress_percent (overall), data_mode ("student" | "sample").
// No other events: re-drawing the chart when data changes, opening the
// calendar or planning a session must not change event counts.

var CHART_MIN_SCALE_MINUTES = 30;
var calendarMonth = null; // Date set to the 1st of the visible month

/* ============================================================
 * A. WEEKLY CHART
 * ============================================================ */

/**
 * FUNCTION: renderWeeklyChart(container)
 *
 * PURPOSE: Seven bars (last 7 days, today last). Height = measured active
 *   study minutes / the largest day (at least CHART_MIN_SCALE_MINUTES).
 *   Bars grow from zero (animations.css) and show a tooltip on hover or
 *   keyboard focus ("Tue, Nov 4: 25 min").
 * EXPECTED WEBSITE RESULT: zero-height bars with "0 min" when there is no
 *   activity, and an explanatory line - never invented values.
 * EXPECTED ANALYTICS RESULT: none. Re-drawing sends no events.
 * RETURNS: total minutes of the 7 days.
 */
function renderWeeklyChart(container) {
  var days = getWeeklyActivity();
  var max = Math.max(CHART_MIN_SCALE_MINUTES, Math.max.apply(null, days.map(function (d) { return d.minutes; })));
  var total = days.reduce(function (sum, d) { return sum + d.minutes; }, 0);
  container.classList.remove("is-drawn");
  container.innerHTML = '<div class="chart__bars" role="list" aria-label="Measured study minutes, last 7 days">' +
    days.map(function (day, i) {
      var label = new Date(day.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      // BUTTON: chart bar -> shows its tooltip on hover/focus. Analytics: none.
      return '<div class="chart__col" role="listitem">' +
        '<button type="button" class="chart__bar' + (day.isToday ? " is-today" : "") + (day.minutes === 0 ? " is-empty" : "") + '" style="--h:' + Math.round((day.minutes / max) * 100) + '%;--i:' + i + '" aria-label="' + label + ': ' + day.minutes + ' minutes">' +
        '<span class="chart__tip" aria-hidden="true">' + day.minutes + ' min</span></button>' +
        '<span class="chart__label">' + day.label.charAt(0) + '<span class="visually-hidden">' + day.label.slice(1) + '</span></span></div>';
    }).join("") + '</div>';
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () { container.classList.add("is-drawn"); });
  });
  return total;
}

/* ============================================================
 * B. UPCOMING ACTIVITIES
 * ============================================================ */

/**
 * FUNCTION: getUpcomingActivities(limit)
 * PURPOSE: Builds the "Upcoming" list from real state:
 *   1. planned study sessions from today on (Learning Calendar),
 *   2. the next unfinished lesson of each enrolled course,
 *   3. "Quiz ready" when all lessons of a course are done.
 * RETURNS: [ { kind, title, detail, url, sessionId? } ].
 * EXPECTED ANALYTICS RESULT: none.
 */
function getUpcomingActivities(limit) {
  var today = localDateKey();
  var items = [];
  getProgress().plannedSessions.filter(function (s) { return s.date >= today; })
    .sort(function (a, b) { return a.date < b.date ? -1 : 1; })
    .forEach(function (session) {
      var course = findCourse(session.courseId);
      if (course) {
        items.push({
          kind: "plan", sessionId: session.id, color: course.color,
          title: course.title,
          detail: new Date(session.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " - planned " + session.minutes + " min",
          url: "course.html?id=" + course.id
        });
      }
    });
  getEnrolledCourses().forEach(function (course) {
    if (isCourseCompleted(course.id)) {
      return;
    }
    var p = getCourseProgress(course);
    if (p.completed === p.total) {
      if (!isQuizPassed(course.quiz.id)) {
        items.push({ kind: "quiz", color: course.color, title: course.quiz.title, detail: course.title + " - quiz ready", url: "quiz.html?course=" + course.id });
      }
      return;
    }
    var next = findNextLesson(course);
    items.push({ kind: "lesson", color: course.color, title: next.lesson.title, detail: course.title + " - lesson " + next.number + " of " + p.total, url: "lesson.html?course=" + course.id + "&lesson=" + next.lesson.id });
  });
  return items.slice(0, limit || 99);
}

/**
 * FUNCTION: renderUpcoming(container, limit)
 * PURPOSE: Draws the upcoming list. Planned sessions get a remove button.
 * LINKS: each item -> its lesson / quiz / course page (page_view there).
 * BUTTON: "Remove" (planned session) -> removeStudySession(); no event.
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderUpcoming(container, limit) {
  var items = getUpcomingActivities(limit);
  if (!items.length) {
    container.innerHTML = getEnrolledCourses().length ?
      '<li class="muted small">All caught up. <a href="dashboard.html#calendar">Plan a study session</a> or <a href="catalog.html">find a new course</a>.</li>' :
      '<li class="muted small">Nothing planned yet. <a href="catalog.html">Enroll in a course</a> to see your next lessons here.</li>';
    return;
  }
  container.innerHTML = items.map(function (item) {
    var iconName = item.kind === "plan" ? "calendar" : item.kind === "quiz" ? "quiz" : "book";
    return '<li class="upcoming__item"><span class="upcoming__icon" style="background:var(--' + item.color + ')">' + icon(iconName) + '</span>' +
      '<a href="' + item.url + '"><strong>' + escapeHtml(item.title) + '</strong><small>' + escapeHtml(item.detail) + '</small></a>' +
      (item.kind === "plan" ? '<button type="button" class="icon-btn icon-btn--sm" data-remove-session="' + item.sessionId + '" aria-label="Remove planned session" data-tooltip="Remove">' + icon("x") + '</button>' : '') +
      '</li>';
  }).join("");
}

/** FUNCTION: renderMyCourses(container, listId) - enrolled courses with progress bars. Analytics: course_selected on click (courses.js). */
function renderMyCourses(container, listId) {
  var courses = getEnrolledCourses();
  if (!courses.length) {
    container.innerHTML = '<li class="muted small">You have not enrolled in a course yet. <a href="catalog.html">Browse the catalog</a>.</li>';
    return;
  }
  container.innerHTML = courses.map(function (course, i) {
    var p = getCourseProgress(course);
    var done = isCourseCompleted(course.id);
    return '<li class="mini-course"><span class="mini-course__thumb" style="background:var(--' + course.color + ')"><img src="' + course.thumbnail + '" alt="" width="48" height="32"></span>' +
      '<div class="mini-course__text"><a href="course.html?id=' + course.id + '" data-course-link="' + course.id + '" data-list-id="' + listId + '" data-position="' + (i + 1) + '">' + escapeHtml(course.title) + '</a>' +
      '<div class="progress"><span style="--value:' + p.percent + '%"></span></div>' +
      '<small>' + (done ? "Completed" : p.completed + " of " + p.total + " lessons - " + p.percent + "%") + '</small></div></li>';
  }).join("");
}

/* ============================================================
 * C. HOME PAGE PANEL
 * ============================================================ */

/**
 * FUNCTION: renderSidePanel()
 * PURPOSE: The right-hand panel of index.html: student, demo connections,
 *   weekly activity, study time, overall progress, My Courses, Upcoming.
 * EXPECTED ANALYTICS RESULT: none (the home page is not the "progress
 *   dashboard"; learning_dashboard_viewed belongs to dashboard.html).
 */
function renderSidePanel() {
  var panel = document.getElementById("side-panel");
  if (!panel) {
    return;
  }
  var stats = getLearningStats();
  document.getElementById("panel-connections").innerHTML = window.DEMO_CONNECTIONS.map(function (person) {
    return '<li><span class="avatar avatar--sm" style="background:' + person.color + '" data-tooltip="' + escapeHtml(person.name + ": " + person.status) + '" tabindex="0" aria-label="' + escapeHtml(person.name + ", " + person.status + " (demo)") + '">' + escapeHtml(person.name.charAt(0)) + '</span></li>';
  }).join("");
  var weekMinutes = renderWeeklyChart(document.getElementById("panel-chart"));
  document.getElementById("panel-week-total").textContent = formatDuration(weekMinutes * 60);
  document.getElementById("panel-chart-note").textContent = weekMinutes === 0 ?
    "No study time measured in the last 7 days yet. Open a lesson to start the timer." :
    "Measured active study time on lesson and quiz pages.";
  document.getElementById("panel-stat-lessons").textContent = stats.completedLessons;
  document.getElementById("panel-stat-streak").textContent = stats.streak + (stats.streak === 1 ? " day" : " days");
  document.getElementById("panel-stat-progress").textContent = stats.completionPercent + "%";
  renderMyCourses(document.getElementById("panel-courses"), "dashboard_panel");
  renderUpcoming(document.getElementById("panel-upcoming"), 3);
}

/* ============================================================
 * D. DASHBOARD PAGE
 * ============================================================ */

/**
 * FUNCTION: renderStats()
 * PURPOSE: The eight statistic tiles (enrolled courses, completed lessons,
 *   completed courses, total study time, quiz average, learning streak,
 *   overall completion, this week) - each with how it is calculated.
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderStats() {
  var s = getLearningStats();
  var week = getWeeklyActivity().reduce(function (sum, d) { return sum + d.seconds; }, 0);
  var tiles = [
    { label: "Enrolled courses", value: s.enrolled, note: "Courses you joined", color: "lavender", icon: "book" },
    { label: "Completed lessons", value: s.completedLessons, note: "Marked as complete", color: "mint", icon: "check" },
    { label: "Completed courses", value: s.completedCourses, note: "All lessons + quiz passed", color: "peach", icon: "award" },
    { label: "Total study time", value: formatDuration(s.totalSeconds), note: "Measured active time", color: "pink", icon: "clock" },
    { label: "Quiz average", value: s.quizAverage === null ? "-" : s.quizAverage + "%", note: s.quizAttempts ? "Across " + s.quizAttempts + (s.quizAttempts === 1 ? " attempt" : " attempts") : "No attempts yet", color: "lavender", icon: "quiz" },
    { label: "Learning streak", value: s.streak + (s.streak === 1 ? " day" : " days"), note: "Consecutive active days", color: "peach", icon: "flame" },
    { label: "Course completion", value: s.completionPercent + "%", note: "Lessons done in enrolled courses", color: "mint", icon: "chart" },
    { label: "This week", value: formatDuration(week), note: "Last 7 days, measured", color: "pink", icon: "calendar" }
  ];
  document.getElementById("stats").innerHTML = tiles.map(function (t, i) {
    return '<li class="stat stat--' + t.color + '" style="--i:' + i + '"><span class="stat__icon">' + icon(t.icon) + '</span>' +
      '<span class="stat__label">' + t.label + '</span><strong class="stat__value">' + t.value + '</strong><small>' + t.note + '</small></li>';
  }).join("");
  return s;
}

/**
 * FUNCTION: renderQuizHistoryAll()
 * PURPOSE: Every saved quiz attempt across courses, newest first.
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderQuizHistoryAll() {
  var rows = [];
  window.COURSES.forEach(function (course) {
    getQuizAttempts(course.quiz.id).forEach(function (a) {
      rows.push({ course: course, attempt: a });
    });
  });
  rows.sort(function (x, y) { return x.attempt.submittedAt < y.attempt.submittedAt ? 1 : -1; });
  var box = document.getElementById("quiz-history-all");
  if (!rows.length) {
    box.innerHTML = '<p class="muted small">No quiz attempts yet. Each course ends with a five-question quiz.</p>';
    return;
  }
  box.innerHTML = '<table class="table"><caption class="visually-hidden">All quiz attempts</caption><thead><tr><th scope="col">Quiz</th><th scope="col">Attempt</th><th scope="col">Score</th><th scope="col">Result</th></tr></thead><tbody>' +
    rows.map(function (r) {
      return '<tr><td><a href="quiz.html?course=' + r.course.id + '">' + escapeHtml(r.course.quiz.title) + '</a><small class="muted block">' + formatDate(r.attempt.submittedAt) + '</small></td>' +
        '<td>#' + r.attempt.attempt + '</td><td>' + r.attempt.score + '%</td><td><span class="pill ' + (r.attempt.passed ? "pill--pass" : "pill--fail") + '">' + (r.attempt.passed ? "Passed" : "Not passed") + '</span></td></tr>';
    }).join("") + '</tbody></table>';
}

/**
 * FUNCTION: renderDashboard()
 * PURPOSE: Draws every section of dashboard.html from the saved record.
 *   Called on load and again when another tab changes the record.
 * EXPECTED ANALYTICS RESULT: none (see initDashboardPage).
 */
function renderDashboard() {
  var stats = renderStats();
  var weekMinutes = renderWeeklyChart(document.getElementById("dashboard-chart"));
  document.getElementById("dashboard-chart-note").textContent = weekMinutes === 0 ?
    "No study time measured in the last 7 days. The timer runs on lesson and quiz pages while you are active." :
    weekMinutes + (weekMinutes === 1 ? " minute" : " minutes") + " of measured active study time in the last 7 days.";
  renderMyCourses(document.getElementById("dashboard-courses"), "dashboard_my_courses");
  renderQuizHistoryAll();
  renderUpcoming(document.getElementById("dashboard-upcoming"), 6);
  renderCalendar();
  renderPlanForm();
  return stats;
}

/**
 * FUNCTION: initDashboardPage()
 *
 * PURPOSE: Opens the Learning Analytics page.
 * USER ACTION: "Learning Analytics" (or "Learning Calendar") in the sidebar.
 * EXPECTED WEBSITE RESULT: statistics, chart (bars grow), course
 *   progress, quiz history and calendar - all from saved data.
 * EXPECTED ANALYTICS EVENT: learning_dashboard_viewed
 * PARAMETERS: enrolled_courses, completed_lessons, completed_courses,
 *   course_progress_percent (overall completion), data_mode.
 * EXPECTED GA4 EFFECT: +1 per dashboard page load (+ its page_view).
 *   Re-drawing after a change in another tab does NOT resend it.
 * VERIFICATION: open dashboard.html -> one learning_dashboard_viewed.
 * DUPLICATE PREVENTION: trackEventOncePerPage("learning_dashboard_viewed").
 */
function initDashboardPage() {
  if (!document.getElementById("stats")) {
    return;
  }
  calendarMonth = new Date();
  calendarMonth.setDate(1);
  var stats = renderDashboard();
  connectCalendarButtons();
  trackEventOncePerPage("learning_dashboard_viewed", "learning_dashboard_viewed", {
    enrolled_courses: stats.enrolled,
    completed_lessons: stats.completedLessons,
    completed_courses: stats.completedCourses,
    course_progress_percent: stats.completionPercent,
    data_mode: getProgress().isSampleData ? "sample" : "student"
  });
}

/* ============================================================
 * E. LEARNING CALENDAR
 * ============================================================ */

/**
 * FUNCTION: getDayActivity()
 * PURPOSE: Map "YYYY-MM-DD" -> { minutes, lessons, plans } for the calendar.
 * EXPECTED ANALYTICS RESULT: none.
 */
function getDayActivity() {
  var state = getProgress();
  var map = {};
  function day(key) {
    map[key] = map[key] || { minutes: 0, lessons: 0, plans: [] };
    return map[key];
  }
  Object.keys(state.studyLog).forEach(function (key) {
    day(key).minutes = Math.round(state.studyLog[key] / 60);
  });
  Object.keys(state.completedLessons).forEach(function (key) {
    day(localDateKey(new Date(state.completedLessons[key]))).lessons++;
  });
  state.plannedSessions.forEach(function (session) {
    day(session.date).plans.push(session);
  });
  return map;
}

/**
 * FUNCTION: renderCalendar()
 * PURPOSE: Month grid. Dots: mint = measured study time, lavender =
 *   lessons completed, peach = planned session. Clicking a day shows its
 *   details and puts the date into the planning form.
 * BUTTONS: previous / next month, each day. Analytics: none.
 */
function renderCalendar() {
  var grid = document.getElementById("calendar-grid");
  if (!grid) {
    return;
  }
  var activity = getDayActivity();
  var year = calendarMonth.getFullYear();
  var month = calendarMonth.getMonth();
  document.getElementById("calendar-month").textContent = calendarMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  var firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  var daysInMonth = new Date(year, month + 1, 0).getDate();
  var today = localDateKey();
  var html = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(function (d) {
    return '<span class="calendar__weekday" aria-hidden="true">' + d.charAt(0) + '</span>';
  }).join("");
  for (var blank = 0; blank < firstWeekday; blank++) {
    html += '<span class="calendar__blank"></span>';
  }
  for (var d = 1; d <= daysInMonth; d++) {
    var key = localDateKey(new Date(year, month, d));
    var a = activity[key] || { minutes: 0, lessons: 0, plans: [] };
    var labels = [];
    if (a.minutes) { labels.push(a.minutes + " min studied"); }
    if (a.lessons) { labels.push(a.lessons + " lesson" + (a.lessons > 1 ? "s" : "") + " completed"); }
    if (a.plans.length) { labels.push(a.plans.length + " planned"); }
    html += '<button type="button" class="calendar__day' + (key === today ? " is-today" : "") + '" data-day="' + key + '" aria-label="' +
      new Date(year, month, d).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) + (labels.length ? ": " + labels.join(", ") : "") + '">' +
      '<span>' + d + '</span><span class="calendar__dots">' +
      (a.minutes ? '<i class="dot-study"></i>' : '') + (a.lessons ? '<i class="dot-lesson"></i>' : '') + (a.plans.length ? '<i class="dot-plan"></i>' : '') +
      '</span></button>';
  }
  grid.innerHTML = html;
}

/** FUNCTION: showDayDetails(key) - details of one calendar day + preset the form date. Analytics: none. */
function showDayDetails(key) {
  var a = getDayActivity()[key] || { minutes: 0, lessons: 0, plans: [] };
  var title = new Date(key + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  var lines = [];
  if (a.minutes) { lines.push(a.minutes + " min of measured study time"); }
  if (a.lessons) { lines.push(a.lessons + " lesson" + (a.lessons > 1 ? "s" : "") + " completed"); }
  a.plans.forEach(function (p) {
    var course = findCourse(p.courseId);
    lines.push("Planned: " + (course ? course.title : p.courseId) + " (" + p.minutes + " min)");
  });
  document.getElementById("calendar-detail").innerHTML = '<strong>' + title + '</strong>' +
    (lines.length ? '<ul>' + lines.map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join("") + '</ul>' : '<p class="muted small">No activity recorded or planned.</p>');
  document.querySelectorAll(".calendar__day").forEach(function (btn) {
    btn.classList.toggle("is-selected", btn.getAttribute("data-day") === key);
  });
  var dateInput = document.getElementById("plan-date");
  if (dateInput && key >= dateInput.min) {
    dateInput.value = key;
  }
}

/**
 * FUNCTION: renderPlanForm()
 * PURPOSE: Fills the course list of the planning form (enrolled courses
 *   only) and sets the earliest date to today.
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderPlanForm() {
  var select = document.getElementById("plan-course");
  if (!select) {
    return;
  }
  var courses = getEnrolledCourses();
  select.innerHTML = courses.length ? courses.map(function (c) {
    return '<option value="' + c.id + '">' + escapeHtml(c.title) + '</option>';
  }).join("") : '<option value="">Enroll in a course first</option>';
  document.getElementById("plan-submit").disabled = !courses.length;
  var date = document.getElementById("plan-date");
  date.min = localDateKey();
  if (!date.value) {
    date.value = localDateKey();
  }
}

/**
 * FUNCTION: handlePlanSubmit(event)
 *
 * PURPOSE: Adds a planned study session to the calendar.
 * USER ACTION: "Add to calendar" in the planning form.
 * EXPECTED WEBSITE RESULT: a peach dot on the day, the session in the
 *   Upcoming list, a toast. Past dates are refused with a message.
 * EXPECTED ANALYTICS EVENT: none (not one of the required events).
 *   To measure it, add trackAnalyticsEvent("study_session_planned",
 *   { course_id, planned_minutes, days_ahead }) after a successful save.
 * FAILURE: storage blocked -> error toast, nothing added.
 */
function handlePlanSubmit(event) {
  event.preventDefault();
  var date = document.getElementById("plan-date").value;
  var courseId = document.getElementById("plan-course").value;
  var minutes = Number(document.getElementById("plan-minutes").value);
  var error = document.getElementById("plan-error");
  if (!date || date < localDateKey()) {
    error.hidden = false;
    error.textContent = "Choose today or a future date.";
    return;
  }
  if (!findCourse(courseId)) {
    error.hidden = false;
    error.textContent = "Choose one of your courses.";
    return;
  }
  error.hidden = true;
  if (!planStudySession(date, courseId, minutes)) {
    showToast("The session could not be saved (browser storage blocked).", "error");
    return;
  }
  renderCalendar();
  renderUpcoming(document.getElementById("dashboard-upcoming"), 6);
  showDayDetails(date);
  showToast("Study session added to your calendar.", "success");
}

/** FUNCTION: connectCalendarButtons() - month arrows, days, form, remove buttons. Analytics: none. */
function connectCalendarButtons() {
  document.getElementById("calendar-prev").addEventListener("click", function () {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById("calendar-next").addEventListener("click", function () {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderCalendar();
  });
  document.getElementById("calendar-grid").addEventListener("click", function (event) {
    var day = event.target.closest("[data-day]");
    if (day) {
      showDayDetails(day.getAttribute("data-day"));
    }
  });
  document.getElementById("plan-form").addEventListener("submit", handlePlanSubmit);
}

/** Remove buttons in any Upcoming list (home panel and dashboard). Analytics: none. */
document.addEventListener("click", function (event) {
  var button = event.target.closest("[data-remove-session]");
  if (!button) {
    return;
  }
  removeStudySession(button.getAttribute("data-remove-session"));
  if (document.getElementById("stats")) {
    renderDashboard();
  } else {
    renderSidePanel();
  }
});

/**
 * When ANOTHER tab saves progress (e.g. a lesson completed there), redraw
 * the numbers and the chart here. The storage listener in progress.js
 * runs first and reloads the record. Analytics: none - redrawing never
 * resends learning_dashboard_viewed.
 */
window.addEventListener("storage", function (event) {
  if (event.key !== window.SITE_CONFIG.storageKey) {
    return;
  }
  if (document.getElementById("stats")) {
    renderDashboard();
  }
  renderSidePanel();
  renderStudentChip();
});

document.addEventListener("DOMContentLoaded", function () {
  renderSidePanel();
  initDashboardPage();
});
