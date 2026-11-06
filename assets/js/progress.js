/**
 * ============================================================
 * FILE: assets/js/progress.js
 * ============================================================
 *
 * 1. PURPOSE
 *    The student's learning record: enrolments, completed lessons, quiz
 *    attempts, notes, measured study time and the calculations built on
 *    them (course progress, quiz average, streak, weekly activity).
 *    Every number on the dashboard comes from here.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. Storage: loadProgress(), saveProgress(), optional backend sync
 *    B. Course helpers: findCourse(), getCourseLessons(), getCourseProgress()
 *    C. Changes: enrollInCourse(), markLessonComplete(), recordQuizAttempt(),
 *       checkCourseCompletion(), saveLessonNotes(), planStudySession()
 *    D. Statistics: getLearningStats(), getWeeklyActivity(), getStudyStreak()
 *    E. Study timer: measured ACTIVE study time (see below)
 *    F. Sample data + reset (Settings page)
 *
 * 3. DEPENDENCIES
 *    config.js, course-data.js. Used by every page script.
 *
 * 4. HOW TO CUSTOMIZE IT
 *    Rules (pass mark, idle seconds) are in config.js. The saved record
 *    format is shown in createEmptyProgress(); if you change it, raise
 *    "version" so old records can be recognised.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    This file sends NO events. It returns facts such as "firstTime:
 *    true" so the page scripts (courses.js, lessons.js, quizzes.js) can
 *    send each event only once and only after a SUCCESSFUL save.
 *
 * STORAGE IN DEMONSTRATION MODE
 *    Progress is saved in localStorage under "eduspace_progress_v1".
 *    localStorage belongs to ONE browser on ONE device: another browser,
 *    a private window or clearing site data starts from zero, and there
 *    is no cross-device synchronisation. Only non-sensitive learning data
 *    is stored (a display name the student types is the only personal
 *    item, and it never leaves the browser).
 *
 * HOW STUDY TIME IS MEASURED (honest definition)
 *    Only on lesson and quiz pages, a timer adds 1 second for every
 *    second in which BOTH are true:
 *      - the tab is visible (document.visibilityState === "visible"), and
 *      - the student moved the mouse, typed, touched or scrolled within
 *        the last idleSeconds (60 s by default).
 *    So a lesson left open in a background tab, or an untouched screen,
 *    does NOT count. This is an estimate of active study time, not
 *    proof of learning, and it is different from GA4's engagement time.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// No events are sent from this file (see section 5 above). Values it
// calculates are used as event parameters: course_progress_percent,
// quiz_score, quiz_attempt and lesson_duration_seconds.

var progressState = null;      // in-memory copy of the saved record
var progressStorageOk = true;  // false when localStorage is blocked or full

/* ============================================================
 * A. STORAGE
 * ============================================================ */

/**
 * FUNCTION: createEmptyProgress()
 * PURPOSE: The shape of a brand-new learning record.
 * EXPECTED ANALYTICS RESULT: none.
 */
function createEmptyProgress() {
  return {
    version: 1,
    isSampleData: false,
    profile: { displayName: "", avatarColor: "#DCD5FA", dailyGoalMinutes: 30 },
    settings: { motion: "system" },
    enrollments: {},       // courseId -> ISO date enrolled
    completedLessons: {},  // "courseId/lessonId" -> ISO date completed
    lessonSeconds: {},     // "courseId/lessonId" -> measured active seconds
    studyLog: {},          // "YYYY-MM-DD" -> measured active seconds that day
    notes: {},             // "courseId/lessonId" -> { text, savedAt }
    quizAttempts: {},      // quizId -> [ { attempt, correct, total, score, passed, submittedAt, answers } ]
    completedCourses: {},  // courseId -> ISO date completed
    plannedSessions: [],   // [ { id, date, courseId, minutes } ]
    lastVisited: null      // { courseId, lessonId, at }
  };
}

/**
 * FUNCTION: loadProgress()
 * PURPOSE: Reads the record from localStorage (or starts an empty one).
 *   Unknown or damaged data is replaced by an empty record instead of
 *   breaking the page.
 * RETURNS: the progress object (also kept in progressState).
 * EXPECTED ANALYTICS RESULT: none. Restoring saved progress NEVER sends
 *   completion events (Scenario 5 in ANALYTICS_TEST_CASES.md).
 */
