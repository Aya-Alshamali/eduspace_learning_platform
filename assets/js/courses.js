/**
 * ============================================================
 * FILE: assets/js/courses.js
 * ============================================================
 *
 * 1. PURPOSE
 *    Everything about FINDING and JOINING courses: course cards, the
 *    category chips and popular grid on the home page, the full catalog
 *    (search, filters, sorting, result count) and the course details
 *    page with the Enroll / Start Learning buttons.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. renderCourseCard()          one card (used everywhere)
 *    B. Home: initHomeCourses(), handleCategorySelection()
 *    C. Catalog: initCatalog(), applyCatalogFilters(), handleSearchSubmit()
 *    D. Card clicks: handleCourseCardClick() -> course_selected
 *    E. Course page: initCoursePage(), handleEnroll()
 *
 * 3. DEPENDENCIES
 *    config.js, course-data.js, analytics.js, progress.js, main.js.
 *
 * 4. HOW TO CUSTOMIZE IT
 *    HOME_COURSE_COUNT = cards shown on the home page.
 *    DURATION_FILTERS = the duration buckets of the catalog.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    course_list_viewed, course_category_selected, search,
 *    course_selected and course_enrolled are sent from this file. See
 *    the EXPECTED ANALYTICS RESULT block of each function.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Events from this file:
//   course_list_viewed       once per page load per list (home_popular / catalog)
//   course_category_selected each time the category CHANGES (home or catalog)
//   search                   each submitted catalog search (not every keystroke)
//   course_selected          click on a card's "View Course" (or its image/title)
//   course_enrolled          first successful enrolment in a course
// Shared parameters: course_id, course_category, list_id.

var HOME_COURSE_COUNT = 6;
var DURATION_FILTERS = {
  any: { label: "Any length", min: 0, max: Infinity },
  short: { label: "Under 50 min", min: 0, max: 49 },
  medium: { label: "50 - 60 min", min: 50, max: 60 },
  long: { label: "Over 60 min", min: 61, max: Infinity }
};

/* ============================================================
 * A. COURSE CARD
 * ============================================================ */

/**
 * FUNCTION: renderCourseCard(course, options)
 *
 * PURPOSE: HTML for one course card: thumbnail, category, title,
 *   instructor, SAMPLE rating, DEMO student count, duration, difficulty,
 *   the student's progress (if enrolled) and a "View Course" button.
 * INPUTS: options { listId ("home_popular" | "catalog" | ...), position (1-based), index (for the stagger animation) }.
 * BUTTON: "View Course" (and the image / title link) -> course.html?id=...
 *   handled by handleCourseCardClick() -> event course_selected.
 * EXPECTED ANALYTICS RESULT: none while rendering. Re-rendering after a
 *   filter never sends events.
 */
function renderCourseCard(course, options) {
  options = options || {};
  var url = "course.html?id=" + encodeURIComponent(course.id);
  var data = ' data-course-link="' + course.id + '" data-list-id="' + (options.listId || "") + '" data-position="' + (options.position || 0) + '"';
  var progressHtml = "";
  if (isEnrolled(course.id)) {
    var p = getCourseProgress(course);
    progressHtml = '<div class="card-progress" aria-label="Your progress ' + p.percent + '%">' +
      '<div class="progress"><span style="--value:' + p.percent + '%"></span></div>' +
      '<span>' + (isCourseCompleted(course.id) ? "Completed" : p.percent + "%") + '</span></div>';
  }
  return '<article class="course-card course-card--' + course.color + '" style="--i:' + (options.index || 0) + '">' +
    '<a class="course-card__media" href="' + url + '"' + data + ' tabindex="-1" aria-hidden="true">' +
      '<img src="' + course.thumbnail + '" alt="" width="240" height="160" loading="lazy"></a>' +
    '<div class="course-card__body">' +
      '<p class="course-card__meta"><span class="tag">' + escapeHtml(categoryLabel(course.category)) + '</span>' +
      '<span class="tag tag--ghost">' + difficultyLabel(course.difficulty) + '</span></p>' +
      '<h3 class="course-card__title"><a href="' + url + '"' + data + '>' + escapeHtml(course.title) + '</a></h3>' +
      '<p class="course-card__instructor">' + escapeHtml(course.instructor.name) + '</p>' +
      '<ul class="course-card__facts">' +
        '<li title="Sample rating, not verified reviews">' + icon("star") + course.rating.toFixed(1) + ' <small>sample</small></li>' +
        '<li title="Demonstration number, not real students">' + icon("users") + formatNumber(course.studentsDemo) + ' <small>demo</small></li>' +
        '<li>' + icon("clock") + getCourseMinutes(course) + ' min</li>' +
      '</ul>' +
      progressHtml +
      '<a class="btn btn--dark btn--sm course-card__cta" href="' + url + '"' + data + '>View Course ' + icon("arrow") + '</a>' +
    '</div></article>';
}

