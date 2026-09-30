import { useEffect, useRef, useState } from "react";
import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { nextGoal } from "@ih/domain";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useDone } from "@/lib/done";
import { play } from "@/lib/fx";
import { successHaptic, tapHaptic } from "@/lib/haptics";
import { todaysThree } from "@/lib/three";
import { useStore } from "@/lib/store";
import { MILESTONE_WORDS, STREAK_RULE, goalView } from "@/lib/streak";
import { useCompanionDay } from "@/lib/companion/use-companion";
import { FRIEND_MILESTONES, useFriends } from "@/lib/friends";
import { Btn, Card, Guy, Screen, Sun, color, font, type } from "@/ui";
import { GOLDEN, Odometer, RestBank, WeekRow } from "@/ui/streak";
import { ShareCardButton } from "@/ui/share-card";

/** The milestones that offer a card to share (streak), and the days-together ones (friend streak). */
const SHARE_MILESTONES = [30, 100, 365];
const SHARE_TOGETHER = [30, 100];

// The streak screen, after every lesson that grows it (and after an earn-back). The number ticks up like an
// odometer, the mascot celebrates, and the week reads Monday to Sunday: checks for lesson days, moons for rest days.
// Milestones (3, 7, 14, 30, 50, 100, 365) get the bigger party. Quiet mode keeps it calm: no sound, a softer pose.
// With "show my streak" off, this is the plain "days on the hill" screen.
export default function Lit() {
  useTitle("your streak");
  const { p, count, go, close } = useDone();
  const { derived, saved, today, setGoal } = useStore();
  const { day: companion } = useCompanionDay();
  const { friends } = useFriends();
  const quiet = companion.quiet;
  const st = saved.settings;
  const s = derived.streak;
  const on = st.streakOn !== false;
  const newDay = p.newDay === "1";
  const restored = p.restored === "1";
  const after = Number(p.streak) || s.streak;
  const grew = restored || (newDay && after > 0);
  const before = grew ? Math.min(Number(p.prev) || 0, after) : after;
  const milestone = Number(p.milestone) || 0;
  const firstDay = count === 1 && newDay;
  const goal = goalView(st.goal, { streak: after });
  const goalJustHit = !!goal && goal.reached && grew && before < goal.days;
  const [nextSet, setNextSet] = useState<number | null>(null);
  const reduce = useReducedMotion();

  // the party: a tick for each wheel turn, then the chime and a success buzz (quiet mode: just the buzz)
  const fired = useRef(false);
  useEffect(() => {
    if (!on || fired.current) return;
    fired.current = true;
    if (milestone) track("milestone", { n: milestone, kind: "streak" });
    if (restored) track("streak_earned_back", { n: after });
    if (!grew) return;
    const ticks = [setTimeout(() => { if (!quiet) play("tick"); tapHaptic(); }, 380), setTimeout(() => { if (!quiet) play(milestone || restored || goalJustHit ? "reward" : "complete"); successHaptic(); }, 1450)];
    return () => ticks.forEach(clearTimeout);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // the number's card pops when the wheels land; milestones pop bigger
  const pop = useSharedValue(1);
  useEffect(() => {
    if (!grew || reduce) return;
    pop.value = withDelay(1350, withSequence(withTiming(milestone ? 1.14 : 1.07, { duration: 160, easing: Easing.out(Easing.quad) }), withSpring(1, { damping: 7 })));
  }, [grew, reduce, milestone, pop]);
  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

  // when today's three are done and the lantern hasn't been lit yet, the lantern comes next
  const three = todaysThree({ doneToday: derived.doneToday, glow: st.glow, book: st.book, lanternOn: st.lanternOn, today });
  const next = () => (firstDay && !st.goal ? go("/done/goal") : three.all && !three.opened ? router.replace("/lantern") : close());

  if (!on) return <PlainLit count={count} newDay={newDay} onNext={next} close={close} visiting={st.active === "visit"} />;

  const golden = s.golden && after >= 7;
  const line = restored ? `earned back. your ${after} days are yours again.`
    : !newDay ? "today was already lit. this one was just for you."
    : milestone ? MILESTONE_WORDS[milestone]
    : firstDay ? "day one. every streak starts right here."
    : s.earnBack ? "a fresh start today. and your old streak isn't gone yet."
    : s.restedYesterday ? "a rest day held it for you. and now it grew."
    : golden && s.clean === 7 ? "seven straight days, no rest day needed. it's golden now."
    : "one more stone lit.";
  const earnBack = s.earnBack; // the first of today's two lessons: one more brings the old streak back
  const nextG = goal?.reached ? nextGoal(goal.days) : null;
  const together = friends.filter((f) => f.doneToday && newDay && FRIEND_MILESTONES.includes(f.together));

  return (
    <Screen close={close} footer={<Btn testID="continue" onPress={next}>continue</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Guy pose={quiet ? "thumbs" : milestone >= 7 || restored || goalJustHit ? "joy" : "celebrate"} h={milestone && !quiet ? 176 : 140} />
        {golden ? <View testID="golden-label" style={{ backgroundColor: GOLDEN, borderWidth: 1.5, borderColor: color.ink, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10, zIndex: 2 }}><Text style={[type.eyebrow(9), { color: color.ink }]}>golden streak</Text></View> : null}
        <Animated.View style={[{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: golden ? GOLDEN : "#fff", borderWidth: 2, borderColor: color.ink, paddingLeft: 24, paddingRight: 16, paddingVertical: 4, borderRadius: 28, marginTop: 10 }, popStyle]}>
          <Odometer from={before} to={after} size={milestone ? 104 : 92} />
          <Sun size={48} mood={grew ? "happy" : "calm"} />
        </Animated.View>
        <Text accessibilityRole="header" style={[type.h1(26), { marginTop: 10 }]}>{after === 1 ? "day streak" : "day streak!"}</Text>
        <Text testID="streak-line" style={[type.body(15), { marginTop: 6, textAlign: "center" }]}>{line}</Text>
        <Text style={[type.caption(12), { marginTop: 4, textAlign: "center" }]}>{STREAK_RULE}</Text>

        <View style={{ marginTop: 20 }}><WeekRow s={s} today={today} /></View>
        <View style={{ marginTop: 14 }}><RestBank n={s.rest} /></View>

        {/* the big milestones get a card to share: the number, the sun, the mascot, the path's name, a link. Nothing private. */}
        {milestone && SHARE_MILESTONES.includes(milestone) && newDay ? (
          <View style={{ marginTop: 16, width: "100%" }}><ShareCardButton testID="share-milestone" kind="gold" spec={{ kind: "streak", n: milestone, door: p.door || st.homeWing }} /></View>
        ) : null}

        {together.length > 0 && !quiet ? (
          // a friend streak milestone (7, 30, 100 days together), counted by the friends server after today's check-in
          <Card testID="friend-milestone" style={{ marginTop: 16, width: "100%", gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Sun size={30} mood="happy" />
              <Text style={[type.body(14), { flex: 1 }]}>{`${together[0].together} days together with ${together[0].nick}.`}</Text>
            </View>
            {/* the card itself never names the friend */}
            {SHARE_TOGETHER.includes(together[0].together) ? <ShareCardButton testID="share-together" spec={{ kind: "together", n: together[0].together, door: st.homeWing }} /> : null}
          </Card>
        ) : null}
        {earnBack && !quiet ? (
          <Card style={{ marginTop: 16, width: "100%", gap: 8 }}>
            <Text style={[type.eyebrow(8), { color: color.ink }]}>earn your streak back · {earnBack.lessonsToday} of {earnBack.need} today</Text>
            <Text style={type.body(14)}>one more lesson today and your {earnBack.lost}-day streak comes back.</Text>
            <Btn testID="earn-back-more" kind="gold" onPress={() => router.replace({ pathname: "/session/[door]/[day]", params: { door: p.door, day: p.day } })}>one more lesson</Btn>
          </Card>
        ) : goal && goalJustHit ? (
          <Card testID="goal-hit" style={{ marginTop: 16, width: "100%", gap: 8, backgroundColor: GOLDEN }}>
            <Text style={[type.eyebrow(8), { color: color.ink }]}>goal reached</Text>
            <Text style={{ fontFamily: font.display[800], fontSize: 18, color: color.ink }}>you hit your {goal.days}-day goal.</Text>
            {nextG && !nextSet ? (
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                <Btn testID="goal-next" onPress={() => { setGoal(nextG); setNextSet(nextG); track("goal_set", { days: nextG, next: true }); }}>{`next: ${nextG} days`}</Btn>
              </View>
            ) : nextSet ? <Text style={type.body(14)}>{`${nextSet} days it is. see you tomorrow.`}</Text> : null}
          </Card>
        ) : goal && !goal.reached ? (
          <View testID="goal-progress" style={{ marginTop: 16, width: "100%" }} accessibilityLabel={`your goal: ${goal.done} of ${goal.days} days`}>
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Text style={[type.eyebrow(8), { color: color.ink }]}>your goal</Text>
              <Text style={type.eyebrow(8)}>{goal.done} of {goal.days} days</Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: color.line, marginTop: 6, overflow: "hidden" }}>
              <View style={{ width: `${(goal.done / goal.days) * 100}%`, height: 10, borderRadius: 5, backgroundColor: color.ink }} />
            </View>
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

/** "show my streak" off: the lifetime count only, the way the app used to say it. */
function PlainLit({ count, newDay, onNext, close, visiting }: { count: number; newDay: boolean; onNext: () => void; close: () => void; visiting: boolean }) {
  return (
    <Screen close={close} footer={<Btn testID="continue" onPress={onNext}>continue</Btn>}>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Guy pose="cheer" h={150} />
        <View style={{ backgroundColor: "#fff", borderWidth: 2, borderColor: color.ink, paddingHorizontal: 26, paddingTop: 6, borderRadius: 28, marginTop: 10, marginBottom: 14 }}>
          <Text accessibilityLabel={`${count} ${count === 1 ? "day" : "days"} on the hill`} style={{ fontFamily: font.display[800], fontSize: 110, lineHeight: 112, letterSpacing: -5, color: color.ink }}>{count}</Text>
        </View>
        <Text style={type.h1(26)}>{count === 1 ? "day" : "days"} on the hill.</Text>
        <Text style={[type.body(), { marginTop: 8, textAlign: "center" }]}>{!newDay ? "today was already lit. this one was just for you." : visiting ? "your days come with you. any door, one count." : "another stone lit."}</Text>
      </View>
    </Screen>
  );
}

