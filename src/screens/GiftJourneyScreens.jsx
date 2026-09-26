import { useState } from "react";
import {
  createGiftDraft,
  markGiftDraftReady,
  saveGiftDraft,
  updateGiftDraft,
  GIFT_SKUS,
} from "../features/commerce.js";
import {
  Button,
  Card,
  Header,
  Notice,
  Page,
  Pill,
  Progress,
  Row,
  SunMark,
} from "../ui/GoldenUI.jsx";

export const GIFT_SKU_IDS = Object.freeze(GIFT_SKUS.map(({ id }) => id));

export const GIFT_SCREEN_IDS = Object.freeze({
  details: "gift-details",
  delivery: "gift-delivery",
  recipientMethod: "gift-recipient-method",
  review: "gift-order-review",
  checkout: "gift-checkout-handoff",
  purchaseConfirmation: "gift-purchase-confirmation",
  deliveryStatus: "gift-delivery-status",
  claim: "gift-claim-landing",
  claimSignIn: "gift-claim-sign-in-handoff",
  attach: "gift-attach-to-account",
  claimed: "gift-claimed-confirmation",
  invalid: "gift-invalid",
  expired: "gift-expired",
  alreadyClaimed: "gift-already-claimed",
  senderOpened: "gift-sender-opened-notification",
});

const GIFT_OPTIONS = [
  { id: "first_100_days", title: "The first 100 days", detail: "Long enough to become a habit", price: "$19" },
  { id: "year", title: "A year", detail: "A door to return to, all year", price: "$39.99" },
  { id: "table", title: "The Table", detail: "A year for six people", price: "$99" },
];

const relationshipOptions = ["my kid", "my parent", "a friend"];
const boxStyle = {
  display: "grid",
  gap: 6,
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 11,
  fontWeight: 650,
  letterSpacing: "0.13em",
  textTransform: "uppercase",
};
const inputStyle = {
  boxSizing: "border-box",
  width: "100%",
  border: "1.5px solid #E3E3DE",
  borderRadius: 14,
  padding: "13px 14px",
  background: "#fff",
  color: "#0A0A0A",
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: 14,
  lineHeight: 1.45,
};
const groupStyle = { display: "grid", gap: 10 };
const rowStyle = { display: "flex", flexWrap: "wrap", gap: 8 };

function ScreenFrame({ eyebrow, title, subtitle, onBack, children, tone = "light", scroll = true }) {
  return (
    <Page tone={tone} scroll={scroll}>
      <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
      <div style={{ display: "grid", gap: 14, padding: "10px 18px 26px" }}>{children}</div>
    </Page>
  );
}

function GiftStatus({ state = "draft" }) {
  const states = {
    draft: { label: "Saved on this device", tone: "info", detail: "Your gift details are a local draft." },
    provider_pending: { label: "Provider pending", tone: "info", detail: "No provider result is confirmed yet." },
    verified_success: { label: "Payment verified", tone: "success", detail: "This status comes from a verified provider result." },
    delivered: { label: "Delivery verified", tone: "success", detail: "Delivery is confirmed by a provider result." },
    failed: { label: "Not completed", tone: "warning", detail: "No charge or delivery was confirmed." },
  };
  const item = states[state] || states.draft;
  return <Notice tone={item.tone}><strong>{item.label}.</strong> {item.detail}</Notice>;
}

function GiftField({ label, ...props }) {
  return <label style={boxStyle}>{label}<input style={inputStyle} {...props} /></label>;
}

function GiftMessageField({ label = "Your note", ...props }) {
  return <label style={boxStyle}>{label}<textarea style={{ ...inputStyle, resize: "vertical", minHeight: 104 }} {...props} /></label>;
}

function getDraft({ draft, recipient, relationship, giftSku }) {
  if (draft?.id) return updateGiftDraft(draft, { recipient, relationship, giftSku });
  return createGiftDraft({ recipient, relationship, giftSku });
}

function persistDraft(draft, ready = false) {
  if (typeof window === "undefined" || !window.localStorage) return draft;
  const next = ready ? markGiftDraftReady(draft) : draft;
  saveGiftDraft(window.localStorage, next);
  return next;
}

