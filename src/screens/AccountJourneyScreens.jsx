import { useState } from "react";
import {
  Button,
  Card,
  Header,
  Notice,
  Page,
  Pill,
  Row,
  SunMark,
} from "../ui/GoldenUI.jsx";

/**
 * Account journey UI contracts.
 *
 * Every operation in this module is presentation-only until an integration
 * supplies onAction. No password, recovery credential, token, or snapshot is
 * persisted, logged, displayed, or sent to callbacks.
 */

export const ACCOUNT_SCREEN_IDS = Object.freeze([
  "account-sign-up",
  "account-sign-in",
  "account-email-check",
  "account-password-reset",
  "account-guest-conversion",
  "account-progress-transfer",
  "account-conflict-resolution",
  "account-recovery-setup",
  "account-restore",
  "account-signed-in-overview",
  "account-device-list",
  "account-sign-out",
  "account-deletion",
  "account-privacy-data-controls",
  "account-family-minor-eligibility",
]);

const AUTH_NOTICE = "Sign-in is a preview. Supabase authentication is not connected, so no account will be created or changed.";
const PRIVACY_NOTICE = "This preview stores progress in this browser. Account export, remote deletion, and family controls are not fully implemented.";

const inputStyle = {
  display: "block",
  width: "100%",
  minHeight: 48,
  marginTop: 7,
  padding: "12px 14px",
  border: "1px solid #E3E3DE",
  borderRadius: 14,
  background: "#fff",
  color: "#0A0A0A",
  font: "14px/1.4 'Inter', system-ui, sans-serif",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  marginTop: 15,
  color: "#6b6b6b",
  font: "600 10px/1.3 'Inter', system-ui, sans-serif",
  letterSpacing: ".14em",
  textTransform: "uppercase",
};

function FormField({ label, type = "text", value, onChange, autoComplete, required = false }) {
  return (
    <label style={labelStyle}>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={autoComplete}
        required={required}
        style={inputStyle}
      />
    </label>
  );
}

function Journey({ id, eyebrow = "Golden · your account", title, subtitle, onBack, children, footer, tone }) {
  return (
    <Page tone={tone} scroll>
      <div style={{ width: "100%", maxWidth: 560, margin: "0 auto", padding: "20px 18px 40px", boxSizing: "border-box" }} data-account-screen={id}>
        <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
        <div style={{ display: "grid", gap: 12, marginTop: 18 }}>{children}</div>
        {footer && <div style={{ display: "grid", gap: 10, marginTop: 17 }}>{footer}</div>}
      </div>
    </Page>
  );
}

function Status({ children, tone = "info" }) {
  return <Notice tone={tone === "muted" ? "info" : tone}>{children}</Notice>;
}

function buttonVariant(variant) {
  if (variant === "dark") return "ink";
  if (variant === "quiet") return "ghost";
  if (variant === "lemon") return "gold";
  return variant;
}

function Action({ children, onAction, action, screenId, payload, variant = "dark", disabled = false }) {
  return (
    <Button
      variant={buttonVariant(variant)}
      disabled={disabled}
      onClick={() => onAction?.({ type: action, screenId, ...(payload ? { payload } : {}) })}
    >
      {children}
    </Button>
  );
}

function NavigationAction({ children, onNavigate, screenId, variant = "quiet" }) {
  return <Button variant={buttonVariant(variant)} onClick={() => onNavigate?.(screenId)}>{children}</Button>;
}

