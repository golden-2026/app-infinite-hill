// Together's circles: the groups a teacher or a house of worship brings in (lib/circles, api/circles.js). Each shows
// its name and leader, how many people are in it (real, from the server; under 3 it's "just getting started"), how
// many walked today, the nicknames of members who chose to show one, and the leader's one pinned note. No chat.
// Only on the parent's own screens: a child at the family table never sees or joins a circle.
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Platform, Pressable, Share, Text, TextInput, View } from "react-native";
import { icon } from "@ih/content";
import { useStore } from "@/lib/store";
import { friendsState } from "@/lib/friends";
import { NOTE_MAX, SMALL, circleLink, cleanLine, joinPending, leaveCircle, markWalked, postNote, prettyCode, refreshCircles, showAs, useCircles, type Circle, type Fail } from "@/lib/circles";
import { Btn, Card, Eyebrow, Link, Sun, color, confirmSheet, font, toast, type } from "@/ui";
import { GOLDEN } from "@/ui/streak";
import { date as fmtDate, doorLabel, getLang, t } from "@/i18n";

export const failWords = (why: Fail) => t(`groups.fail.${why}` as any);

async function copy(text: string): Promise<boolean> {
  const clip = (globalThis as any).navigator?.clipboard;
  if (!clip?.writeText) return false;
  try { await clip.writeText(text); return true; } catch { return false; }
}

/** The phone's share sheet when there is one; otherwise the link is copied and the code shown. */
export async function shareCircle(c: { code: string; name: string; leaderName: string }) {
  const url = circleLink(c.code, getLang());
  const text = t("groups.share.text", { circle: c.name, leader: c.leaderName, code: prettyCode(c.code) });
  if (Platform.OS !== "web") {
    try { await Share.share({ message: `${text}\n${url}` }); } catch {}
    return;
  }
  const nav = (globalThis as any).navigator;
  if (nav?.share) {
    try { await nav.share({ title: t("groups.share.title", { circle: c.name }), text, url }); return; }
    catch (e: any) { if (e?.name === "AbortError") return; }
  }
  toast((await copy(url)) ? t("groups.share.copied") : t("groups.share.copyFail", { code: prettyCode(c.code) }));
}

export function Switch({ on, onPress, label, a11y, testID }: { on: boolean; onPress: () => void; label: string; a11y?: string; testID?: string }) {
  return (
    <Pressable testID={testID} accessibilityRole="switch" accessibilityLabel={a11y || label} accessibilityState={{ checked: on }} aria-checked={on} onPress={onPress}
      style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, minHeight: 44 }}>
      <Text style={{ flex: 1, fontFamily: font.display[800], fontSize: 15, color: color.ink }}>{label}</Text>
      <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: on ? color.ink : color.line, padding: 3, alignItems: on ? "flex-end" : "flex-start" }}>
        <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: on ? GOLDEN : "#fff" }} />
      </View>
    </Pressable>
  );
}

/** "12 people · 5 walked today", or "just getting started" under 3 people. */
export function countWords(count: number) {
  return count < SMALL ? t("groups.gettingStarted") : t("groups.people", { count });
}

function NoteEditor({ c, onDone }: { c: Circle; onDone: () => void }) {
  const { today } = useStore();
  const [text, setText] = useState(c.note || "");
  const [busy, setBusy] = useState(false);
  const left = NOTE_MAX - [...text].length;
  const save = async (value: string) => {
    setBusy(true);
    const ok = await postNote(c.id, value, today);
    setBusy(false);
    if (ok) { toast(value.trim() ? t("groups.note.saved") : t("groups.note.cleared")); onDone(); } else toast(failWords("offline"));
  };
  return (
    <View style={{ gap: 8, marginTop: 10 }}>
      <TextInput testID="circle-note-input" value={text} onChangeText={(v) => setText([...v].slice(0, NOTE_MAX).join(""))} multiline maxLength={NOTE_MAX}
        placeholder={t("groups.note.placeholder")} placeholderTextColor={color.mute} accessibilityLabel={t("groups.note.a11y")}
        style={{ minHeight: 84, borderWidth: 1.5, borderColor: color.line, borderRadius: 16, padding: 12, fontFamily: font.text[400], fontSize: 15, backgroundColor: "#fff", color: color.ink, textAlignVertical: "top" }} />
      <Text style={[type.caption(11)]}>{t("groups.note.left", { count: left })}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Btn testID="circle-note-save" disabled={busy || !text.trim()} onPress={() => save(text)} style={{ flex: 1 }}>{t("groups.note.save")}</Btn>
        <Btn kind="ghost" onPress={onDone} style={{ flex: 1 }}>{t("common.cancel")}</Btn>
      </View>
      {c.note ? <Link onPress={() => save("")} style={{ color: color.mute, fontSize: 10 }}>{t("groups.note.clear")}</Link> : null}
      <Text style={[type.body(11), { color: color.mute }]}>{t("groups.note.rule")}</Text>
    </View>
  );
}

