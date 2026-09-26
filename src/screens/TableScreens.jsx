import { useState } from "react";
import {
  Page,
  Header,
  Card,
  Button,
  Pill,
  Row,
  Progress,
  Notice,
  SunMark,
} from "../ui/GoldenUI.jsx";

/** Route keys consumed by the shell integration. */
export const TABLE_SCREEN_IDS = Object.freeze({
  intro: "table-intro",
  create: "table-create",
  inviteMethod: "table-invite-method",
  inviteLink: "table-invite-link",
  invitationLanding: "table-invitation-landing",
  inviteResponse: "table-invite-response",
  home: "table-home",
  member: "table-member",
  pending: "table-pending-invites",
  manage: "table-manage",
  voiceRecord: "table-voice-record",
  voiceReview: "table-voice-review",
  voicePlayer: "table-voice-player",
  sunConfirm: "table-sun-confirm",
  activity: "table-activity",
  streak: "table-streak",
  leave: "table-leave",
  transfer: "table-transfer",
  delete: "table-delete",
});

const dateLabel = (date) => {
  if (!date) return "Today";
  const parsed = new Date(`${date}T12:00:00`);
  return Number.isNaN(parsed.getTime())
    ? date
    : parsed.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
};
const pageStyle = { display: "grid", alignContent: "start", gap: 12, padding: "0 18px 24px" };

function TableHeader(props) {
  return <Header {...props} style={{ margin: "0 -18px" }} />;
}

function BetaNote({ children = "Private beta · saved on this device. Table sync is not connected." }) {
  return <Notice tone="muted">{children}</Notice>;
}

function ScreenActions({ primary, primaryLabel = "Continue", secondary, secondaryLabel = "Back", disabled = false }) {
  return <div style={{ display: "grid", gap: 9, marginTop: 18 }}>
    <Button onClick={primary} disabled={disabled}>{primaryLabel}</Button>
    {secondary && <Button variant="ghost" onClick={secondary}>{secondaryLabel}</Button>}
  </div>;
}

function MemberAvatar({ name, size = 44, mood }) {
  return <div aria-hidden="true" style={{ width: size, height: size, flex: `0 0 ${size}px`, borderRadius: "50%", display: "grid", placeItems: "center", background: "#EEFF6A", color: "#0A0A0A", fontFamily: "'Manrope', Inter, sans-serif", fontWeight: 800, fontSize: Math.round(size * 0.35) }}>
    {mood ? <SunMark size={Math.round(size * 0.68)} mood={mood} /> : (name || "?").trim().slice(0, 1).toUpperCase()}
  </div>;
}

function MemberLine({ member, onClick, detail }) {
  const state = member?.invitationStatus || "accepted";
  return <Row
    title={member?.name || "Table member"}
    detail={detail || (state === "accepted" ? "Here with you" : state === "invited" ? "Invitation waiting" : "Declined")}
    leading={<MemberAvatar name={member?.name} size={40} />}
    trailing={<Pill tone={state === "accepted" ? "gold" : "muted"}>{state === "accepted" ? "here" : state}</Pill>}
    onClick={onClick}
  />;
}

export function TableIntroScreen({ onBack, onStart, onLearnMore }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="together · your table" title="six seats. the people you keep." subtitle="A little company for the practice, with room for the people who matter." onBack={onBack} />
    <Card tone="dark">
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}><SunMark size={66} mood="glow" /><div><Pill tone="gold">one small signal</Pill><p style={{ margin: "9px 0 0", lineHeight: 1.45 }}>Share whether you showed up today. Your Door, lessons, Guide questions, and reflections stay yours.</p></div></div>
    </Card>
    <Card>
      <div style={{ fontFamily: "'Manrope', Inter, sans-serif", fontWeight: 800, fontSize: 18 }}>A Table is a quiet kind of company.</div>
      <p style={{ margin: "8px 0 0", lineHeight: 1.5 }}>There are up to six seats. Nobody sees what you read or what you believe. You choose who to invite, and each person chooses whether to join.</p>
    </Card>
    <BetaNote />
    <ScreenActions primary={onStart} primaryLabel="Start my Table" secondary={onLearnMore} secondaryLabel="How privacy works" />
  </Page>;
}

