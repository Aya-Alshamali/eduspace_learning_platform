/**
 * ============================================================
 * FILE: assets/js/account.js
 * ============================================================
 *
 * 1. PURPOSE
 *    The Student Profile page (profile.html) and the Settings page
 *    (settings.html): display name, avatar colour, daily goal, the
 *    completion record, saved notes, motion preference, analytics
 *    consent, sample data, export and reset.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. Profile: initProfilePage(), handleProfileSubmit()
 *    B. Settings: initSettingsPage(), motion, consent, data tools
 *
 * 3. DEPENDENCIES
 *    config.js, course-data.js, analytics.js, progress.js, main.js.
 *
 * 4. HOW TO CUSTOMIZE IT
 *    AVATAR_COLORS = the colour choices. DAILY_GOALS = goal options.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    Profile and settings actions send NO events on purpose: the display
 *    name is personal data and must never reach GA4, and settings are
 *    not learning actions. The consent buttons call handleConsentChoice()
 *    in analytics.js (loads or blocks GTM).
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// No custom events in this file (see section 5). Important side effects:
// - "Load sample data" and "Reset" change what the dashboard shows but
//   send NO learning events.
// - After "Reset", completing a lesson again counts as a FIRST completion
//   and sends lesson_completed again (documented test case).
// - The consent switch decides whether GTM loads on the next pages.

var AVATAR_COLORS = ["#DCD5FA", "#F1C1C4", "#BCEED7", "#F9E2C8", "#C9E4F6"];
var DAILY_GOALS = [15, 30, 45, 60];

/* ============================================================
 * A. PROFILE
 * ============================================================ */

/**
 * FUNCTION: initProfilePage()
 * PURPOSE: Fills the profile form and the learning summary.
 * EXPECTED ANALYTICS RESULT: none.
 */
function initProfilePage() {
  var form = document.getElementById("profile-form");
  if (!form) {
    return;
  }
  var profile = getProgress().profile;
  document.getElementById("profile-name").value = profile.displayName;
  document.getElementById("profile-colors").innerHTML = AVATAR_COLORS.map(function (color, i) {
    return '<label class="swatch"><input type="radio" name="avatarColor" value="' + color + '"' + (color === profile.avatarColor ? " checked" : "") + '>' +
      '<span style="background:' + color + '"><span class="visually-hidden">Colour ' + (i + 1) + '</span></span></label>';
  }).join("");
  document.getElementById("profile-goal").innerHTML = DAILY_GOALS.map(function (m) {
    return '<option value="' + m + '"' + (m === profile.dailyGoalMinutes ? " selected" : "") + '>' + m + ' minutes per day</option>';
  }).join("");
  form.addEventListener("submit", handleProfileSubmit);
  renderProfileSummary();
}

/**
 * FUNCTION: handleProfileSubmit(event)
 *
 * PURPOSE: Saves display name, avatar colour and daily goal.
 * USER ACTION: "Save profile".
 * EXPECTED WEBSITE RESULT: the name and avatar update everywhere; toast.
 *   The name is stored ONLY in this browser.
 * EXPECTED ANALYTICS EVENT: none. The name is personal data and is never
 *   sent to GA4 (requirement: no student names in analytics).
 * FAILURE: storage blocked -> error toast; nothing saved.
 */
function handleProfileSubmit(event) {
  event.preventDefault();
  var form = event.currentTarget;
  var profile = getProgress().profile;
  var previous = JSON.stringify(profile);
  profile.displayName = document.getElementById("profile-name").value.trim().slice(0, 40);
  var color = form.querySelector('input[name="avatarColor"]:checked');
  profile.avatarColor = color ? color.value : profile.avatarColor;
  profile.dailyGoalMinutes = Number(document.getElementById("profile-goal").value) || 30;
  if (!saveProgress()) {
    getProgress().profile = JSON.parse(previous);
    showToast("Profile could not be saved (browser storage blocked).", "error");
    return;
  }
  renderStudentChip();
  renderProfileSummary();
  showToast("Profile saved in this browser.", "success");
}

