// "Send it to someone": turns today's lit lantern into a link a friend can open. No server and no account:
// the share sheet (or the clipboard) carries the link; the name is only what the sender types, never filled in.
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, Share, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, radius } from "@ih/brand";
import { giftLink } from "@/lib/walkers";
import { friendsState, makeInvite, setNick } from "@/lib/friends";
import { Btn, Link, font, toast, type } from "@/ui";

async function copy(text: string): Promise<boolean> {
  const clip = (globalThis as any).navigator?.clipboard;
  if (!clip?.writeText) return false;
  try { await clip.writeText(text); return true; } catch { return false; }
}

/** Opens the phone's share sheet when there is one; otherwise copies the link and says so. */
async function send(url: string, text: string): Promise<boolean> {
  if (Platform.OS !== "web") {
    try { const r = await Share.share({ message: `${text}\n${url}` }); return r.action === Share.sharedAction; } catch { return false; }
  }
  const nav = (globalThis as any).navigator;
  if (nav?.share) {
    try { await nav.share({ title: "a lantern for you", text, url }); return true; }
    catch (e: any) { if (e?.name === "AbortError") return false; } // they closed the sheet: nothing to do
  }
  if (await copy(url)) { toast("link copied"); return true; }
  toast("couldn't copy the link — try again");
  return false;
}

/** `to`: the friend this lantern answers ("send them one back"), named on the button and the sheet. */
export function ShareLantern({ line, door, day, n, to }: { line: string; door: string; day: string; n: number; to?: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const insets = useSafeAreaInsets();
  // a friend invite rides along when the friends server answers (fetched as the sheet opens, so the share still counts
  // as the tap's own action); offline, the lantern goes without one
  const [i, setI] = useState<string | null>(null);
  useEffect(() => { if (open && !i) makeInvite().then(setI).catch(() => {}); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = async () => {
    if (name.trim() && !friendsState().nick) setNick(name);
    const ok = await send(giftLink({ from: name, line, door, d: day, n, i }), "i lit my lantern today. here's the line inside.");
    if (ok) { setOpen(false); setI(null); } // single use: the next lantern gets a new invite
  };
  return (
    <>
      <Btn kind="light" onPress={() => setOpen(true)} testID="send-lantern">{to ? `send it to ${to}` : "send it to someone"}</Btn>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]} accessibilityLabel="close" onPress={() => setOpen(false)} />
          <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} accessibilityViewIsModal aria-modal>
            <View style={s.grab} />
            <Text style={[type.eyebrow(), { textAlign: "center" }]}>{to ? `light one for ${to}` : "light one for someone"}</Text>
            <Text accessibilityRole="header" style={[type.h1(24), { textAlign: "center" }]}>{to ? `send your lantern to ${to}.` : "send your lantern."}</Text>
            <Text style={[type.body(14), { color: color.mute, textAlign: "center" }]}>they'll see the line inside and your day count. add your first name if you'd like them to know it's you.</Text>
            <TextInput
              testID="send-name" value={name} onChangeText={(t) => setName(t.slice(0, 24))} placeholder="your first name (optional)" placeholderTextColor={color.mute}
              autoComplete="off" autoCorrect={false} autoCapitalize="words" maxLength={24} accessibilityLabel="Your first name, optional" returnKeyType="send" onSubmitEditing={go}
              style={{ borderWidth: 1.5, borderColor: color.line, borderRadius: 999, paddingVertical: 13, paddingHorizontal: 16, fontFamily: font.text[400], fontSize: 16, backgroundColor: "#fff", color: color.ink }}
            />
            <Btn kind="ink" onPress={go} testID="send-link">send the link</Btn>
            <View style={{ alignItems: "center" }}><Link onPress={() => setOpen(false)} style={{ color: color.mute }}>not now</Link></View>
            <Text style={[type.body(11), { color: color.mute, textAlign: "center" }]}>no account needed. only what's on this card goes in the link, plus an invite: if they walk with you, you'll each see the other's nickname, streak and whether today's done.</Text>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  sheet: { width: "100%", maxWidth: 430, backgroundColor: color.cream, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  grab: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: color.line, marginBottom: 6 },
});