/** Gift details and message; saving here creates only a device-local draft. */
export function GiftDetailsScreen({ draft: initialDraft, onBack, onContinue, onDraftChange }) {
  const [draft, setDraft] = useState(() => initialDraft || createGiftDraft());
  const [message, setMessage] = useState("");
  const patchDraft = (changes) => {
    const next = updateGiftDraft(draft, changes);
    setDraft(next);
    persistDraft(next);
    onDraftChange?.(next);
  };
  return (
    <ScreenFrame eyebrow="gift golden · 1 of 4" title={<>give someone <em>a door.</em></>} subtitle="A thoughtful start, made personal." onBack={onBack}>
      <div style={rowStyle} aria-label="Relationship">
        {relationshipOptions.map((item) => <button key={item} type="button" aria-pressed={draft.relationship === item} onClick={() => patchDraft({ relationship: item })} style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer" }}><Pill active={draft.relationship === item}>{item}</Pill></button>)}
      </div>
      <Card><p style={{ margin: 0, fontFamily: "'Manrope', sans-serif", fontSize: 18, lineHeight: 1.35 }}>A small daily practice can be a gentle thing to offer.</p></Card>
      <GiftField label="Who is it for? · optional" value={draft.recipient} maxLength={80} placeholder="Their name" onChange={(event) => patchDraft({ recipient: event.target.value })} />
      <GiftMessageField label="Add a note · optional" value={message} maxLength={240} placeholder="A few words from you" onChange={(event) => setMessage(event.target.value)} />
      <div style={groupStyle} aria-label="Choose a gift">
        {GIFT_OPTIONS.map((item) => <Card key={item.id} style={{ background: draft.giftSku === item.id ? "#FFFBE0" : "#fff", border: draft.giftSku === item.id ? "1.5px solid #0A0A0A" : undefined }} onClick={() => patchDraft({ giftSku: item.id })}>
          <Row title={item.title} detail={item.detail} trailing={item.price} />
        </Card>)}
      </div>
      <GiftStatus state="draft" />
      <Notice tone="info">Prices and gift fulfillment are preview configuration in this beta.</Notice>
      <Button onClick={() => { const next = persistDraft(getDraft({ draft, ...draft }), true); onDraftChange?.(next); onContinue?.({ draft: next, message }); }}>Continue to delivery</Button>
    </ScreenFrame>
  );
}

/** Select delivery timing. Sunset is the product's ritual cue, not a live scheduler claim. */
export function GiftDeliveryScreen({ onBack, onContinue, initialTiming = "today" }) {
  const [timing, setTiming] = useState(initialTiming);
  const [date, setDate] = useState("");
  return (
    <ScreenFrame eyebrow="gift golden · 2 of 4" title={<>choose <em>the moment.</em></>} subtitle="A gift can arrive now or wait for a day that matters." onBack={onBack}>
      <div style={groupStyle}>
        <Card style={{ background: timing === "today" ? "#FFFBE0" : "#fff", border: timing === "today" ? "1.5px solid #0A0A0A" : undefined }} onClick={() => setTiming("today")}><Row title="Today" detail="The recipient can open it as soon as delivery is connected." trailing="›" /></Card>
        <Card style={{ background: timing === "date" ? "#FFFBE0" : "#fff", border: timing === "date" ? "1.5px solid #0A0A0A" : undefined }} onClick={() => setTiming("date")}><Row title="Choose a date" detail="Pick a day to include with the gift." trailing="›" /></Card>
      </div>
      {timing === "date" && <GiftField label="Delivery date" type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(event) => setDate(event.target.value)} />}
      <Card><div style={{ display: "flex", alignItems: "center", gap: 14 }}><SunMark size={42} mood="glow" /><div><div style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 750 }}>At their sunset</div><div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.45 }}>A quiet time to pause. Scheduled delivery is not connected yet.</div></div></div></Card>
      <Notice tone="info">Timing is saved as part of your local gift draft. No message will be sent from this screen.</Notice>
      <Button onClick={() => onContinue?.({ timing, date })}>Choose how to deliver</Button>
    </ScreenFrame>
  );
}

