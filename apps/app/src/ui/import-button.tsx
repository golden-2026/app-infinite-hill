// "Bring my days" from an exported file. Web: a file picker. iPhone: not offered in the pilot (the app
// build ships later and starts fresh), so the button only renders on web.
import { useRef } from "react";
import { Platform } from "react-native";
import { Btn } from "@/ui";

export function ImportButton({ onText, kind = "ghost", label = "bring my days from a file" }: { onText: (text: string) => void; kind?: "ink" | "ghost"; label?: string }) {
  const input = useRef<HTMLInputElement | null>(null);
  if (Platform.OS !== "web") return null;
  return (
    <>
      <Btn kind={kind} testID="import" onPress={() => input.current?.click()}>{label}</Btn>
      <input ref={input} type="file" accept="application/json,.json" style={{ display: "none" }} aria-hidden="true"
        onChange={async (e) => { const el = e.currentTarget; const f = el.files?.[0]; el.value = ""; if (f) onText(await f.text()); }} />
    </>
  );
}