export function TableCreateScreen({ onBack, onCreate, initialName = "", ownerName = "you", error }) {
  const [name, setName] = useState(initialName);
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your table · name it" title="give this little circle a name." subtitle="You can change it any time." onBack={onBack} />
    <Card><label style={{ display: "grid", gap: 8, fontWeight: 700 }}>Table name
      <input value={name} onChange={(event) => setName(event.target.value)} maxLength={60} placeholder="The Sunday table" autoComplete="off" style={inputStyle} />
    </label><div style={{ marginTop: 12, opacity: 0.7 }}>Started by {ownerName} · {name.length}/60</div></Card>
    {error && <Notice tone="warning">{error}</Notice>}
    <BetaNote />
    <ScreenActions primary={() => onCreate?.(name.trim())} primaryLabel="Create my Table" secondary={onBack} secondaryLabel="Go back" disabled={!name.trim()} />
  </Page>;
}

export function TableInviteMethodScreen({ onBack, onChooseLink, onChooseContacts, onChooseCopy }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your table · invite" title="how would you like to invite them?" subtitle="An invitation is only a request. They join only if they say yes." onBack={onBack} />
    <Card><Row title="Share an invite link" detail="Copy it or use your device share sheet" leading="↗" onClick={onChooseLink} trailing="›" /></Card>
    <Card><Row title="Choose from contacts" detail="Opens your device contacts when available" leading="＋" onClick={onChooseContacts} trailing="›" /></Card>
    <Card><Row title="Invite by name" detail="Save a private-beta invitation on this device" leading="✳" onClick={onChooseCopy} trailing="›" /></Card>
    <BetaNote>Private beta · invite delivery and cross-device Table sync are not connected.</BetaNote>
  </Page>;
}

export function TableInviteLinkScreen({ inviteUrl, onBack, onShare, onCopy, copied = false, inviteeName }) {
  const url = inviteUrl || "golden://table/invite-preview";
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your table · invite link" title="send a seat." subtitle={inviteeName ? `An invitation for ${inviteeName}.` : "Share this link with someone you trust."} onBack={onBack} />
    <Card tone="dark"><div style={{ display: "flex", gap: 14, alignItems: "center" }}><SunMark size={52} mood="glow" /><div><div style={{ fontWeight: 800, fontSize: 18 }}>A place at the Table</div><div style={{ marginTop: 5, opacity: 0.78, lineHeight: 1.4 }}>Showed-up days, together. Your private practice stays private.</div></div></div></Card>
    <Card><div style={{ fontSize: 12, opacity: 0.65, marginBottom: 7 }}>INVITE LINK</div><div style={{ overflowWrap: "anywhere", fontFamily: "ui-monospace, monospace", fontSize: 13 }}>{url}</div></Card>
    <Notice tone="warning">Preview only · this link does not deliver an invitation or create a live Table membership.</Notice>
    <ScreenActions primary={onShare} primaryLabel="Share from this device" secondary={onCopy} secondaryLabel={copied ? "Copied" : "Copy link"} />
  </Page>;
}

export function TableInvitationLandingScreen({ tableName = "A Golden Table", inviterName = "Someone you know", onContinue, onDecline, onBack }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="you have a seat" title={`${inviterName} saved a place for you.`} subtitle={`They invited you to join ${tableName}.`} onBack={onBack} />
    <Card tone="dark"><div style={{ display: "flex", gap: 14, alignItems: "center" }}><SunMark size={58} mood="glow" /><div style={{ fontFamily: "'Manrope', Inter, sans-serif", fontSize: 19, fontWeight: 800 }}>{tableName}</div></div><p style={{ margin: "14px 0 0", lineHeight: 1.5 }}>A Table shares only whether each member showed up on a day. Doors, lesson progress, Guide questions, and reflections stay private.</p></Card>
    <BetaNote>Private beta · this invitation preview is device-local. Joining across accounts is not connected yet.</BetaNote>
    <ScreenActions primary={onContinue} primaryLabel="Review invitation" secondary={onDecline} secondaryLabel="Not now" />
  </Page>;
}

