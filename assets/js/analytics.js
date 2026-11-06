/**
 * ============================================================
 * FILE: assets/js/analytics.js
 * ============================================================
 *
 * 1. PURPOSE
 *    The ONLY file that writes to window.dataLayer (the list Google Tag
 *    Manager reads). Every other file reports a learning action by calling
 *      trackAnalyticsEvent(name, parameters)      normal events
 *      trackEventOncePerPage(key, name, params)   events allowed once per page load
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    A. Consent (Accept / Decline banner, also changeable in Settings)
 *    B. loadGoogleTagManager(): the official GTM snippet
 *    C. Tracking functions + privacy helper for search terms
 *
 * 3. DEPENDENCIES
 *    config.js (SITE_CONFIG.analytics). Pages contain #consent-banner.
 *
 * 4. HOW TO CUSTOMIZE IT
 *    Normally only the IDs in config.js. To add an event, call
 *    trackAnalyticsEvent() where the action happens and document it in
 *    ANALYTICS_GUIDE.md and BUTTON_GUIDE.md.
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    GA4 is configured INSIDE GTM (Google tag G-XXXXXXXXXX + GA4 Event
 *    tags). No gtag.js is loaded here, so GA4 cannot be installed twice.
 *
 * PAGE VIEWS
 *    Multi-page site: each page load = ONE page_view, sent by the GA4
 *    Google tag in GTM (not by this file). Filters, quiz questions,
 *    dialogs and lesson completion never call history.pushState, so they
 *    cannot create extra page views. Going to the next lesson DOES load a
 *    new page (lesson.html?...) and therefore adds one page_view.
 *
 * PRIVACY
 *    Never pass student names, emails, note text or quiz answer text.
 *    Only anonymous ids (course_id, lesson_id, quiz_id), counts and
 *    scores. Search terms are cleaned by sanitizeSearchTerm().
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// Everything in this file. dataLayer is created immediately so events
// pushed before GTM finishes loading are not lost.

window.dataLayer = window.dataLayer || [];

var eventsSentThisPage = {}; // memory for trackEventOncePerPage()

/* ============================================================
 * A. CONSENT
 * ============================================================ */

/**
 * FUNCTION: isAnalyticsConfigured()
 * PURPOSE: true when config.js holds a real GTM ID (not GTM-XXXXXXX).
 * EXPECTED ANALYTICS RESULT: none directly.
 */
function isAnalyticsConfigured() {
  var id = window.SITE_CONFIG.analytics.gtmContainerId || "";
  return id.indexOf("GTM-") === 0 && id.indexOf("XXXX") === -1;
}

/**
 * FUNCTION: getConsentStatus()
 * PURPOSE: Returns "granted", "denied" or null (no choice yet).
 * EXPECTED ANALYTICS RESULT: none directly; decides whether GTM may load.
 */
function getConsentStatus() {
  try {
    return window.localStorage.getItem(window.SITE_CONFIG.consentStorageKey);
  } catch (error) {
    return null;
  }
}

/**
 * FUNCTION: handleConsentChoice(choice)
 *
 * PURPOSE: Saves the cookie choice ("granted" / "denied"); loads GTM after Accept.
 * USER ACTION: Accept / Decline in the banner, or the switch in Settings.
 * EXPECTED WEBSITE RESULT: the banner closes.
 * EXPECTED ANALYTICS EVENT: none of ours. After Accept GTM starts
 *   ("gtm.js") and the GA4 Google tag sends page_view.
 * PAGE VIEWS: +1 right after Accept (only with a real GTM ID).
 * ENGAGEMENT: students who decline are absent from all GA4 numbers.
 * VERIFICATION: Network tab shows googletagmanager.com/gtm.js after Accept.
 * FAILURE: storage blocked -> choice not remembered; banner returns next page.
 * DUPLICATE PREVENTION: loadGoogleTagManager() never inserts GTM twice.
 *   Withdrawing consent stops GTM from loading on the NEXT page load
 *   (a container already running on this page cannot be unloaded).
 */
function handleConsentChoice(choice) {
  try {
    window.localStorage.setItem(window.SITE_CONFIG.consentStorageKey, choice);
  } catch (error) {
    logAnalyticsDebug("Consent choice could not be saved (storage blocked).");
  }
  var banner = document.getElementById("consent-banner");
  if (banner) {
    banner.hidden = true;
  }
  if (choice === "granted") {
    loadGoogleTagManager();
  }
}

/* ============================================================
 * B. GOOGLE TAG MANAGER
 * ============================================================ */

/**
 * FUNCTION: loadGoogleTagManager()
 *
 * PURPOSE: Inserts the official GTM container snippet.
 * EXPECTED ANALYTICS EVENT: GTM's own "gtm.js"; the GA4 Google tag then
 *   sends page_view. PAGE VIEWS: +1 per page load after consent.
 * VERIFICATION: GTM Preview connects; gtm.js in the Network tab.
 * FAILURE: placeholder ID or no consent -> nothing loads (console note).
 *   Ad blockers may block gtm.js; the platform keeps working.
 * DUPLICATE PREVENTION: window.eduspaceGtmLoaded flag.
 */
