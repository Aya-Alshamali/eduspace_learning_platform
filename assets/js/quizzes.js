/**
 * ============================================================
 * FILE: assets/js/quizzes.js
 * ============================================================
 *
 * 1. PURPOSE
 *    The quiz system (quiz.html?course=<id>): intro screen with attempt
 *    history, one question at a time with four options, submission,
 *    automatic grading, per-question feedback, retry and the course
 *    completion check.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. initQuizPage()      validation, enrolment gate, intro screen
 *    B. startQuiz()         quiz_started
 *    C. Question screen     showQuestion(), selectAnswer(), goToQuestion()
 *    D. gradeQuiz()         the scoring formula (pure function)
 *    E. submitQuiz()        quiz_submitted, quiz_completed, course_completed
 *    F. Results + history
 *
 * 3. DEPENDENCIES
 *    config.js (passMarkPercent), course-data.js (questions), analytics.js,
 *    progress.js, main.js, courses.js (handleEnroll), lessons.js
 *    (sendCourseCompletedIfDone).
 *
 * 4. HOW TO CUSTOMIZE IT
 *    Questions live in course-data.js. The pass mark is in config.js.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    quiz_started, quiz_submitted, quiz_completed (and course_completed
 *    via lessons.js). Moving between questions never sends events and
 *    never changes the address, so it creates NO page views.
 *
 * SCORING (real JavaScript logic, never random or preset)
 *    Quiz Score = (Correct Answers / Total Questions) x 100, rounded to a
 *    whole number. 2 of 5 correct = 40 %. Passed when score >= 70 %.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// quiz_started    each click on "Start quiz" / "Retry quiz" (one per attempt)
// quiz_submitted  each graded attempt that was SAVED
// quiz_completed  the FIRST attempt that reaches the pass mark (once per quiz)
// course_completed when that pass is the last requirement of the course
// Parameters: quiz_id, course_id, course_category, quiz_attempt,
// quiz_score, quiz_passed, correct_answers, questions_total.
// Answer TEXT is never sent.

var quizRun = null; // { course, answers[], current, attempt, submitted }

/* ============================================================
 * A. PAGE START
 * ============================================================ */

/**
 * FUNCTION: initQuizPage()
 * PURPOSE: Reads ?course=, shows "Quiz not found", the enrolment gate or
 *   the intro screen, and starts the study timer.
 * BUTTONS: "Enroll and continue" (gate) -> course_enrolled;
 *   "Start quiz" -> startQuiz() -> quiz_started.
 * EXPECTED ANALYTICS RESULT: no event on page load.
 */
function initQuizPage() {
  var root = document.getElementById("quiz-page");
  if (!root) {
    return;
  }
  var course = findCourse(getQueryParam("course"));
  if (!course) {
    root.innerHTML = '<div class="panel empty-state"><h1>Quiz not found</h1><p>This quiz link is not valid.</p>' +
      '<a class="btn btn--dark" href="catalog.html">Browse the catalog</a></div>';
    return;
  }
  quizRun = { course: course, answers: [], current: 0, attempt: 0, submitted: false };
  document.title = course.quiz.title + " | EduSpace";
  document.querySelectorAll("[data-quiz-course-link]").forEach(function (link) {
    link.href = "course.html?id=" + course.id;
    if (link.closest(".breadcrumb")) {
      link.textContent = course.title; // the "Back to course" button keeps its label
    }
  });
  document.getElementById("quiz-title").textContent = course.quiz.title;

  if (!isEnrolled(course.id)) {
    showQuizScreen("gate");
    document.getElementById("quiz-gate-btn").addEventListener("click", function (event) {
      event.currentTarget.disabled = true;
      if (handleEnroll(course, "quiz_gate")) {
        showIntro();
      } else {
        event.currentTarget.disabled = false;
      }
    });
  } else {
    showIntro();
  }
  startStudyTimer(course.id, null);
  connectQuizButtons();
}

/** FUNCTION: showQuizScreen(name) - shows one of gate / intro / runner / results. Analytics: none. */
function showQuizScreen(name) {
  document.querySelectorAll("[data-quiz-screen]").forEach(function (screen) {
    screen.hidden = screen.getAttribute("data-quiz-screen") !== name;
  });
}

/**
 * FUNCTION: showIntro()
 * PURPOSE: Intro screen: number of questions, pass mark, lessons done,
 *   best score and the attempt history.
 * EXPECTED ANALYTICS RESULT: none.
 */
