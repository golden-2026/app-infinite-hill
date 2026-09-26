import { getDoor, getSessionAvailability } from '../content/catalog.js';

/** Views that can be opened directly in the Golden app. */
export const GOLDEN_VIEWS = Object.freeze([
  'today',
  'together',
  'guide',
  'me',
  'plans',
  'gift',
  'account',
  'why',
]);

const viewSet = new Set(GOLDEN_VIEWS);

function readParams(input) {
  if (input instanceof URLSearchParams) return input;
  if (input instanceof URL) return input.searchParams;
  if (typeof input === 'string') {
    try {
      return new URL(input, 'https://golden.invalid').searchParams;
    } catch {
      return new URLSearchParams();
    }
  }
  if (input && typeof input === 'object') {
    if (input.searchParams instanceof URLSearchParams) return input.searchParams;
    if (typeof input.search === 'string') return new URLSearchParams(input.search.replace(/^\?/, ''));
  }
  return new URLSearchParams();
}

function parseLesson(raw) {
  if (raw == null || raw === '') return null;
  if (!/^[1-9]\d*$/.test(raw)) return null;
  const lesson = Number(raw);
  return Number.isSafeInteger(lesson) ? lesson : null;
}

function supportedScreenSet(screenIds) {
  return new Set(Array.isArray(screenIds) ? screenIds.filter((id) => typeof id === 'string' && id) : []);
}

/**
 * Parse legacy and current Golden query links into a safe navigation target.
 * Invalid views fall back to Today; invalid doors, lessons, and screens are
 * discarded. The screen registry is supplied by the app shell so this module
 * remains usable in Node while the real registry stays in the JSX navigator.
 * `valid` and `issues` describe any safe fallback that was required.
 */
export function parseGoldenLink(input, { screenIds = [] } = {}) {
  const params = readParams(input);
  const requestedView = params.get('view');
  const hasView = requestedView != null && requestedView !== '';
  const issues = [];
  let view = 'today';

  // Older door links often contain only ?door=HINDUISM. Continue treating
  // those as Today with that selected home Door.
  if (hasView && viewSet.has(requestedView)) {
    view = requestedView;
  } else if (hasView && requestedView === 'lesson') {
    // Accept the explicit lesson spelling while keeping the app's Today
    // screen as the canonical parent view.
    view = 'today';
  } else if (hasView) {
    issues.push('unknown-view');
  }

  const rawDoor = params.get('door');
  let door = null;
  if (rawDoor) {
    if (getDoor(rawDoor)) door = rawDoor;
    else issues.push('unknown-door');
  }

  const rawLesson = params.get('lesson');
  let lesson = null;
  if (rawLesson != null && rawLesson !== '') {
    const parsed = parseLesson(rawLesson);
    if (parsed == null) {
      issues.push('invalid-lesson');
    } else if (!door) {
      issues.push('lesson-needs-door');
    } else if (!getSessionAvailability(door, parsed).canPreview) {
      issues.push('lesson-not-previewable');
    } else {
      lesson = parsed;
    }
  }

  const screens = supportedScreenSet(screenIds);
  const requestedScreen = params.get('screen');
  let screen = null;
  if (requestedScreen) {
    if (screens.has(requestedScreen)) screen = requestedScreen;
    else issues.push('unknown-screen');
  }

  // Stripe's browser return is evidence only that the browser came back from
  // Checkout. It is never treated as proof of payment or entitlement.
  const rawCommerce = params.get('commerce');
  let commerceReturn = null;
  if (rawCommerce) {
    const outcome = rawCommerce === 'canceled' ? 'cancelled' : rawCommerce;
    if (outcome === 'success' || outcome === 'cancelled') {
      const rawSessionId = params.get('session_id');
      const sessionId = outcome === 'success' && /^cs_[A-Za-z0-9_]{8,200}$/.test(rawSessionId || '') ? rawSessionId : null;
      if (outcome === 'success' && rawSessionId && !sessionId) issues.push('invalid-checkout-session');
      commerceReturn = Object.freeze({ outcome, verified: false, ...(sessionId ? { sessionId } : {}) });
      if (!screen) {
        const returnScreen = outcome === 'success' ? 'checkout-success' : 'checkout-cancelled';
        if (screens.has(returnScreen)) screen = returnScreen;
      }
    } else {
      issues.push('unknown-commerce-return');
    }
  }

  return Object.freeze({
    view,
    door,
    lesson,
    screen,
    commerceReturn,
    embed: params.get('embed') === '1',
    valid: issues.length === 0,
    issues: Object.freeze(issues),
  });
}

/** Build a stable app URL while retaining the existing query-link contract. */
export function buildGoldenLink(target = {}, { base = '/', screenIds = [] } = {}) {
  const params = new URLSearchParams();
  const requestedView = target.view || 'today';
  const isLesson = requestedView === 'lesson';
  const view = isLesson ? 'today' : requestedView;
  if (!viewSet.has(view)) throw new TypeError(`Unsupported Golden view: ${requestedView}`);

  if (target.door != null) {
    if (!getDoor(target.door)) throw new TypeError(`Unsupported Golden Door: ${target.door}`);
    params.set('door', target.door);
  }

  if (isLesson || target.lesson != null) {
    const lesson = parseLesson(String(target.lesson ?? ''));
    if (lesson == null) throw new TypeError('A lesson link requires a positive whole-number lesson.');
    if (!target.door) throw new TypeError('A lesson link requires a supported Door.');
    if (!getSessionAvailability(target.door, lesson).canPreview) {
      throw new TypeError(`Lesson ${lesson} is not previewable for ${target.door}.`);
    }
    params.set('lesson', String(lesson));
  }


  if (target.screen != null) {
    if (!supportedScreenSet(screenIds).has(target.screen)) {
      throw new TypeError(`Unsupported Golden screen: ${target.screen}`);
    }
    params.set('screen', target.screen);
  }

  // Today is the default when view is omitted, matching historical door links.
  if (view !== 'today') params.set('view', view);
  if (target.embed === true) params.set('embed', '1');
  const query = params.toString();
  return query ? `${base}${base.includes('?') ? '&' : '?'}${query}` : base;
}

export function buildDoorLink(door, options) {
  return buildGoldenLink({ door }, options);
}

export function buildLessonLink(door, lesson, options) {
  return buildGoldenLink({ view: 'lesson', door, lesson }, options);
}

export function buildScreenLink(screen, options) {
  return buildGoldenLink({ screen }, options);
}
