// Together's friend pieces: friends you walk with (their streak and your days together), the friends-only weekly
// board (opt-in, nickname only, never public, never on a quiet day), and the family board for the Table (local).
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { lessonCounts, streakFrom } from "@ih/domain";
import { useStore } from "@/lib/store";
import { cheerFriend, cheerGot, cheerLabel, cleanNick, lastSeenWords, refreshFriends, setBoard, setNick, togetherWords, unfriend, useFriends, weekLight, type Friend } from "@/lib/friends";
import { Btn, Card, Eyebrow, Sun, color, confirmSheet, font, toast, type } from "@/ui";
import { GOLDEN } from "@/ui/streak";
import { t } from "@/i18n";

/** What friends can see, in the current language. */
export const friendsPrivacy = () => t("home.friends.privacy");

const initial = (s: string) => (s.trim()[0] || "·").toUpperCase();

function Avatar({ name, faded, me }: { name: string; faded?: boolean; me?: boolean }) {
  return (
    <View accessible={false} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: me ? color.ink : "#EDEBE4", borderWidth: 1.5, borderColor: color.ink, alignItems: "center", justifyContent: "center", opacity: faded ? 0.45 : 1 }}>
      <Text style={{ fontFamily: font.display[800], fontSize: 17, color: me ? GOLDEN : color.ink }}>{initial(name)}</Text>
    </View>
  );
}

/** "what should friends call you?" — asked once someone has a friend and no nickname yet. */
export function NickPrompt() {
  const f = useFriends();
  const [nick, setText] = useState("");
  if (f.nick || !f.friendId) return null;
  return (
    <View style={{ gap: 8, paddingVertical: 10 }}>
      <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{t("home.friends.nickAsk")}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput testID="nick-input" value={nick} onChangeText={(t) => setText(t.slice(0, 24))} placeholder={t("home.friends.nickPlaceholder")} placeholderTextColor={color.mute} maxLength={24}
          accessibilityLabel={t("home.friends.nickA11y")} style={{ flex: 1, borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, fontFamily: font.text[400], fontSize: 15, backgroundColor: "#fff", color: color.ink }} />
        <Btn testID="nick-save" disabled={!cleanNick(nick)} onPress={() => { setNick(nick); toast(t("home.friends.willSee", { nick: cleanNick(nick) })); }} style={{ paddingHorizontal: 16 }}>{t("home.friends.save")}</Btn>
      </View>
    </View>
  );
}

/** Cheers friends sent you lately: "maya cheered your 30-day streak". */
function CheersForMe() {
  const f = useFriends();
  const got = f.cheers || [];
  if (!got.length) return null;
  return (
    <View testID="cheers" style={{ gap: 8, marginTop: 8, marginBottom: 4 }}>
      {got.map((c, i) => (
        <View key={`${c.nick}|${c.kind}|${c.n}|${i}`} testID="cheer-got" style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFBE0", borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
          <Sun size={24} mood="happy" />
          <Text style={{ flex: 1, fontFamily: font.display[800], fontSize: 14, color: color.ink }}>{cheerGot(c)}</Text>
        </View>
      ))}
    </View>
  );
}

