/**
 * ============================================================
 * FILE: assets/js/config.js
 * ============================================================
 *
 * 1. PURPOSE
 *    Every setting a beginner may want to change, in one place:
 *    analytics IDs, learning rules (pass mark, idle time), optional
 *    backend address and the clearly labelled demonstration data
 *    (learning connections, messages).
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. SITE_CONFIG.analytics  GTM / GA4 IDs and consent
 *    B. SITE_CONFIG.learning   quiz pass mark, study-timer rules
 *    C. SITE_CONFIG.backend    optional server for progress (empty = demo)
 *    D. DEMO_CONNECTIONS       sample "friends" shown on the dashboard
 *    E. DEMO_MESSAGES          sample messages in the Messages panel
 *
 * 3. DEPENDENCIES
 *    None. Loaded FIRST on every page.
 *
 * 4. HOW TO CUSTOMIZE IT (safe to edit)
 *    - Analytics: replace GTM-XXXXXXX with your container ID.
 *    - passMarkPercent: the score needed to pass a quiz (default 70).
 *    - idleSeconds: after this many seconds without mouse, keyboard,
 *      touch or scroll activity the study timer pauses.
 *    - Course content lives in course-data.js, not here.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    analytics.js reads SITE_CONFIG.analytics. GA4 (G-XXXXXXXXXX) is
 *    configured INSIDE Google Tag Manager, so this site never loads
 *    gtag.js itself and GA4 cannot be installed twice.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Replace the placeholders to activate analytics:
//   gtmContainerId: your Google Tag Manager container (GTM-ABC1234)
//   ga4MeasurementId: for reference only; enter it in the GTM Google tag
// While the placeholders stay, events are still pushed to
// window.dataLayer and printed in the console, but nothing is sent.

window.SITE_CONFIG = {
  siteName: "EduSpace",

  /* A. Analytics -------------------------------------------- */
  analytics: {
    gtmContainerId: "GTM-XXXXXXX",
    ga4MeasurementId: "G-XXXXXXXXXX",
    requireConsent: true,   // GTM loads only after the student clicks "Accept"
    debugLogging: true      // print "[EduSpace analytics] ..." lines in the console
  },

  /* B. Learning rules --------------------------------------- */
  learning: {
    passMarkPercent: 70,     // quiz score needed to pass (and to complete a course)
    idleSeconds: 60,         // study timer pauses after 60 s without activity
    timerSaveEverySeconds: 15, // how often measured study time is written to storage
    notesMaxLength: 4000     // characters allowed in one lesson's notes
  },

  /* C. Optional backend -------------------------------------- */
  // Empty = demonstration mode: progress is stored only in THIS browser
  // (localStorage). A real deployment would point this to an
  // authenticated API (see README section "Backend") so progress follows
  // the student across devices.
  backend: {
    progressApiUrl: ""
  },

  storageKey: "eduspace_progress_v1",
  consentStorageKey: "eduspace_analytics_consent"
};

/* D. Demonstration learning connections -------------------------
 * SAMPLE people. They are not real users and their numbers are not
 * measured. The dashboard labels them "Demo connections".            */
window.DEMO_CONNECTIONS = [
  { id: "c1", name: "Maya", color: "#F1C1C4", status: "Studying Python" },
  { id: "c2", name: "Omar", color: "#DCD5FA", status: "Finished a quiz" },
  { id: "c3", name: "Lena", color: "#BCEED7", status: "On a 4-day streak" },
  { id: "c4", name: "Jonas", color: "#F9E2C8", status: "Learning SQL" },
  { id: "c5", name: "Sara", color: "#C9E4F6", status: "Enrolled in UX" }
];

/* E. Demonstration messages --------------------------------------
 * SAMPLE messages shown in the Messages panel. Nothing is sent or
 * received; replying is disabled in demo mode.                      */
window.DEMO_MESSAGES = [
  { id: "msg1", from: "EduSpace Team", time: "Today", text: "Welcome to EduSpace! This is a demonstration platform: your progress is saved only in this browser." },
  { id: "msg2", from: "Maya (demo connection)", time: "Yesterday", text: "Want to compare quiz scores after the Python course?" },
  { id: "msg3", from: "Study reminder", time: "2 days ago", text: "Tip: plan your next study session on the Learning Calendar." }
];