function loadProgress() {
  var empty = createEmptyProgress();
  var saved = null;
  try {
    saved = JSON.parse(window.localStorage.getItem(window.SITE_CONFIG.storageKey) || "null");
    progressStorageOk = true;
  } catch (error) {
    progressStorageOk = false;
  }
  if (!saved || saved.version !== 1) {
    progressState = empty;
    return progressState;
  }
  // Fill in any field missing from older saves.
  for (var key in empty) {
    if (saved[key] === undefined) {
      saved[key] = empty[key];
    }
  }
  progressState = saved;
  return progressState;
}

/**
 * FUNCTION: getProgress()
 * PURPOSE: Returns the in-memory record, loading it on first use.
 * EXPECTED ANALYTICS RESULT: none.
 */
function getProgress() {
  return progressState || loadProgress();
}

/**
 * FUNCTION: saveProgress()
 * PURPOSE: Writes the record to localStorage (and to the optional backend).
 * RETURNS: true when saved, false when storage is blocked/full.
 * EXPECTED ANALYTICS RESULT: none directly. Callers send their event ONLY
 *   when this returns true ("if progress cannot be saved, do not record a
 *   successful completion").
 */
function saveProgress() {
  try {
    window.localStorage.setItem(window.SITE_CONFIG.storageKey, JSON.stringify(getProgress()));
    progressStorageOk = true;
  } catch (error) {
    progressStorageOk = false;
    return false;
  }
  syncProgressToBackend();
  return true;
}

/**
 * FUNCTION: syncProgressToBackend()
 * PURPOSE: When SITE_CONFIG.backend.progressApiUrl is set, sends the
 *   record to that server with the student's login cookie
 *   (credentials: "include"), so a real deployment can store progress
 *   per authenticated user. Empty URL (default) = does nothing.
 * EXPECTED ANALYTICS RESULT: none.
 * FAILURE: network errors are only logged; the local copy stays saved.
 */
function syncProgressToBackend() {
  var url = window.SITE_CONFIG.backend.progressApiUrl;
  if (!url || !window.fetch) {
    return;
  }
  window.fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(getProgress())
  }).catch(function () {
    console.warn("EduSpace: progress could not be sent to the backend; the local copy is kept.");
  });
}

// When another tab of EduSpace saves progress, use the newer record here
// too, so two open tabs do not overwrite each other's lessons.
window.addEventListener("storage", function (event) {
  if (event.key === window.SITE_CONFIG.storageKey) {
    loadProgress();
  }
});

/* ============================================================
 * B. COURSE HELPERS
 * ============================================================ */

/** FUNCTION: findCourse(courseId) - the course object or null. Analytics: none. */
function findCourse(courseId) {
  for (var i = 0; i < window.COURSES.length; i++) {
    if (window.COURSES[i].id === courseId) {
      return window.COURSES[i];
    }
  }
  return null;
}

/**
 * FUNCTION: getCourseLessons(course)
 * PURPOSE: All lessons of a course in order, each with its module title,
 *   a running number (1, 2, 3 ...) and its storage key.
 * EXPECTED ANALYTICS RESULT: none.
 */
function getCourseLessons(course) {
  var list = [];
  course.modules.forEach(function (module) {
    module.lessons.forEach(function (lesson) {
      list.push({
        lesson: lesson,
        module: module,
        number: list.length + 1,
        key: lessonKey(course.id, lesson.id)
      });
    });
  });
  return list;
}

/** FUNCTION: lessonKey(courseId, lessonId) - "courseId/lessonId". Analytics: none. */
function lessonKey(courseId, lessonId) {
  return courseId + "/" + lessonId;
}

/** FUNCTION: getCourseMinutes(course) - sum of the lesson estimates. Analytics: none. */
function getCourseMinutes(course) {
  return getCourseLessons(course).reduce(function (sum, item) {
    return sum + item.lesson.minutes;
  }, 0);
}

/** FUNCTION: isEnrolled(courseId) - true/false. Analytics: none. */
function isEnrolled(courseId) {
  return Boolean(getProgress().enrollments[courseId]);
}

/** FUNCTION: isLessonComplete(courseId, lessonId) - true/false. Analytics: none. */
function isLessonComplete(courseId, lessonId) {
  return Boolean(getProgress().completedLessons[lessonKey(courseId, lessonId)]);
}

