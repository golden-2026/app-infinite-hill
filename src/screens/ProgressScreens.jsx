import React, { useState } from "react";
import { Page, Header, Card, Button, Pill, Row, Progress, Notice, SunMark } from "../ui/GoldenUI.jsx";

export const PROGRESS_SCREEN_IDS = Object.freeze([
  "path-overview",
  "camp-arrival",
  "camp-completion",
  "strand-progress",
  "review-progress",
  "review-result-progress",
]);

function Screen({ eyebrow, title, subtitle, onBack, children }) {
  return <Page tone="cream" scroll style={{ paddingBottom: 24 }}>
    <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
    <div style={{ display: "grid", gap: 12, padding: "0 18px 16px" }}>{children}</div>
  </Page>;
}

const campTitle = (camp) => camp?.name || `Camp ${camp?.camp || ""}`.trim();

/** Path counts and stop states come from derivePathProgress, never sample counts. */
export function PathOverviewScreen({ progress, onBack, onCamp, onStrand, onReview }) {
  const camps = progress?.camps || [];
  const stops = progress?.stops || [];
  const completed = progress?.completedCount || 0;
  const current = stops.find((stop) => stop.current) || null;
  return <Screen eyebrow={`${progress?.label || "Your door"} · your mountain`} title="The path you’ve walked." subtitle="Completed stops come from your saved lesson history. Future stops stay marked by the supplied manuscript." onBack={onBack}>
    <Card dark>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div><Pill tone="gold" dark>your progress</Pill><p style={{ font: "700 20px/1.2 Manrope, Inter, system-ui", margin: "12px 0 0" }}>{completed} of {progress?.mappedCount || 0} mapped lessons</p></div>
        <SunMark size={48} mood="calm" />
      </div>
      <Progress dark value={completed} max={progress?.mappedCount || 1} />
      <p style={{ color: "#C8C8C0", fontSize: 12, margin: "7px 0 0" }}>{current ? `Current stop · lesson ${current.lesson}${current.canPreview ? " · manuscript preview" : " · content coming"}` : completed ? "Every mapped stop in this path is complete." : "Your first stop is ready when you are."}</p>
    </Card>
    {camps.map((camp) => <Card key={camp.camp}>
      <Row title={campTitle(camp)} detail={`Camp ${camp.camp} · ${camp.completedCount} of ${camp.mappedCount} complete · ${camp.authoredCount} manuscript previews`} leading={<span aria-hidden="true" style={{ width: 36, height: 36, display: "grid", placeItems: "center", borderRadius: 20, background: camp.complete ? "#0A0A0A" : camp.arrived ? "#EEFF6A" : "#F5F2E8", color: camp.complete ? "#EEFF6A" : "#0A0A0A", fontWeight: 700 }}>{camp.complete ? "✓" : camp.camp}</span>} trailing={<Pill tone={camp.complete || camp.arrived ? "gold" : "quiet"}>{camp.state}</Pill>} />
      <Progress value={camp.completedCount} max={camp.mappedCount || 1} />
      <p style={{ color: "#6B6B6B", fontSize: 11, margin: "7px 0 0" }}>{camp.nextSession ? camp.nextSession.canPreview ? `Next · lesson ${camp.nextSession.lesson} · supplied manuscript preview` : `Next · lesson ${camp.nextSession.lesson} · manuscript not supplied` : "All mapped stops complete"} · {camp.lockedCount} future stops locked</p>
      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 600 }}>See {camp.mappedCount} mapped stops</summary>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {camp.stops.map((stop) => <div key={stop.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, borderTop: "1px solid #E9E5DB", paddingTop: 8 }}>
            <div style={{ minWidth: 0 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{stop.title}</div><div style={{ color: "#6B6B6B", fontSize: 11 }}>Lesson {stop.lesson}{stop.canPreview ? " · manuscript preview" : " · text not supplied"}</div></div>
            <Pill tone={stop.completed || stop.current ? "gold" : "quiet"}>{stop.completed ? "complete" : stop.current ? "current" : stop.locked ? "locked" : stop.canPreview ? "authored" : "coming"}</Pill>
          </div>)}
        </div>
      </details>
      <Button variant="ghost" style={{ marginTop: 10 }} onClick={() => onCamp?.(camp.camp)}>Open camp details</Button>
    </Card>)}
    {!camps.length && <Card><p style={{ margin: 0 }}>This door is not in the supplied curriculum map.</p></Card>}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <Button variant="ghost" onClick={onStrand}>Your strand</Button>
      <Button variant="ghost" onClick={onReview}>Review words</Button>
    </div>
  </Screen>;
}