/**
 * FUNCTION: renderProfileSummary()
 * PURPOSE: Today's goal progress, completion record, best quiz scores and
 *   saved notes (with links back to the lessons).
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderProfileSummary() {
  var state = getProgress();
  var stats = getLearningStats();
  var todayMinutes = Math.round((state.studyLog[localDateKey()] || 0) / 60);
  var goal = state.profile.dailyGoalMinutes;
  var goalPercent = Math.min(100, Math.round((todayMinutes / goal) * 100));
  var since = Object.keys(state.enrollments).map(function (k) { return state.enrollments[k]; }).sort()[0];
  document.getElementById("profile-summary").innerHTML =
    '<p class="muted">' + (since ? "Learning since " + formatDate(since) : "No enrolments yet") + '</p>' +
    '<div class="progress-block"><div class="progress-block__row"><span>Today\'s goal</span><strong>' + todayMinutes + ' / ' + goal + ' min</strong></div>' +
    '<div class="progress progress--lg"><span style="--value:' + goalPercent + '%"></span></div></div>' +
    '<ul class="mini-stats"><li><strong>' + stats.enrolled + '</strong><span>enrolled</span></li><li><strong>' + stats.completedLessons + '</strong><span>lessons</span></li>' +
    '<li><strong>' + stats.completedCourses + '</strong><span>courses done</span></li><li><strong>' + (stats.quizAverage === null ? "-" : stats.quizAverage + "%") + '</strong><span>quiz avg.</span></li></ul>';

  var completed = window.COURSES.filter(function (c) { return state.completedCourses[c.id]; });
  document.getElementById("profile-record").innerHTML = completed.length ? completed.map(function (c) {
    var best = getQuizAttempts(c.quiz.id).reduce(function (m, a) { return Math.max(m, a.score); }, 0);
    return '<li class="record"><span class="upcoming__icon" style="background:var(--' + c.color + ')">' + icon("award") + '</span>' +
      '<div><a href="course.html?id=' + c.id + '"><strong>' + escapeHtml(c.title) + '</strong></a><small>Completed ' + formatDate(state.completedCourses[c.id]) + ' - best quiz score ' + best + '%</small></div></li>';
  }).join("") : '<li class="muted small">No completed courses yet. A course is completed when all lessons are done and its quiz is passed.</li>';

  var noteKeys = Object.keys(state.notes).filter(function (k) { return state.notes[k].text.trim(); });
  document.getElementById("profile-notes").innerHTML = noteKeys.length ? noteKeys.map(function (key) {
    var parts = key.split("/");
    var course = findCourse(parts[0]);
    var lesson = course ? getCourseLessons(course).filter(function (e) { return e.lesson.id === parts[1]; })[0] : null;
    if (!lesson) {
      return "";
    }
    var text = state.notes[key].text;
    return '<li class="note-item"><a href="lesson.html?course=' + course.id + '&lesson=' + lesson.lesson.id + '"><strong>' + escapeHtml(lesson.lesson.title) + '</strong></a>' +
      '<small class="muted">' + escapeHtml(course.title) + ' - saved ' + formatDate(state.notes[key].savedAt) + '</small>' +
      '<p>' + escapeHtml(text.length > 160 ? text.slice(0, 160) + "..." : text) + '</p></li>';
  }).join("") : '<li class="muted small">No notes yet. Use the notes box next to any lesson.</li>';
}

/* ============================================================
 * B. SETTINGS
 * ============================================================ */

/**
 * FUNCTION: initSettingsPage()
 * PURPOSE: Connects motion, consent and data buttons.
 * EXPECTED ANALYTICS RESULT: none on load.
 */
function initSettingsPage() {
  var motionForm = document.getElementById("motion-form");
  if (!motionForm) {
    return;
  }
  var current = getProgress().settings.motion;
  motionForm.querySelectorAll('input[name="motion"]').forEach(function (input) {
    input.checked = input.value === current;
  });
  motionForm.addEventListener("change", handleMotionChange);
  renderConsentStatus();
  document.getElementById("consent-allow-btn").addEventListener("click", function () {
    handleConsentChoice("granted");
    renderConsentStatus();
  });
  document.getElementById("consent-deny-btn").addEventListener("click", function () {
    handleConsentChoice("denied");
    renderConsentStatus();
  });
  document.getElementById("sample-btn").addEventListener("click", handleLoadSample);
  document.getElementById("export-btn").addEventListener("click", handleExport);
  document.getElementById("reset-btn").addEventListener("click", handleReset);
  renderStorageInfo();
}

