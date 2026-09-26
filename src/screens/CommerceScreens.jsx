import { useCallback, useEffect, useState } from "react";
import { getPlan, PLAN_CATALOG } from "../features/commerce.js";
import { getSupabaseAccessToken } from "../platform/index.js";
import {
  Button,
  Card,
  Header,
  Notice,
  Page,
  Pill,
  Row,
} from "../ui/GoldenUI.jsx";

const API = "/api/commerce";

export const COMMERCE_SCREEN_IDS = Object.freeze([
  "plus-detail",
  "table-plan-detail",
  "plan-comparison",
  "checkout-handoff",
  "checkout-success",
  "checkout-cancelled",
  "checkout-failure",
  "subscription-overview",
  "change-plan",
  "payment-method-handoff",
  "cancel-subscription",
  "cancellation-confirmation",
  "promise-eligibility",
  "refund-request",
  "refund-status",
]);

const PLAN_COPY = Object.freeze({
  plus: {
    eyebrow: "golden plus · preview",
    title: "A little more room.",
    summary: "The proposed Plus plan adds deeper sessions and more ways to practice.",
    features: [
      "No ads around your practice",
      "Longer readings and deeper sessions",
      "The Guide, with provider availability shown clearly",
      "Offline listening, when that feature is connected",
    ],
    note: "Plan details and pricing are preview content. No paid access is active in this beta.",
  },
  table: {
    eyebrow: "the table · plan preview",
    title: "A place for your people.",
    summary: "The proposed Table plan is designed for up to six people practicing alongside one another.",
    features: [
      "Everything proposed for Golden Plus",
      "One shared showed-up streak",
      "A private space for up to six people",
      "Voice notes between sunsets, when connected",
    ],
    note: "Paid Table membership and family billing are not connected. Local Table previews do not grant paid access.",
  },
});

async function readJson(response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

export async function requestCheckout(planId, fetchImpl = globalThis.fetch) {
  const plan = getPlan(planId);
  if (!plan || plan.billing !== "subscription" || typeof fetchImpl !== "function") {
    return { ok: false, state: "rejected", errorCode: "invalid_checkout_request" };
  }
  try {
    const accessToken = getSupabaseAccessToken();
    if (!accessToken) return { ok: false, state: "unauthenticated", errorCode: "account_authentication_required" };
    const response = await fetchImpl(API, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ action: "checkout", planId: plan.id }),
    });
    const result = await readJson(response);
    if (response.ok && result.state === "checkout_ready" && typeof result.checkoutUrl === "string") {
      return { ok: true, state: "checkout_ready", checkoutUrl: result.checkoutUrl };
    }
    return {
      ok: false,
      state: result.state || "unavailable",
      errorCode: result.errorCode || "checkout_unavailable",
    };
  } catch {
    return { ok: false, state: "unavailable", errorCode: "checkout_unavailable" };
  }
}

function useProviderStatus() {
  const [status, setStatus] = useState({ loading: true, state: "checking" });
  const refresh = useCallback(async () => {
    setStatus({ loading: true, state: "checking" });
    try {
      const response = await fetch(API, { method: "GET", headers: { Accept: "application/json" }, cache: "no-store" });
      const result = await readJson(response);
      setStatus({
        loading: false,
        state: response.ok && result.state === "configured" ? "configured" : "provider_not_configured",
        offers: result.offers || {},
      });
    } catch {
      setStatus({ loading: false, state: "status_unavailable" });
    }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return [status, refresh];
}

function ProviderNotice({ status }) {
  if (status.loading || status.state === "checking") {
    return <Notice tone="soft">Checking secure checkout availability…</Notice>;
  }
  if (status.state === "configured") {
    return <Notice tone="info">Payment provider is configured. Each plan still needs its own server price before checkout can open.</Notice>;
  }
  if (status.state === "status_unavailable") {
    return <Notice tone="warning">We couldn’t check the payment provider. No plan or payment status has changed.</Notice>;
  }
  return <Notice tone="warning">Payments are not configured for this beta. No charge or paid access is available here.</Notice>;
}

function offerReady(status, planId) {
  return status.state === "configured" && status.offers?.[`plan:${planId}`]?.configured === true;
}

function Screen({ eyebrow, title, subtitle, onBack, children, scroll = true }) {
  return (
    <Page tone="cream" scroll={scroll}>
      <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
      <div style={{ display: "grid", gap: 12, padding: "8px 18px 28px" }}>{children}</div>
    </Page>
  );
}

function FeatureList({ items }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item) => (
        <div key={item} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontFamily: "Inter, system-ui, sans-serif", fontSize: 13, lineHeight: 1.45 }}>
          <span aria-hidden="true" style={{ color: "#5d7a38", fontWeight: 700 }}>•</span>
          <span>{item}</span>
        </div>
      ))}
    </div>
  );
}

