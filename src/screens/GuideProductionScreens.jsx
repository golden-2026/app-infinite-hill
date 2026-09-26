import { useState } from "react";
import { Button, Card, Header, Notice, Page, Pill, Row } from "../ui/GoldenUI.jsx";
import { GUIDE_MODES, GUIDE_RETENTION } from "../features/guide-conversations.js";

export const GUIDE_PRODUCTION_SCREEN_IDS = Object.freeze({
  availability: "guide-availability",
  history: "guide-production-history",
  conversation: "guide-conversation-detail",
  sources: "guide-answer-sources",
  reader: "guide-source-reader",
  report: "guide-report-answer",
  controls: "guide-data-controls",
});

const doorName = (door) => String(door || "this Door").replaceAll("_", " ").toLowerCase();
const stack = { display: "grid", gap: 12, padding: "0 18px 28px" };
const title = { margin: 0, font: "700 19px/1.2 Manrope, Inter, system-ui, sans-serif", color: "#0A0A0A" };
const copy = { margin: "7px 0 0", font: "13px/1.55 Inter, system-ui, sans-serif", color: "#343431" };

const MODE_COPY = Object.freeze({
  [GUIDE_MODES.provider]: { title: "Guide is available", detail: "A live answer can be requested through Golden’s configured server provider. Your question and recent turns will leave this device for processing." },
  [GUIDE_MODES.lesson]: { title: "Lesson text only", detail: "Answers can use supplied lesson text on this device. The Guide will say when that text does not cover your question." },
  [GUIDE_MODES.offline]: { title: "You’re offline", detail: "Live answers are unavailable. Supplied lesson text may still be available on this device." },
  [GUIDE_MODES.rateLimited]: { title: "Guide is taking a pause", detail: "The provider reported a rate limit. No live answer is available right now." },
  [GUIDE_MODES.unavailable]: { title: "Live Guide unavailable", detail: "A provider is not configured or available. You can use supplied lesson text when it is present." },
});

function sourceName(source) {
  return source?.title || source?.sourceTitle || source?.source || "Supplied source";
}

function normalizeDoor(value) {
  const normalized = String(value || "").toLowerCase().replace(/[^a-z]/g, "");
  if (["catholic", "catholicism"].includes(normalized)) return "catholic";
  if (["spiritual", "simplyspiritual"].includes(normalized)) return "spiritual";
  return normalized;
}

function answerSources(messages = [], door) {
  const activeDoor = normalizeDoor(door);
  return messages.flatMap((message) => Array.isArray(message.sources)
    ? message.sources.filter((source) => source && String(source.citation || source.reference || "").trim())
      .filter((source) => {
        const sourceDoor = normalizeDoor(source.door || source.tradition);
        return !sourceDoor || !activeDoor || sourceDoor === activeDoor;
      })
      .map((source) => ({ ...source, messageId: message.id }))
    : []);
}

export function GuideAvailabilityScreen({ door, mode = GUIDE_MODES.unavailable, onBack, onUseProvider, onUseLesson }) {
  const state = MODE_COPY[mode] || MODE_COPY[GUIDE_MODES.unavailable];
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title="Before you ask" subtitle="Choose how this question can be answered." onBack={onBack} />
    <div style={stack}>
      <Card><Pill active>{state.title}</Pill><p style={copy}>{state.detail}</p></Card>
      <Notice tone="info">Lesson-only mode stays with text supplied by Golden. Live Guide requests go through Golden’s server and may be sent to its configured AI provider.</Notice>
      <Notice tone="warning">Provider, hosting, or network logs may have separate retention. This device’s delete controls cannot remove data already sent for processing.</Notice>
      <div style={{ display: "grid", gap: 9 }}>
        <Button onClick={onUseProvider} disabled={mode !== GUIDE_MODES.provider || !onUseProvider}>Use live Guide</Button>
        <Button kind="ghost" onClick={onUseLesson} disabled={!onUseLesson}>Use lesson text only</Button>
      </div>
    </div>
  </Page>;
}

export function GuideProductionHistoryScreen({ door, conversations = [], onBack, onOpenConversation, onDeleteConversation, onOpenControls }) {
  const entries = conversations.filter((item) => item && item.door === door && Array.isArray(item.messages) && item.messages.length);
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title="Your conversations" subtitle="History saved on this device." onBack={onBack} />
    <div style={stack}>
      <Notice tone="info">Saved messages are stored in this browser profile and are not encrypted by Golden. Choose session-only retention or delete a thread whenever you like.</Notice>
      {entries.length ? <Card>{entries.map((entry) => {
        const first = entry.messages.find((message) => message.role === "user");
        return <Row key={entry.id} label={first?.content || "Guide conversation"} detail={new Date(entry.updatedAt).toLocaleString()} trailing="›" onClick={onOpenConversation ? () => onOpenConversation(entry) : undefined} />;
      })}</Card> : <Card><h2 style={title}>No saved conversations</h2><p style={copy}>New conversations are not saved unless you choose a retention period.</p></Card>}
      <Button kind="ghost" onClick={onOpenControls} disabled={!onOpenControls}>Guide data controls</Button>
    </div>
  </Page>;
}