/**
 * FUNCTION: handleMotionChange(event)
 * PURPOSE: "Follow my device" or "Reduce motion". Takes effect at once.
 * EXPECTED ANALYTICS RESULT: none. Animations never send events, so this
 *   choice cannot change any event count.
 */
function handleMotionChange(event) {
  getProgress().settings.motion = event.target.value;
  saveProgress();
  applyMotionPreference();
  showToast(event.target.value === "reduce" ? "Animations reduced." : "Following your device setting.", "info");
}

/**
 * FUNCTION: renderConsentStatus()
 * PURPOSE: Shows the analytics consent choice and whether analytics is
 *   configured at all (placeholder ID = nothing is ever sent).
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderConsentStatus() {
  var status = getConsentStatus();
  var text = status === "granted" ? "Allowed" : status === "denied" ? "Declined" : "Not chosen yet";
  document.getElementById("consent-status").textContent = text;
  document.getElementById("consent-config").textContent = isAnalyticsConfigured() ?
    "Google Tag Manager is configured. With consent it loads on every page." :
    "Analytics is not configured (placeholder GTM-XXXXXXX): nothing is sent to Google, whatever you choose. Events are only printed in the browser console for learning.";
}

/**
 * FUNCTION: handleLoadSample()
 * PURPOSE: After confirmation, replaces this browser's progress with the
 *   labelled sample student (progress.js loadSampleProgress()).
 * EXPECTED ANALYTICS RESULT: NONE - no lesson_completed, quiz_submitted
 *   or course_completed is sent for sample data.
 */
function handleLoadSample() {
  if (!window.confirm("Replace the progress saved in this browser with clearly labelled SAMPLE data?")) {
    return;
  }
  if (!loadSampleProgress()) {
    showToast("Sample data could not be saved (browser storage blocked).", "error");
    return;
  }
  renderStudentChip();
  renderStorageInfo();
  showToast("Sample data loaded. Pages now show a 'Sample data' badge.", "success");
}

/**
 * FUNCTION: handleExport()
 * PURPOSE: Downloads the saved record as eduspace-progress.json (a file
 *   created in the browser; nothing is uploaded).
 * EXPECTED ANALYTICS RESULT: none.
 */
function handleExport() {
  var blob = new Blob([JSON.stringify(getProgress(), null, 2)], { type: "application/json" });
  var link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "eduspace-progress.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(function () { URL.revokeObjectURL(link.href); }, 1000);
}

/**
 * FUNCTION: handleReset()
 * PURPOSE: After confirmation, deletes all progress in this browser.
 * EXPECTED ANALYTICS RESULT: none now. Afterwards lessons and quizzes
 *   count as new again (new "first" completion events are possible).
 */
function handleReset() {
  if (!window.confirm("Delete ALL learning progress saved in this browser? This cannot be undone.")) {
    return;
  }
  resetProgress();
  renderStudentChip();
  renderStorageInfo();
  showToast("All progress in this browser was deleted.", "success");
}

/** FUNCTION: renderStorageInfo() - size and type of the saved record. Analytics: none. */
function renderStorageInfo() {
  var el = document.getElementById("storage-info");
  if (!el) {
    return;
  }
  var size = 0;
  try {
    size = (window.localStorage.getItem(window.SITE_CONFIG.storageKey) || "").length;
  } catch (error) {
    size = 0;
  }
  el.textContent = (size ? "About " + Math.max(1, Math.round(size / 1024)) + " KB saved" : "Nothing saved yet") +
    (getProgress().isSampleData ? " (sample data)." : ".");
}

document.addEventListener("DOMContentLoaded", function () {
  initProfilePage();
  initSettingsPage();
});
