import { useEffect, useMemo, useRef, useState } from "react";
import {
  createSupabaseIdentityClient,
  createLocalSnapshot,
  fetchRemoteSnapshot,
  getLocalAccount,
  getLocalSession,
  getPlatformCapabilities,
  importLocalSnapshot,
  parseLocalSnapshot,
  saveRemoteSnapshot,
} from "../platform/index.js";

const C = {
  cream: "#F7F7F5",
  sand: "#ECECE8",
  ink: "#0A0A0A",
  lemon: "#EEFF6A",
  mute: "#6b6b6b",
  line: "#E3E3DE",
  white: "#fff",
  danger: "#8B332B",
  good: "#285B31",
};
const FONT = "'Inter', system-ui, sans-serif";
const BACKUP_PREFERENCE_KEY = "golden:platform:encrypted-backup-opt-in:v1";
const MAX_IMPORT_BYTES = 128 * 1024;

function readBackupPreference() {
  try { return globalThis.localStorage?.getItem(BACKUP_PREFERENCE_KEY) === "true"; }
  catch { return false; }
}

function saveBackupPreference(value) {
  try {
    if (!globalThis.localStorage) return false;
    globalThis.localStorage.setItem(BACKUP_PREFERENCE_KEY, value ? "true" : "false");
    return true;
  } catch { return false; }
}

