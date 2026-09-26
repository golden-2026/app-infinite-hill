const STORAGE_KEY = "golden:guide:conversations:v1";
const REPORTS_KEY = "golden:guide:reports:v1";
const VERSION = 1;

export const GUIDE_RETENTION = Object.freeze({
  session: 0,
  sevenDays: 7,
  thirtyDays: 30,
});

export const GUIDE_MODES = Object.freeze({
  provider: "provider_live",
  lesson: "lesson_only",
  offline: "offline",
  rateLimited: "rate_limited",
  unavailable: "unavailable",
});

function timestamp(value) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function id(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.();
  return `${prefix}_${uuid || `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`}`;
}

function cleanSource(source) {
  if (!source || typeof source !== "object") return null;
  const citation = String(source.citation || source.reference || "").trim();
  if (!citation) return null;
  const title = String(source.title || source.sourceTitle || source.source || "").trim();
  return {
    citation,
    ...(title ? { title } : {}),
    ...(source.excerpt || source.text ? { excerpt: String(source.excerpt || source.text) } : {}),
    ...(source.door || source.tradition ? { door: String(source.door || source.tradition) } : {}),
  };
}

function cleanMessage(message) {
  if (!message || !["user", "assistant"].includes(message.role)) return null;
  const content = String(message.content ?? "").trim();
  if (!content) return null;
  return {
    id: message.id || id("msg"),
    role: message.role,
    content,
    createdAt: timestamp(message.createdAt),
    mode: Object.values(GUIDE_MODES).includes(message.mode) ? message.mode : GUIDE_MODES.unavailable,
    sources: message.role === "assistant" && Array.isArray(message.sources)
      ? message.sources.map(cleanSource).filter(Boolean)
      : [],
  };
}

function cleanConversation(conversation) {
  if (!conversation || typeof conversation !== "object" || !conversation.id) return null;
  const messages = (Array.isArray(conversation.messages) ? conversation.messages : []).map(cleanMessage).filter(Boolean);
  if (!messages.length) return null;
  return {
    id: String(conversation.id),
    door: String(conversation.door || ""),
    consentMode: conversation.consentMode === "lesson" ? "lesson" : "provider",
    createdAt: timestamp(conversation.createdAt),
    updatedAt: timestamp(conversation.updatedAt || messages.at(-1)?.createdAt),
    messages,
  };
}