function PlanDetail({ planId, onBack, onCompare, onCheckout }) {
  const plan = getPlan(planId);
  const copy = PLAN_COPY[planId];
  const [status] = useProviderStatus();
  if (!plan || !copy) return <UnavailableScreen title="Plan unavailable" onBack={onBack} />;
  return (
    <Screen eyebrow={copy.eyebrow} title={copy.title} subtitle={copy.summary} onBack={onBack}>
      <Card tone={planId === "plus" ? "dark" : "default"}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 22, fontWeight: 750 }}>{plan.name}</div>
          <Pill tone="quiet">planned</Pill>
        </div>
        <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, opacity: 0.78 }}>Pricing and billing terms will be shown by secure checkout when available.</div>
        <div style={{ marginTop: 18 }}><FeatureList items={copy.features} /></div>
      </Card>
      <ProviderNotice status={status} />
      <Notice tone="soft">{copy.note}</Notice>
      <Button disabled={status.loading || !offerReady(status, planId)} onClick={onCheckout}>
        Continue to secure checkout
      </Button>
      <Button variant="ghost" onClick={onCompare}>Compare plans</Button>
    </Screen>
  );
}

export function PlusDetailScreen(props) {
  return <PlanDetail {...props} planId="plus" />;
}

export function TablePlanDetailScreen(props) {
  return <PlanDetail {...props} planId="table" />;
}

export function PlanComparisonScreen({ onBack, onOpenPlan }) {
  const [status] = useProviderStatus();
  const rows = [
    { label: "The House", id: "house", detail: "The free preview, with every current door and lesson." },
    { label: "Golden Plus", id: "plus", detail: "Deeper sessions and additional practice features, when connected." },
    { label: "The Table", id: "table", detail: "The proposed Plus experience for a group of up to six." },
  ];
  return (
    <Screen eyebrow="plans · private beta preview" title="Find your pace." subtitle="The House is the only plan available in this preview. Paid plans are not active." onBack={onBack}>
      {rows.map(({ label, id, detail }) => (
        <Card key={id}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 20, fontWeight: 750 }}>{label}</div>
            <Pill tone={id === "house" ? "quiet" : "gold"}>{id === "house" ? "preview access" : "planned"}</Pill>
          </div>
          <div style={{ marginTop: 6, fontSize: 13, lineHeight: 1.5, color: "#555" }}>{detail}</div>
          <div style={{ marginTop: 12 }}>
            {id === "house" ? <Notice tone="info">No payment required for the current beta preview.</Notice> : <Button variant="ghost" onClick={() => onOpenPlan?.(id)}>View {id === "plus" ? "Plus" : "Table"}</Button>}
          </div>
        </Card>
      ))}
      <ProviderNotice status={status} />
      <div style={{ fontSize: 11, lineHeight: 1.5, textAlign: "center", color: "#6b6b6b" }}>Plan names and included features are preview content. Pricing will be provided by secure checkout, never by this screen.</div>
    </Screen>
  );
}

