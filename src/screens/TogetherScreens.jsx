import { useState } from "react";
import {
  Button,
  Card,
  Header,
  Notice,
  Page,
  Pill,
  Progress,
  Row,
  SunMark,
} from "../ui/GoldenUI.jsx";

export const TOGETHER_SCREEN_IDS = Object.freeze({
  location: "together.location",
  chooseMetro: "together.choose-metro",
  communityDetail: "together.community-detail",
  doorCommunity: "together.door-community",
  liveReadDetail: "together.live-read-detail",
  liveReadReminder: "together.live-read-reminder",
  liveReadLobby: "together.live-read-lobby",
  liveReadPlayer: "together.live-read-player",
  liveReadQA: "together.live-read-qa",
  liveReadReplay: "together.live-read-replay",
  nights: "together.nights",
  eventDetail: "together.event-detail",
  hostDetail: "together.host-detail",
  rsvpHandoff: "together.rsvp-handoff",
  rsvpConfirmation: "together.rsvp-confirmation",
  manageRSVP: "together.manage-rsvp",
  directions: "together.directions",
  reportEvent: "together.report-event",
  voiceProfile: "together.voice-profile",
  keeperProfile: "together.keeper-profile",
});

export const TOGETHER_SCREEN_ID_LIST = Object.freeze(Object.values(TOGETHER_SCREEN_IDS));

const METROS = ["Los Angeles", "New York", "Chicago", "San Francisco", "Toronto"];
const SAMPLE_EVENTS = [
  { id: "sunset", title: "Sunset on the roof", place: "Arts District · Los Angeles", when: "Sample date · time pending", kind: "Gathering" },
  { id: "kirtan", title: "A night of kirtan", place: "El Rey · Los Angeles", when: "Sample date · time pending", kind: "Live music" },
  { id: "shabbat", title: "Shabbat table", place: "Pico-Robertson · Los Angeles", when: "Sample date · invitation pending", kind: "Shared meal" },
  { id: "sunrise", title: "Silent sunrise", place: "Point Dume · Los Angeles", when: "Sample date · safety review pending", kind: "Quiet practice" },
];

function SampleTag({ children = "preview" }) {
  return <Pill tone="sample">{children}</Pill>;
}

function StatusNote({ children }) {
  return <Notice tone="pending">{children}</Notice>;
}

function Shell({ eyebrow, title, subtitle, onBack, children, tone = "cream" }) {
  return (
    <Page tone={tone} scroll>
      <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} dark={tone === "dusk" || tone === "dark"} />
      <div style={{ display: "grid", gap: 12, padding: "0 18px 28px" }}>{children}</div>
    </Page>
  );
}

function Action({ children, onClick, variant = "ink", disabled }) {
  return <Button onClick={onClick} variant={variant} disabled={disabled}>{children}</Button>;
}

function EventRows({ onSelect }) {
  return SAMPLE_EVENTS.map((event) => (
    <Row
      key={event.id}
      title={event.title}
      detail={`${event.place} · ${event.when}`}
      leading={<SunMark size={26} mood="calm" />}
      trailing={<SampleTag />}
      onClick={() => onSelect?.(event.id)}
    />
  ));
}

function ParticipantStatus({ children = "sample participation · not live" }) {
  return <Pill tone="pending">{children}</Pill>;
}

export function LocationExplainerScreen({ onBack, onChooseMetro, onSkip }) {
  return (
    <Shell eyebrow="together · nearby" title="Find your people, at your pace." subtitle="Choose a metro to preview local listings. Golden does not need your precise location." onBack={onBack}>
      <Card tone="dark">
        <SunMark size={48} mood="calm" />
        <p style={{ margin: "12px 0 0" }}>Metro selection is optional and stays a preview here. No GPS lookup or location service is connected.</p>
      </Card>
      <StatusNote>Community counts and local event listings are sample content. Providers and event verification are pending.</StatusNote>
      <Action onClick={onChooseMetro}>Choose a metro</Action>
      <Action variant="ghost" onClick={onSkip}>Not now</Action>
    </Shell>
  );
}