export function TableInviteResponseScreen({ inviterName = "your friend", tableName = "the Table", onBack, onAccept, onDecline, busy, error }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="invitation · your choice" title="would you like to join?" subtitle={`${inviterName} invited you to ${tableName}.`} onBack={onBack} />
    <Card><div style={{ display: "flex", gap: 14, alignItems: "center" }}><MemberAvatar name={inviterName} size={54} /><div><div style={{ fontWeight: 800, fontSize: 17 }}>{tableName}</div><div style={{ opacity: 0.7, marginTop: 4 }}>Up to six people · shared showed-up days</div></div></div><p style={{ margin: "15px 0 0", lineHeight: 1.5 }}>Accepting shares only your showed-up signal for each day. You can leave later. Your Door, lessons, Guide questions, and reflections remain private.</p></Card>
    {error && <Notice tone="warning">{error}</Notice>}
    <BetaNote />
    <ScreenActions primary={onAccept} primaryLabel={busy ? "Saving…" : "Accept invitation"} secondary={onDecline} secondaryLabel="Decline invitation" disabled={busy} />
  </Page>;
}

export function TableHomeScreen({ table, streak = 0, today, onBack, onInvite, onMember, onPending, onManage, onActivity, onStreak, onVoiceNote, onShowedUp, showedUp = false }) {
  const members = table?.members || [];
  const accepted = members.filter((member) => member.invitationStatus === "accepted");
  const pendingCount = members.filter((member) => member.invitationStatus === "invited").length;
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="together · your table" title={table?.name || "the people you keep."} subtitle={`${members.length}/6 seats · a quiet way to keep each other company`} onBack={onBack} />
    <Card tone="dark"><div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}><div><Pill tone="gold">shared streak</Pill><div style={{ marginTop: 8, fontFamily: "'Manrope', Inter, sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1 }}>{streak}<span style={{ fontSize: 17, marginLeft: 7 }}>day{streak === 1 ? "" : "s"}</span></div><div style={{ marginTop: 7, opacity: 0.75 }}>{streak ? "You are showing up together." : "A new rhythm can start today."}</div></div><SunMark size={74} mood="glow" /></div><div style={{ marginTop: 16 }}><Button variant="light" onClick={onStreak}>See the shared streak</Button></div></Card>
    <Card><div style={sectionHead}><span>THE TABLE · {accepted.length} HERE</span><span>{dateLabel(today)}</span></div><div style={{ display: "grid", gap: 2, marginTop: 10 }}>{members.map((member) => <MemberLine key={member.id} member={member} onClick={() => onMember?.(member)} detail={member.invitationStatus === "accepted" ? (table?.activity?.some((item) => item.memberId === member.id && item.date === today) ? "Showed up today" : "Not yet today") : undefined} />)}</div><div style={{ marginTop: 12 }}><Button variant="ghost" onClick={onActivity}>View Table activity</Button></div></Card>
    {pendingCount > 0 && <Card><Row title={`${pendingCount} invitation${pendingCount === 1 ? "" : "s"} waiting`} detail="See who has a seat saved" onClick={onPending} trailing="›" /></Card>}
    <Card><div style={{ fontWeight: 800, fontSize: 18 }}>A little note for the Table</div><p style={{ margin: "7px 0 12px", opacity: 0.72, lineHeight: 1.45 }}>A short voice note can stay here for seven days. Recording and playback are preview-only in this private beta.</p><Button variant="ghost" onClick={onVoiceNote}>Open voice notes</Button></Card>
    {members.length < 6 && <Button onClick={onInvite}>Invite someone · {6 - members.length} seat{members.length === 5 ? "" : "s"} left</Button>}
    <Button variant="ghost" onClick={onShowedUp} disabled={showedUp}>{showedUp ? "You showed up today ✓" : "I showed up today"}</Button>
    <Button variant="ghost" onClick={onManage}>Manage Table</Button>
    <BetaNote />
  </Page>;
}

export function TableMemberScreen({ member, table, onBack, onMessage, onRemove, onResend, isOwner = false }) {
  const status = member?.invitationStatus || "accepted";
  const days = (table?.activity || []).filter((item) => item.memberId === member?.id).length;
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your table · member" title={member?.name || "Table member"} subtitle={status === "accepted" ? "A seat at your Table" : `Invitation ${status}`} onBack={onBack} />
    <Card tone="dark"><div style={{ display: "flex", gap: 15, alignItems: "center" }}><MemberAvatar name={member?.name} size={66} /><div><Pill tone={status === "accepted" ? "gold" : "muted"}>{status}</Pill><div style={{ marginTop: 8, opacity: 0.75 }}>{days} showed-up day{days === 1 ? "" : "s"} recorded</div></div></div></Card>
    <Notice tone="muted">Table activity does not reveal this member’s Door, lesson progress, Guide questions, or reflections.</Notice>
    {status === "invited" && isOwner && <Button variant="ghost" onClick={() => onResend?.(member)}>Copy invitation link again</Button>}
    {status === "accepted" && <Button variant="ghost" onClick={() => onMessage?.(member)}>Send a voice note</Button>}
    {isOwner && member?.role !== "owner" && <Button variant="ghost" onClick={() => onRemove?.(member)}>Remove from Table</Button>}
    <BetaNote />
  </Page>;
}

export function TablePendingInvitesScreen({ members = [], onBack, onMember, onInvite }) {
  const pending = members.filter((member) => member.invitationStatus === "invited");
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your table · invitations" title="seats saved, answers pending." subtitle="No invitation counts as a yes until its person accepts." onBack={onBack} />
    {pending.length ? <Card>{pending.map((member) => <MemberLine key={member.id} member={member} onClick={() => onMember?.(member)} detail={member.invitedAt ? `Invited ${new Date(member.invitedAt).toLocaleDateString()}` : "Invitation waiting"} />)}</Card> : <Card><SunMark size={54} mood="glow" /><div style={{ fontWeight: 800, fontSize: 19, marginTop: 10 }}>No invitations waiting.</div><div style={{ marginTop: 6, opacity: 0.72 }}>Your seats are open for the people you choose.</div></Card>}
    <BetaNote>Private beta · invite delivery is not connected; these entries are saved on this device.</BetaNote>
    {onInvite && <Button onClick={onInvite}>Invite someone</Button>}
  </Page>;
}

export function TableManageScreen({ table, onBack, onRename, onInvite, onPending, onTransfer, onLeave, onDelete, isOwner = true }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your table · settings" title="keep the Table yours." subtitle="You choose who has a seat and what happens next." onBack={onBack} />
    <Card><Row title="Change Table name" detail={table?.name || "Your Table"} onClick={onRename} trailing="›" />{isOwner && <Row title="Invite someone" detail={`${Math.max(0, 6 - (table?.members?.length || 0))} seats available`} onClick={onInvite} trailing="›" />}<Row title="Pending invitations" detail="Review and manage saved invitations" onClick={onPending} trailing="›" /></Card>
    <Notice tone="muted">The Table is private beta and device-local. Membership changes are not shared with other accounts.</Notice>
    <Card>{isOwner ? <><Row title="Transfer ownership" detail="Choose another accepted member" onClick={onTransfer} trailing="›" /><Row title="Leave this Table" detail="Your seat will be removed" onClick={onLeave} trailing="›" /><Row title="Delete this Table" detail="Remove this local Table and its activity" onClick={onDelete} trailing="›" /></> : <Row title="Leave this Table" detail="Remove your seat from this local Table" onClick={onLeave} trailing="›" />}</Card>
  </Page>;
}

export function TableVoiceRecordScreen({ recipient = "your Table", onBack, onStart, recording = false, elapsedSeconds = 0, onStop }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="voice notes · private beta" title="leave a little note." subtitle={`For ${recipient}. Up to five minutes, then it expires after seven days.`} onBack={onBack} />
    <Card tone="dark"><div style={{ textAlign: "center", padding: "8px 0" }}><SunMark size={78} mood={recording ? "breathe" : "glow"} /><div style={{ fontFamily: "ui-monospace, monospace", fontSize: 28, marginTop: 12 }}>{String(Math.floor(elapsedSeconds / 60)).padStart(2, "0")}:{String(elapsedSeconds % 60).padStart(2, "0")}</div><div style={{ marginTop: 6, opacity: 0.72 }}>{recording ? "Recording preview" : "Ready when you are"}</div></div></Card>
    <Notice tone="warning">Preview only · this screen does not capture, upload, or store audio. Voice-note delivery is not connected.</Notice>
    {!recording ? <Button onClick={onStart}>Start recording preview</Button> : <Button onClick={onStop}>Stop preview</Button>}
    <BetaNote />
  </Page>;
}

export function TableVoiceReviewScreen({ durationSeconds = 0, recipient = "your Table", onBack, onPlay, onSend, onDelete }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="voice notes · review" title="your note is ready to review." subtitle={`For ${recipient} · ${Math.floor(durationSeconds / 60)}:${String(Math.floor(durationSeconds % 60)).padStart(2, "0")}`} onBack={onBack} />
    <Card><div style={{ display: "flex", alignItems: "center", gap: 13 }}><SunMark size={48} mood="glow" /><div><div style={{ fontWeight: 800 }}>Voice note preview</div><div style={{ opacity: 0.68, marginTop: 4 }}>Expires seven days after sending</div></div></div><Progress value={0} max={durationSeconds || 1} /></Card>
    <Notice tone="warning">No audio was captured in this build. The feature stores only duration and expiry metadata; playback and delivery are not connected.</Notice>
    <ScreenActions primary={onSend} primaryLabel="Save note preview" secondary={onPlay} secondaryLabel="Play preview" />
    {onDelete && <Button variant="ghost" onClick={onDelete}>Delete this preview</Button>}
  </Page>;
}

export function TableVoicePlayerScreen({ note, senderName = "A Table member", onBack, onPlay, onDelete, isOwner = false }) {
  const expired = note?.expiresAt && Date.parse(note.expiresAt) <= Date.now();
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="voice notes · Table" title={senderName} subtitle={expired ? "This note has expired." : "A small hello from your Table."} onBack={onBack} />
    <Card tone="dark"><div style={{ display: "flex", alignItems: "center", gap: 15 }}><MemberAvatar name={senderName} size={58} mood="glow" /><div><Pill tone="gold">{note?.durationSeconds ? `${Math.floor(note.durationSeconds / 60)}:${String(Math.floor(note.durationSeconds % 60)).padStart(2, "0")}` : "voice note"}</Pill><div style={{ marginTop: 8, opacity: 0.75 }}>{note?.expiresAt ? `Available until ${new Date(note.expiresAt).toLocaleDateString()}` : "Expires after seven days"}</div></div></div></Card>
    <Notice tone="warning">Preview only · no audio file or playback stream is connected. This record contains metadata only.</Notice>
    {!expired && <Button onClick={onPlay}>Play note preview</Button>}
    {isOwner && <Button variant="ghost" onClick={onDelete}>Delete note now</Button>}
    <BetaNote />
  </Page>;
}

export function TableSunConfirmScreen({ memberName = "you", date, onBack, onConfirm, alreadyRecorded = false }) {
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="today · the Table" title={alreadyRecorded ? "your sun is already here." : "you showed up."} subtitle={`${memberName} · ${dateLabel(date)}`} onBack={onBack} />
    <Card tone="dark"><div style={{ display: "grid", justifyItems: "center", textAlign: "center", padding: "12px 0" }}><SunMark size={108} mood="glow" /><div style={{ fontFamily: "'Manrope', Inter, sans-serif", fontWeight: 800, fontSize: 22, marginTop: 14 }}>{alreadyRecorded ? "Counted for today." : "A small signal, shared."}</div><div style={{ opacity: 0.75, marginTop: 7 }}>Only your showed-up day is shared with accepted Table members.</div></div></Card>
    <Notice tone="muted">This never shares your Door, lesson, Guide questions, reflection, or time spent.</Notice>
    <BetaNote>Private beta · activity stays on this device until Table sync is connected.</BetaNote>
    {!alreadyRecorded && <Button onClick={onConfirm}>Add my sun for today</Button>}
  </Page>;
}

export function TableActivityScreen({ table, members = table?.members || [], today, onBack, onMember }) {
  const activity = (table?.activity || []).slice().sort((a, b) => b.date.localeCompare(a.date));
  const byId = new Map(members.map((member) => [member.id, member]));
  const grouped = activity.reduce((groups, item) => {
    (groups[item.date] ||= []).push(item);
    return groups;
  }, {});
  const dates = Object.keys(grouped);
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="together · activity" title="small days, kept together." subtitle="The Table only shows who showed up. There are no ranks or comparisons." onBack={onBack} />
    {dates.length ? dates.map((date) => <Card key={date}><div style={sectionHead}><span>{dateLabel(date)}</span><Pill tone={date === today ? "gold" : "muted"}>{grouped[date].length} showed up</Pill></div><div style={{ display: "grid", gap: 4, marginTop: 10 }}>{grouped[date].map((item) => <MemberLine key={item.memberId} member={byId.get(item.memberId) || { id: item.memberId, name: "Table member", invitationStatus: "accepted" }} onClick={() => onMember?.(byId.get(item.memberId))} detail="Showed up" />)}</div></Card>) : <Card><SunMark size={56} mood="glow" /><div style={{ fontWeight: 800, fontSize: 19, marginTop: 10 }}>The first day is yours to begin.</div><div style={{ marginTop: 6, opacity: 0.7 }}>When a member chooses to share a sun, it will appear here.</div></Card>}
    <BetaNote />
  </Page>;
}

export function TableStreakScreen({ table, streak = 0, today, onBack, onShare }) {
  const dates = new Set((table?.activity || []).map((item) => item.date));
  const cursor = today ? new Date(`${today}T12:00:00`) : new Date();
  const recent = Array.from({ length: 14 }, (_, offset) => {
    const date = new Date(cursor);
    date.setDate(date.getDate() - (13 - offset));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { key, day: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), active: dates.has(key) };
  });
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your Table · shared streak" title={`${streak} day${streak === 1 ? "" : "s"}, together.`} subtitle="A streak is just a record of days when at least one person showed up." onBack={onBack} />
    <Card tone="dark"><div style={{ display: "grid", justifyItems: "center", padding: "10px 0" }}><SunMark size={92} mood="glow" /><div style={{ fontFamily: "'Manrope', Inter, sans-serif", fontSize: 56, fontWeight: 800, marginTop: 8 }}>{streak}</div><div style={{ opacity: 0.75 }}>shared days in a row</div></div><div style={{ display: "grid", gridTemplateColumns: "repeat(14,1fr)", gap: 5, marginTop: 20 }}>{recent.map((item) => <div key={item.key} style={{ display: "grid", justifyItems: "center", gap: 5 }}><div aria-label={item.active ? `${item.key}, someone showed up` : `${item.key}, no shared activity`} style={{ width: "100%", aspectRatio: "1", minWidth: 12, borderRadius: "50%", background: item.active ? "#EEFF6A" : "#414141" }}>{item.active && <span style={{ display: "block", textAlign: "center", color: "#0A0A0A", lineHeight: "24px" }}>☼</span>}</div><span style={{ fontSize: 9, opacity: 0.7 }}>{item.day}</span></div>)}</div></Card>
    <Notice tone="muted">Every member chooses what to share. Missed days are not a judgment, and personal practice stays private.</Notice>
    <BetaNote />
    {onShare && <Button variant="ghost" onClick={onShare}>Share this moment</Button>}
  </Page>;
}