export function CheckoutHandoffScreen({ planId = "plus", onBack, onCheckoutReady, onCancelled, onFailure }) {
  const plan = getPlan(planId);
  const [status, refresh] = useProviderStatus();
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const begin = async () => {
    if (working || !offerReady(status, planId)) return;
    setWorking(true);
    setNotice("Opening secure checkout…");
    const result = await requestCheckout(planId);
    if (result.ok) {
      if (onCheckoutReady) onCheckoutReady(result.checkoutUrl);
      else window.location.assign(result.checkoutUrl);
      return;
    }
    setWorking(false);
    await refresh();
    const message = result.state === "provider_not_configured"
      ? "Secure checkout is not configured. No payment was started."
      : "Checkout could not be opened. No payment or plan change was confirmed.";
    setNotice(message);
    onFailure?.(result);
  };
  return (
    <Screen eyebrow="secure checkout" title="One last step." subtitle={plan ? `You’re choosing ${plan.name}. The payment provider will show the price and billing terms.` : "That plan isn’t available."} onBack={onBack}>
      <Card><div style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 20, fontWeight: 750 }}>{plan?.name || "Plan unavailable"}</div><div style={{ marginTop: 6, fontSize: 12, color: "#6b6b6b" }}>Plan and billing are confirmed by the provider.</div></Card>
      <ProviderNotice status={status} />
      {notice && <Notice tone="warning">{notice}</Notice>}
      <Button disabled={!plan || plan.billing !== "subscription" || status.loading || !offerReady(status, planId) || working} onClick={begin}>{working ? "Opening checkout…" : "Open secure checkout"}</Button>
      <Button variant="ghost" disabled={working} onClick={onCancelled}>Go back to plans</Button>
    </Screen>
  );
}

export function CheckoutSuccessScreen({ sessionId, onBack, onManage }) {
  const [verification, setVerification] = useState({ state: sessionId ? "checking" : "unverified", activated: false });
  const verify = useCallback(async () => {
    const accessToken = getSupabaseAccessToken();
    if (!sessionId || !accessToken) { setVerification({ state: accessToken ? "unverified" : "unauthenticated", activated: false }); return; }
    setVerification({ state: "checking", activated: false });
    try {
      const response = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ action: "status", sessionId }), cache: "no-store" });
      const result = await readJson(response);
      setVerification(response.ok && result.verified === true ? { state: result.state, activated: result.activated === true, productId: result.productId || null } : { state: result.state || "unverified", activated: false });
    } catch { setVerification({ state: "unavailable", activated: false }); }
  }, [sessionId]);
  useEffect(() => { verify(); }, [verify]);
  const active = verification.state === "entitled" && verification.activated;
  return (
    <Screen eyebrow="checkout return" title={active ? "Your access is active." : "You’re back."} subtitle={active ? "Golden verified the provider event and your server entitlement." : "Golden is checking the checkout session against your signed-in account and server entitlement."} onBack={onBack}>
      {active
        ? <Notice tone="info">Verified access: {verification.productId || "paid plan"}. This status came from Golden’s server entitlement record.</Notice>
        : <Notice tone="warning">{verification.state === "checking" ? "Checking payment and entitlement…" : verification.state === "processing" ? "Checkout is verified, but the entitlement event is still processing." : verification.state === "unauthenticated" ? "Sign in to the account that opened checkout before Golden can verify it." : "No purchase or entitlement is confirmed on this screen. Paid access stays unchanged until the server verifies a provider event."}</Notice>}
      {!active && <Card><div style={{ fontSize: 13, lineHeight: 1.55 }}>A browser return alone is not payment proof. Golden activates access only after Stripe and the entitlement ledger agree.</div></Card>}
      {!active && <Button onClick={verify} disabled={verification.state === "checking"}>{verification.state === "checking" ? "Checking…" : "Check again"}</Button>}
      <Button variant="ghost" onClick={onManage}>View subscription status</Button>
    </Screen>
  );
}

export function CheckoutCancelledScreen({ onBack, onRetry }) {
  return (
    <Screen eyebrow="checkout paused" title="No rush." subtitle="Checkout was closed before Golden received a verified result." onBack={onBack}>
      <Notice tone="soft">No payment or plan change is confirmed. Your current access has not changed here.</Notice>
      <Button onClick={onRetry}>Return to plans</Button>
    </Screen>
  );
}

