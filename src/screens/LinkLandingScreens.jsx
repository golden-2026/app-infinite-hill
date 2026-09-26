import React from 'react';
import {
  Button,
  Card,
  Header,
  Notice,
  Page,
  Pill,
  Sun,
} from '../ui/GoldenUI.jsx';

export const LINK_SCREEN_IDS = Object.freeze({
  installOpen: 'link-install-open',
  websiteSignIn: 'link-website-sign-in',
  giftClaim: 'link-gift-claim',
  liveRead: 'link-live-read',
  event: 'link-event',
  planReturn: 'link-plan-return',
  legalDocument: 'link-legal-document',
});

function LinkPage({ eyebrow, title, subtitle, onBack, children }) {
  return (
    <Page scroll>
      <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
      <div style={{ display: 'grid', gap: 12, padding: '10px 18px 28px' }}>{children}</div>
    </Page>
  );
}

function LinkHero({ children, detail }) {
  return (
    <Card dark>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Sun size={54} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 23, lineHeight: 1.05 }}>{children}</div>
          {detail && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.5, opacity: 0.78, marginTop: 7 }}>{detail}</div>}
        </div>
      </div>
    </Card>
  );
}

function PrimaryAction({ children, onClick, disabled }) {
  return <Button kind="gold" onClick={onClick} disabled={disabled}>{children}</Button>;
}

function PreviewNotice({ children = 'Preview only · this link does not confirm a connected service.' }) {
  return <Notice>{children}</Notice>;
}

function StatusPill({ children, tone = 'quiet' }) {
  const style = tone === 'success'
    ? { background: '#EFF7E8', color: '#315D21', borderColor: '#CFE7B7' }
    : tone === 'gold'
      ? { background: '#EEFF6A', color: '#0A0A0A', borderColor: '#EEFF6A' }
      : {};
  return <Pill active={tone === 'gold'} style={style}>{children}</Pill>;
}

/** Universal link landing for opening an existing install or starting installation. */
export function InstallOpenScreen({ onBack, onContinue, onInstall, canInstall = false, installed }) {
  const installable = canInstall && typeof onInstall === 'function';
  return (
    <LinkPage eyebrow="golden · welcome back" title="come on in." subtitle="This link is ready to open in Golden." onBack={onBack}>
      <LinkHero detail="Your practice stays on this device. You can return here whenever you're ready.">
        {installed === true ? 'Golden is ready.' : 'A little room to return to.'}
      </LinkHero>
      {installed === false && <Notice>Golden is not installed on this device yet. You can still continue here.</Notice>}
      <PrimaryAction onClick={installable ? onInstall : onContinue}>
        {installable ? 'Add Golden to this device' : 'Open Golden'}
      </PrimaryAction>
      {installable && <Button kind="light" onClick={onContinue}>Continue in browser</Button>}
    </LinkPage>
  );
}

/** Handoff from the public website; this beta has no email/password sign-in. */
export function WebsiteSignInHandoffScreen({ onBack, onContinue }) {
  return (
    <LinkPage eyebrow="from the website" title="your place is here." subtitle="Continue in the Golden app on this device." onBack={onBack}>
      <LinkHero detail="This private beta uses an anonymous, device-local profile. Email sign-in is not available yet.">
        Welcome back.
      </LinkHero>
      <Notice>If you are moving to another device, use your recovery file in Account. Keep that file private.</Notice>
      <PrimaryAction onClick={onContinue}>Continue in Golden</PrimaryAction>
    </LinkPage>
  );
}

/** Gift deep-link state. Only an explicit verified status may be shown as verified. */
export function GiftClaimScreen({ onBack, onContinue, onClaim, gift, verified = false, claimed = false, status }) {
  const hasVerifiedGift = verified === true;
  const isClaimed = hasVerifiedGift && (claimed === true || status === 'claimed');
  const title = isClaimed ? 'This gift is yours.' : hasVerifiedGift ? 'A gift is ready.' : 'A gift link for you.';
  const description = hasVerifiedGift
    ? (isClaimed ? 'The gift status was confirmed.' : 'The gift details were confirmed. Continue to see what is available.')
    : 'Golden has not confirmed this gift link yet. Nothing has been added to your profile.';
  return (
    <LinkPage eyebrow="gift · Golden" title="a little something." subtitle="Open this link in Golden to check the gift." onBack={onBack}>
      <LinkHero detail={description}>{gift?.title || title}</LinkHero>
      {hasVerifiedGift ? <StatusPill tone={isClaimed ? 'success' : 'gold'}>{isClaimed ? 'status confirmed' : 'gift details confirmed'}</StatusPill> : <PreviewNotice>Gift and delivery services are pending until a verified response is provided.</PreviewNotice>}
      {gift?.detail && <Card><div style={{ fontFamily: 'Inter, sans-serif', fontSize: 14, lineHeight: 1.5 }}>{gift.detail}</div></Card>}
      <PrimaryAction onClick={hasVerifiedGift && !isClaimed ? onClaim || onContinue : onContinue} disabled={!onContinue && !onClaim}>
        {isClaimed ? 'Continue to Golden' : hasVerifiedGift ? 'Continue with this gift' : 'Open Golden'}
      </PrimaryAction>
    </LinkPage>
  );
}