export function ChooseMetroScreen({ onBack, onSelectMetro, selectedMetro = "Los Angeles" }) {
  const [selection, setSelection] = useState(selectedMetro);
  return (
    <Shell eyebrow="your area · optional" title="Which metro should we preview?" subtitle="This choice only filters the sample cards on this device." onBack={onBack}>
      <fieldset style={{ display: "grid", gap: 8, margin: 0, padding: 0, border: 0 }}>
        <legend style={{ position: "absolute", width: 1, height: 1, padding: 0, margin: -1, overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}>Choose a sample metro</legend>
        {METROS.map((metro) => (
          <label key={metro} style={{ display: "block", cursor: "pointer" }}>
            <Row title={metro} detail={metro === "Los Angeles" ? "Sample listings available" : "Sample community preview"} leading={<input type="radio" name="sample-metro" value={metro} checked={selection === metro} onChange={() => setSelection(metro)} aria-label={metro} />} trailing={selection === metro ? <SampleTag>selected</SampleTag> : null} />
          </label>
        ))}
      </fieldset>
      <StatusNote>Metro communities and counts are illustrative samples, not live membership.</StatusNote>
      <Action onClick={() => onSelectMetro?.(selection)}>See this preview</Action>
      <Action variant="ghost" onClick={onSelectMetro ? () => onSelectMetro(null) : onBack}>Skip location</Action>
    </Shell>
  );
}

export function CommunityDetailScreen({ onBack, metro = "Los Angeles", onOpenDoor }) {
  return (
    <Shell eyebrow="community · sample" title={`${metro} · the house`} subtitle="A preview of how people across different doors might gather." onBack={onBack}>
      <Card tone="dark">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
          <div><div style={{ fontSize: 12, opacity: 0.72 }}>people walking here</div><div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1 }}>1,204</div></div>
          <SampleTag>sample count</SampleTag>
        </div>
        <p style={{ marginBottom: 0 }}>This illustrative number is not connected to live participation data.</p>
      </Card>
      <Card>
        <h2 style={{ margin: "0 0 10px" }}>Eight doors, one house.</h2>
        <Row title="Across the doors" detail="Example of a community summary" trailing={<ParticipantStatus />} />
        <Progress value={6} max={8} />
        <p style={{ margin: "10px 0 0", fontSize: 12 }}>The bar is a visual sample only. It does not represent current member or activity data.</p>
      </Card>
      <StatusNote>Location services and community data providers are not connected.</StatusNote>
      <Action onClick={onOpenDoor}>Explore your door</Action>
    </Shell>
  );
}

export function DoorCommunityScreen({ onBack, door = "Hinduism", localDay = 1, onLiveRead }) {
  return (
    <Shell eyebrow={`${door.toLowerCase()} · community preview`} title={`A path walked together.`} subtitle={`Your local path is on day ${localDay}. This screen does not show live participation.`} onBack={onBack}>
      <Card tone="dark"><div style={{ display: "flex", alignItems: "center", gap: 12 }}><SunMark size={52} mood="calm" /><div><div style={{ fontSize: 12, opacity: 0.74 }}>your door</div><div style={{ fontSize: 23, fontWeight: 800 }}>{door}</div></div></div></Card>
      <Card><Row title="A shared daily practice" detail="Sample community story" trailing={<ParticipantStatus />} /><p style={{ marginBottom: 0 }}>The preview keeps your practice on this device. No door choice or practice history is shared with a community service.</p></Card>
      <StatusNote>Live reads are planned. Reader, schedule, and participation are pending.</StatusNote>
      <Action onClick={onLiveRead}>View live-read preview</Action>
    </Shell>
  );
}

export function LiveReadDetailScreen({ onBack, onReminder, door = "your door" }) {
  return (
    <Shell eyebrow="live read · planned" title="A reading, shared in real time." subtitle={`A proposed live reading for ${door}.`} onBack={onBack} tone="dusk">
      <Card tone="dark"><ParticipantStatus>reader proposed · approval pending</ParticipantStatus><h2 style={{ margin: "14px 0 6px" }}>The room is still being prepared.</h2><p style={{ margin: 0 }}>The reader, text, date, and live room have not been confirmed. This card is a product preview.</p></Card>
      <Row title="Read" detail="Specific selection pending" trailing={<SampleTag />} />
      <Row title="Reader" detail="Proposed voice · participation pending" trailing={<SampleTag />} />
      <Row title="Time" detail="Schedule pending" trailing={<SampleTag />} />
      <StatusNote>Live audio and event delivery are not connected.</StatusNote>
      <Action variant="gold" onClick={onReminder}>Save interest on this device</Action>
    </Shell>
  );
}

export function LiveReadReminderScreen({ onBack, onSave, saved = false }) {
  return (
    <Shell eyebrow="live read · reminder" title="Keep the idea close." subtitle="You can save interest locally while the reminder service is being prepared." onBack={onBack}>
      <Card><Row title="Live-read reminder" detail="Delivery is pending provider setup and permission." trailing={<ParticipantStatus>not connected</ParticipantStatus>} /></Card>
      <StatusNote>{saved ? "Interest is marked in this preview; no notification was scheduled." : "Saving interest here does not request notification permission or schedule a reminder."}</StatusNote>
      <Action onClick={onSave}>{saved ? "Interest saved in preview" : "Save interest"}</Action>
      <Action variant="ghost" onClick={onBack}>Maybe later</Action>
    </Shell>
  );
}

