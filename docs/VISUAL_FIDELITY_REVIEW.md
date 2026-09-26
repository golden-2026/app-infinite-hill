# Golden visual fidelity review

Compared the current `src/Golden.jsx` and `public/site.html` against the supplied originals at `/Users/kayan-work-mac/Downloads/golden/golden_v150.jsx` and `golden_web_v83.html`. This is a source-to-source review of layout, style rules, assets, and content ordering; it is not a new pixel-diff or screenshot QA run.

## Verdict

The core visual system remains recognizable and closely follows the supplied pair. The web page retains its styling and order. The app keeps its original phone frame, colors, typography, sun and photography treatment, and screen scaffolding. Truth-status changes are generally placed into existing cards and labels. They introduce deliberate copy-driven reflow and some new vertical height in the app, rather than a wholesale redesign.

## Fidelity by surface

| Surface | Match to original | Differences and effect |
| --- | --- | --- |
| App shell | High | Same cream stage, centered phone frame, 390 px maximum width, 780 px maximum height, 40 px corner radius, 8 px outer inset, and shadow. Embedded mode still fills its parent and removes the radius. |
| Type and palette | High | The app retains its Manrope/Inter stack, Baloo 2 wordmark, near-black/cream/sand/lime palette (`#0A0A0A`, `#F7F7F5`, `#ECECE8`, `#EEFF6A`), and rounded-card/button language. The app `C` and `F` tokens match the corresponding original values. |
| Imagery | High | The embedded sun artwork and existing photo data remain in place. The visual changes reviewed here do not replace, crop, or reorder the source imagery. The onboarding voice/photo card retains its full-width 260 px image treatment. |
| App ordering | High | Welcome, lesson, Today/path, Together, Guide, plans, gift, profile, and Why retain their original flow and tab/order structure. The new manuscript availability messaging is inserted into the path rather than moving its major sections. |
| Marketing page | Very high | The original style blocks and responsive rules remain unchanged. Hero, mosaic, argument, doors, product examples, voices, plans, and lower-page sections stay in their v83 order. Phone mock geometry and the existing desktop/mobile breakpoints are unchanged. |
| Responsive behavior | High by source | No responsive breakpoint or app frame sizing rules changed in the compared sources. Existing web breakpoints (including the 860 px hero/header treatment and smaller card grids) remain in the supplied CSS. This review did not repeat device screenshot testing. |

## Truth changes that alter composition

These are intentional content/state updates, not evidence of a new design direction. Their longer or newly visible copy can still change line breaks and screen height:

- Welcome step 3 keeps the same two-column door grid and card style, but replaces population counts with availability labels. Some labels are longer and can wrap inside a door tile.
- Welcome step 4 keeps the same card and portrait dimensions, but the voice-rights disclosure is longer than the original voice promise. It can push the five-camp paragraph lower on short phones.
- The path header now includes an authored-draft/review-pending label. For a mapped lesson without a supplied manuscript, a separate white notice appears and the current node reads “coming” in a muted state. This is the largest intentional app layout shift: the winding nodes and lower cards move down, while the cream/black/lime node language and path order stay intact.
- Today’s Together and plan cards now use preview/pending copy. The dark card, type scale, and card order stay the same; copy lengths can change wrapping.
- Together replaces unsupported live counts and schedule claims with a community preview and planned-read card. The dark card treatment, door-chip row, and profile/event sequence remain in place. “Save interest” is a real local preference and has a longer success label, which can widen the button.
- Plans and gift screens keep their card pattern and sequence, while pricing, checkout, and delivery language becomes explicitly preview-only. Longer disclosure text can increase card height.
- On the web page, live-count, reader, Keeper, and paid-plan claims are replaced in place with preview/pending labels. Pricing CTAs now open the corresponding local app view. These are small copy/action substitutions inside the existing card layout; no CSS or section reordering was found.

## Small visual deltas to watch

1. The live lesson path uses a 12 px current-node word label where the original used 13 px, a one-pixel reduction that slightly softens the node’s text fit.
2. The new onboarding labels and availability notice were added without changing the original spacing system. On short phone heights, verify step 4 and a mapped-but-unwritten path after scrolling; the added prose is more likely to affect vertical fit than the fixed phone geometry.
3. Truth labels replace higher-contrast promotional numbers with quieter status text. This changes emphasis intentionally; it preserves the black/cream/lime color roles and card silhouettes.
4. The web CSS and responsive rules are unchanged, but longer replacement headings can still wrap differently at mobile widths. Check the revised pricing heading and hero-to-product flow in a rendered narrow viewport.

## Review basis

A line-level source comparison found no web CSS changes. In the app, the shell sizing, typography tokens, color constants, image data, and principal component styles are unchanged; the differences are primarily copy/status state and conditional content. Existing viewport inspection is recorded in `docs/QA.md`; the specific copy-driven pages above should be rechecked visually on the exact final build if pixel-level sign-off is required.