function loadGoogleTagManager() {
  if (window.eduspaceGtmLoaded) {
    return;
  }
  if (!isAnalyticsConfigured()) {
    logAnalyticsDebug("GTM not loaded: replace GTM-XXXXXXX in config.js to activate analytics.");
    return;
  }
  if (window.SITE_CONFIG.analytics.requireConsent && getConsentStatus() !== "granted") {
    logAnalyticsDebug("GTM not loaded: waiting for consent.");
    return;
  }
  var containerId = window.SITE_CONFIG.analytics.gtmContainerId;

  // --- Official GTM snippet (ID read from config.js) ---
  window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
  var script = document.createElement("script");
  script.async = true;
  script.src = "https://www.googletagmanager.com/gtm.js?id=" + containerId;
  var firstScript = document.getElementsByTagName("script")[0];
  firstScript.parentNode.insertBefore(script, firstScript);
  // --- End of official snippet ---

  window.eduspaceGtmLoaded = true;
  logAnalyticsDebug("GTM container " + containerId + " loaded.");
}

/* ============================================================
 * C. TRACKING FUNCTIONS
 * ============================================================ */

/**
 * FUNCTION: trackAnalyticsEvent(eventName, parameters)
 *
 * PURPOSE: Records one event as { event: name, ...parameters }.
 * INPUTS: eventName (lowercase_with_underscores, see ANALYTICS_GUIDE.md);
 *   parameters: plain object with ANONYMOUS values only.
 * EXPECTED WEBSITE RESULT: nothing visible (console line in debug mode).
 * EXPECTED ANALYTICS EVENT: the push happens even without GTM; GA4
 *   RECEIVES it only when GTM has a matching Custom Event trigger and a
 *   GA4 Event tag.
 * EVENT COUNT: +1 per call. PAGE VIEWS: unchanged.
 * ENGAGEMENT: an event alone does not add engagement time; it makes a
 *   session "engaged" only if it is marked as a key event in GA4.
 * VERIFICATION: console line; GTM Preview event list; GA4 DebugView.
 * FAILURE: empty name -> ignored. Never throws, so tracking can never
 *   break a button.
 * DUPLICATE PREVENTION: callers call it once per real action; see each
 *   caller's comment.
 */
function trackAnalyticsEvent(eventName, parameters) {
  if (!eventName) {
    logAnalyticsDebug("trackAnalyticsEvent called without a name. Ignored.");
    return;
  }
  var data = { event: eventName };
  var extra = parameters || {};
  for (var key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      data[key] = extra[key];
    }
  }
  window.dataLayer.push(data);
  logAnalyticsDebug("event sent to dataLayer:", data);
}

/**
 * FUNCTION: trackEventOncePerPage(onceKey, eventName, parameters)
 *
 * PURPOSE: Sends an event only the FIRST time onceKey is used during this
 *   page load (e.g. course_list_viewed). The memory resets on a new page.
 * RETURNS: true if sent, false if already sent.
 * EVENT COUNT: at most +1 per page load per key.
 * DUPLICATE PREVENTION: this function exists for it. Re-rendering a list
 *   after a filter, or an animation replaying, cannot resend the event.
 */
function trackEventOncePerPage(onceKey, eventName, parameters) {
  if (eventsSentThisPage[onceKey]) {
    return false;
  }
  eventsSentThisPage[onceKey] = true;
  trackAnalyticsEvent(eventName, parameters);
  return true;
}

/**
 * FUNCTION: sanitizeSearchTerm(rawTerm)
 *
 * PURPOSE: Prepares a search term for GA4 without personal data.
 *   Lower-cases, trims, shortens to 50 characters, and replaces the term
 *   with "[redacted]" when it looks like an email address or a phone
 *   number (an "@" or 7+ digits), because students sometimes type those.
 * RETURNS: the cleaned string.
 * EXPECTED ANALYTICS RESULT: none directly; used by the search event.
 */
function sanitizeSearchTerm(rawTerm) {
  var term = String(rawTerm || "").trim().toLowerCase().slice(0, 50);
  var digits = term.replace(/\D/g, "").length;
  if (term.indexOf("@") !== -1 || digits >= 7) {
    return "[redacted]";
  }
  return term;
}

/**
 * FUNCTION: logAnalyticsDebug(message, data)
 * PURPOSE: Developer console output when debugLogging is true.
 * EXPECTED ANALYTICS RESULT: none.
 */
function logAnalyticsDebug(message, data) {
  if (!window.SITE_CONFIG.analytics.debugLogging) {
    return;
  }
  if (data !== undefined) {
    console.log("[EduSpace analytics] " + message, data);
  } else {
    console.log("[EduSpace analytics] " + message);
  }
}

/**
 * FUNCTION: initAnalytics()
 * PURPOSE: Once per page: connect the consent buttons, then load GTM
 *   (consent given) or show the banner (no choice yet, real ID only).
 * EXPECTED ANALYTICS RESULT: see loadGoogleTagManager(). No custom event.
 */
function initAnalytics() {
  var accept = document.getElementById("consent-accept-btn");
  var decline = document.getElementById("consent-decline-btn");
  if (accept) {
    accept.addEventListener("click", function () { handleConsentChoice("granted"); });
  }
  if (decline) {
    decline.addEventListener("click", function () { handleConsentChoice("denied"); });
  }
  if (!isAnalyticsConfigured()) {
    logAnalyticsDebug("Analytics inactive (placeholder ID). Events are still printed here for learning.");
    return;
  }
  var settings = window.SITE_CONFIG.analytics;
  if (!settings.requireConsent || getConsentStatus() === "granted") {
    loadGoogleTagManager();
  } else if (getConsentStatus() === null) {
    var banner = document.getElementById("consent-banner");
    if (banner) {
      banner.hidden = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", initAnalytics);