function NickRow({ c }: { c: Circle }) {
  const [asking, setAsking] = useState(false);
  const [nick, setNick] = useState(c.me.nick || friendsState().nick || "");
  const shown = !!c.me.nick;
  const toggle = async () => {
    if (shown) { if (await showAs(c.id, null)) toast(t("groups.countedOnly")); else toast(failWords("offline")); return; }
    setAsking(true);
  };
  const save = async () => {
    const n = cleanLine(nick, 24);
    if (!n) return;
    if (await showAs(c.id, n)) { setAsking(false); toast(t("groups.shownAs", { nick: n })); } else toast(failWords("offline"));
  };
  return (
    <View style={{ marginTop: 8 }}>
      <Switch testID="circle-show-me" on={shown || asking} onPress={asking ? () => setAsking(false) : toggle} label={t("groups.showMe")} a11y={t("groups.showMeA11y", { circle: c.name })} />
      {asking ? (
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <TextInput testID="circle-nick-input" value={nick} onChangeText={(v) => setNick(v.slice(0, 24))} maxLength={24} placeholder={t("groups.join.nickPlaceholder")} placeholderTextColor={color.mute}
            accessibilityLabel={t("groups.join.nickA11y")} autoCorrect={false}
            style={{ flex: 1, borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, fontFamily: font.text[400], fontSize: 15, backgroundColor: "#fff", color: color.ink }} />
          <Btn testID="circle-nick-save" disabled={!cleanLine(nick, 24)} onPress={save} style={{ paddingHorizontal: 16 }}>{t("home.friends.save")}</Btn>
        </View>
      ) : (
        <Text style={[type.body(12), { color: color.mute }]}>{shown ? t("groups.shownAs", { nick: c.me.nick }) : t("groups.countedOnly")}</Text>
      )}
    </View>
  );
}

function CircleBlock({ c, first }: { c: Circle; first: boolean }) {
  const [editing, setEditing] = useState(false);
  const hidden = Math.max(0, c.count - c.members.length);
  const leave = async () => {
    const lead = c.isLeader;
    const yes = await confirmSheet({
      title: t(lead ? "groups.closeTitle" : "groups.leaveTitle", { circle: c.name }), body: t(lead ? "groups.closeBody" : "groups.leaveBody"),
      confirm: t(lead ? "groups.closeConfirm" : "groups.leaveConfirm"), cancel: t("groups.keep"), destructive: true,
    });
    if (!yes) return;
    toast((await leaveCircle(c.id)) ? t(lead ? "groups.closed" : "groups.left", { circle: c.name }) : failWords("offline"));
  };
  return (
    <View testID="circle" style={{ paddingTop: first ? 4 : 16, marginTop: first ? 0 : 12, borderTopWidth: first ? 0 : 1, borderTopColor: color.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View accessible={false} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: icon(c.door).tint, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: color.ink }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 19, color: "#fff" }}>{(c.name.trim()[0] || "·").toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text testID="circle-name" style={{ fontFamily: font.display[800], fontSize: 18, color: color.ink }}>{c.name}</Text>
          <Text style={[type.body(12), { color: color.mute }]}>{t("groups.with", { leader: c.leaderName })} · {doorLabel(c.door)}</Text>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
        <View testID="circle-count" style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: "#EDEBE4" }}>
          <Text style={{ fontFamily: font.display[800], fontSize: 13, color: color.ink }}>{countWords(c.count)}</Text>
        </View>
        <View testID="circle-walked" style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, backgroundColor: c.walkedToday ? "#FFFBE0" : "#EDEBE4" }}>
          {c.walkedToday ? <Sun size={16} mood="happy" /> : null}
          <Text style={{ fontFamily: font.display[800], fontSize: 13, color: color.ink }}>{c.walkedToday ? t("groups.walkedToday", { count: c.walkedToday }) : t("groups.noneYet")}</Text>
        </View>
      </View>
      {c.note && !editing ? (
        <View testID="circle-note" style={{ marginTop: 12, backgroundColor: "#FFFBE0", borderRadius: 16, padding: 14, borderWidth: 1.5, borderColor: color.ink }}>
          <Text style={[type.eyebrow(8), { color: color.mute }]}>{t("groups.noteFrom", { leader: c.leaderName })}</Text>
          <Text style={{ fontFamily: font.text[500], fontSize: 15, color: color.ink, marginTop: 6, lineHeight: 21 }}>{c.note}</Text>
          {c.noteOn ? <Text style={[type.caption(11), { marginTop: 6 }]}>{t("groups.noteOn", { date: fmtDate(c.noteOn, { month: "short", day: "numeric" }) })}</Text> : null}
        </View>
      ) : null}
      {c.isLeader ? (
        editing ? <NoteEditor c={c} onDone={() => setEditing(false)} /> : (
          <View style={{ marginTop: 10 }}>
            <Text style={[type.eyebrow(8), { color: color.mute }]}>{t("groups.leader")}</Text>
            <View style={{ alignItems: "flex-start" }}><Link onPress={() => setEditing(true)} label={c.note ? t("groups.note.edit") : t("groups.note.post")}>{c.note ? t("groups.note.edit") : t("groups.note.post")}</Link></View>
          </View>
        )
      ) : null}
      {c.members.length ? (
        <View testID="circle-members" style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
          {c.members.map((m, i) => (
            <View key={`${m.nick}|${i}`} testID="circle-member" accessibilityLabel={`${m.nick}${m.family ? `, ${t("groups.family")}` : ""}${m.walked ? `, ${t("groups.walkedA11y")}` : ""}`}
              style={{ flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, borderWidth: 1.5, borderColor: m.me ? color.ink : color.line, backgroundColor: m.walked ? "#FFFBE0" : "#fff" }}>
              {m.walked ? <Text style={{ fontSize: 12, color: color.ink }}>☀</Text> : null}
              <Text style={{ fontFamily: font.display[800], fontSize: 13, color: color.ink }}>{m.me ? t("groups.you", { nick: m.nick }) : m.nick}</Text>
              {m.family ? <Text style={[type.eyebrow(7), { color: color.mute }]}>{t("groups.family")}</Text> : null}
            </View>
          ))}
        </View>
      ) : null}
      {hidden > 0 && c.members.length ? <Text style={[type.body(12), { color: color.mute, marginTop: 6 }]}>{t("groups.more", { count: hidden })}</Text> : null}
      <NickRow c={c} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 }}>
        <Btn kind="ghost" testID="circle-invite" onPress={() => shareCircle(c)} style={{ flex: 1 }}>{t("groups.invite")}</Btn>
        <Text testID="circle-code" accessibilityLabel={t("groups.codeA11y", { code: prettyCode(c.code).split("").join(" ") })} style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, letterSpacing: 1 }}>{prettyCode(c.code)}</Text>
      </View>
      <View style={{ alignItems: "flex-start", marginTop: 6 }}>
        <Link onPress={leave} style={{ color: color.mute, fontSize: 10 }}>{c.isLeader ? t("groups.close") : t("groups.leave")}</Link>
      </View>
    </View>
  );
}