/** Recipient delivery preference. The sender can review a method without implying it is live. */
export function GiftRecipientMethodScreen({ onBack, onContinue, initialMethod = "email" }) {
  const [method, setMethod] = useState(initialMethod);
  const [address, setAddress] = useState("");
  return (
    <ScreenFrame eyebrow="gift golden · 3 of 4" title={<>how should it <em>reach them?</em></>} subtitle="Choose a delivery preference for the order." onBack={onBack}>
      <div style={groupStyle}>
        <Card style={{ background: method === "email" ? "#FFFBE0" : "#fff", border: method === "email" ? "1.5px solid #0A0A0A" : undefined }} onClick={() => setMethod("email")}><Row title="Email" detail="Send the gift link to an email address." trailing="›" /></Card>
        <Card style={{ background: method === "share_link" ? "#FFFBE0" : "#fff", border: method === "share_link" ? "1.5px solid #0A0A0A" : undefined }} onClick={() => setMethod("share_link")}><Row title="Share a link" detail="Get a claim link after checkout is available." trailing="›" /></Card>
      </div>
      {method === "email" && <GiftField label="Recipient email" type="email" autoComplete="email" value={address} maxLength={254} placeholder="name@example.com" onChange={(event) => setAddress(event.target.value)} />}
      <Notice tone="info">Email and gift-link delivery are pending provider setup. This choice does not send anything.</Notice>
      <Button onClick={() => onContinue?.({ method, address })}>Review your gift</Button>
    </ScreenFrame>
  );
}

/** Review details before a checkout request; never presents a draft as a purchase. */
export function GiftOrderReviewScreen({ draft, message = "", timing = "today", date = "", method = "email", address = "", onBack, onContinue }) {
  const selected = GIFT_OPTIONS.find((item) => item.id === draft?.giftSku) || GIFT_OPTIONS[0];
  return (
    <ScreenFrame eyebrow="gift golden · 4 of 4" title={<>one last <em>look.</em></>} subtitle="Check the details before continuing." onBack={onBack}>
      <Card><Row title={selected.title} detail={selected.detail} trailing={selected.price} /></Card>
      <Card><Row title="For" detail={draft?.recipient || "Name not added"} /></Card>
      <Card><Row title="Delivery" detail={timing === "date" && date ? `At sunset on ${date}` : "At sunset, today"} /></Card>
      <Card><Row title="Method" detail={method === "email" ? (address || "Email address not added") : "Share a link after checkout"} /></Card>
      {message && <Card><div style={{ ...boxStyle, marginBottom: 6 }}>Your note</div><div style={{ fontFamily: "'Manrope', sans-serif", lineHeight: 1.45 }}>{message}</div></Card>}
      <GiftStatus state="draft" />
      <Notice tone="info">This is a draft order. Checkout, payment, and delivery must each be verified before they can be shown as complete.</Notice>
      <Button onClick={() => {
        let readyDraft = draft || createGiftDraft({ giftSku: selected.id });
        if (readyDraft.status === "draft") readyDraft = markGiftDraftReady(readyDraft);
        persistDraft(readyDraft);
        onContinue?.({ draft: readyDraft, message, timing, date, method, address });
      }}>Continue to secure checkout</Button>
    </ScreenFrame>
  );
}