/** Introduces an arrived camp and opens its next supplied manuscript only. */
export function CampArrivalScreen({ doorLabel = "Your door", camp, onBack, onStart }) {
  const session = camp?.nextSession;
  const ready = Boolean(session?.canPreview);
  return <Screen eyebrow={`${doorLabel} · camp ${camp?.camp || ""}`} title={`Welcome to ${campTitle(camp)}.`} subtitle="A new part of your path begins here. Your earlier words stay with you." onBack={onBack}>
    <Card dark><div style={{ display: "flex", alignItems: "center", gap: 14 }}><SunMark size={56} mood="glow" /><div><Pill tone="gold" dark>camp arrival</Pill><p style={{ font: "700 20px/1.2 Manrope, Inter, system-ui", margin: "10px 0 0" }}>{camp?.mappedCount || 0} mapped stops</p></div></div></Card>
    {session && <Card><Pill tone={ready ? "gold" : "quiet"}>{ready ? "supplied manuscript preview" : "manuscript not supplied"}</Pill><p style={{ font: "700 18px/1.3 Manrope, Inter, system-ui", margin: "10px 0 0" }}>{session.title}</p><p style={{ color: "#6B6B6B", fontSize: 12 }}>Lesson {session.lesson} · {camp?.authoredCount || 0} preview manuscripts in this camp</p></Card>}
    {!ready && <Notice tone="warning">This camp is on the map, but its next lesson text is not supplied. Golden will not make up a lesson.</Notice>}
    <Button disabled={!ready} onClick={() => ready && onStart?.(session.lesson)}>{ready ? "Open the first lesson" : "Lesson text not available"}</Button>
  </Screen>;
}

/** A camp closes only after every mapped stop appears in completion history. */
export function CampCompletionScreen({ doorLabel = "Your door", camp, nextCamp = null, onBack, onContinue, onStrand }) {
  const nextSession = nextCamp?.nextSession;
  const canContinue = Boolean(nextSession?.canPreview);
  return <Screen eyebrow={`${doorLabel} · camp ${camp?.camp || ""}`} title="You’ve completed this camp." subtitle="Every mapped stop is marked complete in your saved lesson history." onBack={onBack}>
    <Card dark><div style={{ textAlign: "center", padding: "8px 0" }}><SunMark size={66} mood="happy" /><Pill tone="gold" dark>camp complete</Pill><p style={{ font: "700 20px/1.25 Manrope, Inter, system-ui", margin: "12px 0 0" }}>{camp?.completedCount || 0} mapped stops complete</p></div></Card>
    <Progress value={camp?.completedCount || 0} max={camp?.mappedCount || 1} />
    {nextCamp ? <Card><Pill tone={canContinue ? "gold" : "quiet"}>next · camp {nextCamp.camp}</Pill><p style={{ font: "700 18px/1.3 Manrope, Inter, system-ui", margin: "10px 0 0" }}>{campTitle(nextCamp)}</p><p style={{ color: "#6B6B6B", fontSize: 12, marginBottom: 0 }}>{canContinue ? `Lesson ${nextSession.lesson} · supplied manuscript preview` : "The next camp is mapped, and its manuscript is still being prepared."}</p></Card> : <Notice>You’ve reached the end of the supplied path map.</Notice>}
    <Button disabled={Boolean(nextCamp) && !canContinue} onClick={() => onContinue?.(nextCamp?.camp)}>{nextCamp ? canContinue ? "Continue to the next camp" : "Next lesson not available" : "Return to your path"}</Button>
    <Button variant="ghost" onClick={onStrand}>See your earned words</Button>
  </Screen>;
}

/** Displays only words persisted with a completed lesson. */
export function StrandProgressScreen({ strand = [], onBack, onWord, onReview }) {
  return <Screen eyebrow="your progress · strand" title="Words you’ve kept." subtitle="Each word here belongs to a lesson in your saved completion history." onBack={onBack}>
    <Card dark><div style={{ display: "flex", alignItems: "center", gap: 14 }}><SunMark size={48} mood="calm" /><div><Pill tone="gold" dark>your strand</Pill><p style={{ font: "700 20px/1.2 Manrope, Inter, system-ui", margin: "9px 0 0" }}>{strand.length} {strand.length === 1 ? "word" : "words"}</p></div></div></Card>
    {strand.length ? strand.map((item) => <Card key={item.id} onClick={() => onWord?.(item)}>
      <Row title={item.word} detail={`${item.doorLabel} · lesson ${item.lesson} · ${item.date}`} leading={<span aria-hidden="true" style={{ width: 36, height: 36, display: "grid", placeItems: "center", border: "1px solid #0A0A0A", borderRadius: 22 }}>✦</span>} trailing={<span aria-hidden="true">›</span>} />
      {item.carry && <p style={{ color: "#6B6B6B", fontSize: 12, margin: "8px 0 0" }}>“{item.carry}”</p>}
    </Card>) : <Card><p style={{ font: "700 18px/1.3 Manrope, Inter, system-ui", margin: 0 }}>Your first word will land here.</p><p style={{ color: "#6B6B6B", fontSize: 13, marginBottom: 0 }}>Complete a lesson that carries a word to add it to your strand.</p></Card>}
    <Button disabled={!strand.length} onClick={onReview}>Review due words</Button>
  </Screen>;
}

