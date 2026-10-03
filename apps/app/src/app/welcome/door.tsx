import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState, useEffect, type ReactNode } from "react";
import { Text, View } from "react-native";
import { DOORS, label } from "@ih/content";
import { PERSON } from "@/content/intake";
import { isDoor, profileFor, youAnswers } from "@/lib/onboard";
import { afterDoor } from "@/lib/lane";
import { useStore } from "@/lib/store";
import { doorLabel, isEs, t } from "@/i18n";
import { Btn, Eyebrow, Link, type } from "@/ui";
import { BigDoorCard, DoorTile, OwnPathCard } from "@/ui/door-cards";
import { Host } from "@/ui/host";
import { WelcomeFrame } from "@/ui/welcome-frame";

// The door screen, curated by what they told us on the first step (welcome/you). It never chooses for anyone, and
// every door is always one tap away:
//   practices a tradition we have      → only their door ("your door"); other doors stay folded until they ask
//   learning a partner's/family's faith → that faith ("the faith you're learning"); other doors folded
//   grew up in one, not sure           → their roots with fresh eyes, and "my own path" offered softly beside it
//   grew up in one and left it         → "my own path" and their roots with fresh eyes, both offered softly
//   no religion / exploring / spiritual → "my own path" as the hero, "or walk one door" below
//   nothing told (a deep link)          → every door, "my own path" as a big card, and a way to tell us first
const TRADITIONS: string[] = DOORS.map(([, w]: [string, string]) => w).filter((w: string) => w !== "SPIRITUAL");

