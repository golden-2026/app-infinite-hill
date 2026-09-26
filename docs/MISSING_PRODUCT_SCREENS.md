# Golden: 100 production screens and states still missing

This inventory compares Shaan's supplied `golden_v150.jsx`, website, build brief,
curriculum, and writers bible with the current app. “Missing” means the state is
not yet a real, customer-ready experience. Some entries have a visual review shell
in `src/screens/`, but still use sample props, local-only state, or disconnected
actions and therefore remain missing from the production product.

## Onboarding and first run

1. **Returning-user welcome** — recognize a real account and continue its last active Door.
2. **Age and eligibility check** — establish adult, teen, and child-safe account paths.
3. **Parent or guardian consent** — verified consent before a minor joins a Table or uses Guide.
4. **Terms and privacy acceptance** — versioned acceptance with links to the exact documents.
5. **Accessibility setup** — text size, reduced motion, captions, contrast, and reading preferences.
6. **Audio test** — play the house voice, select an output, and confirm sound works.
7. **Microphone setup** — explain why speaking practice needs access before the browser prompt.
8. **Reminder setup** — choose a real reminder time or sunset behavior with timezone confirmation.
9. **Interrupted onboarding resume** — return to the exact unanswered onboarding step.
10. **Door not ready** — a designed state for Doors whose first manuscript is unavailable.

## Daily lesson player

11. **Lesson loading** — resolve manuscript, entitlement, audio, and saved position before play.
12. **Resume interrupted lesson** — restore the exact beat and exercise after reload or app close.
13. **Downloaded lesson ready** — confirm the lesson and audio are available offline.
14. **Download in progress** — progress, pause, retry, storage requirement, and cancellation.
15. **Recorded voice unavailable** — offer house voice, read-along, or return without pretending audio exists.
16. **Audio playback failure** — retry, switch voice, use transcript, or continue silently.
17. **Microphone denied** — recover from blocked permission without trapping the lesson.
18. **Speech processing** — visible listening, processing, timeout, and retry states.
19. **Practice timer interrupted** — pause safely when the app backgrounds and resume intentionally.
20. **Lesson save failed** — keep the completion locally and retry sync without losing the earned day.

## Path, progress, strand, and content

21. **Real mountain overview** — current position, completed stops, authored stops, and locked future stops from actual progress.
22. **Camp arrival** — explain the new camp, its purpose, and the first available session.
23. **Camp completion** — close the camp, add its words to the strand, and open the next camp.
24. **Range arrival** — introduce a Range only when its reviewed content exists.
25. **Range progress** — show the sessions, texts, and practices completed inside the Range.
26. **Full strand** — every earned word from actual completion history, ordered by date and Door.
27. **Word detail** — meaning, carry line, source, lesson, review history, and Keeper status.
28. **Review due** — show the actual due set from spaced-review state.
29. **Review empty** — explain when the next words return instead of opening a fake session.
30. **Review result** — persist answer quality and calculate the next review date.

## Guide

31. **Guide availability** — clearly show live Guide, lesson-only, offline, rate-limited, or unavailable before a question.
32. **New Guide conversation** — start a clean thread tied to the active Door and consent mode.
33. **Conversation history** — list real saved threads from the current account.
34. **Conversation detail** — restore the exact messages, citations, Door, and privacy mode.
35. **Source list** — show the real sources used in a specific answer.
36. **Source reader** — open the cited passage with enough context to verify the answer.
37. **Citation unavailable** — disclose when an answer cannot be tied to a supplied text.
38. **Report an answer** — capture theological, safety, citation, tone, and factual issues.
39. **Human help handoff** — give relevant, reviewed routes to a person when the Guide should stop.
40. **Guide data controls** — delete one thread, clear history, and set retention for real stored conversations.

## Account and recovery

41. **Create account** — real Supabase identity creation while preserving guest progress.
42. **Sign in** — email or approved identity provider with clear recovery behavior.
43. **Check your email** — distinguish sign-up verification, magic link, and password reset.
44. **Expired or used link** — resend safely and return to the intended flow.
45. **Forgot password** — request, verify, reset, and finish without losing local progress.
46. **Guest conversion review** — show exactly what local progress will attach to the account.
47. **Progress conflict** — compare device and server state and choose or merge deliberately.
48. **Device list** — name the current device, show last activity, and revoke another session.
49. **Data export** — request and download a complete, understandable account archive.
50. **Delete account** — explain consequences, re-authenticate, confirm, and show deletion status.

## The Table