/** Checkout handoff state; a real handoff only occurs when the parent supplies a provider URL. */
export function GiftCheckoutHandoffScreen({ state = "provider_pending", checkoutUrl, error, onBack, onRetry, onOpenCheckout }) {
  const [starting, setStarting] = useState(false);
  const canOpen = state === "checkout_ready" && Boolean(checkoutUrl);
  return (
    <ScreenFrame eyebrow="gift checkout" title={<>almost <em>there.</em></>} subtitle="Your gift details are saved on this device." onBack={onBack}>
      <Card tone="dark"><div style={{ display: "grid", placeItems: "center", gap: 12, textAlign: "center", padding: "12px 4px" }}><SunMark size={68} mood={canOpen ? "glow" : "breathe"} /><Pill tone="info">{canOpen ? "Secure checkout is ready" : "Provider pending"}</Pill></div></Card>
      <GiftStatus state={canOpen ? "provider_pending" : state === "failed" ? "failed" : "provider_pending"} />
      {error && <Notice tone="warning">{error}</Notice>}
      {canOpen
        ? <Button disabled={starting} onClick={() => { setStarting(true); onOpenCheckout?.(checkoutUrl); }}>Open secure checkout</Button>
        : <Button disabled={starting} onClick={async () => { setStarting(true); await onRetry?.(); setStarting(false); }}>{starting ? "Checking checkout…" : "Check checkout availability"}</Button>}
      <Notice tone="info">The app will only hand off when a verified checkout session URL is returned. No payment is claimed here.</Notice>
    </ScreenFrame>
  );
}

/** Confirmation shows success only when the caller has a verified provider outcome. */
export function GiftPurchaseConfirmationScreen({ providerState = "provider_pending", receiptLabel, onBack, onViewDelivery }) {
  const verified = providerState === "verified_success";
  return (
    <ScreenFrame eyebrow={verified ? "gift · payment verified" : "gift · awaiting confirmation"} title={verified ? <>a gift is <em>on its way.</em></> : <>we're checking <em>the order.</em></>} subtitle={verified ? "The payment provider confirmed this purchase." : "We have not received a verified payment result yet."} onBack={onBack}>
      <Card tone={verified ? "dark" : undefined}><div style={{ display: "grid", placeItems: "center", gap: 12, textAlign: "center", padding: "14px 4px" }}><SunMark size={76} mood={verified ? "glow" : "breathe"} /><Pill tone={verified ? "success" : "pending"}>{verified ? "Payment confirmed" : "Confirmation pending"}</Pill>{receiptLabel && <span style={{ fontSize: 12, opacity: .76 }}>{receiptLabel}</span>}</div></Card>
      <GiftStatus state={verified ? "verified_success" : "provider_pending"} />
      {!verified && <Notice tone="info">A return to this screen alone does not confirm a purchase. Check the provider result before marking it successful.</Notice>}
      {verified && <Button onClick={onViewDelivery}>View delivery status</Button>}
      {!verified && <Button variant="ghost" onClick={() => onViewDelivery?.()}>Check delivery status</Button>}
    </ScreenFrame>
  );
}

/** Provider-backed delivery timeline. Unknown milestones remain pending. */
export function GiftDeliveryStatusScreen({ status = "provider_pending", recipientName, updatedAt, onBack, onCheckAgain }) {
  const delivered = status === "delivered";
  const failed = status === "failed";
  return (
    <ScreenFrame eyebrow="gift delivery" title={delivered ? <>they have <em>the door.</em></> : <>a little more <em>time.</em></>} subtitle={recipientName ? `Gift for ${recipientName}` : "Your gift delivery status"} onBack={onBack}>
      <Progress value={delivered ? 3 : status === "verified_success" ? 2 : 1} max={3} />
      <div style={groupStyle}>
        <Row title="Gift saved" detail="Local draft on this device" leading={<Pill active>Saved</Pill>} />
        <Row title="Payment" detail={status === "verified_success" || delivered ? "Verified by provider" : "Waiting for a verified result"} leading={<Pill active={status === "verified_success" || delivered}>{status === "verified_success" || delivered ? "Verified" : "Pending"}</Pill>} />
        <Row title="Delivery" detail={delivered ? "Provider confirmed delivery" : "Email or gift-link delivery is not confirmed"} leading={<Pill active={delivered}>{delivered ? "Delivered" : "Pending"}</Pill>} />
      </div>
      <GiftStatus state={delivered ? "delivered" : failed ? "failed" : status === "verified_success" ? "verified_success" : "provider_pending"} />
      {updatedAt && <div style={{ fontSize: 12, opacity: .7 }}>Last checked: {updatedAt}</div>}
      {!delivered && <Button variant="ghost" onClick={onCheckAgain}>Check status again</Button>}
    </ScreenFrame>
  );
}

/** Recipient landing page. Claims are based on the gift record supplied by the caller. */
export function GiftClaimLandingScreen({ gift, state = "available", onContinue, onBack }) {
  const available = state === "available";
  const title = gift?.name || GIFT_OPTIONS.find(({ id }) => id === gift?.giftSku)?.title || "A gift for you";
  return (
    <ScreenFrame eyebrow="a gift from golden" title={<>someone left you <em>a door.</em></>} subtitle={gift?.senderName ? `With care, from ${gift.senderName}.` : "A daily practice, offered with care."} onBack={onBack}>
      <Card tone="dark"><div style={{ display: "grid", placeItems: "center", gap: 12, textAlign: "center", padding: "18px 6px" }}><SunMark size={78} mood="glow" /><div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 23, fontWeight: 800 }}>{title}</div></div></Card>
      {gift?.message && <Card><div style={{ ...boxStyle, marginBottom: 6 }}>A note for you</div><div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 16, lineHeight: 1.45 }}>{gift.message}</div></Card>}
      {available
        ? <Notice tone="info">Gift details are displayed from the claim link. Service validation is still required before attaching it.</Notice>
        : <Notice tone="warning">This gift link is {state === "expired" ? "expired" : state === "already_claimed" ? "already claimed" : "unavailable"}.</Notice>}
      {available && <Button onClick={onContinue}>Open your gift</Button>}
    </ScreenFrame>
  );
}

