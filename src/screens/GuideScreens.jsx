import {
  Button,
  Card,
  Header,
  Notice,
  Page,
  Pill,
  Row,
  Sun,
} from "../ui/GoldenUI.jsx";

export const GUIDE_SCREEN_IDS = Object.freeze({
  consent: "guide-consent",
  sources: "guide-sources",
  reader: "guide-reader",
  history: "guide-history",
  clearHistory: "guide-clear-history",
  humanHelp: "guide-human-help",
});
export const GUIDE_IDS = GUIDE_SCREEN_IDS;

const GUIDE_SOURCES = Object.freeze({
  HINDUISM: ["Bhagavad Gita", "Principal Upanishads", "Ramayana (Valmiki)", "Mahabharata", "Yoga Sutras"],
  CHRISTIANITY: ["Bible (Gospels first)", "Psalms"],
  CATHOLIC: ["Bible", "Psalms", "Catechism", "Lives of the saints"],
  JUDAISM: ["Torah", "Tanakh", "Weekly parsha", "Pirkei Avot"],
  ISLAM: ["Qur’an", "Well-known hadith collections"],
  BUDDHISM: ["Dhammapada", "Pali suttas"],
  SIKHISM: ["Guru Granth Sahib", "Japji Sahib"],
  SPIRITUAL: ["Rumi", "Tao Te Ching", "Marcus Aurelius", "Gibran"],
});

const DOOR_LABELS = Object.freeze({
  HINDUISM: "Hinduism",
  CHRISTIANITY: "Christianity",
  CATHOLIC: "Catholicism",
  JUDAISM: "Judaism",
  ISLAM: "Islam",
  BUDDHISM: "Buddhism",
  SIKHISM: "Sikhism",
  SPIRITUAL: "Simply Spiritual",
});

const titleStyle = { font: "700 19px/1.2 Manrope, Inter, system-ui, sans-serif", margin: 0, color: "#0A0A0A" };
const copyStyle = { font: "13px/1.55 Inter, system-ui, sans-serif", margin: "7px 0 0", color: "#343431" };
const sectionStyle = { display: "grid", gap: 12 };
const contentStyle = { ...sectionStyle, padding: "0 18px 28px" };

function labelDoor(door) {
  return DOOR_LABELS[String(door || "SPIRITUAL").toUpperCase()] || String(door || "this Door");
}

function sourceList(door, sources) {
  if (Array.isArray(sources) && sources.length) return sources;
  return GUIDE_SOURCES[String(door || "SPIRITUAL").toUpperCase()] || GUIDE_SOURCES.SPIRITUAL;
}

function sourceMatchesDoor(source, door) {
  const namedDoor = typeof source === "object" && source
    ? source.door || source.tradition || source.wing
    : null;
  if (!namedDoor) return true;
  const normalize = (value) => String(value).toLowerCase().replace(/[^a-z]/g, "");
  return normalize(namedDoor) === normalize(door) || normalize(namedDoor) === normalize(labelDoor(door));
}

function ActionRow({ title, detail, onClick, trailing = "›" }) {
  return <Row label={title} detail={detail} trailing={onClick ? trailing : undefined} onClick={onClick} />;
}

export function GuideConsentScreen({ door, onBack, onContinue, onDecline, onUseLessonText }) {
  const notNow = onDecline || onUseLessonText;
  return (
    <Page scroll>
      <Header eyebrow={`the guide · ${labelDoor(door)}`} title="Before you ask" subtitle="A clear note about what leaves this screen." onBack={onBack} />
      <div style={contentStyle}>
        <Card>
          <h2 style={titleStyle}>Your words go to an AI provider</h2>
          <p style={copyStyle}>When the Guide is available, your question and recent messages are sent to Golden’s server and then to Anthropic. Golden’s server also receives your active Door, current day, and earned-word context; it sends the active Door and recent messages to Anthropic to write an answer. The provider key stays on the server.</p>
          <p style={copyStyle}>The app does not intentionally save Guide history after you leave this screen. Anthropic or hosting logs may have separate retention rules; those settings have not been verified for this private beta.</p>
        </Card>
        <Notice tone="info">You can skip the Guide and use the lesson text already on your device. The Guide may be offline, and answers are not Keeper-approved.</Notice>
        <Notice tone="warning">Offline help is limited to a matching lesson word and supplied lesson text. It cannot look up other passages; when nothing matches, it says it is offline.</Notice>
        <Card>
          <p style={{ ...copyStyle, marginTop: 0 }}>The Guide stays with {labelDoor(door)}’s texts. It does not write prayers or compare Doors. For something heavy, it will point you toward a person.</p>
        </Card>
        <div style={{ display: "grid", gap: 9 }}>
          <Button onClick={onContinue} disabled={!onContinue}>Continue with the Guide</Button>
          <Button kind="ghost" onClick={notNow} disabled={!notNow}>Not now · use lesson text</Button>
        </div>
      </div>
    </Page>
  );
}

