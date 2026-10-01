import { useTitle } from "@/lib/title";
// The waitlist (invite-only launch). Only reachable while the server's switch is on: with it off, this goes straight
// to the usual welcome. Join with an email and a door → your real place in that door's line and your own link; each
// friend who joins with it moves you up (the rule is spelled out, and the numbers all come from the server).
import { DOORS } from "@ih/content";
import { Redirect, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { joinWaitlist, leaveWaitlist, myPlace, rememberRef, useGate, useInvite, type Place } from "@/lib/waitlist";
import { cleanCode } from "@/lib/invite-gate";
import { useStore } from "@/lib/store";
import { doorLabel, formatNumber, t } from "@/i18n";
import { Body, Btn, Eyebrow, Link, Opt, Screen, Sun, color, confirmSheet, font, toast, type } from "@/ui";
import { shareOrCopy } from "@/ui/invites";

const input = { borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff", color: color.ink } as const;

function Scarcity() {
  const s = useInvite().status;
  return <Text testID="waitlist-scarcity" style={[type.body(12.5), { color: "#6b6448", fontFamily: font.text[600] }]}>{s.full ? t("waitlist.full") : t("waitlist.scarcity", { cap: formatNumber(s.cap ?? 10_000) })}</Text>;
}

function CodeEntry() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  if (!open) return <Link onPress={() => setOpen(true)}>{t("waitlist.haveCode")}</Link>;
  const go = () => { const c = cleanCode(code); if (!c) { setErr(t("waitlist.invite.bad")); return; } router.push({ pathname: "/invite", params: { code: c } }); };
  return (
    <View style={{ gap: 8 }}>
      <TextInput testID="code-input" value={code} onChangeText={setCode} placeholder={t("waitlist.invite.code")} accessibilityLabel={t("waitlist.invite.codeA11y")} autoCapitalize="none" autoCorrect={false} maxLength={12} style={input} onSubmitEditing={go} />
      {err ? <Text accessibilityLiveRegion="polite" style={[type.body(13), { color: "#a12a00" }]}>{err}</Text> : null}
      <Btn kind="ghost" onPress={go}>{t("waitlist.invite.enter")}</Btn>
    </View>
  );
}

function PlaceView({ place, onLeft }: { place: Place; onLeft: () => void }) {
  if (place.state === "invited" && place.inviteCode) {
    return (
      <View style={{ gap: 14 }}>
        <Sun size={64} mood="happy" />
        <Eyebrow>{doorLabel(place.door)}</Eyebrow>
        <Text accessibilityRole="header" style={type.title()}>{t("waitlist.invited")}</Text>
        <Body>{t("waitlist.invitedBody")}</Body>
        <Btn testID="come-in" onPress={() => router.push({ pathname: "/invite", params: { code: place.inviteCode! } })}>{t("waitlist.comeIn")}</Btn>
      </View>
    );
  }
  const refs = place.refs ?? 0;
  const rule = place.rule ?? { places: 100, cap: 10 };
  return (
    <View style={{ gap: 12 }}>
      <Eyebrow>{t("waitlist.inLine")}</Eyebrow>
      <Text testID="waitlist-position" accessibilityRole="header" accessibilityLiveRegion="polite" style={type.title()}>{t("waitlist.position", { n: formatNumber(place.position ?? 0), door: doorLabel(place.door) })}</Text>
      <Body style={{ color: color.mute }}>{t("waitlist.waiting", { count: place.waiting ?? 1 })}</Body>
      <Body style={{ fontFamily: font.text[600] }}>{t("waitlist.moveUp", { places: rule.places, cap: rule.cap })}</Body>
      <View style={{ backgroundColor: "#F2F2EC", borderRadius: 14, padding: 12, gap: 4 }}>
        <Eyebrow size={8}>{t("waitlist.yourLink")}</Eyebrow>
        <Text testID="waitlist-link" selectable style={[type.body(13), { color: color.ink }]}>{place.link}</Text>
      </View>
      <View style={{ flexDirection: "row", gap: 10 }}>
        <View style={{ flex: 1 }}><Btn kind="ink" onPress={async () => { if ((await shareOrCopy(place.link || "", true)) === "copied") toast(t("waitlist.copied")); }}>{t("waitlist.copy")}</Btn></View>
        <View style={{ flex: 1 }}><Btn kind="ghost" onPress={async () => { if ((await shareOrCopy(t("waitlist.shareText", { link: place.link || "" }))) === "copied") toast(t("waitlist.copied")); }}>{t("waitlist.share")}</Btn></View>
      </View>
      <Text testID="waitlist-refs" style={[type.body(12.5), { color: color.mute }]}>{refs ? t("waitlist.refs", { count: refs }) : t("waitlist.refsNone")}</Text>
      <Scarcity />
      <View style={{ gap: 12, marginTop: 6 }}>
        <CodeEntry />
        <Link style={{ color: color.mute, fontSize: 11 }} onPress={async () => {
          if (!(await confirmSheet({ title: t("waitlist.leaveTitle"), body: t("waitlist.leaveBody"), confirm: t("waitlist.leaveConfirm"), cancel: t("waitlist.keep"), destructive: true }))) return;
          if (await leaveWaitlist()) { toast(t("waitlist.left")); onLeft(); } else toast(t("waitlist.offline"));
        }}>{t("waitlist.leave")}</Link>
      </View>
    </View>
  );
}

export default function Waitlist() {
  useTitle(t("waitlist.title"));
  const { ref, door: doorParam } = useLocalSearchParams<{ ref?: string; door?: string }>();
  const { saved } = useStore();
  const g = useGate(!!saved.settings.onboarded);
  const s = useInvite();
  const [place, setPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(!!s.wait);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [door, setDoor] = useState<string | null>(typeof doorParam === "string" && DOORS.some(([, w]) => w === doorParam) ? doorParam : null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (ref) rememberRef(ref); }, [ref]);
  useEffect(() => {
    if (!s.wait) { setLoading(false); return; }
    let live = true;
    myPlace().then((p) => { if (!live) return; setLoading(false); if (p && p !== "gone") setPlace(p); else if (!p) setErr(t("waitlist.offline")); });
    return () => { live = false; };
  }, [s.wait?.key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (g === "open") return <Redirect href={saved.settings.onboarded ? "/today" : "/welcome"} />;
  if (g === "asking" || loading) return <Screen center><Sun size={56} /></Screen>;

  if (place) return <Screen scroll><PlaceView place={place} onLeft={() => setPlace(null)} /></Screen>;

  const submit = async () => {
    if (!/^\S+@\S+\.\S{2,}$/.test(email.trim())) { setErr(t("waitlist.badEmail")); return; }
    if (!door) { setErr(t("waitlist.badDoor")); return; }
    setBusy(true); setErr(null);
    const r = await joinWaitlist({ email, door, name });
    setBusy(false);
    if (r.ok) setPlace(r.place);
    else setErr(t(({ email: "waitlist.badEmail", door: "waitlist.badDoor", already: "waitlist.already", slow: "waitlist.slow", offline: "waitlist.offline" } as const)[r.reason]));
  };
  return (
    <Screen scroll footer={<Btn testID="join-waitlist" disabled={busy} onPress={submit}>{busy ? t("waitlist.going") : t("waitlist.go")}</Btn>}>
      <View style={{ gap: 12 }}>
        <Eyebrow>{t("waitlist.eyebrow")}</Eyebrow>
        <Text accessibilityRole="header" style={type.title()}>{t("waitlist.title")}</Text>
        <Body style={{ color: color.mute }}>{s.ref ? t("waitlist.refNote") : t("waitlist.lede")}</Body>
        <TextInput testID="waitlist-email" value={email} onChangeText={setEmail} placeholder={t("waitlist.email")} accessibilityLabel={t("waitlist.emailA11y")} autoCapitalize="none" autoComplete="email" keyboardType="email-address" inputMode="email" maxLength={254} style={input} />
        <Eyebrow size={8} style={{ marginTop: 4 }}>{t("waitlist.door")}</Eyebrow>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }} accessibilityRole="radiogroup">
          {DOORS.map(([, w]: [string, string]) => (
            <View key={w} style={{ width: "48%" }}><Opt testID={`waitlist-door-${w}`} on={door === w} onPress={() => setDoor(w)}>{doorLabel(w)}</Opt></View>
          ))}
        </View>
        <TextInput testID="waitlist-name" value={name} onChangeText={setName} placeholder={t("waitlist.name")} accessibilityLabel={t("waitlist.name")} autoComplete="given-name" maxLength={40} style={input} />
        {err ? <Text testID="waitlist-error" accessibilityLiveRegion="polite" style={[type.body(13), { color: "#a12a00", fontFamily: font.text[600] }]}>{err}</Text> : null}
        <Scarcity />
        <Text style={[type.body(11.5), { color: color.mute }]}>{t("waitlist.privacy")}</Text>
        <View style={{ gap: 12, marginTop: 4 }}>
          <CodeEntry />
          <Link onPress={() => router.push("/sign-in")}>{t("waitlist.beenHere")}</Link>
        </View>
      </View>
    </Screen>
  );
}