function readableSyncError(code) {
  const messages = {
    remote_state_not_initialized: "No encrypted backup exists for this device account yet. Upload one to create it.",
    state_service_unavailable: "The backup service is unavailable right now. Your device data is unchanged.",
    snapshot_account_mismatch: "This backup belongs to a different account and was not uploaded.",
    state_upload_failed: "The snapshot could not be encrypted or uploaded. Your device data is unchanged.",
  };
  return messages[code] || "The backup request did not complete. Your device data is unchanged.";
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function snapshotSummary(snapshot) {
  return `Saved ${formatDate(snapshot.exportedAt)}${snapshot.appState ? " · includes learning progress" : " · no learning progress found"}`;
}

function readableAuthError(code, mode = "sign-in") {
  const messages = {
    supabase_auth_not_configured: "Email sign-in is unavailable because Supabase browser settings are not configured.",
    auth_network_unavailable: "Golden could not reach Supabase. Your device progress is unchanged.",
    email_and_password_required: "Enter an email address and password to continue.",
    invalid_credentials: "That email and password could not be verified. Check them and try again.",
    email_not_confirmed: "Confirm your email address before signing in.",
    user_already_exists: "An account may already use this email. Try signing in instead.",
    email_exists: "An account may already use this email. Try signing in instead.",
    weak_password: "Choose a stronger password that meets the account requirements.",
    auth_pkce_unavailable: "This browser could not safely start the account confirmation flow.",
    auth_callback_session_missing: "The email link did not return a sign-in session. Request a fresh link and try again.",
    auth_pkce_verifier_missing: "This email link was opened in a different or cleared browser session. Start again on this device.",
  };
  if (messages[code]) return messages[code];
  return mode === "sign-up"
    ? "The account request could not be completed. Your device progress is unchanged."
    : "Sign-in could not be completed. Your device progress is unchanged.";
}

function publicIdentityState(value) {
  return {
    status: value?.status || "unconfigured",
    configured: value?.configured === true,
    authenticated: value?.authenticated === true,
    user: value?.user ? { id: value.user.id, email: value.user.email, emailConfirmedAt: value.user.emailConfirmedAt } : null,
    persistence: value?.persistence || "none",
    errorCode: value?.errorCode || null,
  };
}

function accountAuthRedirectUrl(flow = "account") {
  if (typeof window === "undefined") return undefined;
  const url = new URL(window.location.href);
  url.searchParams.set("view", "account");
  url.searchParams.set("flow", flow);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("error_code");
  url.searchParams.delete("error_description");
  url.hash = "";
  return url.toString();
}

export default function AccountScreen({ onClose, initialMode = "sign-in", onAuthenticated }) {
  const account = useMemo(() => getLocalAccount(), []);
  const session = useMemo(() => getLocalSession(), []);
  const capabilities = useMemo(() => getPlatformCapabilities(), []);
  const identityClient = useMemo(() => createSupabaseIdentityClient(), []);
  const fileInput = useRef(null);
  const [backupEnabled, setBackupEnabled] = useState(readBackupPreference);
  const [includeRecoveryCredential, setIncludeRecoveryCredential] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const [syncStatus, setSyncStatus] = useState("not-confirmed");
  const [pendingImport, setPendingImport] = useState(null);
  const [remoteReview, setRemoteReview] = useState(null);
  const [identity, setIdentity] = useState(() => publicIdentityState(identityClient.getState()));
  const [authMode, setAuthMode] = useState(initialMode);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirmation, setAuthPasswordConfirmation] = useState("");
  const [recoveryEmailSent, setRecoveryEmailSent] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const authCallbackHandled = useRef(false);
  const authCompletionHandled = useRef(false);

  useEffect(() => {
    if (!identity.authenticated || !onAuthenticated || authCompletionHandled.current) return;
    authCompletionHandled.current = true;
    onAuthenticated(identity);
  }, [identity, onAuthenticated]);

  useEffect(() => {
    const subscription = identityClient.onAuthStateChange((_event, nextState) => setIdentity(publicIdentityState(nextState)));
    setIdentity(publicIdentityState(identityClient.getState()));

    if (typeof window !== "undefined") {
      const current = new URL(window.location.href);
      const hasAuthCallback = current.searchParams.has("code") || current.searchParams.has("error") || current.searchParams.has("error_code") || /(?:^|[&#])(access_token|error|error_code)=/.test(current.hash);
      if (identityClient.getState().configured && hasAuthCallback && !authCallbackHandled.current) {
        authCallbackHandled.current = true;
        const callbackFlow = current.searchParams.get("flow") || (/type=recovery/.test(current.hash) ? "recovery" : "account");
        setAuthBusy(true);
        identityClient.handleAuthCallback(current.href).then((result) => {
          setIdentity(publicIdentityState(result));
          if (result.ok && callbackFlow === "recovery") setAuthMode("new-password");
          setNotice(result.ok
            ? callbackFlow === "recovery"
              ? { type: "info", text: "Your recovery link is verified. Choose a new password below." }
              : { type: "success", text: "Your Supabase sign-in is confirmed in this browser. Existing anonymous progress remains separate and has not been transferred." }
            : { type: "error", text: readableAuthError(result.errorCode) });
        }).catch(() => {
          setNotice({ type: "error", text: "The email link could not be completed. Your device progress is unchanged." });
        }).finally(() => {
          for (const key of ["code", "error", "error_code", "error_description", "type", "flow"]) current.searchParams.delete(key);
          current.hash = "";
          window.history.replaceState(window.history.state, "", `${current.pathname}${current.search}${current.hash}`);
          setAuthBusy(false);
        });
      }
    }

    return () => subscription.data.subscription.unsubscribe();
  }, [identityClient]);

  const submitAuth = async (event) => {
    event.preventDefault();
    if (authBusy) return;
    if (authMode === "sign-up" && authPassword !== authPasswordConfirmation) {
      setNotice({ type: "error", text: "Those passwords do not match." });
      return;
    }
    setAuthBusy(true);
    setNotice(null);
    try {
      const result = authMode === "sign-up"
        ? await identityClient.signUp({ email: authEmail, password: authPassword, redirectTo: accountAuthRedirectUrl() })
        : await identityClient.signIn({ email: authEmail, password: authPassword });
      setIdentity(publicIdentityState(result));
      setConfirmSignOut(false);
      if (!result.ok) {
        setNotice({ type: "error", text: readableAuthError(result.errorCode, authMode) });
      } else if (result.confirmationRequired) {
        setAuthMode("sign-in");
        setNotice({ type: "info", text: "Supabase accepted the sign-up request and requires email confirmation before a session can start. Delivery is not independently confirmed. Your existing device progress remains separate." });
      } else if (result.authenticated) {
        setAuthPassword("");
        setAuthPasswordConfirmation("");
        setNotice({ type: "success", text: "You are signed in with Supabase in this browser. Existing anonymous progress has not been transferred or synced." });
      }
    } catch {
      setNotice({ type: "error", text: readableAuthError("auth_request_failed", authMode) });
    } finally {
      setAuthPassword("");
      setAuthPasswordConfirmation("");
      setAuthBusy(false);
    }
  };

  const requestPasswordReset = async (event) => {
    event.preventDefault();
    if (authBusy) return;
    setAuthBusy(true);
    setNotice(null);
    setRecoveryEmailSent(false);
    try {
      const result = await identityClient.requestPasswordReset({ email: authEmail, redirectTo: accountAuthRedirectUrl("recovery") });
      if (!result.ok) setNotice({ type: "error", text: readableAuthError(result.errorCode, "recovery") });
      else {
        setRecoveryEmailSent(true);
        setNotice({ type: "info", text: "Supabase accepted the recovery request. Check that inbox for a password-reset link. Email delivery is not independently confirmed." });
      }
    } catch {
      setNotice({ type: "error", text: readableAuthError("auth_request_failed", "recovery") });
    } finally { setAuthBusy(false); }
  };

  const updatePassword = async (event) => {
    event.preventDefault();
    if (authBusy) return;
    if (!authPassword || authPassword !== authPasswordConfirmation) {
      setNotice({ type: "error", text: authPassword ? "Those passwords do not match." : "Enter and confirm a new password." });
      return;
    }
    setAuthBusy(true);
    setNotice(null);
    try {
      const result = await identityClient.updatePassword({ password: authPassword });
      if (!result.ok) setNotice({ type: "error", text: readableAuthError(result.errorCode, "recovery") });
      else {
        setAuthPassword("");
        setAuthPasswordConfirmation("");
        setAuthMode("sign-in");
        setNotice({ type: "success", text: "Your Supabase password was updated. This browser remains signed in; anonymous device progress is still separate." });
      }
    } catch {
      setNotice({ type: "error", text: readableAuthError("auth_request_failed", "recovery") });
    } finally { setAuthBusy(false); }
  };

  const signOut = async () => {
    if (authBusy) return;
    setAuthBusy(true);
    setNotice(null);
    try {
      const result = await identityClient.signOut();
      setIdentity(publicIdentityState(result));
      setConfirmSignOut(false);
      setNotice(result.remoteRevoked
        ? { type: "success", text: "You are signed out in this browser. Your anonymous device profile and recovery backup remain separate." }
        : { type: "info", text: "Supabase cleared this browser’s sign-in session, but remote session revocation could not be confirmed. Your anonymous device profile and recovery backup remain separate." });
    } catch {
      setNotice({ type: "error", text: "Sign-out could not be completed. Check the account status before continuing." });
    } finally { setAuthBusy(false); }
  };

  const updateOptIn = (checked) => {
    const stored = saveBackupPreference(checked);
    setBackupEnabled(stored ? checked : false);
    setNotice(stored
      ? { type: "info", text: checked ? "Encrypted backup is enabled for this browser. Nothing has been uploaded." : "Encrypted backup is disabled. Existing remote data is not deleted." }
      : { type: "error", text: "This browser could not save the backup preference. The setting remains off." });
  };

  const exportRecoveryFile = () => {
    try {
      const snapshot = parseLocalSnapshot(createLocalSnapshot({ includeRecoveryCredential }));
      const contents = JSON.stringify(snapshot, null, 2);
      const url = URL.createObjectURL(new Blob([contents], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `golden-recovery-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice({ type: "success", text: includeRecoveryCredential
        ? "Backup file downloaded with its private sync credential. Anyone with this file can access this anonymous account’s encrypted backup. Keep it somewhere private and never share it."
        : "Backup file downloaded without the private sync credential. It contains this device account’s saved progress, but cannot access an encrypted server backup." });
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "Could not create a recovery file." });
    }
  };

  const readImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setNotice(null);
    setPendingImport(null);
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error("This file is larger than the 128 KiB import limit.");
      if (!(file.type === "application/json" || file.name.toLowerCase().endsWith(".json"))) {
        throw new Error("Choose a Golden JSON backup file.");
      }
      const snapshot = parseLocalSnapshot(await file.text());
      setPendingImport({ snapshot, name: file.name });
    } catch (error) {
      setPendingImport(null);
      setNotice({ type: "error", text: error?.message || "That recovery file could not be read." });
    }
  };

  const confirmImport = () => {
    if (!pendingImport) return;
    try {
      const result = importLocalSnapshot(pendingImport.snapshot);
      setPendingImport(null);
      setNotice({ type: "success", text: `Recovery file restored on this device${result.restoredAppState ? ", including saved learning progress" : ""}${result.restoredSyncIdentity ? " and its encrypted-backup identity" : ""}. Reload the app to refresh the account screen.` });
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "The recovery file could not be restored." });
    }
  };

  const uploadBackup = async () => {
    if (!backupEnabled || busy) return;
    setBusy("upload");
    setNotice(null);
    try {
      const result = await saveRemoteSnapshot({ snapshot: createLocalSnapshot() });
      if (result.delivered) {
        setSyncStatus("delivered");
        setNotice({ type: "success", text: `Encrypted backup uploaded successfully${result.updatedAt ? ` · ${formatDate(result.updatedAt)}` : ""}.` });
      } else {
        setSyncStatus("not-confirmed");
        setNotice({ type: "error", text: readableSyncError(result.errorCode) });
      }
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "The backup upload did not complete." });
    } finally { setBusy(""); }
  };

  const checkRemoteBackup = async () => {
    if (!backupEnabled || busy) return;
    setBusy("restore-check");
    setNotice(null);
    setRemoteReview(null);
    try {
      const result = await fetchRemoteSnapshot();
      if (result.snapshot) {
        setSyncStatus("connected");
        setRemoteReview({ snapshot: parseLocalSnapshot(result.snapshot), updatedAt: result.updatedAt });
      } else {
        setSyncStatus(result.errorCode === "remote_state_not_initialized" ? "no-backup" : "not-confirmed");
        setNotice({ type: "info", text: readableSyncError(result.errorCode) });
      }
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "Could not check for an encrypted backup." });
    } finally { setBusy(""); }
  };

  const confirmRemoteRestore = () => {
    if (!remoteReview) return;
    try {
      const result = importLocalSnapshot(remoteReview.snapshot);
      setRemoteReview(null);
      setNotice({ type: "success", text: `Encrypted backup restored on this device${result.restoredAppState ? ", including saved learning progress" : ""}. Reload the app to see the restored account data.` });
    } catch (error) {
      setNotice({ type: "error", text: error?.message || "The encrypted backup could not be restored." });
    }
  };

  const card = { background: C.white, border: `1px solid ${C.line}`, borderRadius: 18, padding: 18, marginTop: 14 };
  const button = (kind = "dark") => ({
    appearance: "none", border: kind === "quiet" ? `1px solid ${C.line}` : "1px solid transparent",
    background: kind === "dark" ? C.ink : kind === "lemon" ? C.lemon : C.white,
    color: kind === "dark" ? C.lemon : C.ink, borderRadius: 999, padding: "12px 16px", font: `600 13px ${FONT}`,
    cursor: busy ? "wait" : "pointer", opacity: busy ? 0.65 : 1,
  });
  const smallLabel = { font: `700 10px ${FONT}`, letterSpacing: ".12em", textTransform: "uppercase", color: C.mute };
  const body = { font: `14px/1.5 ${FONT}`, color: C.ink, margin: "7px 0 0" };
  const statusTone = { error: C.danger, success: C.good, info: C.mute };

  return (
    <main style={{ height: "100%", overflowY: "auto", background: C.cream, color: C.ink, fontFamily: FONT, padding: "20px 18px 36px", boxSizing: "border-box" }}>
      <div className="golden-account" style={{ maxWidth: 560, margin: "0 auto" }}>
        <style>{`.golden-account button:focus-visible,.golden-account input:focus-visible{outline:3px solid #285B31;outline-offset:3px}.golden-account button:disabled{cursor:not-allowed;opacity:.55}`}</style>
        <header style={{ marginBottom: 22 }}>
          {onClose && <button type="button" onClick={onClose} aria-label="Go back" style={{ minHeight: 44, display: "inline-flex", alignItems: "center", gap: 5, border: 0, background: "transparent", color: C.ink, padding: 0, ...smallLabel, cursor: "pointer" }}><span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>‹</span>back</button>}
          <div>
            <div style={smallLabel}>Golden · your account</div>
            <h1 style={{ font: `700 30px/1.08 ${FONT}`, letterSpacing: "-.04em", margin: "8px 0 0" }}>Your place, kept safe.</h1>
          </div>
        </header>

        <section style={card} aria-labelledby="email-account-title">
          <div style={smallLabel}>Email account</div>
          <h2 id="email-account-title" style={{ font: `650 18px ${FONT}`, margin: "8px 0 0" }}>
            {identity.authenticated ? "Signed in with Supabase" : identity.configured ? "Use an email account" : "Email sign-in is not configured"}
          </h2>
          {identity.authenticated && authMode !== "new-password" ? (
            <>
              <p style={body}>{identity.user?.email || "Signed-in email is unavailable"}</p>
              {identity.user?.emailConfirmedAt
                ? <p style={{ ...body, fontSize: 12, color: C.good }}>Email confirmation is recorded by Supabase.</p>
                : <p style={{ ...body, fontSize: 12, color: C.mute }}>Supabase has not supplied an email confirmation timestamp for this session.</p>}
              <p style={body}>Your anonymous device profile and recovery backup remain separate. Signing in does not transfer, merge, upload, or sync that progress.</p>
              {confirmSignOut ? <div role="group" aria-label="Confirm sign out" style={{ marginTop: 15, padding: 14, borderRadius: 14, background: C.cream }}>
                <p style={{ ...body, marginTop: 0, fontWeight: 650 }}>Sign out of the email account on this browser?</p>
                <p style={{ ...body, fontSize: 12, color: C.mute }}>Your local anonymous progress and recovery files will stay on this device.</p>
                <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
                  <button type="button" disabled={authBusy} onClick={signOut} style={{ ...button("dark"), minHeight: 44 }}>{authBusy ? "Signing out…" : "Yes, sign out"}</button>
                  <button type="button" disabled={authBusy} onClick={() => setConfirmSignOut(false)} style={{ ...button("quiet"), minHeight: 44 }}>Cancel</button>
                </div>
              </div> : <button type="button" disabled={authBusy} onClick={() => setConfirmSignOut(true)} style={{ ...button("quiet"), minHeight: 44, marginTop: 14 }}>Sign out</button>}
            </>
          ) : identity.configured ? (
            <>
              <p style={body}>Supabase email authentication is configured. Your local anonymous profile and recovery backup remain separate; signing in does not transfer or sync progress.</p>
              {authMode !== "new-password" && <div role="group" aria-label="Email account action" style={{ display: "flex", gap: 8, marginTop: 15 }}>
                <button type="button" aria-pressed={authMode === "sign-in"} onClick={() => { setAuthMode("sign-in"); setNotice(null); }} style={{ ...button(authMode === "sign-in" ? "dark" : "quiet"), minHeight: 44 }}>
                  Sign in
                </button>
                <button type="button" aria-pressed={authMode === "sign-up"} onClick={() => { setAuthMode("sign-up"); setNotice(null); }} style={{ ...button(authMode === "sign-up" ? "dark" : "quiet"), minHeight: 44 }}>
                  Create account
                </button>
              </div>}
              {authMode === "recovery" ? <form onSubmit={requestPasswordReset}>
                <label htmlFor="golden-recovery-email" style={{ display: "block", ...smallLabel, marginTop: 16 }}>Account email</label>
                <input id="golden-recovery-email" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" required disabled={authBusy} style={{ width: "100%", minHeight: 48, boxSizing: "border-box", marginTop: 7, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, color: C.ink, font: `14px ${FONT}` }} />
                <button type="submit" disabled={authBusy} style={{ ...button("dark"), minHeight: 48, marginTop: 15 }}>{authBusy ? "Requesting…" : recoveryEmailSent ? "Send another recovery link" : "Send recovery link"}</button>
                <button type="button" onClick={() => { setAuthMode("sign-in"); setRecoveryEmailSent(false); setNotice(null); }} style={{ ...button("quiet"), minHeight: 44, marginTop: 9 }}>Back to sign in</button>
              </form> : authMode === "new-password" ? <form onSubmit={updatePassword}>
                <label htmlFor="golden-new-password" style={{ display: "block", ...smallLabel, marginTop: 16 }}>New password</label>
                <input id="golden-new-password" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete="new-password" required disabled={authBusy} style={{ width: "100%", minHeight: 48, boxSizing: "border-box", marginTop: 7, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, color: C.ink, font: `14px ${FONT}` }} />
                <label htmlFor="golden-new-password-confirmation" style={{ display: "block", ...smallLabel, marginTop: 14 }}>Confirm new password</label>
                <input id="golden-new-password-confirmation" type="password" value={authPasswordConfirmation} onChange={(event) => setAuthPasswordConfirmation(event.target.value)} autoComplete="new-password" required disabled={authBusy} style={{ width: "100%", minHeight: 48, boxSizing: "border-box", marginTop: 7, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, color: C.ink, font: `14px ${FONT}` }} />
                <button type="submit" disabled={authBusy} style={{ ...button("dark"), minHeight: 48, marginTop: 15 }}>{authBusy ? "Updating…" : "Update password"}</button>
              </form> : <form onSubmit={submitAuth}>
                <label htmlFor="golden-auth-email" style={{ display: "block", ...smallLabel, marginTop: 16 }}>Email</label>
                <input id="golden-auth-email" type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} autoComplete="email" required disabled={authBusy} style={{ width: "100%", minHeight: 48, boxSizing: "border-box", marginTop: 7, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, color: C.ink, font: `14px ${FONT}` }} />
                <label htmlFor="golden-auth-password" style={{ display: "block", ...smallLabel, marginTop: 14 }}>Password</label>
                <input id="golden-auth-password" type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} autoComplete={authMode === "sign-up" ? "new-password" : "current-password"} required disabled={authBusy} style={{ width: "100%", minHeight: 48, boxSizing: "border-box", marginTop: 7, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, color: C.ink, font: `14px ${FONT}` }} />
                {authMode === "sign-up" && <>
                  <label htmlFor="golden-auth-password-confirmation" style={{ display: "block", ...smallLabel, marginTop: 14 }}>Confirm password</label>
                  <input id="golden-auth-password-confirmation" type="password" value={authPasswordConfirmation} onChange={(event) => setAuthPasswordConfirmation(event.target.value)} autoComplete="new-password" required disabled={authBusy} style={{ width: "100%", minHeight: 48, boxSizing: "border-box", marginTop: 7, padding: "12px 14px", border: `1px solid ${C.line}`, borderRadius: 14, background: C.white, color: C.ink, font: `14px ${FONT}` }} />
                </>}
                <button type="submit" disabled={authBusy} style={{ ...button("dark"), minHeight: 48, marginTop: 15 }}>
                  {authBusy ? "Working…" : authMode === "sign-up" ? "Create account" : "Sign in"}
                </button>
                {authMode === "sign-in" && <button type="button" onClick={() => { setAuthMode("recovery"); setNotice(null); }} style={{ ...button("quiet"), minHeight: 44, marginTop: 9 }}>Forgot password?</button>}
              </form>}
            </>
          ) : (
            <>
              <p style={body}>Supabase browser settings are missing. This anonymous device profile and its recovery-file controls remain available.</p>
              <p style={{ ...body, fontSize: 12, color: C.mute }}>No email or password was sent. Email sign-in requires the public Supabase project URL and publishable key to be configured for this app.</p>
            </>
          )}
        </section>

        <section style={card} aria-labelledby="device-account-title">
          <div style={smallLabel}>Anonymous device profile</div>
          <h2 id="device-account-title" style={{ font: `650 18px ${FONT}`, margin: "8px 0 0" }}>Saved on this device</h2>
          <p style={body}>{session.persistence === "browser-local"
            ? "Your anonymous account and progress are stored in this browser. There is no sign-in or verified identity for this local profile; email sign-in is separate."
            : "Browser storage is unavailable. This anonymous account may only last until this page closes."}</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, borderTop: `1px solid ${C.line}`, marginTop: 15, paddingTop: 14 }}>
            <div><div style={smallLabel}>Local profile</div><div style={{ ...body, fontSize: 12, overflowWrap: "anywhere" }}>{account.userId.slice(0, 15)}…</div></div>
            <div><div style={smallLabel}>Created</div><div style={{ ...body, fontSize: 12 }}>{formatDate(session.createdAt)}</div></div>
          </div>
          <p style={{ ...body, fontSize: 12, color: C.mute }}>{capabilities.auth.detail}</p>
        </section>

        <section style={card} aria-labelledby="backup-title">
          <div style={smallLabel}>Private backup</div>
          <h2 id="backup-title" style={{ font: `650 18px ${FONT}`, margin: "8px 0 0" }}>Encrypted server backup</h2>
          <p style={body}>Your progress is encrypted in this browser before it is sent. Your recovery credential stays on this device and is never included in the upload.</p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 11, marginTop: 16, padding: 13, borderRadius: 13, background: C.cream, cursor: "pointer" }}>
            <input type="checkbox" checked={backupEnabled} onChange={(event) => updateOptIn(event.target.checked)} style={{ width: 18, height: 18, accentColor: C.ink, margin: "1px 0 0" }} />
            <span><strong style={{ fontSize: 13 }}>I want encrypted backup on this browser</strong><span style={{ display: "block", color: C.mute, font: `12px/1.45 ${FONT}`, marginTop: 3 }}>Opting in only saves this preference. Uploads happen only when you press the button below.</span></span>
          </label>
          {syncStatus === "not-confirmed" && !capabilities.sync.configured && <p style={{ ...body, fontSize: 12, color: C.mute }}>{capabilities.sync.detail}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 15 }}>
            <button type="button" disabled={!backupEnabled || Boolean(busy)} onClick={uploadBackup} style={button("lemon")}>{busy === "upload" ? "Uploading…" : "Upload encrypted backup"}</button>
            <button type="button" disabled={!backupEnabled || Boolean(busy)} onClick={checkRemoteBackup} style={button("quiet")}>{busy === "restore-check" ? "Checking…" : "Check for backup"}</button>
          </div>
          <p style={{ ...body, fontSize: 11, color: C.mute }} aria-live="polite">Opt-in: {backupEnabled ? "on" : "off"}. Backup status: {syncStatus === "delivered" ? "upload confirmed by server" : syncStatus === "connected" ? "server reached; backup found" : syncStatus === "no-backup" ? "server reached; no backup exists yet" : "not confirmed"}.</p>
        </section>

        <section style={card} aria-labelledby="recovery-title">
          <div style={smallLabel}>Recovery files</div>
          <h2 id="recovery-title" style={{ font: `650 18px ${FONT}`, margin: "8px 0 0" }}>Keep a copy you control</h2>
          <p style={body}>Download a copy of your saved progress. By default, the file leaves out the private sync credential. Without it, the file cannot access an encrypted server backup.</p>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 11, marginTop: 16, padding: 13, borderRadius: 13, background: C.cream, cursor: "pointer" }}>
            <input type="checkbox" checked={includeRecoveryCredential} onChange={(event) => setIncludeRecoveryCredential(event.target.checked)} style={{ width: 18, height: 18, accentColor: C.ink, margin: "1px 0 0" }} />
            <span><strong style={{ fontSize: 13 }}>Include private sync credential</strong><span style={{ display: "block", color: C.mute, font: `12px/1.45 ${FONT}`, marginTop: 3 }}>Optional. Anyone with the downloaded file could access this anonymous account’s encrypted server backup. Keep it private like a password.</span></span>
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginTop: 15 }}>
            <button type="button" aria-label="Export recovery file" onClick={exportRecoveryFile} style={button("dark")}>Download backup file</button>
            <button type="button" onClick={() => fileInput.current?.click()} style={button("quiet")}>Import recovery file</button>
            <input ref={fileInput} type="file" accept="application/json,.json" aria-label="Choose a Golden JSON backup file" onChange={readImportFile} style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }} />
          </div>
        </section>

        {notice && <div role={notice.type === "error" ? "alert" : "status"} aria-live={notice.type === "error" ? "assertive" : "polite"} style={{ ...card, borderColor: statusTone[notice.type] || C.line, color: statusTone[notice.type] || C.ink, font: `13px/1.5 ${FONT}` }}>{notice.text}</div>}

        {pendingImport && <section style={{ ...card, borderColor: C.ink }} aria-labelledby="import-review-title">
          <div style={smallLabel}>Review before importing</div>
          <h2 id="import-review-title" style={{ font: `650 18px ${FONT}`, margin: "8px 0 0" }}>Replace this device’s saved account data?</h2>
          <p style={body}>{pendingImport.name} · {snapshotSummary(pendingImport.snapshot)}. This will update the local account and saved progress.</p>
          {pendingImport.snapshot.recoveryCredential && <p style={{ ...body, fontSize: 12, color: C.mute }}>This file includes an encrypted-backup recovery identity. The credential will remain hidden.</p>}
          <div style={{ display: "flex", gap: 9, marginTop: 15 }}><button type="button" onClick={confirmImport} style={button("lemon")}>Restore this file</button><button type="button" onClick={() => setPendingImport(null)} style={button("quiet")}>Cancel</button></div>
        </section>}

        {remoteReview && <section style={{ ...card, borderColor: C.ink }} aria-labelledby="remote-review-title">
          <div style={smallLabel}>Remote backup found · {formatDate(remoteReview.updatedAt)}</div>
          <h2 id="remote-review-title" style={{ font: `650 18px ${FONT}`, margin: "8px 0 0" }}>Restore this backup to this device?</h2>
          <p style={body}>{snapshotSummary(remoteReview.snapshot)}. Restoring replaces the saved account details and progress on this device.</p>
          <div style={{ display: "flex", gap: 9, marginTop: 15 }}><button type="button" onClick={confirmRemoteRestore} style={button("lemon")}>Restore backup</button><button type="button" onClick={() => setRemoteReview(null)} style={button("quiet")}>Cancel</button></div>
        </section>}
      </div>
    </main>
  );
}