function parse(storage, key, fallback) {
  try {
    const raw = storage?.getItem?.(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(storage, key, value) {
  try {
    storage?.setItem?.(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function retentionDays(state) {
  const days = Number(state?.retentionDays);
  return Object.values(GUIDE_RETENTION).includes(days) ? days : GUIDE_RETENTION.session;
}

export function loadGuideRetention(storage) {
  return retentionDays(parse(storage, STORAGE_KEY, { retentionDays: GUIDE_RETENTION.session }));
}

function prune(conversations, days, now) {
  if (!days) return [];
  const cutoff = new Date(now).getTime() - days * 24 * 60 * 60 * 1000;
  return conversations.filter((entry) => new Date(entry.updatedAt).getTime() >= cutoff);
}

export function resolveGuideMode({ accessMode, providerState, online = true } = {}) {
  if (accessMode === "lesson") return GUIDE_MODES.lesson;
  if (!online) return GUIDE_MODES.offline;
  if (providerState === "rate_limited") return GUIDE_MODES.rateLimited;
  if (providerState !== "ready" && providerState !== "configured") return GUIDE_MODES.unavailable;
  return GUIDE_MODES.provider;
}

export function createGuideConversation({ door, consentMode = "provider", now, conversationId } = {}) {
  const createdAt = timestamp(now);
  return {
    id: conversationId || id("guide"),
    door: String(door || ""),
    consentMode: consentMode === "lesson" ? "lesson" : "provider",
    createdAt,
    updatedAt: createdAt,
    messages: [],
  };
}

export function addGuideMessage(conversation, message, now) {
  const current = cleanConversation({ ...conversation, messages: conversation?.messages || [] }) || {
    ...createGuideConversation({ door: conversation?.door, consentMode: conversation?.consentMode, now }),
    ...conversation,
    messages: [],
  };
  const nextMessage = cleanMessage({ ...message, createdAt: message?.createdAt || now });
  if (!nextMessage) throw new TypeError("Guide messages need a user or assistant role and non-empty content.");
  const updatedAt = timestamp(now || nextMessage.createdAt);
  return { ...current, messages: [...current.messages, nextMessage], updatedAt };
}

export function loadGuideConversations(storage, { now = Date.now() } = {}) {
  const state = parse(storage, STORAGE_KEY, { version: VERSION, retentionDays: 0, conversations: [] });
  const days = retentionDays(state);
  const conversations = (Array.isArray(state.conversations) ? state.conversations : [])
    .map(cleanConversation).filter(Boolean);
  return prune(conversations, days, now);
}

export function saveGuideConversation(storage, conversation, { retentionDays: days, now = Date.now() } = {}) {
  const savedState = parse(storage, STORAGE_KEY, { retentionDays: GUIDE_RETENTION.session, conversations: [] });
  const chosenDays = days === undefined ? retentionDays(savedState) : Number(days);
  const normalizedDays = Object.values(GUIDE_RETENTION).includes(chosenDays) ? chosenDays : GUIDE_RETENTION.session;
  const normalized = cleanConversation(conversation);
  if (!normalized) return false;
  if (!normalizedDays) {
    deleteGuideConversation(storage, normalized.id);
    return false;
  }
  const existing = loadGuideConversations(storage, { now }).filter((entry) => entry.id !== normalized.id);
  const conversations = prune([...existing, normalized], normalizedDays, now);
  return write(storage, STORAGE_KEY, { version: VERSION, retentionDays: normalizedDays, conversations });
}

export function setGuideRetention(storage, days, { now = Date.now() } = {}) {
  const normalizedDays = Number(days);
  if (!Object.values(GUIDE_RETENTION).includes(normalizedDays)) throw new RangeError("Choose session-only, 7-day, or 30-day retention.");
  const previous = parse(storage, STORAGE_KEY, { conversations: [] });
  const conversations = normalizedDays
    ? prune((Array.isArray(previous.conversations) ? previous.conversations : []).map(cleanConversation).filter(Boolean), normalizedDays, now)
    : [];
  if (!normalizedDays) storage?.removeItem?.(STORAGE_KEY);
  else write(storage, STORAGE_KEY, { version: VERSION, retentionDays: normalizedDays, conversations });
  return { retentionDays: normalizedDays, conversations };
}

export function deleteGuideConversation(storage, conversationId) {
  const state = parse(storage, STORAGE_KEY, { retentionDays: 0, conversations: [] });
  const conversations = (Array.isArray(state.conversations) ? state.conversations : [])
    .filter((conversation) => conversation?.id !== conversationId);
  if (!conversations.length) storage?.removeItem?.(STORAGE_KEY);
  else write(storage, STORAGE_KEY, { version: VERSION, retentionDays: retentionDays(state), conversations });
  return conversations.length;
}

export function clearGuideHistory(storage) {
  storage?.removeItem?.(STORAGE_KEY);
  storage?.removeItem?.(REPORTS_KEY);
  return true;
}

export function createGuideReport({ conversationId, messageId, category, details = "", now, reportId } = {}) {
  const allowed = ["theology", "safety", "citation", "tone", "factual"];
  if (!allowed.includes(category)) throw new RangeError("Choose a supported Guide report category.");
  return {
    id: reportId || id("report"),
    conversationId: String(conversationId || ""),
    messageId: String(messageId || ""),
    category,
    details: String(details).trim().slice(0, 1000),
    createdAt: timestamp(now),
    delivery: "device_only",
  };
}

export function saveGuideReport(storage, report) {
  if (!report?.id || report.delivery !== "device_only") return false;
  const reports = parse(storage, REPORTS_KEY, []);
  return write(storage, REPORTS_KEY, [...(Array.isArray(reports) ? reports : []), report]);
}

export function loadGuideReports(storage) {
  const reports = parse(storage, REPORTS_KEY, []);
  return Array.isArray(reports) ? reports : [];
}

export const GUIDE_STORAGE_KEYS = Object.freeze({ conversations: STORAGE_KEY, reports: REPORTS_KEY });