/**
 * FUNCTION: sortByPopularity(list) - most demo students first. Analytics: none.
 */
function sortByPopularity(list) {
  return list.slice().sort(function (a, b) { return b.studentsDemo - a.studentsDemo; });
}

/* ============================================================
 * B. HOME PAGE: CATEGORY CHIPS + POPULAR COURSES
 * ============================================================ */

var homeCategory = "all";

/**
 * FUNCTION: renderCategoryChips(container, activeId)
 * PURPOSE: The horizontal filter chips (All, IT & Software, ...).
 * BUTTON: each chip -> handleCategorySelection() -> course_category_selected.
 * EXPECTED ANALYTICS RESULT: none while rendering.
 */
function renderCategoryChips(container, activeId) {
  container.innerHTML = window.COURSE_CATEGORIES.map(function (category) {
    var active = category.id === activeId;
    return '<button type="button" class="chip' + (active ? " is-active" : "") + '" data-category="' + category.id + '" aria-pressed="' + active + '">' +
      escapeHtml(category.label) + '</button>';
  }).join("");
}

/**
 * FUNCTION: renderHomeCourses(animate)
 * PURPOSE: The "most popular courses" grid on the home page for the
 *   chosen category (up to HOME_COURSE_COUNT cards, most popular first).
 * EXPECTED ANALYTICS RESULT: none (see initHomeCourses for the list event).
 */
function renderHomeCourses(animate) {
  var grid = document.getElementById("popular-grid");
  var list = sortByPopularity(window.COURSES.filter(function (course) {
    return homeCategory === "all" || course.category === homeCategory;
  })).slice(0, HOME_COURSE_COUNT);
  grid.classList.toggle("is-filtering", Boolean(animate));
  grid.innerHTML = list.map(function (course, i) {
    return renderCourseCard(course, { listId: "home_popular", position: i + 1, index: i });
  }).join("");
  var count = document.getElementById("popular-count");
  if (count) {
    count.textContent = list.length + (list.length === 1 ? " course" : " courses");
  }
  return list;
}

/**
 * FUNCTION: handleCategorySelection(categoryId, location)
 *
 * PURPOSE: Applies a category chip (home page or catalog).
 * USER ACTION: Student clicks a category chip.
 * EXPECTED WEBSITE RESULT: the chip becomes active (animated), the course
 *   grid re-renders with a soft transition and the count updates.
 * EXPECTED ANALYTICS EVENT: course_category_selected
 * PARAMETERS:
 *   - course_category  (e.g. "data-science"; "all" for All)
 *   - list_id          ("home_popular" | "catalog")
 *   - results_count    (courses shown after the change)
 * EXPECTED GA4 EFFECT:
 *   - +1 event per CHANGE of category. Clicking the chip that is already
 *     active does nothing and sends nothing.
 *   - Page views unchanged (no reload, no pushState).
 *   - course_list_viewed is NOT sent again (once per page load).
 * VERIFICATION: GTM Preview -> click "Data Science" -> one
 *   course_category_selected with course_category = data-science.
 * FAILURE: unknown category id -> ignored.
 * DUPLICATE PREVENTION: compare with the current category first.
 */
function handleCategorySelection(categoryId, location) {
  var current = location === "home_popular" ? homeCategory : catalogFilters.category;
  if (categoryId === current) {
    return;
  }
  var known = window.COURSE_CATEGORIES.some(function (c) { return c.id === categoryId; });
  if (!known) {
    return;
  }
  var resultsCount;
  if (location === "home_popular") {
    homeCategory = categoryId;
    renderCategoryChips(document.getElementById("home-chips"), homeCategory);
    resultsCount = renderHomeCourses(true).length;
  } else {
    catalogFilters.category = categoryId;
    renderCategoryChips(document.getElementById("catalog-chips"), categoryId);
    resultsCount = applyCatalogFilters(true).length;
  }
  trackAnalyticsEvent("course_category_selected", {
    course_category: categoryId,
    list_id: location,
    results_count: resultsCount
  });
}

