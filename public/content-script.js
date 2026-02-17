/**
 * grepHuman Content Script
 * Labels Google search results as "Not AI" or "Maybe AI" based on publication date
 */

// GPT launch date - content before this is definitely human-written
const GPT_LAUNCH_DATE = new Date('2022-11-30');

// State
let labelsEnabled = true;
let hiddenCount = 0;

// ── AI Slop Detection ──────────────────────────────────────────────

/**
 * ChatGPT-style filler phrases (case-insensitive matching)
 */
const SLOP_PHRASES = [
  'in today\'s digital landscape',
  'in today\'s fast-paced',
  'in today\'s world',
  'in the ever-evolving',
  'in this comprehensive guide',
  'dive into',
  'let\'s dive',
  'deep dive',
  'delve into',
  'let\'s delve',
  'it\'s worth noting',
  'it\'s important to note',
  'navigating the',
  'navigate the complexities',
  'unlock the power',
  'unlock the potential',
  'unleash the power',
  'harness the power',
  'the power of',
  'game.changer',
  'game changer',
  'a must-have',
  'revolutionize',
  'elevate your',
  'supercharge your',
  'streamline your',
  'seamlessly',
  'robust and scalable',
  'cutting-edge',
  'leverage the',
  'leveraging',
  'look no further',
  'buckle up',
  'without further ado',
  'comprehensive overview',
  'at the end of the day',
  'the bottom line',
  'in conclusion',
  'to sum up',
  'tapestry',
  'paradigm',
  'synergy',
  'holistic approach',
  'foster a',
  'foster an',
  'multifaceted',
  'pivotal role',
  'in the realm of',
  'landscape of',
  'embark on',
  'let\'s explore',
  'are you looking for',
  'whether you\'re a',
  'empower you',
  'empowering',
  'step-by-step guide',
  'everything you need to know',
  'here\'s the thing',
  'here\'s the deal',
  'the secret sauce',
  'not just any',
  'ready to take your',
  'take it to the next level',
  'next level',
  'level up your',
  'your journey',
  'stands out from the crowd',
  'stay ahead of the curve',
  'in this article',
  'in this blog post',
  'welcome to our',
];

/**
 * Detect AI slop patterns in text.
 * Returns a score 0-100 (0 = human, 100 = pure slop).
 */
function detectSlop(text) {
  if (!text || text.length < 40) return 0;

  const lower = text.toLowerCase();
  let score = 0;

  // ── Phrase matching ───────────────────────────────────────
  let phraseHits = 0;
  for (const phrase of SLOP_PHRASES) {
    if (lower.includes(phrase)) phraseHits++;
  }
  // Each hit adds 12 points, capped at 60
  score += Math.min(phraseHits * 12, 60);

  // ── Emoji density ─────────────────────────────────────────
  const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{200D}\u{2702}-\u{27B0}]/gu;
  const emojis = text.match(emojiRegex) || [];
  const emojiRatio = emojis.length / (text.length / 100);
  // More than ~2 emojis per 100 chars is suspicious
  if (emojiRatio > 2) score += 30;
  else if (emojiRatio > 1) score += 20;
  else if (emojiRatio > 0.5) score += 10;

  // ── Emoji as bullet points ("🔥 Title: …" pattern) ────────
  const emojiBullets = (text.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]\s*\w+.*?:/gu) || []).length;
  if (emojiBullets >= 2) score += 15;

  // ── Exclamation mark abuse ────────────────────────────────
  const exclamations = (text.match(/!/g) || []).length;
  const exclamationRatio = exclamations / (text.length / 100);
  if (exclamationRatio > 1.5) score += 10;

  // ── Heavy use of "✅" "🔥" "💡" "🚀" "🎯" ─────────────────
  const hypeEmojis = (text.match(/[🚀✅🔥💡🎯⭐💪🏆🌟💥✨🎉]/gu) || []).length;
  if (hypeEmojis >= 3) score += 15;

  return Math.min(score, 100);
}

/** Threshold above which we flag as slop */
const SLOP_THRESHOLD = 30;

/**
 * Parse various date formats
 */
