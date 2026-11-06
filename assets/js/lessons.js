/**
 * ============================================================
 * FILE: assets/js/lessons.js
 * ============================================================
 *
 * 1. PURPOSE
 *    The lesson player (lesson.html?course=<id>&lesson=<id>): original
 *    text lesson, module navigation, Previous / Next, Mark as Complete,
 *    notes, the course progress indicator and the active-study timer.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. initLessonPage()       validation, enrolment gate, first render
 *    B. renderLesson()         content, navigation, progress
 *    C. startLesson()          lesson_started
 *    D. completeLesson()       lesson_completed (+ course_completed)
 *    E. saveNotes()            lesson_notes_saved
 *
 * 3. DEPENDENCIES
 *    config.js, course-data.js, analytics.js, progress.js, main.js,
 *    courses.js (handleEnroll, findNextLesson).
 *
 * 4. HOW TO CUSTOMIZE IT
 *    Lesson text is in course-data.js. Notes length limit and idle time
 *    are in config.js (SITE_CONFIG.learning).
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    lesson_started, lesson_completed, course_completed and
 *    lesson_notes_saved are sent here. Moving to another lesson loads a
 *    new page, so each lesson opened = one page_view + one lesson_started.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// lesson_started      once per lesson page load (enrolled students only)
// lesson_completed    first successful completion of a lesson only
// course_completed    when the last requirement is met (here or in quizzes.js)
// lesson_notes_saved  each save that changed the notes (text never sent)
// Parameters: course_id, lesson_id, course_category, lesson_number,
// lesson_status, course_progress_percent, lesson_duration_seconds,
// note_length_chars.

var lessonContext = null; // { course, entry, lessons, index, timer }

/* ============================================================
 * A. START
 * ============================================================ */

/**
 * FUNCTION: initLessonPage()
 * PURPOSE: Reads ?course= and ?lesson=; shows "Lesson not found" for bad
 *   links; shows an enrolment gate when the student is not enrolled;
 *   otherwise renders the lesson and starts it.
 * BUTTON (gate): "Enroll and start" -> handleEnroll(course, "lesson_gate")
 *   -> course_enrolled, then lesson_started.
 * EXPECTED ANALYTICS RESULT: see startLesson(). No event for a bad link
 *   or while the gate is shown.
 */
function initLessonPage() {
  var root = document.getElementById("lesson-page");
  if (!root) {
    return;
  }
  var course = findCourse(getQueryParam("course"));
  var lessons = course ? getCourseLessons(course) : [];
  var index = -1;
  lessons.forEach(function (item, i) {
    if (item.lesson.id === getQueryParam("lesson")) {
      index = i;
    }
  });
  if (!course || index === -1) {
    root.innerHTML = '<div class="panel empty-state"><h1>Lesson not found</h1><p>This lesson link is not valid.</p>' +
      '<a class="btn btn--dark" href="catalog.html">Browse the catalog</a></div>';
    return;
  }
  lessonContext = { course: course, lessons: lessons, index: index, entry: lessons[index], timer: null };

  if (!isEnrolled(course.id)) {
    root.querySelector("[data-lesson-gate]").hidden = false;
    root.querySelector("[data-lesson-content]").hidden = true;
    root.querySelector("[data-gate-title]").textContent = course.title;
    document.getElementById("gate-enroll-btn").addEventListener("click", function (event) {
      event.currentTarget.disabled = true;
      if (handleEnroll(course, "lesson_gate")) {
        root.querySelector("[data-lesson-gate]").hidden = true;
        root.querySelector("[data-lesson-content]").hidden = false;
        showLesson();
      } else {
        event.currentTarget.disabled = false;
      }
    });
    return;
  }
  showLesson();
}

/** FUNCTION: showLesson() - render, connect buttons, start timer and lesson_started. */
function showLesson() {
  renderLesson();
  connectLessonButtons();
  lessonContext.timer = startStudyTimer(lessonContext.course.id, lessonContext.entry.lesson.id);
  window.setInterval(updateTimerDisplay, 1000);
  rememberLastVisited(lessonContext.course.id, lessonContext.entry.lesson.id);
  startLesson();
}

/* ============================================================
 * B. RENDER
 * ============================================================ */

/**
 * FUNCTION: renderLesson()
 * PURPOSE: Fills the page: breadcrumb, title, module, estimated time,
 *   summary, paragraphs, code example, key points, practice task, notes,
 *   module navigation and progress.
 * EXPECTED ANALYTICS RESULT: none (rendering never sends events).
 */