/**
 * FUNCTION: initHomeCourses()
 *
 * PURPOSE: Builds the chips and the popular grid on index.html.
 * EXPECTED ANALYTICS EVENT: course_list_viewed (once per page load)
 * PARAMETERS: list_id "home_popular", courses_count (cards shown),
 *   course_category "all".
 * EXPECTED GA4 EFFECT: +1 event per home page load; filtering afterwards
 *   does not resend it. Page view: the home page's own page_view.
 * VERIFICATION: reload index.html -> exactly one course_list_viewed.
 * DUPLICATE PREVENTION: trackEventOncePerPage("list:home_popular").
 */
function initHomeCourses() {
  var chips = document.getElementById("home-chips");
  if (!chips) {
    return;
  }
  renderCategoryChips(chips, homeCategory);
  var shown = renderHomeCourses(false);
  chips.addEventListener("click", function (event) {
    var chip = event.target.closest("[data-category]");
    if (chip) {
      handleCategorySelection(chip.getAttribute("data-category"), "home_popular");
    }
  });
  trackEventOncePerPage("list:home_popular", "course_list_viewed", {
    list_id: "home_popular",
    courses_count: shown.length,
    course_category: "all"
  });
}

/* ============================================================
 * C. CATALOG
 * ============================================================ */

var catalogFilters = {
  category: "all", difficulty: "any", duration: "any", rating: "0",
  sort: "popular", query: "", mine: false
};

/**
 * FUNCTION: getFilteredCourses()
 * PURPOSE: Applies every catalog filter and the sort order to COURSES.
 *   Search matches the title, summary, category name and instructor
 *   (case-insensitive; every word must match).
 * RETURNS: the matching courses.
 * EXPECTED ANALYTICS RESULT: none (pure calculation).
 */
function getFilteredCourses() {
  var f = catalogFilters;
  var words = f.query.toLowerCase().split(/\s+/).filter(Boolean);
  var range = DURATION_FILTERS[f.duration] || DURATION_FILTERS.any;
  var list = window.COURSES.filter(function (course) {
    var minutes = getCourseMinutes(course);
    var text = (course.title + " " + course.summary + " " + categoryLabel(course.category) + " " + course.instructor.name).toLowerCase();
    return (f.category === "all" || course.category === f.category) &&
      (f.difficulty === "any" || course.difficulty === f.difficulty) &&
      minutes >= range.min && minutes <= range.max &&
      course.rating >= Number(f.rating) &&
      (!f.mine || isEnrolled(course.id)) &&
      words.every(function (word) { return text.indexOf(word) !== -1; });
  });
  var sorters = {
    popular: function (a, b) { return b.studentsDemo - a.studentsDemo; },
    rating: function (a, b) { return b.rating - a.rating || b.ratingCount - a.ratingCount; },
    newest: function (a, b) { return a.published < b.published ? 1 : -1; },
    shortest: function (a, b) { return getCourseMinutes(a) - getCourseMinutes(b); },
    alpha: function (a, b) { return a.title.localeCompare(b.title); }
  };
  return list.sort(sorters[f.sort] || sorters.popular);
}

/**
 * FUNCTION: applyCatalogFilters(animate)
 * PURPOSE: Re-renders the catalog grid and the "N of 12 courses" count,
 *   or an empty-state message with a "Clear filters" button.
 * EXPECTED ANALYTICS RESULT: none. Changing difficulty, duration, rating
 *   or sort sends NO event (only the category chip and search do).
 */
function applyCatalogFilters(animate) {
  var list = getFilteredCourses();
  var grid = document.getElementById("catalog-grid");
  grid.classList.toggle("is-filtering", Boolean(animate));
  if (list.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p><strong>No courses match these filters.</strong></p>' +
      (catalogFilters.mine ? '<p>You have not enrolled in a matching course yet.</p>' : '') +
      // BUTTON: Clear filters -> resetCatalogFilters(); no analytics event.
      '<button type="button" class="btn btn--light btn--sm" data-clear-filters>Clear filters</button></div>';
  } else {
    grid.innerHTML = list.map(function (course, i) {
      return renderCourseCard(course, { listId: "catalog", position: i + 1, index: i });
    }).join("");
  }
  var total = catalogFilters.mine ? getEnrolledCourses().length : window.COURSES.length;
  document.getElementById("catalog-count").textContent =
    "Showing " + list.length + " of " + total + (catalogFilters.mine ? " enrolled" : "") + (total === 1 ? " course" : " courses");
  return list;
}

