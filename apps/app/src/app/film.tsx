// A story film class (night look, 2026-10-28): the film page from public/films plays full screen; its ✕ or
// "Done for today" sends a message back, and we return to Today. Web only for now (the films are web pages).
import { createElement, useEffect } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { Platform, Text, View } from "react-native";
import { color, type } from "@/ui";
import { FILMS, markFilmSeen } from "@/ui/hill-home";

export default function Film() {
  const { f } = useLocalSearchParams<{ f?: string }>();
  const film = Object.values(FILMS).flat().find((x) => x.id === f);
  useEffect(() => {
    if (Platform.OS !== "web") return;
    const on = (e: MessageEvent) => {
      if (!e.data || !e.data.ih) return;
      if (e.data.ih === "done" && film) markFilmSeen(film.id);
      if (router.canGoBack()) router.back(); else router.replace("/today");
    };
    window.addEventListener("message", on);
    return () => window.removeEventListener("message", on);
  }, [film]);
  if (!film || Platform.OS !== "web") {
    return <View style={{ flex: 1, backgroundColor: color.cream, alignItems: "center", justifyContent: "center", padding: 24 }}><Text style={type.body(15)}>this story isn't here yet.</Text></View>;
  }
  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {createElement("iframe", { src: `/films/${film.id}-film.html?app=1`, title: film.title, allow: "autoplay; fullscreen", style: { border: 0, width: "100%", height: "100%" } })}
    </View>
  );
}