function renderLesson() {
  var c = lessonContext;
  var lesson = c.entry.lesson;
  document.title = lesson.title + " | " + c.course.title + " | EduSpace";
  document.getElementById("lesson-course-link").href = "course.html?id=" + c.course.id;
  document.getElementById("lesson-course-link").textContent = c.course.title;
  document.getElementById("lesson-kicker").textContent = "Module " + (c.course.modules.indexOf(c.entry.module) + 1) + " - " + c.entry.module.title;
  document.getElementById("lesson-title").textContent = lesson.title;
  document.getElementById("lesson-meta").innerHTML =
    '<span>' + icon("book") + 'Lesson ' + c.entry.number + ' of ' + c.lessons.length + '</span>' +
    '<span>' + icon("clock") + 'About ' + lesson.minutes + ' min</span>' +
    '<span>' + icon("text") + 'Text lesson</span>';
  document.getElementById("lesson-summary").textContent = lesson.summary;

  var html = lesson.body.map(function (p) { return '<p>' + escapeHtml(p) + '</p>'; }).join("");
  if (lesson.code) {
    html += '<figure class="code-block"><figcaption>Example</figcaption><pre><code>' + escapeHtml(lesson.code) + '</code></pre></figure>';
  }
  html += '<div class="key-points"><h2>Key points</h2><ul>' + lesson.points.map(function (point) {
    return '<li>' + icon("check") + escapeHtml(point) + '</li>';
  }).join("") + '</ul></div>';
  html += '<div class="practice"><h2>' + icon("pencil") + 'Practice</h2><p>' + escapeHtml(lesson.practice) + '</p></div>';
  document.getElementById("lesson-body").innerHTML = html;

  var note = getProgress().notes[c.entry.key];
  var notes = document.getElementById("lesson-notes");
  notes.value = note ? note.text : "";
  notes.maxLength = window.SITE_CONFIG.learning.notesMaxLength;
  document.getElementById("notes-status").textContent = note ? "Saved " + formatDate(note.savedAt) : "Not saved yet";

  renderLessonNavigation();
  renderLessonProgress();
}

/**
 * FUNCTION: renderLessonNavigation()
 * PURPOSE: Module list with each lesson's status, plus Previous / Next.
 *   Next on the last lesson leads to the quiz.
 * LINKS: every lesson link and Previous/Next -> another lesson.html page
 *   (+1 page_view and +1 lesson_started there). "Take the quiz" ->
 *   quiz.html (+1 page_view; quiz_started only after "Start quiz").
 * EXPECTED ANALYTICS RESULT: none while rendering.
 */
function renderLessonNavigation() {
  var c = lessonContext;
  document.getElementById("lesson-nav").innerHTML = c.course.modules.map(function (module, mIndex) {
    return '<li><p class="lesson-nav__module">Module ' + (mIndex + 1) + ': ' + escapeHtml(module.title) + '</p><ol>' +
      module.lessons.map(function (lesson) {
        var key = lessonKey(c.course.id, lesson.id);
        var current = key === c.entry.key;
        var done = isLessonComplete(c.course.id, lesson.id);
        return '<li><a class="lesson-nav__item' + (current ? " is-current" : "") + (done ? " is-done" : "") + '" href="lesson.html?course=' + c.course.id + '&lesson=' + lesson.id + '"' +
          (current ? ' aria-current="page"' : '') + '>' + icon(done ? "check" : "circle") + '<span>' + escapeHtml(lesson.title) + '</span></a></li>';
      }).join("") + '</ol></li>';
  }).join("") +
    '<li><p class="lesson-nav__module">Assessment</p><ol><li><a class="lesson-nav__item' + (isQuizPassed(c.course.quiz.id) ? " is-done" : "") + '" href="quiz.html?course=' + c.course.id + '">' +
    icon(isQuizPassed(c.course.quiz.id) ? "check" : "quiz") + '<span>' + escapeHtml(c.course.quiz.title) + '</span></a></li></ol></li>';

  var prev = c.lessons[c.index - 1];
  var next = c.lessons[c.index + 1];
  var prevLink = document.getElementById("prev-lesson");
  var nextLink = document.getElementById("next-lesson");
  if (prev) {
    prevLink.href = "lesson.html?course=" + c.course.id + "&lesson=" + prev.lesson.id;
    prevLink.classList.remove("is-disabled");
    prevLink.removeAttribute("aria-disabled");
  } else {
    prevLink.removeAttribute("href");
    prevLink.classList.add("is-disabled");
    prevLink.setAttribute("aria-disabled", "true");
  }
  if (next) {
    nextLink.href = "lesson.html?course=" + c.course.id + "&lesson=" + next.lesson.id;
    nextLink.innerHTML = 'Next lesson ' + icon("arrow");
  } else {
    nextLink.href = "quiz.html?course=" + c.course.id;
    nextLink.innerHTML = 'Take the quiz ' + icon("arrow");
  }
}