51. **Create synced Table** — create the Table in the signed-in backend and make the owner the first member.
52. **Choose invite method** — share sheet, copy link, contact, or QR with privacy context.
53. **Invite ready** — create a real single-purpose invitation link with expiry and revocation.
54. **Invitation landing** — identify the inviter and Table without exposing private member data.
55. **Accept or decline invitation** — join with consent or decline without account confusion.
56. **Synced Table home** — real members, real showed-up signals, real pending seats, no sample people.
57. **Member detail** — relationship, membership status, shared days, and allowed actions.
58. **Pending invitations** — resend, copy, revoke, and see expiration for real invites.
59. **Manage Table** — rename, invite, leave, transfer ownership, or delete with correct permissions.
60. **Table activity and shared streak** — backend-derived dates with empty, loading, offline, and conflict states.

## Plans, Stripe, and gifts

61. **Plan comparison from live Stripe configuration** — actual products, prices, interval, eligibility, and included features.
62. **Secure checkout handoff** — create a Stripe Checkout Session tied to the signed-in account.
63. **Checkout processing return** — wait for verified webhook entitlement instead of trusting the URL.
64. **Checkout success** — show the activated plan only after the server confirms it.
65. **Checkout cancelled or failed** — preserve intent and provide a safe retry.
66. **Subscription overview** — current plan, renewal, seats, invoices, and entitlement status.
67. **Manage payment method** — verified Stripe Billing Portal handoff and return.
68. **Cancel, refund, and 100-day promise** — eligibility, confirmation, processing, completion, and denied states.
69. **Gift checkout** — recipient, delivery timing, message, product, tax, and real Stripe payment.
70. **Gift claim and delivery status** — valid, expired, already claimed, failed delivery, opened, and attached-to-account states.

## Together, live reads, and Golden Hour Nights

71. **Metro permission** — explain the value and collect a coarse location without implying GPS is active.
72. **Choose and change metro** — search actual supported metros and persist the selection.
73. **Real community overview** — backend-derived participation only when enough privacy-safe data exists.
74. **Door community** — real Door-specific activity with thresholds that prevent identifying individuals.
75. **Live-read schedule** — confirmed reader, reviewed text, start time, duration, and availability.
76. **Live-read lobby** — authenticated admission, countdown, capacity, accessibility, and connection status.
77. **Live-read player** — real audio, transcript, playback controls, reconnect, and ended states.
78. **Live-read questions** — moderated submission, accepted, answered, rejected, and closed states.
79. **Golden Hour Nights list and detail** — verified host, venue, date, safety, accessibility, capacity, and source.
80. **RSVP lifecycle** — external handoff or native RSVP, confirmation, calendar, directions, cancellation, and event change.

## Device, PWA, notifications, and offline

81. **Install eligibility** — distinguish installed, installable, unsupported, and iOS manual instructions.
82. **Install success** — confirm the PWA opened standalone and preserve the active journey.
83. **Notification permission result** — granted, denied, dismissed, unsupported, and browser-settings recovery.
84. **Scheduled reminder overview** — actual next reminder, timezone, pause, edit, and delivery health.
85. **Notification arrival deep link** — open the correct Door and lesson while preserving auth and progress.
86. **Offline library** — list downloaded lessons, audio variants, size, and last update.
87. **Storage manager** — show Golden usage, per-download deletion, clear-all, and insufficient-space recovery.
88. **Offline launch** — explain what works, what is stale, and when sync will retry.
89. **Content update available** — download a reviewed revision without corrupting an in-progress lesson.
90. **Background sync status** — pending, syncing, synced, failed, conflict, and signed-out states.

## Website, trust, support, and operational states

91. **Website account entry** — real sign-in/open-app handoff instead of an iframe-only bridge.
92. **Website plan checkout** — preserve chosen plan and account through Stripe and back into the app.
93. **Website gift purchase and claim links** — real shareable URLs with safe invalid-link handling.
94. **Privacy center** — current policy, consent history, Guide retention, Table sharing, export, and deletion.
95. **Terms, refunds, and child safety** — versioned legal documents linked from the relevant decision screens.
96. **Help center** — searchable answers for lessons, billing, recovery, Table, Guide, and content review.
97. **Contact support** — authenticated case creation with category, diagnostics consent, and case status.
98. **Maintenance and provider outage** — scoped status for Guide, sync, Stripe, audio, and events without blocking practice.
99. **Unsupported or invalid deep link** — recover gift, event, lesson, invite, checkout, and account links safely.
100. **Release and content correction notice** — tell affected users when a lesson, voice, source, or claim changed and what happens to saved progress.

## What should be built first

The first production slice should cover 11–20, 21, 26–30, 31–40, and 41–50.
That makes the daily practice, progress, Guide, and identity trustworthy. The next
slice is 51–70, because Table, Stripe, and gifts need the same real account model.
Together events, live reads, and public community data should remain unavailable
until their providers, editorial review, privacy thresholds, and operating owners
exist.