export function LiveReadLobbyScreen({ onBack, onJoin, onQA, reader = "Proposed reader" }) {
  return (
    <Shell eyebrow="live room · preview" title="The reading will begin here." subtitle="No live room is connected in this preview." onBack={onBack} tone="dusk">
      <Card tone="dark"><div style={{ textAlign: "center", padding: "14px 0" }}><SunMark size={76} mood="breathe" /><h2 style={{ margin: "14px 0 4px" }}>A quiet place to arrive.</h2><p style={{ margin: 0 }}>Waiting room · sample state</p></div></Card>
      <Row title="Reader" detail={`${reader} · participation pending`} trailing={<SampleTag />} />
      <Row title="Start time" detail="Not scheduled" trailing={<ParticipantStatus />} />
      <StatusNote>Audio, attendance, and room controls are not connected.</StatusNote>
      <Action variant="gold" onClick={onJoin}>Enter preview lobby</Action>
      <Action variant="light" onClick={onQA}>Read sample questions</Action>
    </Shell>
  );
}

export function LiveReadPlayerScreen({ onBack, onQuestions, onReplay, door = "your door" }) {
  return (
    <Shell eyebrow="live read · player preview" title="Take a breath. Stay with the words." subtitle={`A sample player for a proposed ${door} reading.`} onBack={onBack} tone="dusk">
      <Card tone="dark"><div style={{ textAlign: "center", padding: 16 }}><SunMark size={82} mood="breathe" /><div style={{ marginTop: 12 }}><Progress value={2} max={8} /></div><p style={{ marginBottom: 0 }}>Sample progress · no audio is playing</p></div></Card>
      <Card><div style={{ fontSize: 12, opacity: 0.72 }}>sample reading text</div><p style={{ fontSize: 21, lineHeight: 1.35, marginBottom: 0 }}>“Be where your feet are. Let the next breath arrive in its own time.”</p></Card>
      <StatusNote>Reading text is illustrative placeholder copy. A Keeper-reviewed selection and reader approval are pending.</StatusNote>
      <Action variant="gold" onClick={onQuestions}>Open Q&amp;A preview</Action>
      <Action variant="light" onClick={onReplay}>Replay details</Action>
    </Shell>
  );
}

export function LiveReadQAScreen({ onBack, onSubmitQuestion }) {
  const [question, setQuestion] = useState("");
  const [submitted, setSubmitted] = useState(false);
  function submit(event) {
    event.preventDefault();
    if (!question.trim()) return;
    onSubmitQuestion?.(question.trim());
    setSubmitted(true);
  }
  return (
    <Shell eyebrow="live read · questions preview" title="What would you like to ask?" subtitle="Questions are kept in this screen only; a live reader is not connected." onBack={onBack}>
      <form onSubmit={submit} style={{ display: "grid", gap: 12 }}>
        <label htmlFor="live-read-question">Your question</label>
        <textarea id="live-read-question" rows={4} maxLength={500} value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Write a question for the sample session" style={{ width: "100%", boxSizing: "border-box", borderRadius: 14, border: "1px solid #d9d9d2", padding: 14, font: "inherit", resize: "vertical" }} />
        <div style={{ fontSize: 12, opacity: 0.72 }}>{question.length}/500 · not sent</div>
        <StatusNote>{submitted ? "Saved in this preview only. Nothing was sent to a host or service." : "Question submission is not connected; avoid adding sensitive personal details."}</StatusNote>
        <Action disabled={!question.trim()} onClick={() => submit({ preventDefault() {} })}>{submitted ? "Saved in preview" : "Save sample question"}</Action>
      </form>
    </Shell>
  );
}

export function LiveReadReplayScreen({ onBack, onPlay, onQA, door = "your door" }) {
  return (
    <Shell eyebrow="live read · replay preview" title="Return to the reading." subtitle={`A replay preview for ${door}.`} onBack={onBack}>
      <Card tone="dark"><div style={{ display: "flex", alignItems: "center", gap: 14 }}><SunMark size={56} mood="calm" /><div><div style={{ fontSize: 12, opacity: 0.72 }}>sample replay</div><div style={{ fontSize: 20, fontWeight: 800 }}>Audio not available</div></div></div></Card>
      <Row title="Reader" detail="Proposed · approval pending" trailing={<SampleTag />} />
      <Row title="Transcript" detail="Not supplied" trailing={<ParticipantStatus />} />
      <StatusNote>Replay audio and transcript hosting are not connected.</StatusNote>
      <Action onClick={onPlay}>Open player preview</Action>
      <Action variant="ghost" onClick={onQA}>Q&amp;A preview</Action>
    </Shell>
  );
}