function showIntro() {
  var course = quizRun.course;
  var attempts = getQuizAttempts(course.quiz.id);
  var progress = getCourseProgress(course);
  document.getElementById("quiz-intro-facts").innerHTML =
    '<li><strong>' + course.quiz.questions.length + '</strong><span>questions</span></li>' +
    '<li><strong>' + window.SITE_CONFIG.learning.passMarkPercent + '%</strong><span>pass mark</span></li>' +
    '<li><strong>' + attempts.length + '</strong><span>' + (attempts.length === 1 ? "attempt" : "attempts") + ' so far</span></li>' +
    '<li><strong>' + progress.completed + '/' + progress.total + '</strong><span>lessons done</span></li>';
  document.getElementById("quiz-intro-note").textContent = progress.completed < progress.total ?
    "Tip: finishing the lessons first helps. You can take the quiz at any time; the course is completed when all lessons are done AND the quiz is passed." :
    "All lessons are done. Pass the quiz to complete the course.";
  document.getElementById("start-quiz-btn").innerHTML = icon("play") + (attempts.length ? "Retry quiz (attempt " + (attempts.length + 1) + ")" : "Start quiz");
  renderAttemptHistory(document.getElementById("quiz-history-intro"));
  showQuizScreen("intro");
}

/** FUNCTION: connectQuizButtons() - runner + results buttons. Analytics: see each handler. */
function connectQuizButtons() {
  document.getElementById("start-quiz-btn").addEventListener("click", startQuiz);
  document.getElementById("retry-quiz-btn").addEventListener("click", startQuiz);
  document.getElementById("quiz-prev").addEventListener("click", function () { goToQuestion(quizRun.current - 1); });
  document.getElementById("quiz-next").addEventListener("click", function () {
    if (quizRun.current === quizRun.course.quiz.questions.length - 1) {
      submitQuiz();
    } else {
      goToQuestion(quizRun.current + 1);
    }
  });
  document.getElementById("quiz-options").addEventListener("change", function (event) {
    if (event.target.name === "answer") {
      selectAnswer(Number(event.target.value));
    }
  });
  document.getElementById("quiz-dots").addEventListener("click", function (event) {
    var dot = event.target.closest("[data-question]");
    if (dot) {
      goToQuestion(Number(dot.getAttribute("data-question")));
    }
  });
}

/* ============================================================
 * B. START
 * ============================================================ */

/**
 * FUNCTION: startQuiz()
 *
 * PURPOSE: Begins a new attempt with empty answers at question 1.
 * USER ACTION: "Start quiz" (intro) or "Retry quiz" (results).
 * EXPECTED WEBSITE RESULT: question 1 of 5 appears with a soft transition.
 * EXPECTED ANALYTICS EVENT: quiz_started
 * PARAMETERS: quiz_id, course_id, course_category, quiz_attempt (the
 *   number this attempt will get if submitted), questions_total.
 * EXPECTED GA4 EFFECT: +1 per started attempt. An attempt started but
 *   never submitted shows up as quiz_started without quiz_submitted
 *   (a useful drop-off measure). Page views unchanged.
 * VERIFICATION: GTM Preview -> Start quiz -> one quiz_started, attempt 1.
 *   Retry -> one more with attempt 2.
 * DUPLICATE PREVENTION: the button belongs to a screen that is hidden as
 *   soon as the attempt starts, so one click = one attempt.
 */
function startQuiz() {
  var course = quizRun.course;
  quizRun.answers = course.quiz.questions.map(function () { return null; });
  quizRun.current = 0;
  quizRun.submitted = false;
  quizRun.attempt = getQuizAttempts(course.quiz.id).length + 1;
  document.getElementById("quiz-error").hidden = true;
  showQuizScreen("runner");
  showQuestion("none");
  trackAnalyticsEvent("quiz_started", {
    quiz_id: course.quiz.id,
    course_id: course.id,
    course_category: course.category,
    quiz_attempt: quizRun.attempt,
    questions_total: course.quiz.questions.length
  });
}

/* ============================================================
 * C. QUESTION SCREEN (no analytics)
 * ============================================================ */

/**
 * FUNCTION: showQuestion(direction)
 * PURPOSE: Renders the current question, its four options (A-D), the
 *   progress dots and the Previous / Next (or Submit) buttons.
 *   direction "next" / "prev" chooses the slide direction of the
 *   transition.
 * EXPECTED ANALYTICS RESULT: none (no events, no page views).
 */