/** FUNCTION: resetCatalogFilters() - back to defaults (keeps "My courses" view). Analytics: none. */
function resetCatalogFilters() {
  var mine = catalogFilters.mine;
  catalogFilters = { category: "all", difficulty: "any", duration: "any", rating: "0", sort: "popular", query: "", mine: mine };
  var form = document.getElementById("catalog-filters");
  form.reset();
  document.getElementById("catalog-search-input").value = "";
  renderCategoryChips(document.getElementById("catalog-chips"), "all");
  applyCatalogFilters(true);
}

/**
 * FUNCTION: handleSearchSubmit(event)
 *
 * PURPOSE: Runs a catalog search.
 * USER ACTION: Student types in the search box and presses Enter or the
 *   search button.
 * EXPECTED WEBSITE RESULT: the grid shows matching courses and the count
 *   updates ("Showing 2 of 12 courses" for "Python").
 * EXPECTED ANALYTICS EVENT: search
 * PARAMETERS:
 *   - search_term   (cleaned by sanitizeSearchTerm(): lower case, max 50
 *                    characters, "[redacted]" if it looks like an email
 *                    or phone number)
 *   - results_count (matching courses)
 *   - list_id       "catalog"
 * EXPECTED GA4 EFFECT: +1 search per SUBMITTED search (typing alone sends
 *   nothing). Submitting the same term twice = two searches, by design.
 *   An empty box clears the search and sends nothing.
 *   Page views unchanged (the form does not reload the page).
 * VERIFICATION: GTM Preview -> search "Python" -> one search event with
 *   search_term "python" and results_count 2.
 * FAILURE: none expected; zero results still count as a search.
 */
function handleSearchSubmit(event) {
  event.preventDefault();
  var raw = document.getElementById("catalog-search-input").value;
  catalogFilters.query = raw.trim();
  var results = applyCatalogFilters(true);
  if (!catalogFilters.query) {
    return;
  }
  trackAnalyticsEvent("search", {
    search_term: sanitizeSearchTerm(catalogFilters.query),
    results_count: results.length,
    list_id: "catalog"
  });
}

/**
 * FUNCTION: initCatalog()
 *
 * PURPOSE: Builds catalog.html: chips, filters, search, sort and grid.
 *   "My Courses" in the sidebar opens catalog.html?mine=1 (only enrolled
 *   courses). ?category=<id> preselects a category.
 * EXPECTED ANALYTICS EVENT: course_list_viewed (once per page load)
 * PARAMETERS: list_id "catalog" or "my_courses", courses_count,
 *   course_category (preselected or "all").
 * EXPECTED GA4 EFFECT: +1 per catalog page load. Filters/search after
 *   that do not resend it.
 * DUPLICATE PREVENTION: trackEventOncePerPage("list:catalog").
 */
function initCatalog() {
  var grid = document.getElementById("catalog-grid");
  if (!grid) {
    return;
  }
  catalogFilters.mine = getQueryParam("mine") === "1";
  var preselected = getQueryParam("category");
  if (window.COURSE_CATEGORIES.some(function (c) { return c.id === preselected; })) {
    catalogFilters.category = preselected;
  }
  if (catalogFilters.mine) {
    document.getElementById("catalog-title").textContent = "My Courses";
    document.getElementById("catalog-intro").textContent = "Courses you have enrolled in, with your saved progress.";
  }
  renderCategoryChips(document.getElementById("catalog-chips"), catalogFilters.category);
  var shown = applyCatalogFilters(false);

  document.getElementById("catalog-chips").addEventListener("click", function (event) {
    var chip = event.target.closest("[data-category]");
    if (chip) {
      handleCategorySelection(chip.getAttribute("data-category"), "catalog");
    }
  });
  document.getElementById("catalog-search").addEventListener("submit", handleSearchSubmit);
  document.getElementById("catalog-filters").addEventListener("change", function (event) {
    var name = event.target.name;
    if (name in catalogFilters) {
      catalogFilters[name] = event.target.value;
      applyCatalogFilters(true);
    }
  });
  grid.addEventListener("click", function (event) {
    if (event.target.closest("[data-clear-filters]")) {
      resetCatalogFilters();
    }
  });
  trackEventOncePerPage("list:catalog", "course_list_viewed", {
    list_id: catalogFilters.mine ? "my_courses" : "catalog",
    courses_count: shown.length,
    course_category: catalogFilters.category
  });
}