function parseDate(text) {
  if (!text) return null;

  // Try standard date parsing first
  const directParse = new Date(text);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }

  // Month name mappings
  const months = {
    'jan': 0, 'january': 0, 'janv': 0,
    'feb': 1, 'february': 1, 'févr': 1, 'fevr': 1,
    'mar': 2, 'march': 2, 'mars': 2,
    'apr': 3, 'april': 3, 'avr': 3,
    'may': 4, 'mai': 4,
    'jun': 5, 'june': 5, 'juin': 5,
    'jul': 6, 'july': 6, 'juil': 6,
    'aug': 7, 'august': 7, 'août': 7, 'aout': 7,
    'sep': 8, 'sept': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11, 'déc': 11
  };

  // Pattern: "Month Day, Year" or "Day Month Year"
  const match = text.match(/(\d{1,2})?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janv|févr|mars|avr|mai|juin|juil|août|sept|déc)[a-zéû]*\.?\s*(\d{1,2})?,?\s*(\d{4})/i);
  if (match) {
    const day = parseInt(match[1] || match[3]) || 1;
    const monthStr = match[2].toLowerCase().replace(/\./g, '');
    const year = parseInt(match[4]);

    for (const [name, num] of Object.entries(months)) {
      if (monthStr.startsWith(name) || name.startsWith(monthStr)) {
        return new Date(year, num, day);
      }
    }
  }

  return null;
}

/**
 * Check if Google search page
 */
function isGoogleSearch() {
  return window.location.hostname.includes('google.') && window.location.pathname.startsWith('/search');
}

/**
 * Extract date from search result
 */
function extractDateFromResult(result) {
  const text = result.textContent || '';

  // French: "il y a X ans/mois"
  const frenchMatch = text.match(/il y a (\d+)\s+(ans?|mois)/i);
  if (frenchMatch) {
    const num = parseInt(frenchMatch[1]);
    const unit = frenchMatch[2].toLowerCase();
    const date = new Date();
    if (unit.startsWith('an')) {
      date.setFullYear(date.getFullYear() - num);
    } else {
      date.setMonth(date.getMonth() - num);
    }
    return { date, text: frenchMatch[0] };
  }

  // English: "X years/months ago"
  const englishMatch = text.match(/(\d+)\s+(years?|months?|days?)\s+ago/i);
  if (englishMatch) {
    const num = parseInt(englishMatch[1]);
    const unit = englishMatch[2].toLowerCase();
    const date = new Date();
    if (unit.startsWith('year')) {
      date.setFullYear(date.getFullYear() - num);
    } else if (unit.startsWith('month')) {
      date.setMonth(date.getMonth() - num);
    } else {
      date.setDate(date.getDate() - num);
    }
    return { date, text: englishMatch[0] };
  }

  // Absolute date
  const absMatch = text.match(/\b(\d{1,2})?\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|janv|févr|mars|avr|mai|juin|juil|août|sept|déc)[a-zéû]*\.?\s*(\d{1,2})?,?\s*(\d{4})\b/i);
  if (absMatch) {
    const date = parseDate(absMatch[0]);
    if (date) return { date, text: absMatch[0] };
  }

  return null;
}

/**
 * Badge types: 'not-ai' | 'maybe-ai' | 'slop'
 */
const BADGE_CONFIG = {
  'not-ai': {
    text: '\u2713 Not AI',
    bg: 'linear-gradient(135deg, #10b981, #059669)',
    defaultTitle: 'Pre-ChatGPT content',
  },
  'maybe-ai': {
    text: '\u26A0 Maybe AI',
    bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
    defaultTitle: 'Could be AI generated',
  },
  'slop': {
    text: '\u2716 AI Slop',
    bg: 'linear-gradient(135deg, #ef4444, #b91c1c)',
    defaultTitle: 'Likely AI-generated (ChatGPT-style writing detected)',
  },
};

/**
 * Create badge element
 * @param {'not-ai'|'maybe-ai'|'slop'} type
 * @param {string} [titleOverride]
 */
function createBadge(type, titleOverride) {
  const cfg = BADGE_CONFIG[type];
  const badge = document.createElement('span');
  badge.className = 'grephuman-badge';

  const baseStyles = `
      all: initial !important;
      display: inline-block !important;
      padding: 2px 8px !important;
      border-radius: 4px !important;
      font-size: 11px !important;
      font-weight: 600 !important;
      margin-left: 8px !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
      box-shadow: 0 1px 3px rgba(0,0,0,0.2) !important;
      color: white !important;
      vertical-align: middle !important;
      line-height: normal !important;
      text-align: left !important;
      direction: ltr !important;
      unicode-bidi: isolate !important;
      writing-mode: horizontal-tb !important;
      transform: none !important;
      rotate: none !important;
      scale: none !important;
      position: relative !important;
      cursor: default !important;
    `;

  badge.textContent = cfg.text;
  badge.style.cssText = baseStyles + `background: ${cfg.bg} !important;`;
  badge.title = titleOverride || cfg.defaultTitle;

  return badge;
}

/**
 * Get all search result elements
 */
function getSearchResults() {
  return document.querySelectorAll('#search .g, #rso .g, .MjjYud');
}