/**
 * FUNCTION: getCourseProgress(course)
 *
 * PURPOSE: Course Progress = (Completed Lessons / Total Lessons) x 100,
 *   rounded to a whole number. Example: 1 of 4 lessons -> 25.
 * RETURNS: { completed, total, percent }.
 * EXPECTED ANALYTICS RESULT: none directly; "percent" is sent as
 *   course_progress_percent with lesson_completed.
 */
function getCourseProgress(course) {
  var lessons = getCourseLessons(course);
  var completed = lessons.filter(function (item) {
    return isLessonComplete(course.id, item.lesson.id);
  }).length;
  return {
    completed: completed,
    total: lessons.length,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0
  };
}

/** FUNCTION: getQuizAttempts(quizId) - list of saved attempts (oldest first). Analytics: none. */
function getQuizAttempts(quizId) {
  return getProgress().quizAttempts[quizId] || [];
}

/** FUNCTION: isQuizPassed(quizId) - true when any attempt reached the pass mark. Analytics: none. */
function isQuizPassed(quizId) {
  return getQuizAttempts(quizId).some(function (attempt) {
    return attempt.passed;
  });
}

/** FUNCTION: isCourseCompleted(courseId) - true/false. Analytics: none. */
function isCourseCompleted(courseId) {
  return Boolean(getProgress().completedCourses[courseId]);
}

/** FUNCTION: getEnrolledCourses() - course objects, most recently enrolled first. Analytics: none. */
function getEnrolledCourses() {
  var enrollments = getProgress().enrollments;
  return window.COURSES.filter(function (course) {
    return enrollments[course.id];
  }).sort(function (a, b) {
    return enrollments[b.id] < enrollments[a.id] ? -1 : 1;
  });
}

/* ============================================================
 * C. CHANGES (each returns whether it was saved and if it was new)
 * ============================================================ */

/**
 * FUNCTION: enrollInCourse(courseId)
 * PURPOSE: Records the enrolment date.
 * RETURNS: { ok, firstTime }. ok=false when storage failed.
 * EXPECTED ANALYTICS RESULT: none here; courses.js sends course_enrolled
 *   only when ok && firstTime.
 */
function enrollInCourse(courseId) {
  var state = getProgress();
  if (state.enrollments[courseId]) {
    return { ok: true, firstTime: false };
  }
  state.enrollments[courseId] = new Date().toISOString();
  var ok = saveProgress();
  if (!ok) {
    delete state.enrollments[courseId]; // keep memory and storage in agreement
  }
  return { ok: ok, firstTime: true };
}

/**
 * FUNCTION: markLessonComplete(courseId, lessonId)
 * PURPOSE: Records the completion time of one lesson.
 * RETURNS: { ok, firstTime }.
 * EXPECTED ANALYTICS RESULT: none here; lessons.js sends lesson_completed
 *   only when ok && firstTime, so re-opening a completed lesson cannot
 *   create a second completion.
 */
function markLessonComplete(courseId, lessonId) {
  var state = getProgress();
  var key = lessonKey(courseId, lessonId);
  if (state.completedLessons[key]) {
    return { ok: true, firstTime: false };
  }
  state.completedLessons[key] = new Date().toISOString();
  var ok = saveProgress();
  if (!ok) {
    delete state.completedLessons[key];
  }
  return { ok: ok, firstTime: true };
}

/**
 * FUNCTION: recordQuizAttempt(quizId, result)
 * PURPOSE: Stores one graded attempt as a NEW entry (attempts are never
 *   overwritten, so retries stay separate in the history).
 * INPUTS: result { correct, total, score, passed, answers }.
 * RETURNS: { ok, attempt (number), firstPass (true when this is the
 *   first attempt ever to reach the pass mark) }.
 * EXPECTED ANALYTICS RESULT: none here; quizzes.js uses the result for
 *   quiz_submitted (every saved attempt) and quiz_completed (firstPass).
 */
function recordQuizAttempt(quizId, result) {
  var state = getProgress();
  var attempts = state.quizAttempts[quizId] || [];
  var wasPassed = isQuizPassed(quizId);
  var entry = {
    attempt: attempts.length + 1,
    correct: result.correct,
    total: result.total,
    score: result.score,
    passed: result.passed,
    answers: result.answers,
    submittedAt: new Date().toISOString()
  };
  attempts.push(entry);
  state.quizAttempts[quizId] = attempts;
  var ok = saveProgress();
  if (!ok) {
    attempts.pop();
  }
  return { ok: ok, attempt: entry.attempt, firstPass: ok && result.passed && !wasPassed };
}

