# Accessibility and interaction review

Scope: source review of `src/Golden.jsx` and `public/site.html` as present on 2026-09-12. Findings below are tied to current code. This was not a rendered assistive-technology test; keyboard, VoiceOver/NVDA, 200% zoom, and contrast measurements should be repeated against the fixed build.

## Findings

### P1 — The app's primary controls are mouse-only `div`s with no control roles

**Locations:** `src/Golden.jsx:168-176`, `666-699`, `774-787`, `790-806`, `997-1010`, `1124-1165`, `1317-1340`, `1441-1444`.

`Btn`, `Card`, and `Opt` render clickable `div`s; the match, order, speak, and tap-hear activities also wire `onClick` to generic `div`s. The account/menu affordance, lesson path nodes, door switcher, settings rows, and bottom tabs follow the same pattern. These are not in the tab order, do not activate with Enter/Space, and do not expose button, radio/selected, or tab semantics. As a result, core onboarding, lesson answers, navigation, settings, and completion cannot be reliably operated or understood without a pointer.

**Acceptance:** Replace action-bearing elements with native buttons/links and proper grouped choice/tab semantics; expose selected/disabled state; verify the complete onboarding → lesson → finish → navigation flow using keyboard only.

### P1 — Modal overlays do not manage focus or announce themselves

**Locations:** `src/Golden.jsx:944-956`, `961-1014`, `1433-1445`; `public/site.html:498-499`, `816`, `898-917`, `928-947`.

The in-app explain sheet and post-lesson flow are absolutely positioned overlays, while the app underneath remains mounted and exposed; neither has dialog semantics, an initial focus target, a focus boundary, or focus restoration. On the site, `#gpage` and `#goldenapp` lock body scrolling and have close controls, but neither is a named modal dialog or traps/restores focus. `Escape` closes only `#gpage` (`public/site.html:925`); the app overlay has no Escape handler. Keyboard and screen-reader users can move behind the open overlay, lose their place on close, or have no announced context for the overlay.

**Acceptance:** Give each modal an accessible name and dialog/modal semantics, move focus into it, keep focus within it while open, close on Escape where appropriate, and restore focus to the invoking control. Confirm the embedded app and page sheet each pass keyboard and screen-reader checks.

### P2 — App screen hierarchy and changing lesson feedback are not exposed semantically

**Locations:** `src/Golden.jsx:856-935`, `1124-1167`, `1170-1210`, `1274-1297`, `1388-1445`.

Most visual headings and prompts are styled `div`s, and the app shell has no main landmark or semantic navigation (the bottom tabs are generic `div`s). Lesson screens replace content as state changes, but there is no live region or focus update for new prompts, answer verdicts, or progress. Screen readers therefore get a weak document outline and may not learn that the current question or result changed.

**Acceptance:** Use a meaningful heading outline and main/nav landmarks, label navigation, and announce each new prompt and its result without repeating the entire screen. Check heading navigation and announcements with VoiceOver or NVDA.

### P2 — The site email field and generated photo inputs lack programmatic labels

**Locations:** `public/site.html:755-756`, `799-803`.

The email form relies on the `EMAIL ADDRESS` placeholder, which is not a persistent visible or programmatic label. The script also appends file inputs to photo slots without labels, and opens them only from a click handler on the containing `div`. These controls are unclear or inaccessible by keyboard and assistive technology.

**Acceptance:** Add a visible `<label>` associated with the email input and a clear name/instructions for each upload control; make upload activation keyboard operable or remove it from the public interaction.

### P2 — No reduced-motion accommodation for repeated app animation or smooth scrolling

**Locations:** `src/Golden.jsx:1432` (animation keyframes), `981-989` (sun rise / breathing loop), `900-912` (progress and beat animation); `public/site.html:918` (smooth scrolling).

The app defines and uses pulsing, rising, hopping, and transition animations without a `prefers-reduced-motion` override. Site anchor movement always requests smooth scrolling. This can cause discomfort for people who request reduced motion.

**Acceptance:** Respect `prefers-reduced-motion: reduce` by stopping nonessential loops/transforms and using immediate scrolling/transitions; verify both normal and reduced-motion settings.

### P2 — Some app text and controls have insufficient contrast or undersized targets

**Locations:** `src/Golden.jsx:782-784` (placeholder text at `#ffffff66` on the dark lesson screen), `909-910` (small text-only “hear it again” action), `1441` (36×36 menu target), `1443-1444` (bottom tab targets).

The translucent `#ffffff66` text is about 3.7:1 against the app's `#0A0A0A` background, below 4.5:1 for normal text. The “hear it again” action is a small text-only click target, the menu target is 36×36 CSS px, and the bottom tabs have only 10px vertical padding around 17px text (roughly 37px high), all below the 44×44 target referenced by this review skill. These make low-vision and touch operation harder.

**Acceptance:** Raise small text contrast to at least 4.5:1, give icon/text actions a visible focus treatment and at least 44×44px hit area, and recheck the smallest viewport and 200% zoom.

### P2 — Footer navigation and launch controls are not consistently native links/buttons

**Locations:** `public/site.html:480`, `493`, `754-756`, `765-772`, `816`, `922-923`.

The footer navigation items and legal links are `li`/`span` elements activated by delegated mouse clicks, so they are absent from keyboard navigation. “Start free” uses an anchor with `javascript:void(0)` for an action that opens a modal. The modal backdrop also closes on click but is an unlabeled generic `div`. This leaves site navigation and launch behavior inconsistent for keyboard and assistive-technology users.

**Acceptance:** Render footer items as real links/buttons, use buttons for modal actions, and keep backdrop dismissal supplemental to the named close button.

## Acceptance checklist

- [ ] Complete first-run setup, choose answers, use the lesson, finish it, change tabs, and edit settings with keyboard only; no pointer-only action remains.
- [ ] Focus is always visible, follows a logical order, stays inside each modal while open, and returns to its trigger after close.
- [ ] VoiceOver/NVDA announces landmarks, headings, selected/disabled states, each new prompt, and answer feedback.
- [ ] All form and upload controls have persistent accessible names and instructions.
- [ ] Text contrast is at least 4.5:1 for normal text; visible control boundaries/focus indicators are distinguishable.
- [ ] Interactive targets meet 44×44 CSS px where practical, including tabs and icon controls.
- [ ] Reduced-motion preferences stop nonessential animation and smooth scrolling.
- [ ] At 200% zoom and on a short mobile viewport, every screen and modal remains reachable without a nested scroll trap.