/** One tap to cheer what a friend reached lately (a fixed cheer, no words), then "you cheered this". */
function CheerButtons({ x }: { x: Friend }) {
  const { today } = useStore();
  const [busy, setBusy] = useState(false);
  const list = x.cheer || [];
  if (!list.length || x.faded) return null;
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8, marginLeft: 52 }}>
      {list.map((c) => c.cheered ? (
        <Text key={`${c.kind}${c.n}`} testID="cheered" style={[type.eyebrow(8), { color: color.mute, paddingVertical: 6 }]}>☀ {t("home.friends.cheered")}</Text>
      ) : (
        <Pressable key={`${c.kind}${c.n}`} testID="cheer" accessibilityRole="button" accessibilityLabel={t("home.friends.cheerA11y", { what: cheerLabel(c), nick: x.nick })} disabled={busy}
          onPress={async () => { setBusy(true); const ok = await cheerFriend(x.id, c.kind, c.n, today); setBusy(false); toast(ok ? t("home.friends.cheerSent", { nick: x.nick }) : t("home.friends.unreachable")); }}
          style={({ pressed }) => ({ maxWidth: "100%", flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, paddingHorizontal: 12, borderRadius: 999, backgroundColor: GOLDEN, borderWidth: 1.5, borderColor: color.ink, opacity: busy ? 0.6 : pressed ? 0.8 : 1 })}>
          <Text style={{ fontSize: 13 }}>☀</Text>
          <Text style={{ flexShrink: 1, fontFamily: font.display[800], fontSize: 13, color: color.ink }}>{cheerLabel(c)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Friends you walk with: their streak, whether they're done today, and your days together. */
export function FriendRows() {
  const { today } = useStore();
  const f = useFriends();
  useFocusEffect(useCallback(() => { refreshFriends(today); }, [today]));
  if (!f.friends.length) return null;
  const offline = f.reachable === false;
  const drop = async (x: Friend) => {
    if (await confirmSheet({ title: t("home.friends.stopTitle", { nick: x.nick }), body: t("home.friends.stopBody"), confirm: t("home.friends.stop"), cancel: t("home.friends.keepWalking"), destructive: true })) {
      if (await unfriend(x.id)) toast(t("home.friends.stopped", { nick: x.nick }));
    }
  };
  return (
    <View style={{ marginTop: 6 }}>
      <CheersForMe />
      {f.friends.map((x, i) => (
        <View key={x.id} style={{ paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: color.line }}>
        <View testID="friend" style={{ flexDirection: "row", alignItems: "center", gap: 12, opacity: x.faded ? 0.55 : 1 }}>
          <Avatar name={x.nick} faded={x.faded} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{x.nick}</Text>
            {x.faded || offline ? (
              <Text style={[type.body(12), { color: color.mute }]}>{lastSeenWords(x.lastSeen, today)}</Text>
            ) : (
              <Text style={[type.body(12), { color: color.mute }]}>{x.streak ? `${t("home.streakN", { count: x.streak })}${x.golden ? t("home.friends.golden") : ""}` : t("home.friends.fresh")} · {x.doneToday ? t("home.friends.doneToday") : t("home.friends.notYetToday")}</Text>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel={t("home.friends.stopA11y", { nick: x.nick })} onPress={() => drop(x)} hitSlop={8} style={{ alignSelf: "flex-start" }}>
              <Text style={[type.eyebrow(8), { color: color.mute, marginTop: 2 }]}>{t("home.friends.stop")}</Text>
            </Pressable>
          </View>
          {/* the shared streak: our sun, never a flame */}
          <View testID="friend-together" accessibilityLabel={togetherWords(x.together)} style={{ alignItems: "center", minWidth: 64 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink }}>{x.together}</Text>
              <Sun size={20} />
            </View>
            <Text style={[type.eyebrow(7), { marginTop: 2 }]}>{t("home.friends.daysTogether", { count: x.together })}</Text>
          </View>
        </View>
        {/* under the row, lined up with the name: the whole card width, so a long cheer never runs into the numbers */}
        {offline ? null : <CheerButtons x={x} />}
        </View>
      ))}
      {offline ? <Text style={[type.body(11), { color: color.mute, marginTop: 4 }]}>{t("home.friends.offline")}</Text> : null}
    </View>
  );
}

type Row = { key: string; name: string; light: number; me?: boolean };
function Ranked({ rows, testID }: { rows: Row[]; testID: string }) {
  const sorted = [...rows].sort((a, b) => b.light - a.light || (a.me ? -1 : b.me ? 1 : a.name.localeCompare(b.name)));
  return (
    <View testID={testID} style={{ marginTop: 8 }}>
      {sorted.map((r, i) => (
        <View key={r.key} testID="board-row" style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 14, backgroundColor: r.me ? "#FFFBE0" : "transparent" }}>
          <Text style={{ width: 22, fontFamily: font.display[800], fontSize: 15, color: color.ink, textAlign: "center" }}>{i + 1}</Text>
          <Avatar name={r.name} me={r.me} />
          <Text style={{ flex: 1, fontFamily: font.display[800], fontSize: 15, color: color.ink }}>{r.me ? t("home.friends.me", { name: r.name }) : r.name}</Text>
          {i === 0 && r.light > 0 ? <View testID="board-top" accessibilityLabel={t("home.friends.top")}><Sun size={22} mood="happy" /></View> : null}
          <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, minWidth: 54, textAlign: "right" }}>{r.light}</Text>
          <Text style={[type.eyebrow(7)]}>{t("home.friends.light")}</Text>
        </View>
      ))}
    </View>
  );
}

/** "this week with friends": opt-in, default off, friends only, resets Monday. Hidden on quiet days. */
export function WeeklyBoard({ quiet }: { quiet: boolean }) {
  const { saved, today } = useStore();
  const f = useFriends();
  if (quiet || (!f.friends.length && !f.board)) return null; // no friends yet: nothing to rank
  const mine = weekLight(saved.sits, saved.settings.runs, today);
  const rows: Row[] = [{ key: "me", name: f.nick || t("home.friends.you"), light: mine, me: true }, ...f.friends.filter((x) => x.onBoard && x.weekLight !== null && !x.faded).map((x) => ({ key: x.id, name: x.nick, light: x.weekLight || 0 }))];
  return (
    <Card testID="weekly-board">
      <Eyebrow>{t("home.friends.weekTitle")}</Eyebrow>
      <Text style={[type.body(12), { color: color.mute, marginTop: 4 }]}>{t("home.friends.weekBody")}</Text>
      <Pressable testID="board-toggle" accessibilityRole="switch" accessibilityState={{ checked: f.board }} aria-checked={f.board} onPress={() => { setBoard(!f.board); toast(f.board ? t("home.friends.boardLeft") : t("home.friends.boardOn")); }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, minHeight: 44 }}>
        <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink }}>{t("home.friends.boardJoin")}</Text>
        <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: f.board ? color.ink : color.line, padding: 3, alignItems: f.board ? "flex-end" : "flex-start" }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: f.board ? GOLDEN : "#fff" }} />
        </View>
      </Pressable>
      {f.board ? (
        f.friends.length ? <Ranked rows={rows} testID="board" /> : <Text style={[type.body(13), { marginTop: 8 }]}>{t("home.friends.boardEmpty")}</Text>
      ) : null}
      <Text style={[type.caption(11), { marginTop: 8 }]}>{t("home.friends.lightRule")}</Text>
    </Card>
  );
}

/** The Table's own board: you and your kids, on this phone only. Kids never join friends' boards. */
export function FamilyBoard({ quiet }: { quiet: boolean }) {
  const { saved, today } = useStore();
  const f = useFriends();
  const kids = saved.settings.kids;
  if (quiet || !kids.length) return null;
  const rows: Row[] = [
    { key: "me", name: f.nick || t("home.friends.you"), light: weekLight(saved.sits, saved.settings.runs, today), me: true },
    ...kids.map((k) => ({ key: k.id, name: `${k.name} · ${t("home.streakN", { count: streakFrom(lessonCounts(saved.sits, k.id), today).streak })}`, light: weekLight(saved.sits, [], today, k.id) })),
  ];
  return (
    <Card testID="family-board">
      <Eyebrow>{t("home.friends.tableTitle")}</Eyebrow>
      <Text style={[type.body(12), { color: color.mute, marginTop: 4 }]}>{t("home.friends.tableBody")}</Text>
      <Ranked rows={rows} testID="family-rows" />
      <Pressable accessibilityRole="link" onPress={() => router.push("/you/table")}><Text style={[type.eyebrow(8), { marginTop: 8 }]}>{t("home.friends.tableLink")}</Text></Pressable>
    </Card>
  );
}