export function GuideSourcesScreen({ door, sources, onBack, onOpenSource, onOpenReader }) {
  const items = sourceList(door, sources).filter((source) => sourceMatchesDoor(source, door));
  const open = onOpenSource || onOpenReader;
  return (
    <Page scroll>
      <Header eyebrow={`the guide · ${labelDoor(door)}`} title="The texts behind it" subtitle="One Door at a time. Open a source to see the citation or excerpt supplied with an answer." onBack={onBack} />
      <div style={contentStyle}>
        <Notice tone="info">This is the Guide’s source shelf for {labelDoor(door)}. It is not a complete library, and sources are not blended across Doors.</Notice>
        <Card>
          {items.map((source, index) => {
            const name = typeof source === "string" ? source : source?.title || source?.name || "Source";
            const detail = typeof source === "object" ? source?.detail || source?.citation || "Reference collection" : "Reference collection";
            return <ActionRow key={`${name}-${index}`} title={name} detail={detail} onClick={open ? () => open(source) : undefined} />;
          })}
        </Card>
        <p style={{ ...copyStyle, color: "#6B6B6B" }}>A source title alone is not a citation. The Guide should name a verse, passage, or story when it has one, and say plainly when it does not.</p>
      </div>
    </Page>
  );
}

export function GuideReaderScreen({ door, passage, source, onBack, onOpenSources }) {
  const item = passage || source || null;
  const citation = item?.citation || item?.reference || "";
  const sourceTitle = item?.sourceTitle || item?.title || item?.source || "Source reading";
  const excerpt = item?.excerpt || item?.text || "";
  const belongsToDoor = sourceMatchesDoor(item, door);
  return (
    <Page scroll>
      <Header eyebrow={`the guide · ${labelDoor(door)}`} title={sourceTitle} subtitle={citation || "Source details"} onBack={onBack} />
      <div style={contentStyle}>
        {!belongsToDoor ? (
          <Notice tone="warning">This reference is outside the active Door, so it is not shown here.</Notice>
        ) : excerpt ? (
          <Card>
            <Pill active>{item?.tradition || labelDoor(door)}</Pill>
            <blockquote style={{ margin: "15px 0 0", font: "18px/1.55 Manrope, Inter, system-ui, sans-serif", color: "#0A0A0A" }}>{excerpt}</blockquote>
            {citation && <p style={{ ...copyStyle, color: "#6B6B6B" }}>{citation}</p>}
          </Card>
        ) : (
          <Card>
            <Sun size={36} />
            <h2 style={{ ...titleStyle, marginTop: 10 }}>No passage was supplied</h2>
            <p style={copyStyle}>This preview does not invent scripture or fill in a missing citation. Open a source from an answer when the Guide provides one.</p>
          </Card>
        )}
        <Notice tone="info">This screen shows only text supplied with the selected citation. It does not confirm translation, rights, or Keeper review.</Notice>
        <Button kind="ghost" onClick={onOpenSources} disabled={!onOpenSources}>Browse this Door’s sources</Button>
      </div>
    </Page>
  );
}

function historyText(entry) {
  if (typeof entry === "string") return entry;
  if (Array.isArray(entry)) return entry[1] || "Guide message";
  return entry?.question || entry?.title || entry?.messages?.find?.((message) => message?.role === "user")?.content || "Guide conversation";
}