/**
 * Label all search results
 */
function labelResults() {
  if (!isGoogleSearch() || !labelsEnabled) return;

  console.log('[grepHuman] Labeling results...');
  const results = getSearchResults();

  results.forEach(result => {
    // Skip if already labeled
    if (result.querySelector('.grephuman-badge')) return;

    // Find title
    const title = result.querySelector('h3');
    if (!title) return;

    // Gather snippet text for slop analysis
    const snippetEl = result.querySelector('.VwiC3b, .IsZvec, [data-sncf], .s3v9rd');
    const snippetText = (snippetEl?.textContent || '') + ' ' + (title.textContent || '');
    const slopScore = detectSlop(snippetText);

    const dateInfo = extractDateFromResult(result);
    const isPreGpt = dateInfo?.date && dateInfo.date < GPT_LAUNCH_DATE;

    // Determine badge type
    let badgeType;
    let badgeTitle;

    if (slopScore >= SLOP_THRESHOLD) {
      badgeType = 'slop';
      badgeTitle = `AI slop score: ${slopScore}/100 — ChatGPT-style writing detected`;
      result.setAttribute('data-grephuman-ai', 'true');
    } else if (isPreGpt) {
      badgeType = 'not-ai';
      badgeTitle = dateInfo?.text ? `Published ${dateInfo.text} - Before ChatGPT (Nov 30, 2022)` : undefined;
      result.setAttribute('data-grephuman-ai', 'false');
    } else {
      badgeType = 'maybe-ai';
      badgeTitle = dateInfo?.text ? `Published ${dateInfo.text} - After ChatGPT launch` : undefined;
      result.setAttribute('data-grephuman-ai', 'true');
    }

    const badge = createBadge(badgeType, badgeTitle);
    title.appendChild(badge);
  });
}

/**
 * Remove all labels
 */
function removeLabels() {
  document.querySelectorAll('.grephuman-badge').forEach(el => el.remove());
}

/**
 * Hide results marked as AI
 */
function hideAIResults() {
  hiddenCount = 0;
  const results = getSearchResults();

  results.forEach(result => {
    if (result.getAttribute('data-grephuman-ai') === 'true') {
      result.style.display = 'none';
      result.setAttribute('data-grephuman-hidden', 'true');
      hiddenCount++;
    }
  });

  console.log('[grepHuman] Hidden', hiddenCount, 'results');
  return hiddenCount;
}

/**
 * Show all hidden results
 */
function showAllResults() {
  document.querySelectorAll('[data-grephuman-hidden="true"]').forEach(el => {
    el.style.display = '';
    el.removeAttribute('data-grephuman-hidden');
  });
  hiddenCount = 0;
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[grepHuman] Message:', message.type);

  switch (message.type) {
    case 'PING':
      sendResponse({ pong: true });
      break;

    case 'GET_STATE':
      sendResponse({
        labelsEnabled,
        hiddenCount,
        isGoogleSearch: isGoogleSearch()
      });
      break;

    case 'TOGGLE_LABELS':
      labelsEnabled = message.enabled;
      if (labelsEnabled) {
        labelResults();
      } else {
        removeLabels();
        showAllResults();
      }
      sendResponse({ success: true });
      break;

    case 'HIDE_AI_RESULTS':
      const count = hideAIResults();
      sendResponse({ hiddenCount: count });
      break;

    case 'SHOW_ALL_RESULTS':
      showAllResults();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ error: 'Unknown message' });
  }

  return true;
});

/**
 * Inject global styles to isolate badges from page CSS transforms
 */
function injectBadgeStyles() {
  if (document.getElementById('grephuman-styles')) return;
  const style = document.createElement('style');
  style.id = 'grephuman-styles';
  style.textContent = `
    .grephuman-badge {
      all: initial !important;
      display: inline-block !important;
      vertical-align: middle !important;
      direction: ltr !important;
      unicode-bidi: isolate !important;
      writing-mode: horizontal-tb !important;
      transform: none !important;
      rotate: none !important;
      scale: none !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// Auto-start on Google
if (isGoogleSearch()) {
  console.log('[grepHuman] Google search detected, labeling...');
  injectBadgeStyles();

  // Wait for page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', labelResults);
  } else {
    labelResults();
  }

  // Watch for dynamic content
  const observer = new MutationObserver(() => {
    clearTimeout(window.grepHumanDebounce);
    window.grepHumanDebounce = setTimeout(labelResults, 300);
  });

  const container = document.querySelector('#search, #rso, #main');
  if (container) {
    observer.observe(container, { childList: true, subtree: true });
  }
}

console.log('[grepHuman] Content script loaded');