/** Deep link to a live read; schedule and live state require a verified caller status. */
export function LiveReadScreen({ onBack, onContinue, title, startsAt, status, verified = false }) {
  const confirmed = verified === true && ['scheduled', 'live', 'ended'].includes(status);
  const stateLabel = confirmed
    ? ({ scheduled: 'scheduled', live: 'live now', ended: 'ended' }[status])
    : 'not confirmed';
  const lead = confirmed
    ? ({ scheduled: 'The read is scheduled.', live: 'The read is live.', ended: 'This read has ended.' }[status])
    : 'This live-read link is ready to open.';
  return (
    <LinkPage eyebrow="together · live read" title={title || 'a moment to listen.'} subtitle={startsAt || 'Open Golden to view this read.'} onBack={onBack}>
      <LinkHero detail={confirmed ? lead : 'The schedule and live status have not been confirmed for this link.'}>Come sit with us.</LinkHero>
      <StatusPill tone={confirmed && status === 'live' ? 'gold' : 'quiet'}>{stateLabel}</StatusPill>
      {!confirmed && <PreviewNotice>Live reads are preview content until a verified schedule is supplied.</PreviewNotice>}
      <PrimaryAction onClick={onContinue}>Open Golden</PrimaryAction>
    </LinkPage>
  );
}

/** Event deep link; an event is presented as confirmed only when the caller supplies verification. */
export function EventScreen({ onBack, onContinue, onAction, title, detail, verified = false, status }) {
  const confirmed = verified === true && status !== 'unavailable';
  return (
    <LinkPage eyebrow="golden hour · gathering" title={title || 'a gathering to explore.'} subtitle="Event details from a Golden link" onBack={onBack}>
      <LinkHero detail={detail || (confirmed ? 'The event details were confirmed.' : 'Golden has not confirmed this event or its availability.')}>Make room for people.</LinkHero>
      {confirmed ? <StatusPill tone="gold">details confirmed</StatusPill> : <PreviewNotice>Events shown in the preview are not listings or reservations.</PreviewNotice>}
      <PrimaryAction onClick={onAction || onContinue}>{confirmed ? 'View in Golden' : 'Open Golden'}</PrimaryAction>
      {confirmed && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: '#756f65', textAlign: 'center' }}>Attendance or a reservation is not confirmed by opening this link.</div>}
    </LinkPage>
  );
}

/** Checkout return state; a query parameter alone never reports successful payment. */
export function PlanReturnScreen({ onBack, onContinue, status, verified = false, planName }) {
  const paid = verified === true && ['complete', 'paid', 'active'].includes(status);
  const canceled = verified === true && status === 'canceled';
  const failed = verified === true && ['failed', 'expired'].includes(status);
  const title = paid ? 'your plan is ready.' : canceled ? 'you can take your time.' : failed ? 'checkout did not finish.' : 'welcome back to Golden.';
  const description = paid
    ? 'The plan status was confirmed.'
    : canceled
      ? 'Checkout was canceled. No plan change is confirmed.'
      : failed
        ? 'The checkout result was confirmed, but no active plan was found.'
        : 'We have not received a verified plan result yet.';
  return (
    <LinkPage eyebrow="the house · plan" title={title} subtitle={planName ? `${planName} · ${description}` : description} onBack={onBack}>
      <LinkHero detail={paid ? 'Your confirmed plan is ready in Golden.' : 'A return link by itself does not confirm a payment or subscription.'}>{paid ? 'Glad you’re here.' : canceled ? 'No hurry.' : 'Your practice is here.'}</LinkHero>
      <StatusPill tone={paid ? 'success' : canceled ? 'quiet' : 'gold'}>{paid ? 'plan confirmed' : canceled ? 'checkout canceled' : failed ? 'checkout not completed' : 'awaiting confirmation'}</StatusPill>
      {!paid && <PreviewNotice>{failed ? 'No active plan was reported by the verified checkout result.' : 'Plan access changes only after the checkout provider confirms the result.'}</PreviewNotice>}
      <PrimaryAction onClick={onContinue}>Continue to Golden</PrimaryAction>
    </LinkPage>
  );
}

/** Legal route handoff to a supplied document viewer or site route. */
export function LegalDocumentHandoffScreen({ onBack, onContinue, onOpenDocument, documentType = 'privacy', documentTitle }) {
  const normalized = documentType === 'terms' ? 'terms' : 'privacy';
  const name = documentTitle || (normalized === 'terms' ? 'Terms of use' : 'Privacy');
  return (
    <LinkPage eyebrow="golden · house notes" title={name.toLowerCase()} subtitle="This document opens from the Golden website." onBack={onBack}>
      <LinkHero detail="Continue to the document route to read the current text. This screen does not replace the document.">
        A clear place to read.
      </LinkHero>
      <Card>
        <div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 18 }}>{name}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#756f65', marginTop: 5 }}>Document route handoff · Golden private beta</div>
      </Card>
      <PrimaryAction onClick={onOpenDocument || onContinue}>Open {name}</PrimaryAction>
    </LinkPage>
  );
}

export default LINK_SCREEN_IDS;