export function GuideHistoryScreen({ door, history = [], saved = false, onBack, onOpenConversation, onClearHistory }) {
  const entries = Array.isArray(history) ? history : [];
  return (
    <Page scroll>
      <Header eyebrow={`the guide · ${labelDoor(door)}`} title={saved ? "Your conversations" : "This conversation"} subtitle="Guide history for this Door." onBack={onBack} />
      <div style={contentStyle}>
        <Notice tone="info">{saved ? "These conversations are saved on this device. Messages sent for an answer are processed by the provider described in the privacy note." : "This preview keeps messages in memory while the Guide is open. Leaving the Guide clears them. Messages sent for an answer are processed by the provider described in the privacy note."}</Notice>
        {entries.length ? (
          <Card>
            {entries.map((entry, index) => <ActionRow key={entry?.id || index} title={historyText(entry)} detail={entry?.updatedAt || entry?.date || "This session"} onClick={onOpenConversation ? () => onOpenConversation(entry) : undefined} />)}
          </Card>
        ) : (
          <Card>
            <h2 style={titleStyle}>{saved ? "Nothing saved here" : "No messages yet"}</h2>
            <p style={copyStyle}>{saved ? "There are no saved conversations for this Door." : "Ask the Guide a question and it will appear here while this session stays open."}</p>
          </Card>
        )}
        <Button kind="ghost" disabled={!entries.length || !onClearHistory} onClick={onClearHistory}>{saved ? "Clear Guide history" : "Clear this conversation"}</Button>
      </div>
    </Page>
  );
}

export function GuideClearHistoryScreen({ door, onBack, onCancel, onConfirm, historyCount, saved = false }) {
  const cancel = onCancel || onBack;
  return (
    <Page scroll>
      <Header eyebrow={`the guide · ${labelDoor(door)}`} title={saved ? "Clear this history?" : "Clear this conversation?"} subtitle={saved ? "This removes Guide conversations saved on this device." : "This clears the open Guide conversation from memory."} onBack={onBack} />
      <div style={contentStyle}>
        <Card>
          <h2 style={titleStyle}>This can’t be undone</h2>
          <p style={copyStyle}>{saved ? (Number.isFinite(historyCount) ? `This will remove ${historyCount} saved ${historyCount === 1 ? "conversation" : "conversations"}. ` : "Saved Guide conversations will be removed. ") : "This will remove the current conversation from the open session. "}It cannot remove text already sent to Anthropic or provider and hosting logs.</p>
        </Card>
        <div style={{ display: "grid", gap: 9 }}>
          <Button kind="ink" onClick={onConfirm} disabled={!onConfirm}>{saved ? "Clear saved history" : "Clear conversation"}</Button>
          <Button kind="ghost" onClick={cancel} disabled={!cancel}>Keep it</Button>
        </div>
      </div>
    </Page>
  );
}

export function GuideHumanHelpScreen({ door, onBack, onReachedOut, onReturnToGuide }) {
  return (
    <Page scroll>
      <Header eyebrow={`the guide · ${labelDoor(door)}`} title="Please bring in a person" subtitle="Some things deserve support from someone who can be with you." onBack={onBack} />
      <div style={contentStyle}>
        <Notice tone="warning">The Guide is for learning from texts. It is not a counselor or emergency service.</Notice>
        <Card>
          <h2 style={titleStyle}>Reach someone you trust today</h2>
          <p style={copyStyle}>A friend, family member, clergy member, doctor, or another trusted person can listen and help you take the next step. If you may be in immediate danger, contact your local emergency service now.</p>
          <p style={copyStyle}>You do not need to explain everything at once. You can start with: “I’m having a hard time and could use someone with me.”</p>
        </Card>
        <div style={{ display: "grid", gap: 9 }}>
          <Button onClick={onReachedOut} disabled={!onReachedOut}>I’ve reached someone</Button>
          <Button kind="ghost" onClick={onReturnToGuide || onBack} disabled={!onReturnToGuide && !onBack}>Return to the Guide</Button>
        </div>
      </div>
    </Page>
  );
}

export const GuideConsent = GuideConsentScreen;
export const GuideSources = GuideSourcesScreen;
export const GuideReader = GuideReaderScreen;
export const GuideHistory = GuideHistoryScreen;
export const GuideClearHistory = GuideClearHistoryScreen;
export const GuideHumanHelp = GuideHumanHelpScreen;
