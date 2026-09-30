// Together's friend pieces: friends you walk with (their streak and your days together), the friends-only weekly
// board (opt-in, nickname only, never public, never on a quiet day), and the family board for the Table (local).
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { lessonCounts, streakFrom } from "@ih/domain";
import { useStore } from "@/lib/store";
import { cleanNick, lastSeenWords, refreshFriends, setBoard, setNick, togetherWords, unfriend, useFriends, weekLight, type Friend } from "@/lib/friends";
import { Btn, Card, Eyebrow, Sun, color, confirmSheet, font, toast, type } from "@/ui";
import { GOLDEN } from "@/ui/streak";

export const FRIENDS_PRIVACY = "friends see your nickname, your streak, whether today's done and your weekly light. never your door or anything you wrote.";

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
      <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>what should friends call you?</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <TextInput testID="nick-input" value={nick} onChangeText={(t) => setText(t.slice(0, 24))} placeholder="a first name or a nickname" placeholderTextColor={color.mute} maxLength={24}
          accessibilityLabel="What should friends call you?" style={{ flex: 1, borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 14, fontFamily: font.text[400], fontSize: 15, backgroundColor: "#fff", color: color.ink }} />
        <Btn testID="nick-save" disabled={!cleanNick(nick)} onPress={() => { setNick(nick); toast(`friends will see “${cleanNick(nick)}”`); }} style={{ paddingHorizontal: 16 }}>save</Btn>
      </View>
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
    if (await confirmSheet({ title: `stop walking with ${x.nick}?`, body: "you'll each drop off the other's list and your days together end. they aren't told.", confirm: "stop walking", cancel: "keep", destructive: true })) {
      if (await unfriend(x.id)) toast(`not walking with ${x.nick} anymore`);
    }
  };
  return (
    <View style={{ marginTop: 6 }}>
      {f.friends.map((x, i) => (
        <View key={x.id} testID="friend" style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: color.line, opacity: x.faded ? 0.55 : 1 }}>
          <Avatar name={x.nick} faded={x.faded} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: font.display[800], fontSize: 16, color: color.ink }}>{x.nick}</Text>
            {x.faded || offline ? (
              <Text style={[type.body(12), { color: color.mute }]}>{lastSeenWords(x.lastSeen, today)}</Text>
            ) : (
              <Text style={[type.body(12), { color: color.mute }]}>{x.streak ? `${x.streak}-day streak${x.golden ? " · golden" : ""}` : "starting fresh"} · {x.doneToday ? "done today" : "not yet today"}</Text>
            )}
            <Pressable accessibilityRole="button" accessibilityLabel={`stop walking with ${x.nick}`} onPress={() => drop(x)} hitSlop={8} style={{ alignSelf: "flex-start" }}>
              <Text style={[type.eyebrow(8), { color: color.mute, marginTop: 2 }]}>stop walking</Text>
            </Pressable>
          </View>
          {/* the shared streak: our sun, never a flame */}
          <View testID="friend-together" accessibilityLabel={togetherWords(x.together)} style={{ alignItems: "center", minWidth: 64 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Text style={{ fontFamily: font.display[800], fontSize: 20, color: color.ink }}>{x.together}</Text>
              <Sun size={20} />
            </View>
            <Text style={[type.eyebrow(7), { marginTop: 2 }]}>{x.together === 1 ? "day together" : "days together"}</Text>
          </View>
        </View>
      ))}
      {offline ? <Text style={[type.body(11), { color: color.mute, marginTop: 4 }]}>can't reach friends right now. showing when you last saw them.</Text> : null}
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
          <Text style={{ flex: 1, fontFamily: font.display[800], fontSize: 15, color: color.ink }}>{r.me ? `${r.name} (you)` : r.name}</Text>
          {i === 0 && r.light > 0 ? <View testID="board-top" accessibilityLabel="top this week"><Sun size={22} mood="happy" /></View> : null}
          <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink, minWidth: 54, textAlign: "right" }}>{r.light}</Text>
          <Text style={[type.eyebrow(7)]}>light</Text>
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
  const rows: Row[] = [{ key: "me", name: f.nick || "you", light: mine, me: true }, ...f.friends.filter((x) => x.onBoard && x.weekLight !== null && !x.faded).map((x) => ({ key: x.id, name: x.nick, light: x.weekLight || 0 }))];
  return (
    <Card testID="weekly-board">
      <Eyebrow>this week with friends</Eyebrow>
      <Text style={[type.body(12), { color: color.mute, marginTop: 4 }]}>only friends you've walked with see it. no strangers, no public ranks. resets every monday.</Text>
      <Pressable testID="board-toggle" accessibilityRole="switch" accessibilityState={{ checked: f.board }} aria-checked={f.board} onPress={() => { setBoard(!f.board); toast(f.board ? "left the weekly board" : "on the weekly board"); }}
        style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 10, minHeight: 44 }}>
        <Text style={{ fontFamily: font.display[800], fontSize: 15, color: color.ink }}>join the weekly board</Text>
        <View style={{ width: 50, height: 30, borderRadius: 15, backgroundColor: f.board ? color.ink : color.line, padding: 3, alignItems: f.board ? "flex-end" : "flex-start" }}>
          <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: f.board ? GOLDEN : "#fff" }} />
        </View>
      </Pressable>
      {f.board ? (
        f.friends.length ? <Ranked rows={rows} testID="board" /> : <Text style={[type.body(13), { marginTop: 8 }]}>send a lantern to someone and walk with them: they'll show up here once they join too.</Text>
      ) : null}
      <Text style={[type.caption(11), { marginTop: 8 }]}>light: 10 for each lesson you finish this week, 5 more for a clean run. it counts learning, never faith.</Text>
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
    { key: "me", name: f.nick || "you", light: weekLight(saved.sits, saved.settings.runs, today), me: true },
    ...kids.map((k) => ({ key: k.id, name: `${k.name} · ${streakFrom(lessonCounts(saved.sits, k.id), today).streak}-day streak`, light: weekLight(saved.sits, [], today, k.id) })),
  ];
  return (
    <Card testID="family-board">
      <Eyebrow>this week at your table</Eyebrow>
      <Text style={[type.body(12), { color: color.mute, marginTop: 4 }]}>just your family, on this phone. kids only ever see this board.</Text>
      <Ranked rows={rows} testID="family-rows" />
      <Pressable accessibilityRole="link" onPress={() => router.push("/you/table")}><Text style={[type.eyebrow(8), { marginTop: 8 }]}>your table ›</Text></Pressable>
    </Card>
  );
}
