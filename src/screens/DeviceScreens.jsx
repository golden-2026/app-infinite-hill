import { useEffect, useState } from "react";
import {
  loadReminderPreference,
  requestReminderPermission,
  saveReminderPreference,
} from "../features/reminders.js";
import { Page, Header, Card, Button, Pill, Row, Notice, SunMark } from "../ui/GoldenUI.jsx";

const MANUAL_SUNSET_KEY = "golden:sunset-manual:v1";
const READ_ALONG_KEY = "golden:read-along:v1";
const APP_CACHE_PREFIX = "golden-pwa-";

export const DEVICE_SCREEN_IDS = Object.freeze({
  sunsetReminder: "sunset-reminder",
  sunsetLocation: "sunset-location",
  notificationPermission: "notification-permission",
  reminderPreview: "reminder-preview",
  reminderArrival: "reminder-arrival",
  widgetInstall: "widget-install",
  widgetInstalled: "widget-installed",
  offlineLesson: "offline-lesson",
  downloads: "downloads",
  storageCleanup: "storage-cleanup",
  offlineState: "offline-state",
  audioSettings: "audio-settings",
});

const localTimeZone = () => {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "your device time zone"; }
  catch { return "your device time zone"; }
};

function loadManualSunset() {
  try { return globalThis.localStorage?.getItem(MANUAL_SUNSET_KEY) || "19:00"; }
  catch { return "19:00"; }
}

function saveManualSunset(value) {
  try {
    if (!globalThis.localStorage?.setItem) return false;
    globalThis.localStorage.setItem(MANUAL_SUNSET_KEY, value);
    return true;
  } catch { return false; }
}

function loadReadAlong() {
  try { return globalThis.localStorage?.getItem(READ_ALONG_KEY) !== "false"; }
  catch { return true; }
}

function Screen({ eyebrow, title, subtitle, onBack, children }) {
  return <Page scroll><style>{`.device-screen-stack{display:grid;gap:12px;padding:0 18px 24px}.device-card-title{margin:0;font:800 19px/1.15 'Manrope','Inter',system-ui,sans-serif;letter-spacing:-.02em}.device-card-copy{margin:7px 0 14px;color:#343431;font:13px/1.5 'Inter',system-ui,sans-serif}.device-choice{width:100%;display:flex;align-items:flex-start;gap:12px;padding:13px 0;border:0;border-bottom:1px solid #E3E3DE;background:transparent;color:#0A0A0A;text-align:left;cursor:pointer;font:14px/1.4 'Inter',system-ui,sans-serif}.device-choice:focus-visible{outline:3px solid #0A0A0A;outline-offset:3px}.device-choice-mark{display:grid;place-items:center;width:22px;height:22px;flex-shrink:0;border:1px solid #777;border-radius:99px;background:#fff;font-size:11px}.device-choice.is-selected .device-choice-mark{border-color:#0A0A0A;background:#EEFF6A}.device-choice strong,.device-choice small{display:block}.device-choice small{margin-top:3px;color:#6B6B6B;font-size:12px;line-height:1.4}.device-actions{display:grid;gap:9px;margin-top:14px}.device-field{display:block;margin-top:12px;font:13px/1.4 'Inter',system-ui,sans-serif}.device-field input{display:block;width:100%;min-height:46px;box-sizing:border-box;margin-top:6px;border:1px solid #E3E3DE;border-radius:13px;background:#fff;color:#0A0A0A;padding:12px 14px;font:14px 'Inter',system-ui,sans-serif}.device-preview{display:flex;align-items:center;gap:14px;min-height:76px;padding:14px;margin-top:12px;border-radius:16px;background:#F7F7F5;color:#0A0A0A;font:600 13px 'Inter',system-ui,sans-serif}.device-inline-status{margin:10px 0 0;color:#6B6B6B;font:12px/1.5 'Inter',system-ui,sans-serif}.device-screen-stack input[type=checkbox]{width:22px;height:22px;accent-color:#0A0A0A}`}</style><Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} /><div className="device-screen-stack">{children}</div></Page>;
}

function ActionCard({ title, detail, children }) {
  return <Card><h2 className="device-card-title">{title}</h2>{detail && <p className="device-card-copy">{detail}</p>}{children}</Card>;
}