export function AccountSignUpScreen({ onBack, onNavigate, onAction }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accepted, setAccepted] = useState(false);
  const id = "account-sign-up";
  return (
    <Journey id={id} title="Make a place for your progress." subtitle="An account could carry your place between devices." onBack={onBack}>
      <Card>
        <Status>{AUTH_NOTICE}</Status>
        <form onSubmit={(event) => { event.preventDefault(); onAction?.({ type: "account.sign-up.requested", screenId: id, payload: { emailProvided: Boolean(email), passwordProvided: Boolean(password), acceptedPreviewTerms: accepted } }); setPassword(""); }}>
          <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <FormField label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" required />
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 16, color: "#0A0A0A", font: "13px/1.45 'Inter', system-ui, sans-serif" }}>
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} style={{ width: 18, height: 18, margin: "1px 0 0", accentColor: "#0A0A0A" }} />
            <span>I understand this is a preview and that account creation is not available yet.</span>
          </label>
          <div style={{ marginTop: 16 }}><Button type="submit" variant="ink" disabled={!accepted}>Continue</Button></div>
        </form>
      </Card>
      <Card><Row title="Already have a place?" detail="The sign-in screen is also a preview." trailing="→" onClick={() => onNavigate?.("account-sign-in")} /></Card>
    </Journey>
  );
}

export function AccountSignInScreen({ onBack, onNavigate, onAction }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const id = "account-sign-in";
  return (
    <Journey id={id} title="Welcome back." subtitle="Your saved place stays in this browser in the current preview." onBack={onBack}>
      <Card>
        <Status>{AUTH_NOTICE}</Status>
        <form onSubmit={(event) => { event.preventDefault(); onAction?.({ type: "account.sign-in.requested", screenId: id, payload: { emailProvided: Boolean(email), passwordProvided: Boolean(password) } }); setPassword(""); }}>
          <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <FormField label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" required />
          <div style={{ marginTop: 16 }}><Button type="submit" variant="ink">Sign in</Button></div>
        </form>
        <div style={{ marginTop: 12 }}><NavigationAction onNavigate={onNavigate} screenId="account-password-reset">Forgot your password?</NavigationAction></div>
      </Card>
      <Card><Row title="New to Golden?" detail="Create an account when sign-up is available." trailing="→" onClick={() => onNavigate?.("account-sign-up")} /></Card>
    </Journey>
  );
}