/** Due cards come from deriveReviewState; answers are handed back for persistence. */
export function ReviewProgressScreen({ review, onBack, onComplete, onWord }) {
  const cards = review?.cards || [];
  const [answers, setAnswers] = useState({});
  const [revealed, setRevealed] = useState({});
  const ready = cards.length > 0 && cards.every((card) => typeof answers[card.id] === "boolean");
  if (!cards.length) return <Screen eyebrow="your strand · review" title="No words are due today." subtitle="Your words will return when it’s time. Nothing is behind." onBack={onBack}>
    <Card dark><div style={{ textAlign: "center", padding: "8px 0" }}><SunMark size={60} mood="calm" /><Pill tone="gold" dark>review is clear</Pill><p style={{ font: "700 19px/1.3 Manrope, Inter, system-ui", margin: "12px 0 0" }}>{review?.nextDate ? `Next return · ${review.nextDate}` : "A word will return after your next completed lesson."}</p></div></Card>
    {review?.nextDate && <p style={{ color: "#6B6B6B", fontSize: 12, margin: 0 }}>That date comes from your saved review schedule.</p>}
    <Button variant="ghost" onClick={onBack}>Back to your path</Button>
  </Screen>;

  const submit = () => onComplete?.(cards.map((card) => ({ id: card.id, remembered: answers[card.id] })));
  return <Screen eyebrow="your strand · review" title="Keep the words." subtitle="Try each word, then tell Golden whether it came back to you. There’s no score or penalty." onBack={onBack}>
    <Card dark><Pill tone="gold" dark>{cards.length} due today</Pill><p style={{ font: "700 19px/1.3 Manrope, Inter, system-ui", margin: "10px 0 0" }}>A short return, at your pace.</p></Card>
    {cards.map((card) => <Card key={card.id}>
      <Row title={card.word} detail={`${card.doorLabel} · lesson ${card.lesson} · due ${card.dueDate}`} leading={<span aria-hidden="true" style={{ width: 34, height: 34, display: "grid", placeItems: "center", border: "1px solid #0A0A0A", borderRadius: 22 }}>✦</span>} />
      {revealed[card.id] ? <><p style={{ margin: "10px 0", fontSize: 14, fontWeight: 600 }}>{card.title}</p>{card.carry && <p style={{ margin: "0 0 10px", fontSize: 14 }}>“{card.carry}”</p>}</> : <Button variant="ghost" style={{ marginTop: 10 }} onClick={() => setRevealed((current) => ({ ...current, [card.id]: true }))}>Reveal its lesson and carry line</Button>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
        <Button disabled={!revealed[card.id]} variant={answers[card.id] === true ? "gold" : "ghost"} aria-pressed={answers[card.id] === true} onClick={() => setAnswers((current) => ({ ...current, [card.id]: true }))}>Remembered</Button>
        <Button disabled={!revealed[card.id]} variant={answers[card.id] === false ? "gold" : "ghost"} aria-pressed={answers[card.id] === false} onClick={() => setAnswers((current) => ({ ...current, [card.id]: false }))}>Not yet</Button>
      </div>
      {onWord && <button type="button" onClick={() => onWord(card)} style={{ border: 0, background: "transparent", padding: "10px 0 0", color: "#6B6B6B", textDecoration: "underline", cursor: "pointer" }}>Open word details</button>}
    </Card>)}
    <Button disabled={!ready} onClick={submit}>Save this review</Button>
  </Screen>;
}

/** Result props should be the result returned by completeReview. */
export function ReviewResultProgressScreen({ result, onBack, onAgain }) {
  const total = result?.total || 0;
  const remembered = result?.remembered || 0;
  return <Screen eyebrow="your strand · review" title={`${remembered} of ${total}. Still yours.`} subtitle="Every return is practice. Words you missed can come back sooner." onBack={onBack}>
    <Card dark><div style={{ textAlign: "center", padding: "8px 0" }}><SunMark size={66} mood="glow" /><Pill tone="gold" dark>review saved</Pill><p style={{ font: "700 20px/1.25 Manrope, Inter, system-ui", margin: "12px 0 0" }}>{total ? `${remembered} remembered` : "No answers were recorded"}</p></div></Card>
    <Progress value={remembered} max={total || 1} />
    {(result?.items || []).map((item) => <Card key={item.id}><Row title={item.word} detail={`${item.door} · next review ${item.dueDate}`} trailing={<Pill tone="quiet">{item.reviewCount || 0} returns</Pill>} /></Card>)}
    <Button onClick={onAgain}>Back to your path</Button>
  </Screen>;
}
