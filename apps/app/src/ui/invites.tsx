// The members' invites card (under You), shown only while the server's invite-only switch is on. Each member has a few
// links that each let one person in (api/waitlist.js). Someone who came in appears by a nickname only if they chose to.
// Someone who was walking before the switch can claim invites of their own (the server caps how many such claims).
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Platform, Share, Text, View } from "react-native";
import { claimInvites, myInvites, useInvite, type MyInvite } from "@/lib/waitlist";
import { showInvitesCard } from "@/lib/invite-gate";
import { useStore } from "@/lib/store";
import { t } from "@/i18n";
import { Btn, Card, Eyebrow, Link, color, font, toast, type } from "@/ui";

/** Share sheet where there is one; otherwise copy the text. Returns "shared" | "copied" | "failed". */
export async function shareOrCopy(message: string, copyOnly = false): Promise<"shared" | "copied" | "failed"> {
  try {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (Platform.OS === "web") {
      if (!copyOnly && nav?.share) { await nav.share({ text: message }); return "shared"; }
      await nav?.clipboard?.writeText(message);
      return "copied";
    }
    await Share.share({ message });
    return "shared";
  } catch {
    return "failed";
  }
}

function InviteRow({ inv, n }: { inv: MyInvite; n: number }) {
  return (
    <View testID="invite-row" style={{ paddingVertical: 10, borderTopWidth: n > 1 ? 1 : 0, borderTopColor: color.line, gap: 6 }}>
      <Text style={[type.body(14), { color: inv.used ? color.mute : color.ink, fontFamily: font.text[600] }]}>
        {inv.used ? (inv.nick ? t("waitlist.card.joinedNick", { n, nick: inv.nick }) : t("waitlist.card.joined", { n })) : t("waitlist.card.free", { n })}
      </Text>
      {inv.used ? null : (
        <View style={{ flexDirection: "row", gap: 16 }}>
          <Link label={`${t("waitlist.card.copy")} ${n}`} onPress={async () => { if ((await shareOrCopy(inv.link, true)) === "copied") toast(t("waitlist.card.copied")); }}>{t("waitlist.card.copy")}</Link>
          <Link label={`${t("waitlist.card.share")} ${n}`} onPress={async () => { const r = await shareOrCopy(t("waitlist.card.shareText", { link: inv.link })); if (r === "copied") toast(t("waitlist.card.copied")); }}>{t("waitlist.card.share")}</Link>
        </View>
      )}
    </View>
  );
}

export function InvitesCard() {
  const s = useInvite();
  const { saved } = useStore();
  const [list, setList] = useState<{ invites: MyInvite[]; left: number } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const member = s.member?.memberId ?? null;
  useFocusEffect(useCallback(() => {
    let live = true;
    if (member) myInvites().then((r) => { if (!live) return; setList(r); setMsg(r ? null : t("waitlist.card.offline")); });
    return () => { live = false; };
  }, [member]));
  if (!showInvitesCard(s.status, !!saved.settings.onboarded)) return null;
  return (
    <Card testID="invites-card">
      <Eyebrow>{t("waitlist.card.eyebrow")}</Eyebrow>
      {member ? (
        <>
          <Text style={[type.serif(19), { marginTop: 4 }]}>{list ? (list.left ? t("waitlist.card.left", { count: list.left }) : t("waitlist.card.none")) : "…"}</Text>
          <Text style={[type.body(12.5), { color: color.mute, marginTop: 4, marginBottom: 4 }]}>{t("waitlist.card.body")}</Text>
          {list?.invites.map((inv, i) => <InviteRow key={inv.code} inv={inv} n={i + 1} />)}
          <Text style={[type.body(11), { color: color.mute, marginTop: 8 }]}>{t("waitlist.card.privacy")}</Text>
        </>
      ) : (
        <View style={{ gap: 10, marginTop: 4 }}>
          <Text style={[type.body(13), { color: color.ink }]}>{t("waitlist.card.claimBody")}</Text>
          <Btn kind="ink" testID="claim-invites" disabled={busy} onPress={async () => {
            setBusy(true);
            const r = await claimInvites();
            setBusy(false);
            if (r === "ok") { setList(await myInvites()); setMsg(null); }
            else setMsg(r === "full" ? t("waitlist.card.claimFull") : r === "slow" ? t("waitlist.slow") : t("waitlist.card.offline"));
          }}>{t("waitlist.card.claim")}</Btn>
        </View>
      )}
      {msg ? <Text accessibilityLiveRegion="polite" style={[type.body(12), { color: color.mute, marginTop: 8 }]}>{msg}</Text> : null}
    </Card>
  );
}