/** Together's circles card: the circles you're in, and a way to start or join one. */
export function CirclesCard() {
  const { today } = useStore();
  const s = useCircles();
  useFocusEffect(useCallback(() => { refreshCircles(today); }, [today]));
  const list = [...s.circles].sort((a, b) => Number(b.isLeader) - Number(a.isLeader) || a.name.localeCompare(b.name));
  return (
    <Card testID="circles-card">
      <Eyebrow>{t("groups.card.eyebrow")}</Eyebrow>
      {list.length ? (
        <View style={{ marginTop: 8 }}>{list.map((c, i) => <CircleBlock key={c.id} c={c} first={i === 0} />)}</View>
      ) : (
        <Text style={[type.body(14), { color: color.ink, marginTop: 8 }]}>{t("groups.card.pitch")}</Text>
      )}
      {s.reachable === false && list.length ? <Text style={[type.body(11), { color: color.mute, marginTop: 8 }]}>{t("groups.card.offline")}</Text> : null}
      <View style={{ flexDirection: "row", gap: 8, marginTop: 14 }}>
        <Btn testID="circle-start" kind={list.length ? "ghost" : "ink"} onPress={() => router.push("/start-circle")} style={{ flex: 1, paddingHorizontal: 8 }}>{t("groups.card.start")}</Btn>
        <Btn testID="circle-join" kind="ghost" onPress={() => router.push("/circle")} style={{ flex: 1, paddingHorizontal: 8 }}>{t("groups.card.join")}</Btn>
      </View>
      <Text testID="circles-privacy" style={[type.body(11), { color: color.mute, marginTop: 10 }]}>{t("groups.card.privacy")}</Text>
    </Card>
  );
}

/**
 * After a lesson, tell your circles "walked today" (only the date). A family membership also counts a child's lesson
 * at the family table as the family walking. Also retries a join that couldn't reach the server during sign-up.
 */
export function CirclesSync() {
  const { saved, today } = useStore();
  const s = useCircles();
  const family = s.circles.some((c) => c.me.family);
  const walked = saved.sits.some((x) => x.date === today && (!x.kidId || family));
  const onboarded = !!saved.settings.onboarded;
  useEffect(() => { if (onboarded && s.pending) joinPending(today); }, [onboarded, s.pending, today]);
  const ids = s.circles.map((c) => c.id).sort().join(",");
  useEffect(() => { if (walked && ids) markWalked(today); }, [walked, ids, today]);
  return null;
}