/**
 * FUNCTION: checkCourseCompletion(course)
 *
 * PURPOSE: A course is COMPLETED when every lesson is complete AND the
 *   course quiz has been passed (score >= passMarkPercent). The first
 *   time both are true, the date is saved.
 * RETURNS: true only at that first moment (and only if saved).
 * EXPECTED ANALYTICS RESULT: none here; the caller (lessons.js or
 *   quizzes.js) sends course_completed once when this returns true.
 *   Restoring progress or reopening pages returns false.
 */
function checkCourseCompletion(course) {
  var state = getProgress();
  if (state.completedCourses[course.id]) {
    return false;
  }
  var progress = getCourseProgress(course);
  if (progress.completed < progress.total || !isQuizPassed(course.quiz.id)) {
    return false;
  }
  state.completedCourses[course.id] = new Date().toISOString();
  if (!saveProgress()) {
    delete state.completedCourses[course.id];
    return false;
  }
  return true;
}

/**
 * FUNCTION: saveLessonNotes(courseId, lessonId, text)
 * PURPOSE: Stores the student's notes for one lesson (this browser only).
 * RETURNS: { ok, changed } - changed=false when the text is the same as
 *   the saved version.
 * EXPECTED ANALYTICS RESULT: none here; lessons.js sends
 *   lesson_notes_saved (without the text) when ok && changed.
 */
function saveLessonNotes(courseId, lessonId, text) {
  var state = getProgress();
  var key = lessonKey(courseId, lessonId);
  var previous = state.notes[key];
  if (previous && previous.text === text) {
    return { ok: true, changed: false };
  }
  state.notes[key] = { text: text, savedAt: new Date().toISOString() };
  var ok = saveProgress();
  if (!ok) {
    if (previous) {
      state.notes[key] = previous;
    } else {
      delete state.notes[key];
    }
  }
  return { ok: ok, changed: true };
}

/**
 * FUNCTION: planStudySession(date, courseId, minutes)
 * PURPOSE: Adds a planned session to the Learning Calendar.
 * RETURNS: true when saved.
 * EXPECTED ANALYTICS RESULT: none (planning is not one of the required
 *   events; add "study_session_planned" in dashboard.js if you need it).
 */
function planStudySession(date, courseId, minutes) {
  var state = getProgress();
  state.plannedSessions.push({ id: "s" + Date.now(), date: date, courseId: courseId, minutes: minutes });
  return saveProgress();
}

/** FUNCTION: removeStudySession(id) - deletes a planned session. Analytics: none. */
function removeStudySession(id) {
  var state = getProgress();
  state.plannedSessions = state.plannedSessions.filter(function (session) {
    return session.id !== id;
  });
  return saveProgress();
}

/** FUNCTION: rememberLastVisited(courseId, lessonId) - for "Continue learning". Analytics: none. */
function rememberLastVisited(courseId, lessonId) {
  getProgress().lastVisited = { courseId: courseId, lessonId: lessonId, at: new Date().toISOString() };
  saveProgress();
}

/* ============================================================
 * D. STATISTICS
 * ============================================================ */

/** FUNCTION: localDateKey(date) - "YYYY-MM-DD" in the student's time zone. Analytics: none. */
function localDateKey(date) {
  var d = date || new Date();
  var month = String(d.getMonth() + 1).padStart(2, "0");
  var day = String(d.getDate()).padStart(2, "0");
  return d.getFullYear() + "-" + month + "-" + day;
}

/**
 * FUNCTION: getLearningStats()
 *
 * PURPOSE: The headline numbers of the dashboard, all calculated from
 *   the saved record:
 *   - enrolled: number of enrolled courses
 *   - completedLessons: completed lessons (all courses)
 *   - completedCourses: courses meeting the completion rule
 *   - totalSeconds: measured active study time (study timer)
 *   - quizAverage: average score of ALL saved quiz attempts, or null
 *   - quizAttempts: number of saved attempts
 *   - completionPercent: completed lessons / total lessons of the
 *     ENROLLED courses x 100 (0 when not enrolled anywhere)
 *   - streak: see getStudyStreak()
 * EXPECTED ANALYTICS RESULT: none (display only).
 */