/** Identity handoff explains the current anonymous profile boundary. */
export function GiftClaimSignInHandoffScreen({ onBack, onContinueLocally, onSignIn }) {
  return (
    <ScreenFrame eyebrow="your gift" title={<>make it <em>yours.</em></>} subtitle="Choose where to attach the gift." onBack={onBack}>
      <Card><div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, lineHeight: 1.45 }}>Golden can start a private, anonymous profile on this device. Email sign-in and identity verification are not connected in this beta.</div></Card>
      <GiftStatus state="draft" />
      <Button onClick={onContinueLocally}>Continue on this device</Button>
      <Button variant="ghost" onClick={onSignIn}>Sign-in option · pending</Button>
      <Notice tone="info">The sign-in button is a handoff placeholder. It does not create or verify an account.</Notice>
    </ScreenFrame>
  );
}

/** Explicit recipient action to attach a verified gift entitlement to local state. */
export function GiftAttachScreen({ gift, localProfileReady = false, attaching = false, onBack, onAttach }) {
  const [accepted, setAccepted] = useState(false);
  const title = gift?.name || GIFT_OPTIONS.find(({ id }) => id === gift?.giftSku)?.title || "Your gift";
  return (
    <ScreenFrame eyebrow="attach your gift" title={<>one small step <em>together.</em></>} subtitle="Review the gift before adding it to this profile." onBack={onBack}>
      <Card><Row title={title} detail={gift?.senderName ? `From ${gift.senderName}` : "Gift details"} /></Card>
      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: "'Inter', sans-serif", fontSize: 13, lineHeight: 1.45 }}><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>Attach this gift to the profile on this device.</span></label>
      {!localProfileReady && <Notice tone="info">A local profile must be ready before attaching. No entitlement is created by this preview.</Notice>}
      <Notice tone="info">The gift must be validated by the commerce service before it can unlock access.</Notice>
      <Button disabled={!accepted || !localProfileReady || attaching} onClick={onAttach}>{attaching ? "Attaching…" : "Attach gift"}</Button>
    </ScreenFrame>
  );
}