function Choice({ title, detail, selected, onClick, disabled = false }) {
  return <button type="button" className={`device-choice${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={onClick} disabled={disabled}>
    <span className="device-choice-mark" aria-hidden="true">{selected ? "●" : "○"}</span><span><strong>{title}</strong><small>{detail}</small></span>
  </button>;
}

function useConnection() {
  const [online, setOnline] = useState(() => globalThis.navigator?.onLine !== false);
  useEffect(() => {
    const onlineNow = () => setOnline(true);
    const offlineNow = () => setOnline(false);
    globalThis.addEventListener?.("online", onlineNow);
    globalThis.addEventListener?.("offline", offlineNow);
    return () => {
      globalThis.removeEventListener?.("online", onlineNow);
      globalThis.removeEventListener?.("offline", offlineNow);
    };
  }, []);
  return online;
}

export function SunsetReminderScreen({ onBack, onContinue, preference: initialPreference }) {
  const [preference, setPreference] = useState(() => initialPreference || loadReminderPreference());
  const [saved, setSaved] = useState(false);
  const enabled = preference.enabled;
  const setEnabled = (value) => { setPreference((old) => ({ ...old, enabled: value, event: "sunset", timezone: localTimeZone() })); setSaved(false); };
  const [saveMessage, setSaveMessage] = useState("");
  const continueSetup = () => {
    const result = saveReminderPreference(preference);
    setSaved(result.saved);
    setSaveMessage(result.saved ? "Your preference is saved on this device." : "This browser could not save the preference. It will apply only while Golden is open.");
    onContinue?.(preference);
  };

  return <Screen eyebrow="make room" title="A little nudge at sunset." subtitle="One gentle reminder, on this device. No streak pressure." onBack={onBack}>
    <ActionCard title="Keep the door open" detail="Choose whether Golden should remind you to pause around sunset. You can change this any time.">
      <Choice title="Yes, remind me" detail="A quiet invitation once a day" selected={enabled} onClick={() => setEnabled(true)} />
      <Choice title="Not now" detail="You can turn this on later" selected={!enabled} onClick={() => setEnabled(false)} />
      <div className="device-actions"><Button onClick={continueSetup}>{saved ? "Saved" : "Continue"}</Button></div>
      {saveMessage && <p role="status" className="device-inline-status">{saveMessage}</p>}
    </ActionCard>
    <Notice tone="soft">A preference can be saved here, but this browser preview does not have a sunset-time provider or a background reminder scheduler yet.</Notice>
  </Screen>;
}

export function SunsetLocationScreen({ onBack, onContinue }) {
  const [mode, setMode] = useState("device");
  const [manualTime, setManualTime] = useState(loadManualSunset);
  const [saved, setSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const finish = () => {
    const stored = saveManualSunset(manualTime);
    setSaved(stored);
    setSaveMessage(stored ? "Your time preference is saved on this device. It does not schedule a notification." : "This browser could not save the time preference.");
    onContinue?.({ mode, timezone: localTimeZone(), manualTime: mode === "manual" ? manualTime : null });
  };
  return <Screen eyebrow="sunset time" title="Where should sunset come from?" subtitle="Golden does not request or save your precise location in this preview." onBack={onBack}>
    <ActionCard title="Choose a time reference" detail="Automatic local sunset lookup is not connected yet. These choices only save your preference on this device.">
      <Choice title="Use this device’s time zone" detail={`${localTimeZone()} · sunset lookup unavailable`} selected={mode === "device"} onClick={() => { setMode("device"); setSaved(false); }} />
      <Choice title="Choose a time myself" detail="Set a time that feels like sunset where you are" selected={mode === "manual"} onClick={() => { setMode("manual"); setSaved(false); }} />
      {mode === "manual" && <label className="device-field">My sunset time<input type="time" value={manualTime} onChange={(event) => { setManualTime(event.target.value); setSaved(false); }} /></label>}
      <div className="device-actions"><Button onClick={finish}>{saved ? "Saved" : "Save choice"}</Button></div>
      {saveMessage && <p role="status" className="device-inline-status">{saveMessage}</p>}
    </ActionCard>
  </Screen>;
}

export function NotificationPermissionScreen({ onBack, onContinue }) {
  const [state, setState] = useState(() => {
    if (typeof globalThis.Notification === "undefined") return "unsupported";
    return globalThis.Notification.permission === "granted" ? "granted" : globalThis.Notification.permission === "denied" ? "denied" : "not-requested";
  });
  const [busy, setBusy] = useState(false);
  const request = async () => {
    setBusy(true);
    const result = await requestReminderPermission();
    setState(result.state);
    setBusy(false);
  };
  const copy = {
    granted: "Notifications are allowed by this browser. Golden still needs a local scheduler before it can send a sunset reminder.",
    denied: "Notifications are blocked in browser settings. You can change that there later.",
    unsupported: "This browser does not expose the notifications feature Golden needs.",
    "not-requested": "Your browser will ask only after you tap the button below. Permission does not create a reminder by itself.",
    "permission-required": "No permission was granted. You can try again from browser settings if you changed your mind.",
  }[state];
  return <Screen eyebrow="your choice" title="May Golden send a reminder?" subtitle="Your browser controls this permission. Golden will not ask until you choose." onBack={onBack}>
    <ActionCard title="Notifications" detail={copy}>
      <Pill tone={state === "granted" ? "gold" : "quiet"}>{state === "granted" ? "permission allowed" : state === "denied" ? "permission blocked" : state === "unsupported" ? "not available" : state === "permission-required" ? "not granted" : "not asked"}</Pill>
      <div className="device-actions">
        {state === "not-requested" && <Button onClick={request} disabled={busy}>{busy ? "Opening browser prompt…" : "Allow notifications"}</Button>}
        {state === "granted" && <Button onClick={() => onContinue?.({ permission: "granted" })}>Continue</Button>}
        {state === "denied" && <Button variant="ghost" onClick={() => onContinue?.({ permission: "denied" })}>Continue without reminders</Button>}
        {state === "unsupported" && <Button variant="ghost" onClick={() => onContinue?.({ permission: "unsupported" })}>Continue</Button>}
        {state === "permission-required" && <Button variant="ghost" onClick={() => onContinue?.({ permission: "default" })}>Continue without reminders</Button>}
      </div>
    </ActionCard>
    <Notice tone="soft">You can change notification permission in your browser or device settings. There is no cloud notification service connected.</Notice>
  </Screen>;
}

export function ReminderPreviewScreen({ onBack, onContinue }) {
  const preference = loadReminderPreference();
  const [result, setResult] = useState("");
  const canTest = typeof globalThis.Notification !== "undefined" && globalThis.Notification.permission === "granted";
  const test = () => {
    if (!canTest) return;
    try {
      new globalThis.Notification("A moment for yourself", { body: "The day is turning. Take one quiet breath with Golden." });
      setResult("The browser accepted this one-time test on this device.");
    } catch {
      setResult("This browser could not show the test notification. No reminder was scheduled.");
    }
  };
  return <Screen eyebrow="one gentle nudge" title="Here’s how it will sound." subtitle="A reminder is an invitation, never a score." onBack={onBack}>
    <ActionCard title="A moment for yourself" detail="The day is turning. Take one quiet breath with Golden.">
      <div className="device-preview"><SunMark size={48} mood="breathe" /><span>sunset · once a day</span></div>
      <p className="device-card-copy">Preference: {preference.enabled ? "on" : "off"} · time zone: {preference.timezone || localTimeZone()}</p>
      <div className="device-actions"><Button onClick={test} disabled={!canTest}>{canTest ? "Send a one-time test" : "Test unavailable"}</Button><Button variant="ghost" onClick={() => onContinue?.()}>Done</Button></div>
      {!canTest && <p className="device-inline-status">Allow browser notifications first to try a one-time test. This preview cannot schedule the daily sunset reminder.</p>}
      {result && <p role="status" className="device-inline-status">{result}</p>}
    </ActionCard>
  </Screen>;
}

export function ReminderArrivalScreen({ onContinue, onBack, reminderTime }) {
  return <Screen eyebrow="you’re here" title="The day is turning." subtitle="This reminder opens Golden. Take one breath before you begin." onBack={onBack}>
    <ActionCard title="A small pause" detail={reminderTime ? `Your reminder arrived around ${reminderTime}.` : "Your reminder brought you back to your practice."}>
      <div className="device-preview"><SunMark size={58} mood="glow" /><span>one breath · then begin</span></div>
      <Button onClick={() => onContinue?.()}>Begin today</Button>
    </ActionCard>
  </Screen>;
}

function isStandalone() {
  return globalThis.matchMedia?.("(display-mode: standalone)").matches || globalThis.navigator?.standalone === true;
}

function installInstructions() {
  const ua = globalThis.navigator?.userAgent || "";
  if (/iphone|ipad|ipod/i.test(ua)) return "In Safari, tap Share, then Add to Home Screen.";
  if (/android/i.test(ua)) return "In your browser menu, choose Install app or Add to Home screen.";
  return "Open the browser menu and choose Install app, if your browser offers it.";
}

export function WidgetInstallScreen({ onBack, onContinue, installed = isStandalone() }) {
  return <Screen eyebrow="keep golden close" title="Bring the sun to your home screen." subtitle="The app can open from your home screen. A live widget is not available in this browser preview." onBack={onBack}>
    <ActionCard title={installed ? "Golden is on this home screen" : "Add the app"} detail={installed ? "You are viewing Golden in its installed app window." : installInstructions()}>
      <div className="device-preview"><SunMark size={54} mood="glow" /><span>Golden · a small daily practice</span></div>
      <Notice tone="soft">Web apps cannot add a live home-screen widget here. Adding Golden creates an app shortcut; it does not add a widget or enable background updates.</Notice>
      <div className="device-actions"><Button onClick={() => onContinue?.({ installed })}>{installed ? "Continue" : "I’ve added Golden"}</Button></div>
    </ActionCard>
  </Screen>;
}

export function WidgetInstallSuccessScreen({ onContinue }) {
  return <Screen eyebrow="saved for later" title="Golden is close by." subtitle="Your home-screen shortcut opens the app. The live widget experience is not part of this preview.">
    <ActionCard title="A place to return" detail="When you open Golden, your practice stays on this device." ><div className="device-preview"><SunMark size={58} mood="glow" /><span>you can come back any time</span></div><Button onClick={() => onContinue?.()}>Continue</Button></ActionCard>
  </Screen>;
}

export function OfflineLessonScreen({ onBack, onOpenDownloads, lessonTitle = "Today’s lesson" }) {
  const online = useConnection();
  return <Screen eyebrow="take it with you" title="Keep a lesson close." subtitle="Golden’s lesson content ships with the app. Individual lesson files are not downloaded separately in this preview." onBack={onBack}>
    <ActionCard title={lessonTitle} detail={online ? "You’re online. The app shell can be cached for a later offline launch after the first visit." : "You’re offline. A lesson opens only if the app shell and its files were cached earlier."}>
      <Pill tone={online ? "quiet" : "gold"}>{online ? "connection available" : "offline right now"}</Pill>
      <Row title="Lesson text" detail="Included in the app bundle · no separate download" trailing={<Pill tone="soft">included</Pill>} />
      <div className="device-actions"><Button disabled>Individual lesson download unavailable</Button>{onOpenDownloads && <Button variant="ghost" onClick={onOpenDownloads}>Downloads</Button>}</div>
    </ActionCard>
  </Screen>;
}

export function DownloadsManagerScreen({ onBack, onOpenCleanup }) {
  const online = useConnection();
  return <Screen eyebrow="on this device" title="Your downloads." subtitle="The current preview caches the public app shell, not a library of individually downloaded lessons." onBack={onBack}>
    <ActionCard title="App files" detail={online ? "The app shell can be available offline after the browser has cached it." : "The app is offline. The browser can open cached app files; uncached pages and live services need a connection."}>
      <Row title="Golden app shell" detail="Managed by your browser’s cache" trailing={<Pill tone={online ? "quiet" : "gold"}>{online ? "connection on" : "offline"}</Pill>} />
      <Row title="Individual lessons" detail="No separate lesson downloads in this preview" trailing={<Pill tone="soft">not available</Pill>} />
      <Row title="Saved lessons" detail="Individual lesson downloads are not available in this preview" trailing={<Pill tone="quiet">0</Pill>} />
      {onOpenCleanup && <div className="device-actions"><Button variant="ghost" onClick={onOpenCleanup}>Manage app storage</Button></div>}
    </ActionCard>
  </Screen>;
}

export function StorageCleanupScreen({ onBack, onDone }) {
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState("");
  const clearShell = async () => {
    if (!globalThis.caches?.keys) { setResult("This browser does not expose app-cache controls."); setConfirming(false); return; }
    try {
      const names = await globalThis.caches.keys();
      const appCaches = names.filter((name) => name.startsWith(APP_CACHE_PREFIX));
      const results = await Promise.all(appCaches.map((name) => globalThis.caches.delete(name)));
      setResult(results.some(Boolean) ? "Golden’s cached app files were cleared. Your practice progress and reminder preferences were left in place." : "There were no Golden app files to clear.");
    } catch {
      setResult("The browser could not clear Golden’s cached app files.");
    }
    setConfirming(false);
  };
  return <Screen eyebrow="storage" title="Clear cached app files?" subtitle="This removes Golden’s cached public app shell from this browser. It does not clear your progress or account data." onBack={onBack}>
    <ActionCard title="App shell cache" detail="If you clear it, the app needs a connection to cache these files again. No per-lesson downloads are stored here.">
      {!confirming ? <Button variant="ghost" onClick={() => { setConfirming(true); setResult(""); }}>Review clear action</Button> : <div className="device-actions"><Button variant="ghost" onClick={clearShell}>Clear cached app files</Button><Button variant="light" onClick={() => setConfirming(false)}>Keep them</Button></div>}
      {result && <p role="status" className="device-inline-status">{result}</p>}
      {result && onDone && <Button variant="light" onClick={onDone}>Done</Button>}
    </ActionCard>
  </Screen>;
}

export function OfflineStateScreen({ onBack, onRetry, onContinue }) {
  const online = useConnection();
  return <Screen eyebrow={online ? "connection found" : "no connection"} title={online ? "You’re back online." : "A quiet moment offline."} subtitle={online ? "Live services can be reached again. Your device-local progress is still here." : "Golden can reopen from cached app files. Live Guide answers and uncached files need a connection."} onBack={onBack}>
    <ActionCard title={online ? "Welcome back" : "Your practice stays close"} detail={online ? "This status reflects the browser’s connection signal; it does not confirm that a specific service is available." : "Try again when you have a connection, or continue with content already loaded on this device."}>
      <Pill tone={online ? "gold" : "quiet"}>{online ? "browser reports online" : "browser reports offline"}</Pill>
      <div className="device-actions">{onRetry && <Button variant="ghost" onClick={onRetry}>Try again</Button>}{onContinue && <Button onClick={onContinue}>{online ? "Continue" : "Continue with what’s here"}</Button>}</div>
    </ActionCard>
    {!online && <Notice tone="soft">The Guide’s live answer and Google Fonts need a connection. The Guide may fall back to supplied lesson text. The app does not claim that a lesson was downloaded separately.</Notice>}
  </Screen>;
}

export function AudioSettingsScreen({ onBack, voiceOn, onVoiceChange, readAlongOn, onReadAlongChange }) {
  const [localVoiceOn, setLocalVoiceOn] = useState(voiceOn ?? true);
  const [localReadAlongOn, setLocalReadAlongOn] = useState(() => readAlongOn ?? loadReadAlong());
  const [previewState, setPreviewState] = useState("");
  const speechAvailable = typeof globalThis.speechSynthesis !== "undefined" && typeof globalThis.SpeechSynthesisUtterance !== "undefined";
  const changeVoice = (value) => { setLocalVoiceOn(value); onVoiceChange?.(value); };
  const changeReadAlong = (value) => {
    setLocalReadAlongOn(value);
    onReadAlongChange?.(value);
    try { globalThis.localStorage?.setItem(READ_ALONG_KEY, String(value)); } catch { /* Preference remains active for this view. */ }
  };
  const preview = () => {
    if (!speechAvailable) { setPreviewState("This browser does not offer built-in read-aloud here."); return; }
    try {
      globalThis.speechSynthesis.cancel();
      const utterance = new globalThis.SpeechSynthesisUtterance("Take one quiet breath. You can begin again whenever you are ready.");
      utterance.onend = () => setPreviewState("Preview finished.");
      utterance.onerror = () => setPreviewState("The browser could not play its voice preview.");
      globalThis.speechSynthesis.speak(utterance);
      setPreviewState("Playing a device voice preview.");
    } catch { setPreviewState("The browser could not play its voice preview."); }
  };
  return <Screen eyebrow="how Golden speaks" title="Read along, your way." subtitle="This preview uses your device’s built-in speech voice. Ambassador recordings are not available here." onBack={onBack}>
    <ActionCard title="Audio and read-along" detail="These controls change local playback preferences. No voice recording or audio service is connected.">
      <Row title="Read lesson text aloud" detail="Uses your browser’s speech voice" trailing={<input aria-label="Read lesson text aloud" type="checkbox" checked={localVoiceOn} onChange={(event) => changeVoice(event.target.checked)} />} />
      <Row title="Read-along prompts" detail="Speak the prompt while you follow the text" trailing={<input aria-label="Read-along prompts" type="checkbox" checked={localReadAlongOn} onChange={(event) => changeReadAlong(event.target.checked)} />} />
      <div className="device-actions"><Button onClick={preview} disabled={!speechAvailable}>Hear a short preview</Button><Pill tone="quiet">{speechAvailable ? "device voice" : "not supported"}</Pill></div>
      {previewState && <p role="status" className="device-inline-status">{previewState}</p>}
    </ActionCard>
  </Screen>;
}