function showQuestion(direction) {
  var questions = quizRun.course.quiz.questions;
  var q = questions[quizRun.current];
  var card = document.getElementById("quiz-card");
  card.classList.remove("slide-next", "slide-prev");
  void card.offsetWidth; // restart the CSS animation
  if (direction === "next" || direction === "prev") {
    card.classList.add("slide-" + direction);
  }
  document.getElementById("quiz-counter").textContent = "Question " + (quizRun.current + 1) + " of " + questions.length;
  document.getElementById("quiz-question").textContent = q.text;
  document.getElementById("quiz-options").innerHTML = '<legend class="visually-hidden">' + escapeHtml(q.text) + '</legend>' +
    q.options.map(function (option, i) {
      var checked = quizRun.answers[quizRun.current] === i;
      return '<label class="option' + (checked ? " is-selected" : "") + '">' +
        '<input type="radio" name="answer" value="' + i + '"' + (checked ? " checked" : "") + '>' +
        '<span class="option__letter">' + "ABCD".charAt(i) + '</span><span class="option__text">' + escapeHtml(option) + '</span></label>';
    }).join("");
  document.getElementById("quiz-dots").innerHTML = questions.map(function (question, i) {
    var cls = "dot" + (i === quizRun.current ? " is-current" : "") + (quizRun.answers[i] !== null ? " is-answered" : "");
    // BUTTON: question dot -> goToQuestion(i). Analytics: none.
    return '<button type="button" class="' + cls + '" data-question="' + i + '" aria-label="Question ' + (i + 1) +
      (quizRun.answers[i] !== null ? ", answered" : ", not answered") + '"' + (i === quizRun.current ? ' aria-current="step"' : '') + '>' + (i + 1) + '</button>';
  }).join("");
  document.getElementById("quiz-prev").disabled = quizRun.current === 0;
  var last = quizRun.current === questions.length - 1;
  document.getElementById("quiz-next").innerHTML = last ? icon("check") + "Submit quiz" : "Next question " + icon("arrow");
  document.getElementById("quiz-next").classList.toggle("btn--dark", last);
  updateAnsweredCount();
}

/** FUNCTION: selectAnswer(index) - stores the choice and highlights it. Analytics: none. */
function selectAnswer(index) {
  quizRun.answers[quizRun.current] = index;
  document.querySelectorAll("#quiz-options .option").forEach(function (label, i) {
    label.classList.toggle("is-selected", i === index);
  });
  var dot = document.querySelector('#quiz-dots [data-question="' + quizRun.current + '"]');
  if (dot) {
    dot.classList.add("is-answered");
  }
  document.getElementById("quiz-error").hidden = true;
  updateAnsweredCount();
}

/** FUNCTION: goToQuestion(index) - moves within the attempt. Analytics: none. */
function goToQuestion(index) {
  var total = quizRun.course.quiz.questions.length;
  if (index < 0 || index >= total || index === quizRun.current) {
    return;
  }
  var direction = index > quizRun.current ? "next" : "prev";
  quizRun.current = index;
  showQuestion(direction);
  var first = document.querySelector("#quiz-options input");
  if (first) {
    first.focus({ preventScroll: true });
  }
}

/** FUNCTION: updateAnsweredCount() - "3 of 5 answered". Analytics: none. */
function updateAnsweredCount() {
  var answered = quizRun.answers.filter(function (a) { return a !== null; }).length;
  document.getElementById("quiz-answered").textContent = answered + " of " + quizRun.answers.length + " answered";
}

/* ============================================================
 * D. GRADING (pure function - easy to test in the console)
 * ============================================================ */

/**
 * FUNCTION: gradeQuiz(questions, answers, passMark)
 *
 * PURPOSE: Calculates the result of one attempt.
 *   Quiz Score = (Correct Answers / Total Questions) x 100, rounded.
 * INPUTS: questions (with "correct" index), answers (chosen indexes),
 *   passMark (percent).
 * RETURNS: { correct, total, score, passed, answers }.
 * EXAMPLE: 2 correct of 5 -> { correct: 2, total: 5, score: 40, passed: false }.
 * EXPECTED ANALYTICS RESULT: none directly; its result becomes
 *   quiz_score / correct_answers / quiz_passed in quiz_submitted.
 * TEST IN THE CONSOLE:
 *   gradeQuiz([{correct:1},{correct:0}], [1, 3], 70) -> score 50, passed false
 */