export function CheckoutFailureScreen({ planId = "plus", onBack, onRetry, detail }) {
  const [status, refresh] = useProviderStatus();
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState("");
  const retry = async () => {
    if (working || !offerReady(status, planId)) return;
    if (onRetry) {
      onRetry();
      return;
    }
    setWorking(true);
    const result = await requestCheckout(planId);
    if (result.ok) {
      window.location.assign(result.checkoutUrl);
      return;
    }
    setWorking(false);
    await refresh();
    setNotice(result.state === "provider_not_configured" ? "Secure checkout is not configured. No payment was started." : "Checkout could not be opened. No payment or plan change was confirmed.");
  };
  return (
    <Screen eyebrow="checkout · needs another try" title="That didn’t go through." subtitle="Golden couldn’t confirm a secure checkout session." onBack={onBack}>
      <Notice tone="warning">{detail || "No payment was confirmed and no plan was changed."}</Notice>
      <ProviderNotice status={status} />
      {notice && <Notice tone="warning">{notice}</Notice>}
      <Button disabled={status.loading || !offerReady(status, planId) || working} onClick={retry}>{working ? "Opening checkout…" : "Try checkout again"}</Button>
      <Button variant="ghost" onClick={onBack}>Return to plans</Button>
    </Screen>
  );
}

function ManagementUnavailable({ children }) {
  return <Notice tone="warning">{children} is not connected in this beta. No subscription, payment method, or paid access has changed.</Notice>;
}

export function SubscriptionOverviewScreen({ onBack, onChangePlan, onPaymentMethod, onCancel, onPromise, onRefund }) {
  const [status] = useProviderStatus();
  return (
    <Screen eyebrow="your plan" title="Subscription status." subtitle="Golden cannot currently read a provider-backed subscription for this account." onBack={onBack}>
      <Card><div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><div style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 19, fontWeight: 750 }}>No verified plan on file</div><Pill tone="quiet">not connected</Pill></div><div style={{ marginTop: 8, fontSize: 12, lineHeight: 1.5, color: "#6b6b6b" }}>Your access cannot be inferred from a checkout return or browser value.</div></Card>
      <ProviderNotice status={status} />
      <Row title="Change plan" detail="View plan options" onClick={onChangePlan} />
      <Row title="Payment method" detail="Provider portal unavailable" onClick={onPaymentMethod} />
      <Row title="Cancel subscription" detail="No cancellation will be submitted" onClick={onCancel} />
      <Row title="100-day promise" detail="Eligibility needs verified order history" onClick={onPromise} />
      <Row title="Refund" detail="No request is recorded" onClick={onRefund} />
    </Screen>
  );
}

export function ChangePlanScreen({ onBack, onCheckout }) {
  return (
    <Screen eyebrow="your plan · change" title="Choose a plan." subtitle="Golden can start server-priced checkout for a plan, but it cannot yet change an existing subscription." onBack={onBack}>
      <ManagementUnavailable>Changing or replacing an existing subscription</ManagementUnavailable>
      {PLAN_CATALOG.filter((plan) => plan.billing === "subscription").map((plan) => (
        <Card key={plan.id}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}><div style={{ fontFamily: "Manrope, Inter, system-ui, sans-serif", fontSize: 19, fontWeight: 750 }}>{plan.name}</div><Pill tone="quiet">planned</Pill></div>
          <div style={{ margin: "6px 0 12px", fontSize: 12, color: "#6b6b6b" }}>Starting another checkout would not update your current billing.</div>
          <Button variant="ghost" onClick={() => onCheckout?.(plan.id)}>Continue with {plan.name}</Button>
        </Card>
      ))}
    </Screen>
  );
}

export function PaymentMethodHandoffScreen({ onBack }) {
  const [status] = useProviderStatus();
  return (
    <Screen eyebrow="billing settings" title="Payment method." subtitle="Secure payment settings are not available from this account yet." onBack={onBack}>
      <ProviderNotice status={status} />
      <ManagementUnavailable>Opening a payment-method portal</ManagementUnavailable>
      <Button disabled>Open secure billing settings</Button>
    </Screen>
  );
}