/**
 * FUNCTION: renderLessonProgress()
 * PURPOSE: Course progress bar ("2 of 4 lessons - 50%") and the state of
 *   the Mark as Complete button. The bar animates to the new width.
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderLessonProgress() {
  var c = lessonContext;
  var p = getCourseProgress(c.course);
  document.getElementById("lesson-progress-text").textContent = p.completed + " of " + p.total + " lessons completed - " + p.percent + "%";
  document.getElementById("lesson-progress-bar").style.setProperty("--value", p.percent + "%");
  document.getElementById("lesson-progress-bar").parentElement.setAttribute("aria-valuenow", p.percent);
  var button = document.getElementById("complete-btn");
  var done = isLessonComplete(c.course.id, c.entry.lesson.id);
  button.disabled = done;
  button.classList.toggle("is-complete", done);
  button.innerHTML = done ? icon("check") + "Completed" : icon("check") + "Mark as Complete";
  var hint = document.getElementById("course-complete-hint");
  if (isCourseCompleted(c.course.id)) {
    hint.hidden = false;
    hint.innerHTML = icon("award") + "<span>You completed this course. Well done!</span>";
  } else if (p.completed === p.total) {
    hint.hidden = false;
    hint.innerHTML = icon("quiz") + '<span>All lessons done. <a href="quiz.html?course=' + c.course.id + '">Pass the quiz</a> (' +
      window.SITE_CONFIG.learning.passMarkPercent + '% or more) to complete the course.</span>';
  } else {
    hint.hidden = true;
  }
}

/** FUNCTION: updateTimerDisplay() - "Active study time on this page: 2:15". Analytics: none. */
function updateTimerDisplay() {
  var el = document.getElementById("study-timer");
  if (el && lessonContext && lessonContext.timer) {
    el.textContent = formatClock(lessonContext.timer.getSessionSeconds());
  }
}

/** FUNCTION: connectLessonButtons() - Mark as Complete, Save notes. Analytics: see handlers. */
function connectLessonButtons() {
  document.getElementById("complete-btn").addEventListener("click", completeLesson);
  document.getElementById("notes-form").addEventListener("submit", function (event) {
    event.preventDefault();
    saveNotes();
  });
  document.getElementById("lesson-notes").addEventListener("input", function () {
    document.getElementById("notes-status").textContent = "Unsaved changes";
  });
}

/* ============================================================
 * C. LESSON STARTED
 * ============================================================ */

/**
 * FUNCTION: startLesson()
 *
 * PURPOSE: Reports that an enrolled student opened a lesson to study.
 * USER ACTION: Opening lesson.html (Start / Continue Learning, a lesson
 *   link, Previous / Next).
 * EXPECTED WEBSITE RESULT: lesson content visible, timer running.
 * EXPECTED ANALYTICS EVENT: lesson_started
 * PARAMETERS:
 *   - course_id, lesson_id, course_category
 *   - lesson_number   (1-based position in the course)
 *   - lesson_status   "new" (not completed yet) | "review" (completed before)
 *   - course_progress_percent (before this lesson)
 * EXPECTED GA4 EFFECT:
 *   - +1 per lesson page load. Reloading the page = a new study visit =
 *     +1 again (and +1 page_view). Use lesson_status = "new" to count
 *     first-time study separately from reviews.
 *   - Not sent to students who are not enrolled (gate shown instead).
 * VERIFICATION: GTM Preview -> open lesson 1 -> one lesson_started with
 *   lesson_id l1, lesson_status new.
 * DUPLICATE PREVENTION: trackEventOncePerPage("lesson_started:<key>"),
 *   so re-rendering after completion cannot resend it.
 */
function startLesson() {
  var c = lessonContext;
  trackEventOncePerPage("lesson_started:" + c.entry.key, "lesson_started", {
    course_id: c.course.id,
    lesson_id: c.entry.lesson.id,
    course_category: c.course.category,
    lesson_number: c.entry.number,
    lesson_status: isLessonComplete(c.course.id, c.entry.lesson.id) ? "review" : "new",
    course_progress_percent: getCourseProgress(c.course).percent
  });
}

/* ============================================================
 * D. LESSON COMPLETED
 * ============================================================ */

/**
 * FUNCTION: completeLesson()
 *
 * PURPOSE: Marks the current lesson as completed.
 * USER ACTION: Student clicks "Mark as Complete".
 * EXPECTED WEBSITE RESULT:
 *   - The button turns into "Completed" with a short pop animation.
 *   - The progress bar animates to the new value
 *     (Course Progress = Completed Lessons / Total Lessons x 100).
 *   - The module list shows a tick; the dashboard count increases.
 *   - If the quiz was already passed and this was the last lesson, the
 *     course becomes completed.
 * EXPECTED ANALYTICS EVENT: lesson_completed
 * PARAMETERS:
 *   - course_id, lesson_id, course_category, lesson_number
 *   - course_progress_percent (AFTER completion, e.g. 25 for 1 of 4)
 *   - lesson_duration_seconds (measured ACTIVE study time on this lesson,
 *     all visits together - see the timer definition in progress.js)
 * EXPECTED GA4 EFFECT:
 *   - One lesson_completed after a successful FIRST completion.
 *   - Page views do not increase. Engagement rate is not guaranteed to change.
 *   - Possibly one course_completed right after (see below).
 * VERIFICATION:
 *   1. Open GTM Preview. 2. Complete a lesson. 3. Verify ONE event with
 *   course_progress_percent. 4. Check GA4 DebugView.
 * FAILURE: if progress cannot be saved, an error toast appears, the
 *   lesson stays incomplete and NO event is sent.
 * DUPLICATE PREVENTION: the button is disabled after completion and
 *   markLessonComplete() returns firstTime=false for completed lessons,
 *   so reopening a completed lesson never creates another completion.
 */