function gradeQuiz(questions, answers, passMark) {
  var correct = 0;
  questions.forEach(function (question, i) {
    if (answers[i] === question.correct) {
      correct++;
    }
  });
  var total = questions.length;
  var score = total ? Math.round((correct / total) * 100) : 0;
  return { correct: correct, total: total, score: score, passed: score >= passMark, answers: answers.slice() };
}

/* ============================================================
 * E. SUBMIT
 * ============================================================ */

/**
 * FUNCTION: submitQuiz()
 *
 * PURPOSE: Grades the attempt, saves it and shows the results.
 * USER ACTION: "Submit quiz" on the last question.
 * EXPECTED WEBSITE RESULT:
 *   - Unanswered questions -> message "Answer all questions" and the
 *     dots of the missing questions are marked; nothing is saved.
 *   - Otherwise: the score ring animates to the calculated score, each
 *     question shows correct / incorrect with the explanation, the
 *     attempt appears in the history, Retry is offered.
 * EXPECTED ANALYTICS EVENTS:
 *   1. quiz_submitted (every saved attempt)
 *      quiz_id, course_id, course_category, quiz_attempt, quiz_score,
 *      quiz_passed, correct_answers, questions_total
 *   2. quiz_completed (only the FIRST attempt that passes)
 *      quiz_id, course_id, course_category, quiz_attempt, quiz_score
 *   3. course_completed (only if this pass completes the course)
 * EXPECTED GA4 EFFECT:
 *   - Fail (e.g. 40 %): ONE quiz_submitted, NO quiz_completed - no
 *     passing result is fabricated.
 *   - First pass: quiz_submitted + quiz_completed.
 *   - A later retry after passing: quiz_submitted only (attempt +1).
 *   - Page views unchanged (results appear on the same page).
 * VERIFICATION: GTM Preview -> answer 2 of 5 correctly -> one
 *   quiz_submitted with quiz_score 40 and quiz_passed false.
 * FAILURE: storage blocked -> results are shown with a warning that
 *   they were NOT saved, and NO events are sent.
 * DUPLICATE PREVENTION: quizRun.submitted flag + the runner screen is
 *   hidden immediately, so double-clicking Submit saves one attempt.
 */
function submitQuiz() {
  if (quizRun.submitted) {
    return;
  }
  var course = quizRun.course;
  var missing = [];
  quizRun.answers.forEach(function (a, i) {
    if (a === null) {
      missing.push(i + 1);
    }
  });
  if (missing.length) {
    var error = document.getElementById("quiz-error");
    error.hidden = false;
    error.textContent = "Please answer every question before submitting. Missing: question " + missing.join(", ") + ".";
    missing.forEach(function (n) {
      var dot = document.querySelector('#quiz-dots [data-question="' + (n - 1) + '"]');
      if (dot) {
        dot.classList.add("is-missing");
      }
    });
    return;
  }
  quizRun.submitted = true;
  var result = gradeQuiz(course.quiz.questions, quizRun.answers, window.SITE_CONFIG.learning.passMarkPercent);
  var saved = recordQuizAttempt(course.quiz.id, result);
  showResults(result, saved);
  if (!saved.ok) {
    return;
  }
  trackAnalyticsEvent("quiz_submitted", {
    quiz_id: course.quiz.id,
    course_id: course.id,
    course_category: course.category,
    quiz_attempt: saved.attempt,
    quiz_score: result.score,
    quiz_passed: result.passed,
    correct_answers: result.correct,
    questions_total: result.total
  });
  if (saved.firstPass) {
    trackAnalyticsEvent("quiz_completed", {
      quiz_id: course.quiz.id,
      course_id: course.id,
      course_category: course.category,
      quiz_attempt: saved.attempt,
      quiz_score: result.score
    });
    sendCourseCompletedIfDone(course, "quiz");
  }
  renderAttemptHistory(document.getElementById("quiz-history-results"));
  updateResultsNextStep();
}

/* ============================================================
 * F. RESULTS + HISTORY (no analytics)
 * ============================================================ */

/**
 * FUNCTION: showResults(result, saved)
 * PURPOSE: Score ring, headline, feedback per question.
 * EXPECTED ANALYTICS RESULT: none.
 */
