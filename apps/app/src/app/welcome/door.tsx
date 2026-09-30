import { track } from "@/lib/analytics";
import { useTitle } from "@/lib/title";
import { router } from "expo-router";
import { useState, useEffect, type ReactNode } from "react";
import { Text, View } from "react-native";
import { DOORS, label } from "@ih/content";
import { PERSON } from "@/content/intake";
import { isDoor, youAnswers } from "@/lib/onboard";
import { useStore } from "@/lib/store";
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
  useTitle("pick a door");
  const { saved } = useStore();
  const { stance, raisedIn, learning } = youAnswers(saved.settings.profile);
  const home = stance === "partner" ? (isDoor(learning) ? learning : null) : isDoor(raisedIn) ? raisedIn : null;
  const mode = stance === "partner" ? (home ? "partner" : "closest")
    : stance === "practice" ? (home ? "yours" : "closest")
    : stance === "unsure" ? (home ? "roots" : "own")
    : stance === "left" ? (home ? "left" : "own")
    : stance ? "own" : "open";
  // one door shown (the faith you're learning, or your own): it's already chosen, so "continue" works straight away
  const single = (mode === "partner" || mode === "yours") && home ? home : null;
  const [door, setDoor] = useState<string | null>(single);
  useEffect(() => { if (single) setDoor((d) => d ?? single); }, [single]);
  const [more, setMore] = useState(false);
  const grid = (skip: string | null) => (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-between" }} accessibilityRole="radiogroup">
      {TRADITIONS.filter((w) => w !== skip).map((w) => <DoorTile key={w} door={w} on={door === w} onPress={() => setDoor(w)} />)}
    </View>
  );
  const own = (size: "hero" | "soft", eyebrow?: string) => <OwnPathCard size={size} eyebrow={eyebrow} on={door === "SPIRITUAL"} onPress={() => setDoor("SPIRITUAL")} />;
  const or = (t: string) => <Eyebrow style={{ textAlign: "center", marginTop: 4 }}>{t}</Eyebrow>;
  const roots = (eyebrow: string) => (
    <BigDoorCard door={home!} eyebrow={eyebrow} a11y={`${label(home!)}, with fresh eyes`} on={door === home} onPress={() => setDoor(home!)}
      line={`taught as history, stories and practice. no belief required — bring your questions.`} />
  );
  // Folded until asked for: the rest of the doors, for people whose screen leads with their own tradition.
  const folded = (children: ReactNode, text = "a different door ›") => (more ? <>{children}</> : (
    <View style={{ alignItems: "center" }}><Link onPress={() => setMore(true)}>{text}</Link></View>
  ));

  let host: string;
  let body: ReactNode;
  if (mode === "partner") {
    host = `Here's ${label(home!)}, taught the way the people who practice it understand it. No belief asked of you.`;
    body = <>
      <BigDoorCard door={home!} eyebrow="the faith you're learning" a11y={`${label(home!)}, the faith you're learning`} on={door === home} onPress={() => setDoor(home!)}
        line="what things mean to the people who practice them — the words, the holidays, the table." />
      {folded(<>{or("every door")}{grid(home)}{own("soft")}</>)}
    </>;
  } else if (mode === "yours") {
    host = `Welcome in. Here's your door.`;
    body = <>
      <BigDoorCard door={home!} eyebrow="your door" on={door === home} onPress={() => setDoor(home!)} />
      {folded(<>{or("every door")}{grid(home)}{own("soft")}</>)}
    </>;
  } else if (mode === "roots") {
    host = `You grew up ${PERSON[home!] || label(home!)}. We can walk it with fresh eyes — no belief required. Or there's a path built just around you.`;
    body = <>
      {roots("your roots, with fresh eyes")}
      {or("or, if you'd rather")}
      {own("soft")}
      {folded(<>{or("every door")}{grid(home)}</>, "see every door ›")}
    </>;
  } else if (mode === "left") {
    host = `You grew up ${PERSON[home!] || label(home!)} and stepped away — that's allowed. Nothing here asks you to go back. Two ways in, both yours to pick:`;
    body = <>
      {own("soft")}
      {or("or")}
      {roots("your roots, with fresh eyes")}
      {folded(<>{or("every door")}{grid(home)}</>, "see every door ›")}
    </>;
  } else if (mode === "own") {
    host = stance === "many" ? "Exploring more than one? Then this was made for you. Every door is open too."
      : stance === "spiritual" ? "Spiritual, not religious? Then start here. Every door is open too."
      : stance === "curious" ? "Curious is a great place to start. Here's where we'd begin — and every door is open too."
      : "Here's where we'd begin — and every door is open too.";
    body = <>
      {own("hero")}
      {or("or walk one door")}
      {grid(null)}
    </>;
  } else {
    host = mode === "closest" ? "Pick the door that fits best, or make a path of your own. More traditions are on the way." : "Which door is yours? You can change it any time — your days come with you.";
    body = <>
      {grid(null)}
      {or("or")}
      {own(mode === "closest" ? "soft" : "hero")}
    </>;
  }

  return (
    <WelcomeFrame step={2} door={door} footer={<Btn testID="door-continue" disabled={!door} onPress={() => router.push({ pathname: "/welcome/trail", params: { door: door! } })}>{door ? (door === "SPIRITUAL" ? "Start my path" : `Open ${label(door)}`) : "Pick a door"}</Btn>}>
      <Host pose={mode === "own" ? "globe" : "point"}>{host}</Host>
      {body}
      <Text style={[type.caption(), { textAlign: "center" }]}>more traditions on the way. change your door any time — your days come with you.</Text>
      {mode === "open" && !saved.settings.profile ? <View style={{ alignItems: "center" }}><Link onPress={() => router.push("/welcome/you")}>not sure? tell us about you first ›</Link></View> : null}
    </WelcomeFrame>
  );
}