/* ============================================================
 * D. CARD CLICKS
 * ============================================================ */

/**
 * FUNCTION: handleCourseCardClick(event)
 *
 * PURPOSE: Reports which course a student opened from a list.
 * USER ACTION: "View Course", the card image or the card title.
 * EXPECTED WEBSITE RESULT: course.html?id=<course> opens (soft fade).
 * EXPECTED ANALYTICS EVENT: course_selected
 * PARAMETERS:
 *   - course_id, course_category
 *   - list_id   ("home_popular" | "catalog" | "dashboard_my_courses" | "dashboard_panel")
 *   - list_position (1-based position in the list)
 * EXPECTED GA4 EFFECT: +1 course_selected, then +1 page_view for
 *   course.html when the next page loads.
 * VERIFICATION: GTM Preview -> click a card -> course_selected, then the
 *   new page's Container Loaded / page_view.
 * FAILURE: none; navigation happens even if analytics is blocked.
 * DUPLICATE PREVENTION: one delegated listener for the whole document;
 *   image, title and button are separate links but one click = one event.
 */
function handleCourseCardClick(event) {
  var link = event.target.closest("[data-course-link]");
  if (!link) {
    return;
  }
  var course = findCourse(link.getAttribute("data-course-link"));
  if (!course) {
    return;
  }
  trackAnalyticsEvent("course_selected", {
    course_id: course.id,
    course_category: course.category,
    list_id: link.getAttribute("data-list-id") || "unknown",
    list_position: Number(link.getAttribute("data-position")) || 0
  });
}

/* ============================================================
 * E. COURSE DETAILS PAGE
 * ============================================================ */

/**
 * FUNCTION: findNextLesson(course)
 * PURPOSE: The first lesson not yet completed (or the first lesson when
 *   all are done) - used by "Start / Continue Learning".
 * EXPECTED ANALYTICS RESULT: none.
 */
function findNextLesson(course) {
  var lessons = getCourseLessons(course);
  for (var i = 0; i < lessons.length; i++) {
    if (!isLessonComplete(course.id, lessons[i].lesson.id)) {
      return lessons[i];
    }
  }
  return lessons[0];
}

/**
 * FUNCTION: handleEnroll(course, location)
 *
 * PURPOSE: Enrols the student in a course.
 * USER ACTION: "Enroll for free" on course.html, or "Enroll and start"
 *   on a lesson/quiz page opened without enrolment.
 * EXPECTED WEBSITE RESULT: enrolment saved; the button area changes to
 *   "Start Learning"; the course appears in My Courses and on the
 *   dashboard; a toast confirms it.
 * EXPECTED ANALYTICS EVENT: course_enrolled
 * PARAMETERS: course_id, course_category, enrollment_location
 *   ("course_page" | "lesson_gate" | "quiz_gate"), course_lessons_total.
 * EXPECTED GA4 EFFECT: +1 event for the FIRST enrolment in a course only.
 *   Page views unchanged on course.html. Recommended GA4 key event.
 * VERIFICATION: GTM Preview -> Enroll -> one course_enrolled. Reload ->
 *   the page shows "Enrolled" and sends nothing.
 * FAILURE: storage blocked -> error toast, NOT enrolled, NO event.
 * DUPLICATE PREVENTION: enrollInCourse() reports firstTime=false for an
 *   existing enrolment; the button is disabled while saving.
 * RETURNS: true when the student is enrolled afterwards.
 */
function handleEnroll(course, location) {
  var result = enrollInCourse(course.id);
  if (!result.ok) {
    showToast("Enrollment could not be saved (browser storage blocked).", "error");
    return false;
  }
  if (result.firstTime) {
    trackAnalyticsEvent("course_enrolled", {
      course_id: course.id,
      course_category: course.category,
      enrollment_location: location,
      course_lessons_total: getCourseLessons(course).length
    });
    showToast("You are enrolled in " + course.title + ".", "success");
  }
  return true;
}