function showResults(result, saved) {
  var course = quizRun.course;
  showQuizScreen("results");
  var ring = document.getElementById("score-ring");
  ring.style.setProperty("--score", 0);
  ring.classList.toggle("is-pass", result.passed);
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(function () {
      ring.style.setProperty("--score", result.score);
    });
  });
  document.getElementById("score-value").textContent = result.score + "%";
  document.getElementById("results-headline").textContent = result.passed ? "Passed - great work!" : "Not passed yet";
  document.getElementById("results-text").textContent = result.correct + " of " + result.total + " correct. " +
    (result.passed ? "You reached the pass mark of " : "You need ") + window.SITE_CONFIG.learning.passMarkPercent + "%" +
    (result.passed ? "." : " to pass. Review the explanations and try again.");
  document.getElementById("results-attempt").textContent = saved.ok ?
    "Attempt " + saved.attempt + " saved " + (getProgress().isSampleData ? "(sample record)" : "in this browser") + "." :
    "Warning: this attempt could NOT be saved (browser storage blocked) and was not recorded.";
  document.getElementById("results-review").innerHTML = course.quiz.questions.map(function (q, i) {
    var chosen = result.answers[i];
    var ok = chosen === q.correct;
    return '<li class="review-item ' + (ok ? "is-correct" : "is-wrong") + '" style="--i:' + i + '">' +
      '<p class="review-item__q"><span class="review-item__badge">' + icon(ok ? "check" : "x") + (ok ? "Correct" : "Incorrect") + '</span>' + (i + 1) + '. ' + escapeHtml(q.text) + '</p>' +
      '<p>Your answer: <strong>' + "ABCD".charAt(chosen) + '. ' + escapeHtml(q.options[chosen]) + '</strong></p>' +
      (ok ? '' : '<p>Correct answer: <strong>' + "ABCD".charAt(q.correct) + '. ' + escapeHtml(q.options[q.correct]) + '</strong></p>') +
      '<p class="muted">' + escapeHtml(q.explanation) + '</p></li>';
  }).join("");
  document.getElementById("retry-quiz-btn").innerHTML = icon("refresh") + "Retry quiz";
  document.getElementById("results-headline").focus();
}

/** FUNCTION: updateResultsNextStep() - course-completed note or next lesson link. Analytics: none. */
function updateResultsNextStep() {
  var course = quizRun.course;
  var box = document.getElementById("results-next");
  var progress = getCourseProgress(course);
  if (isCourseCompleted(course.id)) {
    box.innerHTML = icon("award") + '<span>Course completed! It now appears as completed on your <a href="dashboard.html">learning dashboard</a>.</span>';
  } else if (isQuizPassed(course.quiz.id) && progress.completed < progress.total) {
    var next = findNextLesson(course);
    box.innerHTML = icon("book") + '<span>Quiz passed. Finish the remaining lessons to complete the course: <a href="lesson.html?course=' + course.id + '&lesson=' + next.lesson.id + '">' + escapeHtml(next.lesson.title) + '</a>.</span>';
  } else {
    box.innerHTML = icon("book") + '<span>Review the <a href="course.html?id=' + course.id + '">course lessons</a>, then retry.</span>';
  }
}

/**
 * FUNCTION: renderAttemptHistory(container)
 * PURPOSE: Table of every saved attempt (number, date, score, result).
 * EXPECTED ANALYTICS RESULT: none.
 */
function renderAttemptHistory(container) {
  var attempts = getQuizAttempts(quizRun.course.quiz.id);
  if (!attempts.length) {
    container.innerHTML = '<p class="muted small">No attempts yet.</p>';
    return;
  }
  container.innerHTML = '<table class="table"><caption class="visually-hidden">Attempt history</caption><thead><tr><th scope="col">Attempt</th><th scope="col">Date</th><th scope="col">Score</th><th scope="col">Result</th></tr></thead><tbody>' +
    attempts.slice().reverse().map(function (a) {
      return '<tr><td>#' + a.attempt + '</td><td>' + formatDate(a.submittedAt) + '</td><td>' + a.correct + '/' + a.total + ' (' + a.score + '%)</td>' +
        '<td><span class="pill ' + (a.passed ? "pill--pass" : "pill--fail") + '">' + (a.passed ? "Passed" : "Not passed") + '</span></td></tr>';
    }).join("") + '</tbody></table>';
}

document.addEventListener("DOMContentLoaded", initQuizPage);