function getLearningStats() {
  var state = getProgress();
  var enrolled = getEnrolledCourses();
  var lessonsDone = 0;
  var lessonsTotal = 0;
  enrolled.forEach(function (course) {
    var p = getCourseProgress(course);
    lessonsDone += p.completed;
    lessonsTotal += p.total;
  });
  var scores = [];
  Object.keys(state.quizAttempts).forEach(function (quizId) {
    state.quizAttempts[quizId].forEach(function (attempt) {
      scores.push(attempt.score);
    });
  });
  var totalSeconds = Object.keys(state.studyLog).reduce(function (sum, day) {
    return sum + state.studyLog[day];
  }, 0);
  return {
    enrolled: enrolled.length,
    completedLessons: Object.keys(state.completedLessons).length,
    completedCourses: Object.keys(state.completedCourses).length,
    totalSeconds: totalSeconds,
    quizAverage: scores.length ? Math.round(scores.reduce(function (a, b) { return a + b; }, 0) / scores.length) : null,
    quizAttempts: scores.length,
    completionPercent: lessonsTotal ? Math.round((lessonsDone / lessonsTotal) * 100) : 0,
    streak: getStudyStreak()
  };
}

/**
 * FUNCTION: getWeeklyActivity()
 * PURPOSE: The last 7 days (oldest first, today last) with the measured
 *   active study minutes of each day. Days without activity are 0 -
 *   nothing is invented.
 * RETURNS: [ { date, label ("Mon"), minutes, seconds, isToday } x 7 ].
 * EXPECTED ANALYTICS RESULT: none (chart data only).
 */
function getWeeklyActivity() {
  var log = getProgress().studyLog;
  var days = [];
  for (var offset = 6; offset >= 0; offset--) {
    var date = new Date();
    date.setDate(date.getDate() - offset);
    var key = localDateKey(date);
    var seconds = log[key] || 0;
    days.push({
      date: key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      seconds: seconds,
      minutes: Math.round(seconds / 60),
      isToday: offset === 0
    });
  }
  return days;
}

/**
 * FUNCTION: getStudyStreak()
 * PURPOSE: Consecutive days with activity (measured study time OR a
 *   completed lesson), counting back from today. If today has no activity
 *   yet, the count starts from yesterday, so a streak is not "lost"
 *   before the day is over.
 * RETURNS: number of days.
 * EXPECTED ANALYTICS RESULT: none.
 */
function getStudyStreak() {
  var state = getProgress();
  var activeDays = {};
  Object.keys(state.studyLog).forEach(function (day) {
    if (state.studyLog[day] > 0) {
      activeDays[day] = true;
    }
  });
  Object.keys(state.completedLessons).forEach(function (key) {
    activeDays[localDateKey(new Date(state.completedLessons[key]))] = true;
  });
  var cursor = new Date();
  if (!activeDays[localDateKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  var streak = 0;
  while (activeDays[localDateKey(cursor)]) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/* ============================================================
 * E. STUDY TIMER (lesson and quiz pages only)
 * ============================================================ */

/**
 * FUNCTION: startStudyTimer(courseId, lessonId)
 *
 * PURPOSE: Measures ACTIVE study time on this page (definition at the top
 *   of this file). Adds the seconds to studyLog[today] and, on lesson
 *   pages, to lessonSeconds[course/lesson]. Saves every
 *   timerSaveEverySeconds and when the page is hidden or closed.
 * INPUTS: courseId; lessonId (null on the quiz page).
 * RETURNS: { getSessionSeconds() } - seconds measured on this page load.
 * EXPECTED WEBSITE RESULT: the "Active study time" counter on the lesson
 *   page increases only while the student is active.
 * EXPECTED ANALYTICS RESULT: no event of its own. The measured total for
 *   the lesson is sent as lesson_duration_seconds with lesson_completed.
 *   It is NOT the same as GA4 engagement time (GA4 measures foreground
 *   time of the page, without our idle rule).
 * FAILURE: storage blocked -> time is counted for this page only.
 */
function startStudyTimer(courseId, lessonId) {
  var idleLimit = window.SITE_CONFIG.learning.idleSeconds * 1000;
  var saveEvery = window.SITE_CONFIG.learning.timerSaveEverySeconds;
  var lastActivity = Date.now();
  var pending = 0;       // seconds not yet written to storage
  var sessionSeconds = 0;

  function noteActivity() {
    lastActivity = Date.now();
  }
  ["pointermove", "pointerdown", "keydown", "scroll", "touchstart", "wheel"].forEach(function (type) {
    window.addEventListener(type, noteActivity, { passive: true });
  });

  function flush() {
    if (pending === 0) {
      return;
    }
    var state = getProgress();
    var today = localDateKey();
    state.studyLog[today] = (state.studyLog[today] || 0) + pending;
    if (lessonId) {
      var key = lessonKey(courseId, lessonId);
      state.lessonSeconds[key] = (state.lessonSeconds[key] || 0) + pending;
    }
    pending = 0;
    saveProgress();
  }

  window.setInterval(function () {
    var visible = document.visibilityState === "visible";
    var active = Date.now() - lastActivity < idleLimit;
    if (visible && active) {
      pending++;
      sessionSeconds++;
      if (pending >= saveEvery) {
        flush();
      }
    }
  }, 1000);

  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "hidden") {
      flush();
    }
  });
  window.addEventListener("pagehide", flush);

  return {
    getSessionSeconds: function () { return sessionSeconds; },
    flush: flush
  };
}