/**
 * FUNCTION: renderCourseActions(course)
 * PURPOSE: The button area of course.html, depending on the state:
 *   not enrolled  -> "Enroll for free"
 *   enrolled      -> "Start Learning" / "Continue Learning" + progress
 *   all lessons   -> "Take the Quiz" (until passed)
 *   completed     -> "Course completed" + "Review lessons"
 * BUTTONS: Enroll -> handleEnroll() -> course_enrolled;
 *   Start/Continue -> lesson.html (lesson_started on that page);
 *   Take the Quiz -> quiz.html.
 * EXPECTED ANALYTICS RESULT: none while rendering.
 */
function renderCourseActions(course) {
  var box = document.getElementById("course-actions");
  if (!isEnrolled(course.id)) {
    box.innerHTML = '<button type="button" class="btn btn--dark btn--lg" id="enroll-btn">' + icon("plus") + 'Enroll for free</button>' +
      '<p class="muted small">Demonstration platform: enrolment is free and saved only in this browser.</p>';
    document.getElementById("enroll-btn").addEventListener("click", function (event) {
      event.currentTarget.disabled = true;
      if (handleEnroll(course, "course_page")) {
        renderCoursePage(course);
        var start = document.getElementById("start-btn");
        if (start) {
          start.focus();
          start.classList.add("pop");
        }
      } else {
        event.currentTarget.disabled = false;
      }
    });
    return;
  }
  var p = getCourseProgress(course);
  var next = findNextLesson(course);
  var lessonUrl = "lesson.html?course=" + course.id + "&lesson=" + next.lesson.id;
  var quizUrl = "quiz.html?course=" + course.id;
  var html = '<div class="progress-block"><div class="progress-block__row"><span>Your progress</span><strong>' + p.completed + ' / ' + p.total + ' lessons - ' + p.percent + '%</strong></div>' +
    '<div class="progress progress--lg"><span style="--value:' + p.percent + '%"></span></div></div><div class="btn-row">';
  if (isCourseCompleted(course.id)) {
    html += '<span class="status status--done">' + icon("check") + 'Course completed</span>' +
      '<a class="btn btn--light" href="' + lessonUrl + '">Review lessons</a>';
  } else if (p.completed === p.total) {
    html += '<a class="btn btn--dark btn--lg" id="start-btn" href="' + quizUrl + '">' + icon("quiz") + 'Take the Quiz</a>';
  } else {
    html += '<a class="btn btn--dark btn--lg" id="start-btn" href="' + lessonUrl + '">' + icon("play") +
      (p.completed === 0 ? "Start Learning" : "Continue Learning") + '</a>' +
      '<a class="btn btn--light" href="' + quizUrl + '">Go to quiz</a>';
  }
  box.innerHTML = html + '</div>';
}

/**
 * FUNCTION: renderCoursePage(course)
 * PURPOSE: Fills course.html: header facts, description, objectives,
 *   prerequisites, module outline (with completion ticks), quiz box and
 *   instructor card.
 * EXPECTED ANALYTICS RESULT: none (no view event is required for the
 *   course page; its page_view identifies it via page_location ?id=).
 */
