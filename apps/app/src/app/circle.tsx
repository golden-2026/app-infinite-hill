// Joining a circle: from a share link (/circle?c=K7M2QX) or a code typed in. The preview (name, door, leader, how many
// people, the leader's welcome) comes from the server. Someone still signing up joins and starts straight on the
// circle's door ("you're joining <circle> with <leader>"); everyone else lands on Together. Nickname is opt-in; a
// parent with children at the family table can join on the family's behalf (children never join themselves).
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, TextInput, View } from "react-native";
import { icon } from "@ih/content";
import { useTitle } from "@/lib/title";
import { useStore } from "@/lib/store";
import { friendsState } from "@/lib/friends";
import { CODE_RE, cleanLine, joinCircle, keepPending, normalizeCode, peekCircle, prettyCode, useCircles, type Peek } from "@/lib/circles";
import { Btn, Card, Eyebrow, Guy, Link, Screen, color, font, toast, type } from "@/ui";
import { Switch, countWords, failWords } from "@/ui/circles";
import { doorLabel, t } from "@/i18n";

export default function JoinCircle() {
  useTitle(t("groups.join.title"));
  const { saved, today } = useStore();
  const onboarded = !!saved.settings.onboarded;
  const hasKids = saved.settings.kids.length > 0;
  const { c: raw } = useLocalSearchParams<{ c?: string }>();
  const fromLink = normalizeCode(typeof raw === "string" ? raw : "");
  const [code, setCode] = useState(fromLink);
  const [peek, setPeek] = useState<Peek | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showNick, setShowNick] = useState(false);
  const [nick, setNick] = useState(friendsState().nick || "");
  const [family, setFamily] = useState(false);
  const mine = useCircles().circles;
  const already = peek ? mine.some((c) => c.code === normalizeCode(code)) : false;

  const find = async (c = code) => {
    setMsg(null);
    setPeek(null);
    if (!CODE_RE.test(normalizeCode(c))) { setMsg(failWords("missing")); return; }
    setBusy(true);
    const r = await peekCircle(c);
    setBusy(false);
    if (r.ok) setPeek(r.circle); else setMsg(failWords(r.why));
  };
  useEffect(() => { if (fromLink) find(fromLink); }, [fromLink]); // eslint-disable-line react-hooks/exhaustive-deps

  const leave = () => (router.canGoBack() ? router.back() : router.replace(onboarded ? "/together" : "/"));
  const join = async () => {
    if (!peek) return;
    setBusy(true);
    setMsg(null);
    const r = await joinCircle(code, { nick: showNick ? cleanLine(nick, 24) || null : null, family: hasKids && family }, today);
    setBusy(false);
    if (!onboarded) {
      // still signing up: straight on to the circle's door; offline, the join waits and is tried again later
      if (!r.ok && r.why === "offline") keepPending(code);
      else if (!r.ok) { setMsg(failWords(r.why)); return; }
      router.replace({ pathname: "/welcome/trail", params: { door: peek.door } });
      return;
    }
    if (r.ok) { toast(t("groups.join.joined", { circle: peek.name })); router.replace("/together"); }
    else setMsg(failWords(r.why));
  };

  const footer = peek ? (
    already ? <Btn kind="ink" onPress={() => router.replace("/together")} testID="circle-to-together">{t("groups.join.toTogether")}</Btn>
      : <Btn kind="ink" testID="circle-join-go" disabled={busy || (showNick && !cleanLine(nick, 24))} onPress={join}>
          {busy ? t("groups.join.busy") : onboarded ? t("groups.join.go") : t("groups.join.goStart", { door: doorLabel(peek.door) })}
        </Btn>
  ) : (
    <Btn kind="ink" testID="circle-find" disabled={busy || !CODE_RE.test(normalizeCode(code))} onPress={() => find()}>{busy ? t("groups.join.looking") : t("groups.join.find")}</Btn>
  );

  return (
    <Screen scroll close={leave} title={peek ? undefined : t("groups.join.title")} footer={footer} contentStyle={{ gap: 14 }}>
      {!peek ? (
        <View style={{ gap: 10 }}>
          <Text style={[type.body(14), { color: color.mute }]}>{t("groups.join.codeAsk")}</Text>
          <TextInput testID="circle-code-input" value={code} onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9 -]/g, "").slice(0, 8))} placeholder={t("groups.join.codePlaceholder")} placeholderTextColor={color.mute}
            autoCapitalize="characters" autoCorrect={false} autoComplete="off" maxLength={8} accessibilityLabel={t("groups.join.codeA11y")} returnKeyType="go" onSubmitEditing={() => find()}
            style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 18, fontFamily: font.display[800], fontSize: 22, letterSpacing: 3, textAlign: "center", backgroundColor: "#fff", color: color.ink }} />
          {msg ? <Text accessibilityLiveRegion="polite" testID="circle-msg" style={[type.body(13), { color: color.ink, textAlign: "center" }]}>{msg}</Text> : null}
          <View style={{ alignItems: "center", marginTop: 8 }}><Guy pose="wave" h={120} /></View>
        </View>
      ) : (
        <>
          <Text testID="circle-joining" accessibilityRole="header" style={[type.h1(26), { marginTop: 8 }]}>
            {already ? t("groups.join.already") : t("groups.join.joining", { circle: peek.name, leader: peek.leaderName })}
          </Text>
          <Card testID="circle-preview">
            <Eyebrow>{t("groups.join.eyebrow")}</Eyebrow>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 }}>
              <View accessible={false} style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: icon(peek.door).tint, alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: color.ink }}>
                <Text style={{ fontFamily: font.display[800], fontSize: 22, color: "#fff" }}>{(peek.name.trim()[0] || "·").toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: font.display[800], fontSize: 19, color: color.ink }}>{peek.name}</Text>
                <Text style={[type.body(13), { color: color.mute }]}>{t("groups.with", { leader: peek.leaderName })} · {t("groups.join.walks", { door: doorLabel(peek.door) })}</Text>
                <Text testID="circle-preview-count" style={[type.body(13), { color: color.ink, fontFamily: font.text[600], marginTop: 2 }]}>{countWords(peek.count)}</Text>
              </View>
            </View>
            {peek.welcome ? (
              <View style={{ marginTop: 12, backgroundColor: "#FFFBE0", borderRadius: 16, padding: 14 }}>
                <Text style={[type.eyebrow(8), { color: color.mute }]}>{t("groups.join.welcome", { leader: peek.leaderName })}</Text>
                <Text testID="circle-welcome" style={{ fontFamily: font.text[500], fontSize: 15, color: color.ink, marginTop: 6, lineHeight: 21 }}>“{peek.welcome}”</Text>
              </View>
            ) : null}
          </Card>
          {already ? null : (
            <>
              <View>
                <Switch testID="circle-join-nick" on={showNick} onPress={() => setShowNick(!showNick)} label={t("groups.join.nickAsk")} />
                <Text style={[type.body(12), { color: color.mute }]}>{t("groups.join.nickBody")}</Text>
                {showNick ? (
                  <TextInput testID="circle-join-nick-input" value={nick} onChangeText={(v) => setNick(v.slice(0, 24))} maxLength={24} placeholder={t("groups.join.nickPlaceholder")} placeholderTextColor={color.mute}
                    accessibilityLabel={t("groups.join.nickA11y")} autoCorrect={false}
                    style={{ marginTop: 8, borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 12, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff", color: color.ink }} />
                ) : null}
              </View>
              {onboarded && hasKids ? (
                <View>
                  <Switch testID="circle-join-family" on={family} onPress={() => setFamily(!family)} label={t("groups.join.family")} />
                  <Text style={[type.body(12), { color: color.mute }]}>{t("groups.join.familyBody")}</Text>
                </View>
              ) : null}
              {msg ? <Text accessibilityLiveRegion="polite" testID="circle-msg" style={[type.body(13), { color: color.ink }]}>{msg}</Text> : null}
              <Text style={[type.body(11), { color: color.mute }]}>{t("groups.join.privacy")}{onboarded ? "" : ` ${t("groups.join.later")}`}</Text>
            </>
          )}
          {fromLink ? null : <View style={{ alignItems: "flex-start" }}><Link onPress={() => { setPeek(null); setMsg(null); }}>{`‹ ${prettyCode(normalizeCode(code))}`}</Link></View>}
          <View style={{ alignItems: "center" }}><Link onPress={leave} style={{ color: color.mute }}>{t("groups.join.notNow")}</Link></View>
        </>
      )}
    </Screen>
  );
}