/* ============================================================
 * F. SAMPLE DATA AND RESET (Settings page)
 * ============================================================ */

/**
 * FUNCTION: loadSampleProgress()
 *
 * PURPOSE: Replaces the record with a CLEARLY LABELLED sample student
 *   (isSampleData: true) so the dashboard can be explored before real
 *   use. Every page that shows these numbers displays a "Sample data"
 *   badge. Generated from fixed rules (no random numbers).
 * EXPECTED ANALYTICS RESULT: NO events. Loading sample data is not a
 *   learning action, so no lesson_completed / quiz_submitted is sent.
 */
function loadSampleProgress() {
  var state = createEmptyProgress();
  state.isSampleData = true;
  state.settings = getProgress().settings; // keep the student's motion preference
  state.profile.displayName = "Sample Student";
  var now = new Date();
  function daysAgo(n, hour) {
    var d = new Date(now);
    d.setDate(d.getDate() - n);
    d.setHours(hour || 18, 0, 0, 0);
    return d;
  }
  var plan = [
    { id: "intro-cybersecurity", enrolledDaysAgo: 9, lessonsDone: 4, quizScores: [60, 100] },
    { id: "python-fundamentals", enrolledDaysAgo: 6, lessonsDone: 3, quizScores: [] },
    { id: "web-development", enrolledDaysAgo: 4, lessonsDone: 2, quizScores: [80] },
    { id: "design-a-room", enrolledDaysAgo: 2, lessonsDone: 1, quizScores: [] }
  ];
  var dayCounter = 0;
  plan.forEach(function (item) {
    var course = findCourse(item.id);
    state.enrollments[item.id] = daysAgo(item.enrolledDaysAgo, 9).toISOString();
    getCourseLessons(course).slice(0, item.lessonsDone).forEach(function (entry) {
      state.completedLessons[entry.key] = daysAgo(dayCounter % 6, 19).toISOString();
      state.lessonSeconds[entry.key] = entry.lesson.minutes * 60;
      dayCounter++;
    });
    var total = course.quiz.questions.length;
    state.quizAttempts[course.quiz.id] = item.quizScores.map(function (score, index) {
      return { attempt: index + 1, correct: score * total / 100, total: total, score: score,
        passed: score >= window.SITE_CONFIG.learning.passMarkPercent, answers: [],
        submittedAt: daysAgo(1, 20).toISOString() };
    });
  });
  state.completedCourses["intro-cybersecurity"] = daysAgo(1, 20).toISOString();
  // Fixed sample minutes for the last 7 days (oldest first).
  [25, 40, 0, 55, 30, 45, 20].forEach(function (minutes, index) {
    if (minutes > 0) {
      state.studyLog[localDateKey(daysAgo(6 - index))] = minutes * 60;
    }
  });
  state.plannedSessions.push({ id: "s-sample", date: localDateKey(daysAgo(-2)), courseId: "python-fundamentals", minutes: 30 });
  progressState = state;
  return saveProgress();
}

/**
 * FUNCTION: resetProgress()
 * PURPOSE: Deletes the whole record from this browser (Settings page,
 *   after confirmation). Consent choice is kept.
 * EXPECTED ANALYTICS RESULT: none. Later completions count as "first"
 *   again, so a reset student CAN produce new completion events - by
 *   design, documented in ANALYTICS_TEST_CASES.md.
 */
function resetProgress() {
  try {
    window.localStorage.removeItem(window.SITE_CONFIG.storageKey);
  } catch (error) {
    // nothing stored or storage blocked: the in-memory record is reset anyway
  }
  progressState = createEmptyProgress();
}
