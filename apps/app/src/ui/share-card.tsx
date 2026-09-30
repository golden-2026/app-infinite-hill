// "share this": a milestone or year card, previewed in a sheet, then shared the share-lantern way (share sheet with
// the image, or download + copied link). What's on the card is exactly what's shared: nothing private.
import { useEffect, useState } from "react";
import { Image, Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { color, radius } from "@ih/brand";
import { track } from "@/lib/analytics";
import { CARD_H, CARD_W, cardText, paintCard, shareCard, type CardSpec } from "@/lib/share-card";
import { Btn, Link, toast, type } from "@/ui";

export function ShareCardButton({ spec, kind = "light", testID = "share-card", children = "share this" }: { spec: CardSpec; kind?: "light" | "gold" | "ink" | "ghost"; testID?: string; children?: string }) {
  const [open, setOpen] = useState(false);
  const [canvas, setCanvas] = useState<HTMLCanvasElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const insets = useSafeAreaInsets();
  useEffect(() => {
    if (!open || canvas) return;
    let live = true;
    paintCard(spec).then((c) => { if (!live) return; setCanvas(c); if (c) setPreview(c.toDataURL("image/png")); }).catch(() => {});
    return () => { live = false; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const go = async () => {
    setBusy(true);
    const r = await shareCard(spec, canvas);
    setBusy(false);
    track("card_shared", { kind: spec.kind, result: r });
    if (r === "saved") toast("image saved · link copied");
    else if (r === "copied") toast("link copied");
    else if (r === "failed") toast("couldn't share it — try again");
    if (r === "shared" || r === "saved" || r === "copied") setOpen(false);
  };
  const w = 260;
  return (
    <>
      <Btn kind={kind} onPress={() => setOpen(true)} testID={testID}>{children}</Btn>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: color.scrim }]} accessibilityLabel="close" onPress={() => setOpen(false)} />
          <View testID="share-sheet" style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]} accessibilityViewIsModal aria-modal>
            <View style={s.grab} />
            <Text style={[type.eyebrow(), { textAlign: "center" }]}>share this</Text>
            <View style={{ alignItems: "center" }}>
              {preview ? (
                <Image testID="share-preview" source={{ uri: preview }} accessibilityLabel={cardText(spec)} style={{ width: w, height: (w * CARD_H) / CARD_W, borderRadius: 18 }} />
              ) : Platform.OS === "web" ? (
                <View style={{ width: w, height: (w * CARD_H) / CARD_W, borderRadius: 18, backgroundColor: color.sand }} />
              ) : (
                <Text style={[type.body(15), { textAlign: "center" }]}>{cardText(spec)}</Text>
              )}
            </View>
            <Btn kind="ink" onPress={go} disabled={busy} testID="share-card-go">{busy ? "one moment…" : "share"}</Btn>
            <View style={{ alignItems: "center" }}><Link onPress={() => setOpen(false)} style={{ color: color.mute }}>not now</Link></View>
            <Text style={[type.body(11), { color: color.mute, textAlign: "center" }]}>only what's on the card: the number, your path's name and a link. never your journal, moods or answers.</Text>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  sheet: { width: "100%", maxWidth: 430, backgroundColor: color.cream, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, paddingHorizontal: 20, paddingTop: 10, gap: 12 },
  grab: { alignSelf: "center", width: 40, height: 5, borderRadius: 3, backgroundColor: color.line, marginBottom: 6 },
});