export default function PickDoor() {
  useEffect(() => { track("onboard_step", { step: "door" }); }, []);
  useTitle(t("onboarding.door.title"));
  const { saved, update, today } = useStore();
  const why = saved.settings.profile?.answers.why;
  const { stance, raisedIn, learning } = youAnswers(saved.settings.profile);
  const home = stance === "partner" ? (isDoor(learning) ? learning : null) : isDoor(raisedIn) ? raisedIn : null;
  const mode = stance === "partner" ? (home ? "partner" : "closest")
    : stance === "practice" ? (home ? "yours" : "closest")
    : stance === "unsure" ? (home ? "roots" : "own")
    : stance === "left" ? (home ? "left" : "own")
    : stance ? "own" : "open";
  // one door shown (the faith you're learning, or your own): it's already chosen, so "continue" works straight away
  // ...and someone who said "spiritual, not religious" or "just curious" finds "my own path" already chosen (every door
  // stays one tap away)
  const single = (mode === "partner" || mode === "yours") && home ? home : stance === "spiritual" || (why === "curious" && mode === "own") ? "SPIRITUAL" : null;
  const [door, setDoor] = useState<string | null>(single);
  useEffect(() => { if (single) setDoor((d) => d ?? single); }, [single]);
  const [more, setMore] = useState(false);
  const grid = (skip: string | null) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }} accessibilityRole="radiogroup">
      {TRADITIONS.filter((w) => w !== skip).map((w) => <DoorTile key={w} door={w} on={door === w} onPress={() => setDoor(w)} />)}
    </View>
  );
  const own = (size: "hero" | "soft", eyebrow?: string) => <OwnPathCard size={size} eyebrow={eyebrow} on={door === "SPIRITUAL"} onPress={() => setDoor("SPIRITUAL")} />;
  const or = (s: string) => <Eyebrow style={{ textAlign: "center", marginTop: 4 }}>{s}</Eyebrow>;
  const roots = (eyebrow: string) => (
    <BigDoorCard door={home!} eyebrow={eyebrow} a11y={t("onboarding.door.freshA11y", { door: doorLabel(home!) })} on={door === home} onPress={() => setDoor(home!)}
      line={t("onboarding.door.freshLine")} />
  );
  // Folded until asked for: the rest of the doors, for people whose screen leads with their own tradition.
  const folded = (children: ReactNode, text = t("onboarding.door.differentDoor")) => (more ? <>{children}</> : (
    <View style={{ alignItems: "center" }}><Link onPress={() => setMore(true)}>{text}</Link></View>
  ));
  // "You grew up Jewish" in English; Spanish says "creciste en el judaísmo" (the door's name, no gendered adjective).
  const grewUp = { faith: home ? (isEs() ? doorLabel(home) : PERSON[home] || label(home)) : "" };

  let host: string;
  let body: ReactNode;
  if (mode === "partner") {
    host = t("onboarding.door.partnerHost", { door: doorLabel(home!) });
    body = <>
      <BigDoorCard door={home!} eyebrow={t("onboarding.door.partnerEyebrow")} a11y={t("onboarding.door.partnerA11y", { door: doorLabel(home!) })} on={door === home} onPress={() => setDoor(home!)}
        line={t("onboarding.door.partnerLine")} />
      {folded(<>{or(t("onboarding.door.every"))}{grid(home)}{own("soft")}</>)}
    </>;
  } else if (mode === "yours") {
    host = t("onboarding.door.yoursHost");
    body = <>
      <BigDoorCard door={home!} eyebrow={t("onboarding.door.yoursEyebrow")} on={door === home} onPress={() => setDoor(home!)} />
      {folded(<>{or(t("onboarding.door.every"))}{grid(home)}{own("soft")}</>)}
    </>;
  } else if (mode === "roots") {
    host = t("onboarding.door.rootsHost", grewUp);
    body = <>
      {roots(t("onboarding.door.rootsEyebrow"))}
      {or(t("onboarding.door.orRather"))}
      {own("soft")}
      {folded(<>{or(t("onboarding.door.every"))}{grid(home)}</>, t("onboarding.door.seeEvery"))}
    </>;
  } else if (mode === "left") {
    host = t("onboarding.door.leftHost", grewUp);
    body = <>
      {own("soft")}
      {or(t("onboarding.door.or"))}
      {roots(t("onboarding.door.rootsEyebrow"))}
      {folded(<>{or(t("onboarding.door.every"))}{grid(home)}</>, t("onboarding.door.seeEvery"))}
    </>;
  } else if (mode === "own") {
    host = stance === "many" ? t("onboarding.door.ownMany")
      : stance === "spiritual" ? t("onboarding.door.ownSpiritual")
      : stance === "curious" ? t("onboarding.door.ownCurious")
      : t("onboarding.door.ownDefault");
    body = <>
      {own("hero")}
      {or(t("onboarding.door.orWalkOne"))}
      {grid(null)}
    </>;
  } else {
    host = mode === "closest" ? t("onboarding.door.closestHost") : t("onboarding.door.openHost");
    body = <>
      {grid(null)}
      {or(t("onboarding.door.or"))}
      {own(mode === "closest" ? "soft" : "hero")}
    </>;
  }

  // The full welcome walks the map next. The gentle, light and quick ways in (lib/lane.ts) skip the map, the check and
  // the summary, so the door's profile is made here, carrying what the first step told us.
  const go = (d: string) => {
    const next = afterDoor(why);
    if (next === "trail") return router.push({ pathname: "/welcome/trail", params: { door: d } });
    update({ profile: profileFor(saved.settings.profile, d, today) });
    router.push({ pathname: next === "ready" ? "/welcome/ready" : "/welcome/voice", params: { door: d } });
  };

  return (
    <WelcomeFrame step={2} door={door} footer={<Btn testID="door-continue" disabled={!door} onPress={() => go(door!)}>{door ? (door === "SPIRITUAL" ? t("onboarding.startMyPath") : t("onboarding.door.open", { door: doorLabel(door) })) : t("onboarding.door.pick")}</Btn>}>
      <Host pose={mode === "own" ? "globe" : "point"}>{host}</Host>
      {body}
      <Text style={[type.caption(), { textAlign: "center" }]}>{t("onboarding.door.caption")}</Text>
      {mode === "open" && !saved.settings.profile ? <View style={{ alignItems: "center" }}><Link onPress={() => router.push("/welcome/you")}>{t("onboarding.door.tellFirst")}</Link></View> : null}
    </WelcomeFrame>
  );
}