export function TableLeaveScreen({ table, onBack, onLeave, isOwner = false }) {
  return <DestructiveScreen eyebrow="your Table · leave" title="leave this Table?" subtitle={`You are about to leave ${table?.name || "your Table"}.`} onBack={onBack} action={onLeave} actionLabel={isOwner ? "Leave after transferring ownership" : "Leave Table"}>
    <p style={{ margin: 0, lineHeight: 1.5 }}>Your seat and future shared activity will be removed from this device. {isOwner ? "The Table needs another owner before you leave." : "The other members can still keep their Table."}</p>
    {isOwner && <Notice tone="warning">Choose an accepted member to take ownership before leaving.</Notice>}
  </DestructiveScreen>;
}

export function TableTransferScreen({ members = [], onBack, onTransfer, currentOwner, error }) {
  const candidates = members.filter((member) => member.role !== "owner" && member.invitationStatus === "accepted");
  const [selected, setSelected] = useState("");
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your Table · ownership" title="choose the next keeper." subtitle="Only an accepted member can take ownership." onBack={onBack} />
    <Card>{candidates.length ? candidates.map((member) => <div key={member.id} onClick={() => setSelected(member.id)} role="button" tabIndex={0} onKeyDown={(event) => (event.key === "Enter" || event.key === " ") && setSelected(member.id)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 2px", borderBottom: "1px solid #E3E3DE", cursor: "pointer" }}><MemberAvatar name={member.name} size={42} /><div style={{ flex: 1 }}><div style={{ fontWeight: 800 }}>{member.name}</div><div style={{ opacity: 0.65, fontSize: 12 }}>{member.role === "owner" ? "Current owner" : "Accepted member"}</div></div><input type="radio" name="table-owner" checked={selected === member.id} onChange={() => setSelected(member.id)} aria-label={`Make ${member.name} the owner`} /></div>) : <p style={{ margin: 0 }}>There are no other accepted members yet. Invite someone and wait for them to accept before transferring ownership.</p>}</Card>
    {error && <Notice tone="warning">{error}</Notice>}
    <BetaNote>Private beta · ownership transfer is a local preview and does not affect another account.</BetaNote>
    <Button onClick={() => onTransfer?.(selected)} disabled={!selected}>Transfer to selected member</Button>
    {currentOwner && <div style={{ textAlign: "center", opacity: 0.6 }}>Current owner: {currentOwner}</div>}
  </Page>;
}

export function TableDeleteScreen({ table, onBack, onDelete, typedConfirmation = true }) {
  const [confirmText, setConfirmText] = useState("");
  const confirmed = typedConfirmation ? confirmText === "DELETE" : true;
  return <Page tone="cream" scroll style={pageStyle}>
    <TableHeader eyebrow="your Table · delete" title="delete this Table?" subtitle="This removes this Table and its activity from this device." onBack={onBack} />
    <Card tone="dark"><div style={{ fontWeight: 800, fontSize: 20 }}>{table?.name || "Your Table"}</div><div style={{ opacity: 0.75, marginTop: 6 }}>{table?.members?.length || 0} members · {table?.activity?.length || 0} shared days · {table?.voiceNotes?.length || 0} voice-note records</div></Card>
    <Notice tone="warning">This cannot be undone on this device. Other accounts are not affected because Table sync is not connected.</Notice>
    {typedConfirmation && <label style={{ display: "grid", gap: 7, fontWeight: 700 }}>Type DELETE to confirm<input value={confirmText} onChange={(event) => setConfirmText(event.target.value)} autoCapitalize="characters" style={inputStyle} /></label>}
    <BetaNote />
    <Button variant="ghost" onClick={onDelete} disabled={!confirmed} style={{ borderColor: "#A72F24", color: "#A72F24" }}>Delete this Table</Button>
  </Page>;
}

function DestructiveScreen({ eyebrow, title, subtitle, onBack, children, action, actionLabel }) {
  return <Page tone="cream" scroll style={pageStyle}><TableHeader eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} /><Card>{children}</Card><BetaNote /><Button variant="ghost" onClick={action} style={{ borderColor: "#A72F24", color: "#A72F24" }}>{actionLabel}</Button></Page>;
}

const inputStyle = { boxSizing: "border-box", width: "100%", minHeight: 48, border: "1.5px solid #0A0A0A", borderRadius: 14, padding: "11px 13px", background: "#fff", color: "#0A0A0A", font: "inherit", outlineOffset: 3 };
const sectionHead = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 10, letterSpacing: "0.14em", fontWeight: 700, textTransform: "uppercase", opacity: 0.62 };