/** Confirmation is explicit about whether the result is local or provider-verified. */
export function GiftClaimedConfirmationScreen({ state = "local_attached", onBack, onStart }) {
  const verified = state === "verified_success";
  return (
    <ScreenFrame eyebrow={verified ? "gift claimed" : "gift saved locally"} title={verified ? <>this door is <em>yours.</em></> : <>your gift is <em>saved here.</em></>} subtitle={verified ? "The claim service verified the gift for this profile." : "The gift is attached to this device, pending service verification."} onBack={onBack}>
      <Card tone={verified ? "dark" : undefined}><div style={{ display: "grid", placeItems: "center", gap: 12, textAlign: "center", padding: "16px 4px" }}><SunMark size={78} mood="glow" /><Pill tone={verified ? "success" : "pending"}>{verified ? "Claim verified" : "Local attachment only"}</Pill></div></Card>
      <GiftStatus state={verified ? "verified_success" : "draft"} />
      <Button onClick={onStart}>{verified ? "Begin your first day" : "Return to the house"}</Button>
    </ScreenFrame>
  );
}

function GiftUnavailableFrame({ eyebrow, title, subtitle, detail, onBack, onContinue }) {
  return (
    <ScreenFrame eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack}>
      <Card><div style={{ display: "grid", placeItems: "center", gap: 12, textAlign: "center", padding: "16px 4px" }}><SunMark size={70} mood="breathe" /><Pill active>Link unavailable</Pill></div></Card>
      <Notice tone="warning">{detail}</Notice>
      <Notice tone="info">No gift was attached and no payment status changed.</Notice>
      {onContinue && <Button variant="ghost" onClick={onContinue}>Return to Golden</Button>}
    </ScreenFrame>
  );
}

export function GiftInvalidStateScreen({ onBack, onContinue }) {
  return <GiftUnavailableFrame eyebrow="gift link" title={<>this link <em>isn't valid.</em></>} subtitle="We couldn't match this link to a gift." detail="Check that you opened the complete gift link. If you need help, ask the sender to check its status." onBack={onBack} onContinue={onContinue} />;
}

export function GiftExpiredStateScreen({ expiresAt, onBack, onContinue }) {
  return <GiftUnavailableFrame eyebrow="gift link" title={<>this gift link <em>has expired.</em></>} subtitle="An expired link cannot be claimed." detail={expiresAt ? `This link expired on ${expiresAt}. The sender can check whether another delivery is available.` : "The claim window has ended. The sender can check the gift status."} onBack={onBack} onContinue={onContinue} />;
}

export function GiftAlreadyClaimedScreen({ claimedAt, onBack, onContinue }) {
  return <GiftUnavailableFrame eyebrow="gift link" title={<>this gift has <em>found its home.</em></>} subtitle="It has already been claimed." detail={claimedAt ? `The gift was claimed on ${claimedAt}.` : "This gift was already claimed, so the link cannot be used again."} onBack={onBack} onContinue={onContinue} />;
}

/** Sender-facing event view; a notification is only shown when supplied by a verified event. */
export function GiftSenderOpenedNotificationScreen({ state = "pending", recipientName, openedAt, eventVerified = false, onBack, onRefresh }) {
  const verified = state === "opened" && eventVerified;
  return (
    <ScreenFrame eyebrow="gift update" title={verified ? <>they opened <em>your gift.</em></> : <>we'll let you <em>know.</em></>} subtitle={verified ? `${recipientName || "Your recipient"} opened the gift.` : "A sender update will appear when notifications are connected."} onBack={onBack}>
      <Card tone={verified ? "dark" : undefined}><div style={{ display: "flex", alignItems: "center", gap: 14 }}><SunMark size={54} mood={verified ? "glow" : "breathe"} /><div><div style={{ fontFamily: "'Manrope', sans-serif", fontSize: 17, fontWeight: 800 }}>{verified ? "Gift opened" : "Waiting for a verified event"}</div><div style={{ marginTop: 4, fontSize: 13 }}>{verified ? (openedAt || "Provider confirmed") : "No notification has been sent."}</div></div></div></Card>
      <GiftStatus state={verified ? "delivered" : "provider_pending"} />
      {!verified && <Notice tone="info">The sender-opened notification service is not connected. This screen does not simulate an opened event.</Notice>}
      <Button variant="ghost" onClick={onRefresh}>Refresh status</Button>
    </ScreenFrame>
  );
}
