# Production acceptance matrix

This matrix prevents a screen that merely looks complete from being reported as a connected customer feature. It applies to the exact build under review. Source inspection and local tests can establish implementation behavior, but they do not prove production configuration, a real user record, provider acceptance, or delivery.

| Evidence state | What it proves | What it does not prove | Required acceptance evidence |
| --- | --- | --- | --- |
| Rendered shell | The route returns HTML and the app mounts at the tested viewport. | That its content is real, actions work, or a service is connected. | HTTP success plus rendered mobile and desktop review of the named route. |
| Local preview | A control changes or a draft/state is held in the current browser or React session. | Persistence after reload, another device, server write, or external effect. | Exercise the action, identify its storage boundary, and verify local state after the promised lifecycle. Label examples and preview data at the point of use. |
| Persisted locally | Data survives the stated reload/browser restart in device storage. | Account identity, cross-device sync, backup delivery, or backend acceptance. | Reload from a clean route and read the saved value back from its actual local store. |
| Backend connected | A request reached the intended service and the service accepted or returned the user-scoped record. | Provider payment, email, notification, or human delivery. | Record the successful request/response state against an isolated test account; distinguish configured credentials from a successful operation. |
| Provider accepted | The external provider created/accepted the requested operation, such as a Checkout Session. | Payment completion, entitlement, recipient delivery, or fulfillment. | Verify the provider's returned operation identifier/state. Do not infer it from a browser redirect or query parameter. |
| Provider delivered / verified | A provider or trusted server event confirms the external effect and Golden reflects the verified result. | Anything beyond the specific event and account observed. | Verify signature/trusted event, match it to the user and operation, then read the resulting entitlement/delivery state from the backend. |

## Adversarial acceptance cases

| Area | Adversarial input or state | Pass condition | Evidence class |
| --- | --- | --- | --- |
| Shell vs. feature | Open an attractive route whose controls are examples or local-only. | Copy identifies preview/local state where the decision occurs; the shell is not counted as feature completion. | Rendered shell + local preview |
| Table people/gallery | Open the Table journey with no real Table or members. | No sample person, invitation, activity, or community member is presented as a customer record. Empty state is explicit. | Rendered shell / local preview |
| Immersive navigation | Enter a lesson, placement, reflection, or full-screen journey screen. | Primary tab navigation does not overlay or remain actionable inside the immersive flow; its explicit close/back control remains usable. | Rendered shell |
| Checkout return | Visit `?commerce=success` with an arbitrary or absent session ID, including a forged browser value. | Return is described as unverified; no paid access, purchase, or entitlement is claimed or granted without a trusted backend/provider verification. | Browser input vs. provider verified |
| Guide citations | Ask a question answered from fallback text, provider prose with no citation, or unrelated Door context. | A source/citation affordance appears only for answer-specific, supplied citation metadata tied to the active Door. Otherwise the Guide says a citation was not supplied. | Provider response / answer metadata |
| Unconfigured provider | Remove Guide/Stripe configuration, make the status route fail, or let the provider reject a request. | UI reports unavailable/unconfigured/unknown, makes no success claim, and makes no external call when configuration is absent. | Backend/provider status |
| Persistence | Save locally, reload, then inspect another browser/device. | UI claims only the persistence scope actually observed; device-local persistence is not called account sync. | Local persistence vs. backend connected |
| Delivery | Trigger an accepted backend request without the provider's completion event. | UI remains pending until delivery/verification is observed. | Backend connected vs. provider delivered |

## Release decision rule

Record the strongest evidence actually observed for each journey. A later state implies earlier states only when the same user, operation, and build are tied together by evidence. “Configured,” “connected,” “saved,” “checkout returned,” and “delivered” are separate states. A source-level test is a guard against regressions; it is not proof that the corresponding production service is live. Any failed adversarial case blocks the associated production claim and must remain visible as a gap until retested against the exact release build.