export function CancelSubscriptionScreen({ onBack, onConfirm }) {
  const [reason, setReason] = useState("");
  return (
    <Screen eyebrow="subscription settings" title="Before you go." subtitle="Subscription cancellation is not connected in this beta." onBack={onBack}>
      <ManagementUnavailable>Canceling a subscription</ManagementUnavailable>
      <Card>
        <div style={{ fontSize: 13, lineHeight: 1.5 }}>Optional note for yourself. It stays in this screen and is not saved or sent.</div>
        <textarea aria-label="Optional reason for leaving" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 500))} rows={3} style={{ boxSizing: "border-box", width: "100%", marginTop: 12, border: "1px solid #e3e3de", borderRadius: 12, background: "#fff", padding: 12, font: "13px Inter, system-ui, sans-serif", resize: "vertical" }} />
      </Card>
      <Button variant="ghost" disabled>Cancellation is not connected</Button>
      <Button variant="ghost" onClick={onConfirm}>Review what cancellation would mean</Button>
    </Screen>
  );
}

export function CancellationConfirmationScreen({ onBack, onDone }) {
  return (
    <Screen eyebrow="cancellation details" title="Nothing is changing yet." subtitle="This is an information screen. Golden has not scheduled or confirmed a cancellation." onBack={onBack}>
      <Notice tone="warning">Cancellation status requires a verified subscription and provider response. Neither is available in this preview.</Notice>
      <Card><div style={{ fontSize: 13, lineHeight: 1.55 }}>Your current provider billing, if any, must be managed through the receipt or provider account until Golden's billing portal is connected.</div></Card>
      <Button variant="ghost" onClick={onDone}>Back to subscription</Button>
    </Screen>
  );
}

export function PromiseEligibilityScreen({ onBack, onRefund }) {
  return (
    <Screen eyebrow="golden plus · 100-day promise" title="Let’s check the facts." subtitle="The supplied plan preview mentions a 100-day promise. This beta cannot assess eligibility." onBack={onBack}>
      <Notice tone="warning">Eligibility requires the verified purchase date, completed-day record, and approved promise terms. Those records are not connected.</Notice>
      <Card><div style={{ fontSize: 13, lineHeight: 1.55 }}>A day count shown on this device is not enough to confirm refund eligibility. No decision or refund has been recorded.</div></Card>
      <Button variant="ghost" onClick={onRefund}>View refund request options</Button>
    </Screen>
  );
}

export function RefundRequestScreen({ onBack, onStatus }) {
  const [reason, setReason] = useState("");
  return (
    <Screen eyebrow="refund request" title="Tell us what happened." subtitle="Refund requests are not submitted by this private beta preview." onBack={onBack}>
      <ManagementUnavailable>Submitting or evaluating a refund request</ManagementUnavailable>
      <Card>
        <label htmlFor="refund-reason" style={{ fontSize: 13, lineHeight: 1.5 }}>Optional note for your own reference</label>
        <textarea id="refund-reason" value={reason} onChange={(event) => setReason(event.target.value.slice(0, 1000))} rows={4} style={{ boxSizing: "border-box", width: "100%", marginTop: 10, border: "1px solid #e3e3de", borderRadius: 12, background: "#fff", padding: 12, font: "13px Inter, system-ui, sans-serif", resize: "vertical" }} />
        <div style={{ marginTop: 7, fontSize: 11, color: "#6b6b6b" }}>This note stays in this screen and is not sent.</div>
      </Card>
      <Button variant="ghost" disabled>Refund requests are not connected</Button>
      <Button variant="ghost" onClick={onStatus}>View request status</Button>
    </Screen>
  );
}

export function RefundStatusScreen({ onBack }) {
  const [status] = useProviderStatus();
  return (
    <Screen eyebrow="refund status" title="No request on file." subtitle="Golden does not have a connected refund-request record for this account." onBack={onBack}>
      <ProviderNotice status={status} />
      <Notice tone="soft">No refund decision, payment status, or eligibility result is available in this preview.</Notice>
    </Screen>
  );
}

function UnavailableScreen({ title, onBack }) {
  return <Screen eyebrow="plans" title={title} subtitle="This plan is not part of the current catalog." onBack={onBack}><Notice tone="warning">No plan or entitlement was changed.</Notice></Screen>;
}