function completeLesson() {
  var c = lessonContext;
  var button = document.getElementById("complete-btn");
  button.disabled = true;
  if (c.timer) {
    c.timer.flush(); // include the time measured so far in lesson_duration_seconds
  }
  var result = markLessonComplete(c.course.id, c.entry.lesson.id);
  if (!result.ok) {
    button.disabled = false;
    showToast("Progress could not be saved, so the lesson was not marked complete.", "error");
    return;
  }
  if (!result.firstTime) {
    renderLessonProgress();
    return;
  }
  var progress = getCourseProgress(c.course);
  trackAnalyticsEvent("lesson_completed", {
    course_id: c.course.id,
    lesson_id: c.entry.lesson.id,
    course_category: c.course.category,
    lesson_number: c.entry.number,
    course_progress_percent: progress.percent,
    lesson_duration_seconds: getProgress().lessonSeconds[c.entry.key] || 0
  });
  sendCourseCompletedIfDone(c.course, "lesson");
  renderLessonProgress();
  renderLessonNavigation();
  button.classList.add("pop");
  showToast("Lesson completed - course progress " + progress.percent + "%.", "success");
}

/**
 * FUNCTION: sendCourseCompletedIfDone(course, trigger)
 *
 * PURPOSE: Checks the completion rule (all lessons + quiz passed) and
 *   reports the course completion the first time it is met.
 * EXPECTED ANALYTICS EVENT: course_completed
 * PARAMETERS: course_id, course_category, completion_trigger
 *   ("lesson" | "quiz" - the action that met the last requirement),
 *   best_quiz_score.
 * EXPECTED GA4 EFFECT: +1 per course, once. Recommended key event.
 * VERIFICATION: finish the last requirement -> one course_completed.
 * FAILURE: save failed -> checkCourseCompletion() returns false -> none.
 * DUPLICATE PREVENTION: completedCourses[courseId] is stored; restoring
 *   the page or retrying the quiz never resends it.
 */
function sendCourseCompletedIfDone(course, trigger) {
  if (!checkCourseCompletion(course)) {
    return false;
  }
  var best = getQuizAttempts(course.quiz.id).reduce(function (max, a) { return Math.max(max, a.score); }, 0);
  trackAnalyticsEvent("course_completed", {
    course_id: course.id,
    course_category: course.category,
    completion_trigger: trigger,
    best_quiz_score: best
  });
  showToast("Course completed: " + course.title + "!", "success");
  return true;
}

/* ============================================================
 * E. NOTES
 * ============================================================ */

/**
 * FUNCTION: saveNotes()
 *
 * PURPOSE: Saves the notes of this lesson in this browser.
 * USER ACTION: Student clicks "Save notes".
 * EXPECTED WEBSITE RESULT: "Saved Nov 7, 2026" appears; notes are there
 *   when the lesson is opened again (same browser).
 * EXPECTED ANALYTICS EVENT: lesson_notes_saved
 * PARAMETERS: course_id, lesson_id, note_length_chars. The note TEXT is
 *   never sent (it may contain personal information).
 * EXPECTED GA4 EFFECT: +1 per save that changed the notes; saving the
 *   same text again sends nothing. Page views unchanged.
 * VERIFICATION: type a note, save -> one event; save again unchanged ->
 *   no event.
 * FAILURE: storage blocked -> error message, no event.
 */
function saveNotes() {
  var c = lessonContext;
  var text = document.getElementById("lesson-notes").value;
  var status = document.getElementById("notes-status");
  var result = saveLessonNotes(c.course.id, c.entry.lesson.id, text);
  if (!result.ok) {
    status.textContent = "Could not save (browser storage blocked).";
    return;
  }
  status.textContent = result.changed ? "Saved just now" : "No changes to save";
  if (result.changed) {
    trackAnalyticsEvent("lesson_notes_saved", {
      course_id: c.course.id,
      lesson_id: c.entry.lesson.id,
      note_length_chars: text.length
    });
  }
}

document.addEventListener("DOMContentLoaded", initLessonPage);