export function NightsListScreen({ onBack, onSelectEvent, metro = "Los Angeles" }) {
  return (
    <Shell eyebrow="golden hour nights · near you" title="A few ways to gather." subtitle={`Sample listings for ${metro}. Dates and hosts are not verified.`} onBack={onBack}>
      <StatusNote>Every event below is sample content. Host review, venue, schedule, ticketing, and safety checks are pending.</StatusNote>
      <Card>{EventRows({ onSelect: onSelectEvent })}</Card>
      <Card><div style={{ display: "flex", alignItems: "center", gap: 12 }}><SunMark size={38} mood="calm" /><p style={{ margin: 0 }}>Listings appear only after the host, source, date, and destination are verified.</p></div></Card>
    </Shell>
  );
}

export function EventDetailScreen({ onBack, onRSVP, onHost, onDirections, onReport, event = SAMPLE_EVENTS[0] }) {
  return (
    <Shell eyebrow="event listing · sample" title={event.title} subtitle={event.place} onBack={onBack}>
      <Card tone="dark"><SampleTag>sample event</SampleTag><h2 style={{ margin: "14px 0 6px" }}>{event.kind}</h2><p style={{ margin: 0 }}>{event.when}</p></Card>
      <Card><h2 style={{ margin: "0 0 8px" }}>A gathering to share the evening.</h2><p style={{ margin: 0 }}>Sample description. The event source, date, venue, capacity, and host have not been verified.</p></Card>
      <Row title="Host" detail="Sample host · verification pending" trailing={<SampleTag />} onClick={onHost} />
      <StatusNote>RSVP, directions, ticketing, and event reporting are preview flows only.</StatusNote>
      <Action onClick={onRSVP}>Show RSVP preview</Action>
      <Action variant="ghost" onClick={onDirections}>Directions preview</Action>
      <Action variant="ghost" onClick={onReport}>Report this listing</Action>
    </Shell>
  );
}

export function HostDetailScreen({ onBack, hostName = "Sample host" }) {
  return (
    <Shell eyebrow="host profile · sample" title={hostName} subtitle="A proposed host profile for review." onBack={onBack}>
      <Card tone="dark"><SunMark size={58} mood="calm" /><h2 style={{ margin: "10px 0 4px" }}>Host verification pending</h2><p style={{ margin: 0 }}>No identity, affiliation, or event history has been verified.</p></Card>
      <Row title="Hosting status" detail="Proposed · review pending" trailing={<SampleTag />} />
      <Row title="Events" detail="No verified events" trailing={<ParticipantStatus />} />
      <StatusNote>This sample profile is not a real host account or endorsement.</StatusNote>
    </Shell>
  );
}

export function EventRSVPHandoffScreen({ onBack, onContinue, event = SAMPLE_EVENTS[0] }) {
  return (
    <Shell eyebrow="RSVP · preview" title="Before you head over." subtitle={event.title} onBack={onBack}>
      <Card><Row title="Event status" detail="Sample listing · host and venue pending verification" trailing={<SampleTag />} /><Row title="RSVP service" detail="No ticket or seat reservation is connected" trailing={<ParticipantStatus />} /></Card>
      <StatusNote>Continuing opens a local preview state only. No details are sent to an organizer.</StatusNote>
      <Action onClick={onContinue}>Continue to RSVP preview</Action>
      <Action variant="ghost" onClick={onBack}>Go back</Action>
    </Shell>
  );
}

export function EventRSVPConfirmationScreen({ onBack, onManage, event = SAMPLE_EVENTS[0] }) {
  return (
    <Shell eyebrow="RSVP · preview" title="Your interest is noted here." subtitle={event.title} onBack={onBack}>
      <Card tone="dark"><SunMark size={58} mood="happy" /><h2 style={{ margin: "12px 0 4px" }}>Preview confirmation</h2><p style={{ margin: 0 }}>This is a local sample state, not an RSVP or reserved place.</p></Card>
      <StatusNote>No organizer was notified and no seat was reserved.</StatusNote>
      <Action onClick={onManage}>Manage preview interest</Action>
      <Action variant="ghost" onClick={onBack}>Back to event details</Action>
    </Shell>
  );
}