export function AccountEmailCheckScreen({ onBack, onNavigate }) {
  return (
    <Journey id="account-email-check" eyebrow="Golden · check your inbox" title="One small check." subtitle="We would send a verification link here after a connected sign-up." onBack={onBack}>
      <Card><SunMark size={54} mood="quiet" /><div style={{ marginTop: 12 }}><Pill tone="muted">Email verification · not connected</Pill></div><p style={{ margin: "14px 0 0", color: "#6b6b6b", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>No email was sent. Supabase authentication and email delivery are not connected in this preview.</p></Card>
      <NavigationAction onNavigate={onNavigate} screenId="account-sign-in">Back to sign in</NavigationAction>
    </Journey>
  );
}

export function AccountPasswordResetScreen({ onBack, onAction }) {
  const [email, setEmail] = useState("");
  const id = "account-password-reset";
  return (
    <Journey id={id} eyebrow="Golden · account help" title="Find your way back." subtitle="A verified email reset would help recover a connected account." onBack={onBack}>
      <Card>
        <Status>{AUTH_NOTICE}</Status>
        <form onSubmit={(event) => { event.preventDefault(); onAction?.({ type: "account.password-reset.requested", screenId: id, payload: { emailProvided: Boolean(email) } }); }}>
          <FormField label="Email" type="email" value={email} onChange={setEmail} autoComplete="email" required />
          <div style={{ marginTop: 16 }}><Button type="submit" variant="ink">Send reset link</Button></div>
        </form>
      </Card>
      <Status tone="muted">No reset email will be sent. The current anonymous device account has no verified email or password.</Status>
    </Journey>
  );
}

export function AccountGuestConversionScreen({ onBack, onNavigate, onAction }) {
  const id = "account-guest-conversion";
  return (
    <Journey id={id} eyebrow="Golden · keep your place" title="Your practice can start here." subtitle="You are using an anonymous account stored on this device." onBack={onBack}>
      <Card><Pill tone="gold">Saved on this device</Pill><p style={{ margin: "13px 0 0", color: "#0A0A0A", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>The current preview does not convert a device account into a verified sign-in. Your progress remains local unless you use the separate encrypted backup controls.</p></Card>
      <Status>{AUTH_NOTICE}</Status>
      <Action screenId={id} action="account.guest-conversion.requested" onAction={onAction} variant="dark">Continue with preview</Action>
      <NavigationAction onNavigate={onNavigate} screenId="account-recovery-setup">Review recovery options</NavigationAction>
    </Journey>
  );
}

export function AccountProgressTransferScreen({ onBack, onAction }) {
  const id = "account-progress-transfer";
  return (
    <Journey id={id} eyebrow="Golden · move your place" title="Bring your progress along." subtitle="Choose which copy to keep after both devices are verified." onBack={onBack}>
      <Card><Row title="This device" detail="Local progress · details hidden" leading="◉" trailing={<Pill tone="gold">Here</Pill>} /></Card>
      <Card><Row title="Another device" detail="No signed-in device is connected" leading="○" trailing={<Pill tone="muted">Unavailable</Pill>} /></Card>
      <Status>Cross-device transfer is not connected. No progress has been copied or changed.</Status>
      <Action screenId={id} action="account.progress-transfer.requested" onAction={onAction} disabled variant="dark">Transfer progress</Action>
    </Journey>
  );
}

export function AccountConflictResolutionScreen({ onBack, onAction }) {
  const id = "account-conflict-resolution";
  return (
    <Journey id={id} eyebrow="Golden · choose a copy" title="Two places to continue." subtitle="Review the copies before choosing one to keep." onBack={onBack}>
      <Card><Pill tone="gold">This device</Pill><h2 style={{ margin: "10px 0 4px", font: "650 17px/1.25 'Inter', system-ui, sans-serif" }}>Saved here</h2><p style={{ margin: 0, color: "#6b6b6b", font: "13px/1.45 'Inter', system-ui, sans-serif" }}>Local progress · date details not loaded</p></Card>
      <Card><Pill tone="muted">Encrypted backup</Pill><h2 style={{ margin: "10px 0 4px", font: "650 17px/1.25 'Inter', system-ui, sans-serif" }}>Not checked</h2><p style={{ margin: 0, color: "#6b6b6b", font: "13px/1.45 'Inter', system-ui, sans-serif" }}>No remote comparison has been made.</p></Card>
      <Status>Automatic merging is not available. Check both copies and make a deliberate choice before a future restore.</Status>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Action screenId={id} action="account.conflict.keep-local" onAction={onAction} variant="dark">Keep this device</Action>
        <Action screenId={id} action="account.conflict.keep-remote" onAction={onAction} variant="quiet">Use backup</Action>
      </div>
    </Journey>
  );
}

export function AccountRecoverySetupScreen({ onBack, onNavigate, onAction }) {
  const id = "account-recovery-setup";
  return (
    <Journey id={id} eyebrow="Golden · your private key" title="Keep a copy you control." subtitle="A recovery file can include your private sync credential only when you choose." onBack={onBack}>
      <Card><Pill tone="gold">Credential hidden</Pill><p style={{ margin: "12px 0 0", color: "#0A0A0A", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>The credential is never shown on this screen. The existing account area can export a recovery file; its credential is excluded by default.</p></Card>
      <Status tone="warning">A file that includes the recovery credential works like a password. Keep it private. Do not share it or place it in a public folder.</Status>
      <Action screenId={id} action="account.recovery.setup.requested" onAction={onAction} variant="dark">Open recovery options</Action>
      <NavigationAction onNavigate={onNavigate} screenId="account-restore">Restore from a file</NavigationAction>
    </Journey>
  );
}

export function AccountRestoreScreen({ onBack, onAction }) {
  const [fileSelected, setFileSelected] = useState(false);
  const id = "account-restore";
  return (
    <Journey id={id} eyebrow="Golden · restore a place" title="Bring a saved copy here." subtitle="Choose a recovery file to preview its details before restoring." onBack={onBack}>
      <Card>
        <div style={{ position: "relative", marginTop: 12 }}>
          <Button variant="ghost">Choose recovery file</Button>
          <input aria-label="Choose recovery file" type="file" accept="application/json,.json" onChange={(event) => setFileSelected(Boolean(event.target.files?.length))} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
        </div>
        {fileSelected && <p style={{ margin: "10px 0 0", color: "#6b6b6b", font: "12px/1.45 'Inter', system-ui, sans-serif" }}>A file is selected. Its name and contents stay hidden here.</p>}
        <p style={{ margin: "13px 0 0", color: "#6b6b6b", font: "12px/1.45 'Inter', system-ui, sans-serif" }}>The file contents and any recovery credential stay hidden. This screen does not read or restore the file.</p>
      </Card>
      <Status>{PRIVACY_NOTICE}</Status>
      <Action screenId={id} action="account.restore.requested" onAction={onAction} disabled={!fileSelected} variant="dark" payload={{ fileSelected }}>Review restore</Action>
    </Journey>
  );
}

export function AccountSignedInOverviewScreen({ onBack, onNavigate }) {
  return (
    <Journey id="account-signed-in-overview" eyebrow="Golden · account" title="Your place, kept safe." subtitle="Account overview for a future signed-in experience." onBack={onBack}>
      <Card><Pill tone="muted">Not signed in</Pill><p style={{ margin: "12px 0 0", color: "#0A0A0A", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>This preview uses an anonymous device account. Supabase authentication is not connected.</p></Card>
      <Card><Row title="Your devices" detail="Device management is not connected" trailing="→" onClick={() => onNavigate?.("account-device-list")} /></Card>
      <Card><Row title="Privacy and data" detail="See local data and account controls" trailing="→" onClick={() => onNavigate?.("account-privacy-data-controls")} /></Card>
      <NavigationAction onNavigate={onNavigate} screenId="account-sign-in" variant="dark">Sign-in preview</NavigationAction>
    </Journey>
  );
}

export function AccountDeviceListScreen({ onBack, onAction }) {
  const id = "account-device-list";
  return (
    <Journey id={id} eyebrow="Golden · your devices" title="Your place, on your devices." subtitle="Review active sessions and remove devices you no longer use." onBack={onBack}>
      <Card><Row title="This device" detail="Anonymous · saved in this browser" leading="◉" trailing={<Pill tone="gold">Current</Pill>} /></Card>
      <Card><Row title="Other devices" detail="No verified device list is available" leading="○" trailing={<Pill tone="muted">Not connected</Pill>} /></Card>
      <Status>There is no signed-in session or device revocation service connected. No devices can be removed here.</Status>
      <Action screenId={id} action="account.device-revoke.requested" onAction={onAction} disabled variant="quiet">Remove another device</Action>
    </Journey>
  );
}

export function AccountSignOutScreen({ onBack, onNavigate, onAction }) {
  const id = "account-sign-out";
  return (
    <Journey id={id} eyebrow="Golden · sign out" title="Leave this device?" subtitle="Signing out of a future account would end its session here." onBack={onBack}>
      <Card><Pill tone="muted">No signed-in session</Pill><p style={{ margin: "12px 0 0", color: "#0A0A0A", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>The current anonymous account remains saved in this browser. Closing Golden will not remove local progress.</p></Card>
      <Action screenId={id} action="account.sign-out.requested" onAction={onAction} variant="dark">Sign out preview</Action>
      <NavigationAction onNavigate={onNavigate} screenId="account-signed-in-overview">Back to account</NavigationAction>
    </Journey>
  );
}

export function AccountDeletionScreen({ onBack, onAction }) {
  const id = "account-deletion";
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <Journey id={id} eyebrow="Golden · delete data" title="You should be able to leave." subtitle="Deletion should explain what will be removed before anything changes." onBack={onBack}>
      <Card><Pill style={{ background: "#FFF0EC", color: "#8B332B", borderColor: "#E8C6BD" }}>Deletion unavailable</Pill><p style={{ margin: "12px 0 0", color: "#0A0A0A", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>This preview has no verified identity or remote deletion route. Clearing this browser would not remove remote backups or provider logs.</p></Card>
      <label style={{ display: "flex", gap: 10, alignItems: "flex-start", color: "#0A0A0A", font: "13px/1.45 'Inter', system-ui, sans-serif" }}><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} style={{ width: 18, height: 18, margin: "1px 0 0", accentColor: "#0A0A0A" }} /><span>I understand this screen cannot delete my local or remote data.</span></label>
      <Action screenId={id} action="account.deletion.requested" onAction={onAction} disabled={!acknowledged} variant="dark">Review deletion options</Action>
    </Journey>
  );
}

export function AccountPrivacyDataControlsScreen({ onBack, onNavigate, onAction }) {
  const id = "account-privacy-data-controls";
  return (
    <Journey id={id} eyebrow="Golden · privacy" title="Your practice is personal." subtitle="Understand what is saved and choose what happens to it." onBack={onBack}>
      <Status>{PRIVACY_NOTICE}</Status>
      <Card><Row title="Saved on this device" detail="Progress and preferences use browser storage" leading="◉" /></Card>
      <Card><Row title="Encrypted backup" detail="Optional; status must be confirmed by a live request" leading="◇" /></Card>
      <Card><Row title="Export or restore" detail="Recovery file controls" trailing="→" onClick={() => onNavigate?.("account-recovery-setup")} /></Card>
      <Action screenId={id} action="account.local-data-clear.requested" onAction={onAction} variant="quiet">Review local data options</Action>
      <NavigationAction onNavigate={onNavigate} screenId="account-deletion">Deletion information</NavigationAction>
    </Journey>
  );
}

export function AccountFamilyMinorEligibilityScreen({ onBack, onNavigate, onAction }) {
  const id = "account-family-minor-eligibility";
  return (
    <Journey id={id} eyebrow="Golden · who can join" title="A safe start comes first." subtitle="Family and child accounts need clear guardian consent and privacy safeguards." onBack={onBack}>
      <Card><Pill tone="warning">Family access is not available</Pill><p style={{ margin: "12px 0 0", color: "#0A0A0A", font: "14px/1.5 'Inter', system-ui, sans-serif" }}>This preview has no age check, parent account, guardian consent flow, or child privacy controls. Do not create an account for a minor here.</p></Card>
      <Status tone="muted">Eligibility and family membership have not been reviewed or connected for use.</Status>
      <Action screenId={id} action="account.family-eligibility.learn-more" onAction={onAction} variant="dark">Learn about the preview</Action>
      <NavigationAction onNavigate={onNavigate} screenId="account-privacy-data-controls">Read privacy controls</NavigationAction>
    </Journey>
  );
}

// Short aliases keep route registries readable while the full names stay clear
// to component consumers and tests.
export const SignUpScreen = AccountSignUpScreen;
export const SignInScreen = AccountSignInScreen;
export const EmailCheckScreen = AccountEmailCheckScreen;
export const PasswordResetScreen = AccountPasswordResetScreen;
export const GuestConversionScreen = AccountGuestConversionScreen;
export const ProgressTransferScreen = AccountProgressTransferScreen;
export const ConflictResolutionScreen = AccountConflictResolutionScreen;
export const RecoverySetupScreen = AccountRecoverySetupScreen;
export const RestoreScreen = AccountRestoreScreen;
export const SignedInOverviewScreen = AccountSignedInOverviewScreen;
export const DeviceListScreen = AccountDeviceListScreen;
export const SignOutScreen = AccountSignOutScreen;
export const DeletionScreen = AccountDeletionScreen;
export const PrivacyDataControlsScreen = AccountPrivacyDataControlsScreen;
export const FamilyMinorEligibilityScreen = AccountFamilyMinorEligibilityScreen;