export function GuideConversationDetailScreen({ door, conversation, onBack, onOpenSources, onReport, onDelete }) {
  const messages = Array.isArray(conversation?.messages) ? conversation.messages : [];
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title="Conversation" subtitle="Messages saved on this device." onBack={onBack} />
    <div style={stack}>
      {!conversation ? <Notice tone="warning">This conversation is no longer available on this device.</Notice> : <>
        {messages.map((message) => <Card key={message.id}>
          <Pill active={message.role === "assistant"}>{message.role === "assistant" ? "Guide answer" : "Your question"}</Pill>
          <p style={copy}>{message.content}</p>
          {message.role === "assistant" && <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <Button kind="ghost" onClick={onOpenSources ? () => onOpenSources(message) : undefined} disabled={!onOpenSources}>View supplied citations ({(message.sources || []).filter((source) => source?.citation || source?.reference).length})</Button>
            <Button kind="ghost" onClick={onReport ? () => onReport(message) : undefined} disabled={!onReport}>Report this answer</Button>
          </div>}
        </Card>)}
        <Notice tone="info">A citation is shown only when it was supplied with this answer. No citation means the answer cannot be verified from a supplied source here.</Notice>
        <Button kind="ghost" onClick={onDelete} disabled={!onDelete}>Delete this conversation from this device</Button>
      </>}
    </div>
  </Page>;
}

export function GuideAnswerSourcesScreen({ door, message, onBack, onOpenSource }) {
  const sources = answerSources(message ? [message] : [], door);
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title="Sources for this answer" subtitle="Only references supplied with this answer appear here." onBack={onBack} />
    <div style={stack}>
      {sources.length ? <Card>{sources.map((source, index) => <Row key={`${source.citation || source.reference}-${index}`} label={sourceName(source)} detail={source.citation || source.reference} trailing={source.excerpt || source.text ? "›" : undefined} onClick={source.excerpt || source.text ? () => onOpenSource?.(source) : undefined} />)}</Card> : <Card><h2 style={title}>No citation supplied</h2><p style={copy}>This answer did not include a source reference that Golden can show. The screen will not fill in a likely text or citation.</p></Card>}
      <Notice tone="info">A displayed reference is not independent confirmation of translation, rights, or Keeper review.</Notice>
    </div>
  </Page>;
}

export function GuideSourceReaderScreen({ door, source, onBack }) {
  const excerpt = source?.excerpt || source?.text || "";
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title={sourceName(source)} subtitle={source?.citation || source?.reference || "No citation supplied"} onBack={onBack} />
    <div style={stack}>
      {excerpt ? <Card><blockquote style={{ margin: 0, font: "18px/1.55 Manrope, Inter, system-ui, sans-serif", color: "#0A0A0A" }}>{excerpt}</blockquote></Card> : <Notice tone="warning">No passage text was included with this citation.</Notice>}
      <Notice tone="info">This shows only the passage included with the answer. It does not establish the source edition or review status.</Notice>
    </div>
  </Page>;
}

export function GuideReportScreen({ door, conversationId, messageId, onBack, onSave }) {
  const [category, setCategory] = useState("citation");
  const [details, setDetails] = useState("");
  const [saved, setSaved] = useState(false);
  const submit = (event) => {
    event.preventDefault();
    if (!onSave || saved) return;
    onSave({ conversationId, messageId, category, details });
    setSaved(true);
  };
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title="Report an answer" subtitle="Record what needs review." onBack={onBack} />
    <form onSubmit={submit} style={stack}>
      <Notice tone="info">This preview saves your report on this device only. It does not send it to a person or a review team.</Notice>
      <label style={{ display: "grid", gap: 7, font: "13px Inter, system-ui, sans-serif" }}>What needs attention?
        <select value={category} onChange={(event) => setCategory(event.target.value)} style={{ minHeight: 48, border: "1px solid #E3E3DE", borderRadius: 14, padding: "0 12px", font: "inherit" }}>
          <option value="theology">Theology or tradition</option><option value="safety">Safety</option><option value="citation">Citation</option><option value="tone">Tone</option><option value="factual">Factual accuracy</option>
        </select>
      </label>
      <label style={{ display: "grid", gap: 7, font: "13px Inter, system-ui, sans-serif" }}>Details (optional)
        <textarea value={details} onChange={(event) => setDetails(event.target.value.slice(0, 1000))} maxLength={1000} rows={5} style={{ border: "1px solid #E3E3DE", borderRadius: 14, padding: 12, font: "14px/1.5 Inter, system-ui, sans-serif" }} />
      </label>
      <Button type="submit" disabled={!onSave || saved}>{saved ? "Saved on this device" : "Save report"}</Button>
    </form>
  </Page>;
}

export function GuideDataControlsScreen({ door, retentionDays = GUIDE_RETENTION.session, historyCount = 0, onBack, onRetentionChange, onClearHistory }) {
  return <Page scroll>
    <Header eyebrow={`the guide · ${doorName(door)}`} title="Guide data controls" subtitle="Choose local retention and remove saved history." onBack={onBack} />
    <div style={stack}>
      <Card>
        <label style={{ display: "grid", gap: 8, font: "13px/1.5 Inter, system-ui, sans-serif" }}>Keep conversations on this device
          <select aria-label="Guide conversation retention" value={retentionDays} onChange={(event) => onRetentionChange?.(Number(event.target.value))} style={{ minHeight: 48, border: "1px solid #E3E3DE", borderRadius: 14, padding: "0 12px", font: "inherit" }}>
            <option value={GUIDE_RETENTION.session}>Session only · do not save history</option>
            <option value={GUIDE_RETENTION.sevenDays}>7 days</option>
            <option value={GUIDE_RETENTION.thirtyDays}>30 days</option>
          </select>
        </label>
      </Card>
      <Notice tone="warning">Saved history is readable by scripts and people with access to this browser profile. Deleting it here cannot remove questions already sent to the provider or its logs.</Notice>
      <Button kind="ghost" onClick={onClearHistory} disabled={!onClearHistory}>Clear saved Guide history and local reports ({historyCount} conversations)</Button>
    </div>
  </Page>;
}