function renderCoursePage(course) {
  document.title = course.title + " | EduSpace";
  var lessons = getCourseLessons(course);
  var attempts = getQuizAttempts(course.quiz.id);
  var best = attempts.reduce(function (max, a) { return Math.max(max, a.score); }, 0);
  var enrolled = isEnrolled(course.id);

  document.getElementById("course-hero").innerHTML =
    '<div class="course-hero__media course-card--' + course.color + '"><img src="' + course.thumbnail + '" alt="" width="240" height="160"></div>' +
    '<div class="course-hero__text">' +
      '<p class="course-card__meta"><span class="tag">' + escapeHtml(categoryLabel(course.category)) + '</span><span class="tag tag--ghost">' + difficultyLabel(course.difficulty) + '</span></p>' +
      '<h1>' + escapeHtml(course.title) + '</h1>' +
      '<p class="lead">' + escapeHtml(course.summary) + '</p>' +
      '<ul class="fact-row">' +
        '<li>' + icon("star") + course.rating.toFixed(1) + ' sample rating (' + formatNumber(course.ratingCount) + ' sample reviews)</li>' +
        '<li>' + icon("users") + formatNumber(course.studentsDemo) + ' students (demo number)</li>' +
        '<li>' + icon("clock") + getCourseMinutes(course) + ' min estimated</li>' +
        '<li>' + icon("book") + lessons.length + ' lessons + quiz</li>' +
      '</ul>' +
      '<div id="course-actions" class="course-actions"></div>' +
    '</div>';
  renderCourseActions(course);

  document.getElementById("course-description").textContent = course.description;
  document.getElementById("course-objectives").innerHTML = course.objectives.map(function (o) {
    return '<li>' + icon("check") + escapeHtml(o) + '</li>';
  }).join("");
  document.getElementById("course-prereqs").innerHTML = course.prerequisites.map(function (o) {
    return '<li>' + escapeHtml(o) + '</li>';
  }).join("");

  document.getElementById("course-outline").innerHTML = course.modules.map(function (module, mIndex) {
    return '<li class="outline__module"><h3>Module ' + (mIndex + 1) + ': ' + escapeHtml(module.title) + '</h3><ol>' +
      module.lessons.map(function (lesson) {
        var done = isLessonComplete(course.id, lesson.id);
        var label = escapeHtml(lesson.title);
        // LINK: lesson title -> lesson.html (only once enrolled). Analytics: lesson_started on arrival.
        var title = enrolled ? '<a href="lesson.html?course=' + course.id + '&lesson=' + lesson.id + '">' + label + '</a>' : label;
        return '<li class="outline__lesson' + (done ? " is-done" : "") + '">' +
          '<span class="outline__status" aria-label="' + (done ? "Completed" : "Not completed") + '">' + icon(done ? "check" : "circle") + '</span>' +
          '<span class="outline__title">' + title + '<small>' + escapeHtml(lesson.summary) + '</small></span>' +
          '<span class="outline__time">' + lesson.minutes + ' min</span></li>';
      }).join("") + '</ol></li>';
  }).join("") +
    '<li class="outline__module"><h3>Final quiz</h3><ol><li class="outline__lesson' + (isQuizPassed(course.quiz.id) ? " is-done" : "") + '">' +
    '<span class="outline__status">' + icon(isQuizPassed(course.quiz.id) ? "check" : "quiz") + '</span>' +
    '<span class="outline__title">' + (enrolled ? '<a href="quiz.html?course=' + course.id + '">' + escapeHtml(course.quiz.title) + '</a>' : escapeHtml(course.quiz.title)) +
    '<small>' + course.quiz.questions.length + ' questions - pass mark ' + window.SITE_CONFIG.learning.passMarkPercent + '%' +
    (attempts.length ? ' - best score ' + best + '% in ' + attempts.length + (attempts.length === 1 ? ' attempt' : ' attempts') : '') + '</small></span></li></ol></li>';

  document.getElementById("course-instructor").innerHTML =
    '<span class="avatar avatar--lg" style="background:var(--' + course.color + ')">' + initialsOf(course.instructor.name) + '</span>' +
    '<div><h3>' + escapeHtml(course.instructor.name) + '</h3><p class="muted">' + escapeHtml(course.instructor.role) + '</p>' +
    '<p>' + escapeHtml(course.instructor.bio) + '</p></div>';
}

/**
 * FUNCTION: initCoursePage()
 * PURPOSE: Reads ?id= and renders the course, or a friendly "Course not
 *   found" panel with a link back to the catalog.
 * EXPECTED ANALYTICS RESULT: none on load (enrol button -> course_enrolled).
 */
function initCoursePage() {
  var root = document.getElementById("course-page");
  if (!root) {
    return;
  }
  var course = findCourse(getQueryParam("id"));
  if (!course) {
    root.innerHTML = '<div class="panel empty-state"><h1>Course not found</h1><p>The link may be outdated.</p>' +
      '<a class="btn btn--dark" href="catalog.html">Browse the catalog</a></div>';
    return;
  }
  renderCoursePage(course);
}

document.addEventListener("DOMContentLoaded", function () {
  document.addEventListener("click", handleCourseCardClick);
  initHomeCourses();
  initCatalog();
  initCoursePage();
});