export function ManageRSVPScreen({ onBack, onClear, event = SAMPLE_EVENTS[0], interested = true }) {
  const [cleared, setCleared] = useState(!interested);
  return (
    <Shell eyebrow="RSVP · manage preview" title="Your event interest." subtitle={event.title} onBack={onBack}>
      <Card><Row title="Preview status" detail={cleared ? "No local interest marked" : "Interest marked in this preview only"} trailing={<SampleTag />} /></Card>
      <StatusNote>There is no live RSVP record to update or cancel.</StatusNote>
      {!cleared && <Action variant="ghost" onClick={() => { setCleared(true); onClear?.(); }}>Clear local preview interest</Action>}
    </Shell>
  );
}

export function DirectionsScreen({ onBack, onOpenDirections, event = SAMPLE_EVENTS[0] }) {
  return (
    <Shell eyebrow="directions · preview" title="Getting there, once details are confirmed." subtitle={event.title} onBack={onBack}>
      <Card tone="dark"><div style={{ fontSize: 12, opacity: 0.72 }}>sample destination</div><h2 style={{ margin: "8px 0" }}>{event.place}</h2><p style={{ margin: 0 }}>Address not verified · route not calculated</p></Card>
      <StatusNote>No precise location is requested, and no map or directions provider is connected.</StatusNote>
      <Action onClick={onOpenDirections} disabled={!onOpenDirections}>Directions unavailable in preview</Action>
    </Shell>
  );
}

export function ReportEventScreen({ onBack, onSubmitReport, event = SAMPLE_EVENTS[0] }) {
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const reasons = ["The information looks wrong", "The host or venue seems unsafe", "This listing may be misleading", "Something else"];
  function submit(eventObject) {
    eventObject.preventDefault();
    if (!reason) return;
    onSubmitReport?.({ reason, eventId: event.id });
    setSubmitted(true);
  }
  return (
    <Shell eyebrow="report listing · preview" title="Help us review this event." subtitle={event.title} onBack={onBack}>
      <form onSubmit={submit} style={{ display: "grid", gap: 8 }}>
        <fieldset style={{ margin: 0, border: 0, padding: 0 }}>
          <legend style={{ marginBottom: 10 }}>What should be reviewed?</legend>
          {reasons.map((item) => <label key={item} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 44 }}><input type="radio" name="event-report-reason" value={item} checked={reason === item} onChange={() => setReason(item)} />{item}</label>)}
        </fieldset>
        <StatusNote>{submitted ? "Your report is shown as a local preview only. It was not sent." : "Report delivery and moderation are not connected. No contact details are requested."}</StatusNote>
        <Action disabled={!reason} onClick={() => submit({ preventDefault() {} })}>{submitted ? "Saved in preview" : "Save report preview"}</Action>
      </form>
    </Shell>
  );
}

export function VoiceProfileScreen({ onBack, voiceName = "Proposed voice" }) {
  return (
    <Shell eyebrow="voice profile · proposed" title={voiceName} subtitle="An example of a door voice profile." onBack={onBack}>
      <Card tone="dark"><SunMark size={58} mood="calm" /><h2 style={{ margin: "10px 0 4px" }}>A voice with a seat at the table.</h2><p style={{ margin: 0 }}>This profile is a proposal, not a confirmed participant.</p></Card>
      <Row title="Participation" detail="Pending" trailing={<ParticipantStatus />} />
      <Row title="Recording rights" detail="Not confirmed" trailing={<ParticipantStatus />} />
      <Row title="Sample audio" detail="Not available" trailing={<SampleTag />} />
      <StatusNote>No voice recording is included or connected in this preview.</StatusNote>
    </Shell>
  );
}

export function KeeperProfileScreen({ onBack, keeperName = "Proposed Keeper" }) {
  return (
    <Shell eyebrow="keeper profile · proposed" title={keeperName} subtitle="A profile concept for the people who review a door's materials." onBack={onBack}>
      <Card tone="dark"><SunMark size={58} mood="calm" /><h2 style={{ margin: "10px 0 4px" }}>Review seat proposed</h2><p style={{ margin: 0 }}>No appointment or endorsement is confirmed.</p></Card>
      <Row title="Door" detail="Not assigned in this preview" trailing={<SampleTag />} />
      <Row title="Review status" detail="Participation pending" trailing={<ParticipantStatus />} />
      <Row title="Lesson approvals" detail="None attached" trailing={<ParticipantStatus />} />
      <StatusNote>Keeper review and voice participation require explicit confirmation before any content is described as approved.</StatusNote>
    </Shell>
  );
}

export { METROS as SAMPLE_METROS, SAMPLE_EVENTS as TOGETHER_SAMPLE_EVENTS };
