import { useMemo, useState } from "react";
import { Button, Card, Header, Notice, Page, Pill } from "../ui/GoldenUI.jsx";
import {
  clearGuideHistory,
  deleteGuideConversation,
  GUIDE_RETENTION,
  loadGuideConversations,
  loadGuideRetention,
  setGuideRetention,
} from "../features/guide-conversations.js";

const contentStyle = { display: "grid", gap: 12, padding: "0 18px 28px" };
const bodyStyle = { margin: "7px 0 0", font: "13px/1.55 Inter, system-ui, sans-serif", color: "#343431", whiteSpace: "pre-wrap" };

function browserStorage() {
  try { return typeof window === "undefined" ? null : window.localStorage; }
  catch { return null; }
}

function firstQuestion(conversation) {
  return conversation?.messages?.find((message) => message.role === "user")?.content || "Guide conversation";
}

function actualSources(message) {
  return (Array.isArray(message?.sources) ? message.sources : [])
    .filter((source) => source && String(source.citation || source.reference || "").trim());
}

export default function GuideHistoryScreen({ onClose, currentConversation = null, storage: storageProp }) {
  const storage = useMemo(() => storageProp === undefined ? browserStorage() : storageProp, [storageProp]);
  const [conversations, setConversations] = useState(() => loadGuideConversations(storage));
  const [retention, setRetention] = useState(() => loadGuideRetention(storage));
  const [openId, setOpenId] = useState(null);
  const [hiddenIds, setHiddenIds] = useState([]);
  const list = useMemo(() => {
    const entries = !currentConversation?.id || conversations.some((entry) => entry.id === currentConversation.id)
      ? conversations
      : [currentConversation, ...conversations];
    return entries.filter((entry) => !hiddenIds.includes(entry.id));
  }, [conversations, currentConversation, hiddenIds]);
  const selected = list.find((entry) => entry.id === openId) || null;

  const refresh = () => setConversations(loadGuideConversations(storage));
  const changeRetention = (days) => {
    const result = setGuideRetention(storage, days);
    setRetention(result.retentionDays);
    setConversations(result.conversations);
  };
  const removeConversation = (conversationId) => {
    deleteGuideConversation(storage, conversationId);
    setHiddenIds((previous) => [...new Set([...previous, conversationId])]);
    if (openId === conversationId) setOpenId(null);
    refresh();
  };
  const clearAll = () => {
    clearGuideHistory(storage);
    setOpenId(null);
    setConversations([]);
  };

  return <Page scroll aria-label="Guide history">
    <Header eyebrow="the guide" title={selected ? "Conversation" : "Your conversations"} subtitle={selected ? "Saved on this device." : "History saved on this device."} onBack={selected ? () => setOpenId(null) : onClose} />
    <div style={contentStyle}>
      <Notice tone="info">Messages in saved history are stored in this browser profile and are not encrypted by Golden. Questions sent for live answers may also be processed by the configured provider.</Notice>
      {selected ? <>
        {selected.messages.map((message) => {
          const sources = message.role === "assistant" ? actualSources(message) : [];
          return <Card key={message.id}>
            <Pill active={message.role === "assistant"}>{message.role === "assistant" ? "Guide answer" : "Your question"}</Pill>
            <p style={bodyStyle}>{message.content}</p>
            {message.role === "assistant" && (sources.length ? <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
              {sources.map((source, index) => <section key={`${source.citation || source.reference}-${index}`} style={{ borderTop: "1px solid #E3E3DE", paddingTop: 8 }}>
                <strong style={{ font: "600 12px/1.45 Inter, system-ui, sans-serif" }}>{source.title || source.sourceTitle || source.source || "Supplied source"}</strong>
                <div style={{ font: "12px/1.45 Inter, system-ui, sans-serif", color: "#6B6B6B" }}>{source.citation || source.reference}</div>
                {(source.excerpt || source.text) && <blockquote style={{ margin: "8px 0 0", font: "14px/1.5 Manrope, Inter, system-ui, sans-serif" }}>{source.excerpt || source.text}</blockquote>}
              </section>)}
            </div> : <Notice tone="warning">No citation was supplied with this answer. Golden cannot verify it against a source here.</Notice>)}
          </Card>;
        })}
        <Button kind="ghost" onClick={() => removeConversation(selected.id)}>Delete this conversation from this device</Button>
      </> : <>
        <Card>
          <label style={{ display: "grid", gap: 8, font: "13px/1.5 Inter, system-ui, sans-serif" }}>Keep conversations on this device
            <select aria-label="Guide history retention" value={retention} onChange={(event) => changeRetention(Number(event.target.value))} style={{ minHeight: 48, border: "1px solid #E3E3DE", borderRadius: 14, padding: "0 12px", font: "inherit" }}>
              <option value={GUIDE_RETENTION.session}>Session only · do not save history</option>
              <option value={GUIDE_RETENTION.sevenDays}>7 days</option>
              <option value={GUIDE_RETENTION.thirtyDays}>30 days</option>
            </select>
          </label>
        </Card>
        {list.length ? <>
          {list.map((conversation) => <Card key={conversation.id}>
            <button type="button" onClick={() => setOpenId(conversation.id)} style={{ display: "block", width: "100%", border: 0, padding: 0, background: "transparent", color: "inherit", font: "inherit", textAlign: "left", cursor: "pointer", minHeight: 44 }}>
              <strong style={{ font: "700 14px/1.4 Manrope, Inter, system-ui, sans-serif" }}>{firstQuestion(conversation)}</strong>
              <span style={{ display: "block", marginTop: 4, font: "12px/1.4 Inter, system-ui, sans-serif", color: "#6B6B6B" }}>{new Date(conversation.updatedAt).toLocaleString()}</span>
              {conversation.messages.some((message) => message.role === "assistant" && actualSources(message).length === 0) && <span style={{ display: "block", marginTop: 5, font: "12px/1.4 Inter, system-ui, sans-serif", color: "#6B6B6B" }}>At least one answer has no supplied citation.</span>}
            </button>
            <Button kind="ghost" fullWidth={false} style={{ marginTop: 10, minHeight: 44 }} onClick={() => removeConversation(conversation.id)}>Delete</Button>
          </Card>)}
          <Button kind="ghost" onClick={clearAll}>Clear saved history and local reports</Button>
        </> : <Card><h2 style={{ margin: 0, font: "700 19px/1.2 Manrope, Inter, system-ui, sans-serif" }}>No saved conversations</h2><p style={bodyStyle}>New conversations are not saved unless you choose a retention period. An open conversation can still be reviewed here while it is active.</p></Card>}
        <Notice tone="warning">Deleting history here removes this device’s copy only. It cannot remove text already sent to the provider or provider and hosting logs.</Notice>
      </>}
    </div>
  </Page>;
}
