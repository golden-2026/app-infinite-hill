import React from 'react';
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
} from '../ui/GoldenUI.jsx';
import {
  DOOR_CATALOG,
  getDoor,
  getSession,
  getSessionAvailability,
  listDoorSessions,
} from '../content/catalog.js';

export const CURRICULUM_SCREEN_IDS = Object.freeze([
  'mountain-map',
  'camp-detail',
  'lesson-preview',
  'lesson-coming',
  'placement-result',
  'strand-library',
  'word-detail',
  'review-hub',
  'review-result',
  'festival-arrival',
  'festival-detail',
  'lineage-choice',
  'milestone-note',
  'ambassador-position',
]);

const DOOR_LABEL = (door) => getDoor(door)?.label || 'Your door';
const lessonName = (session) => session?.title || `Lesson ${session?.lesson || ''}`.trim();
const formatCount = (value) => Number.isFinite(value) ? Math.max(0, value) : 0;
const statusLabel = (session) => session?.canPreview
  ? 'manuscript preview · review pending'
  : 'coming · manuscript not supplied';

function Shell({ eyebrow, title, subtitle, onBack, children, tone = 'cream' }) {
  return <Page tone={tone} scroll style={{ paddingBottom: 24 }}>
    <style>{`
      .golden-screen-stack { display: grid; gap: 12px; padding: 0 18px 14px; }
      .golden-screen-row { display: flex; align-items: center; gap: 14px; }
      .golden-screen-between { justify-content: space-between; }
      .golden-screen-lede { margin: 10px 0 0; font-family: Manrope, Inter, system-ui, sans-serif; font-size: 19px; font-weight: 750; letter-spacing: -.025em; line-height: 1.2; }
      .golden-screen-card-title { margin: 8px 0 0; font-family: Manrope, Inter, system-ui, sans-serif; font-size: 18px; font-weight: 750; letter-spacing: -.02em; }
      .golden-screen-muted { margin: 6px 0 0; color: #6B6B6B; font-size: 12px; line-height: 1.45; }
      .golden-screen-dark .golden-screen-muted { color: #C8C8C0; }
      .golden-screen-footnote { margin: 7px 0 0; color: #6B6B6B; font-size: 10px; letter-spacing: .07em; text-transform: uppercase; }
      .golden-screen-copy { margin: 12px 0 0; font-size: 14px; line-height: 1.6; }
      .golden-screen-word { margin: 12px 0 0; font-family: Manrope, Inter, system-ui, sans-serif; font-size: 40px; font-weight: 800; letter-spacing: -.04em; }
      .golden-screen-arrow { font-family: Georgia, serif; font-size: 28px; }
      .golden-screen-center { display: grid; justify-items: center; gap: 12px; padding: 10px 0; text-align: center; }
      .golden-screen-node { width: 36px; height: 36px; flex: 0 0 36px; display: inline-flex; align-items: center; justify-content: center; border: 1.5px solid #0A0A0A; border-radius: 50%; background: #FFFFFF; color: #0A0A0A; font-size: 11px; font-weight: 700; }
      .golden-screen-node.is-current { background: #EEFF6A; }
      .golden-screen-node.is-done { background: #0A0A0A; color: #EEFF6A; }
      .golden-screen-beads { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 0 18px 16px; }
      .golden-screen-bead { display: grid; gap: 5px; min-height: 78px; align-content: center; border: 1.5px solid #0A0A0A; border-radius: 18px; padding: 12px; background: #FFFFFF; color: #0A0A0A; text-align: left; cursor: pointer; }
      .golden-screen-bead span { font-family: Manrope, Inter, system-ui, sans-serif; font-size: 17px; font-weight: 750; }
      .golden-screen-bead small { color: #6B6B6B; font-size: 10px; }
      main > section, main > button { margin: 0 18px 12px; width: calc(100% - 36px); }
      main > section[role="status"] { margin-top: 0; }
      main > [role="status"] { margin: 0 18px 12px; }
    `}</style>
    <Header eyebrow={eyebrow} title={title} subtitle={subtitle} onBack={onBack} />
    {children}
  </Page>;
}

/** Full first-year mountain map with the outlined Ranges clearly separated. */
export function MountainMapScreen({
  door = 'HINDUISM',
  currentLesson = 1,
  completedLessons = [],
  onBack,
  onCamp,
  onRanges,
}) {
  const catalogDoor = getDoor(door);
  const completed = new Set(completedLessons);
  const sessions = listDoorSessions(door);
  return <Shell
    eyebrow={`${DOOR_LABEL(door)} · your mountain`}
    title="The whole path."
    subtitle="Every camp is on the map from day one. You can see what is here and what is still being written."
    onBack={onBack}
  >
    <Card dark className="golden-screen-dark">
      <div className="golden-screen-row">
        <div><Pill tone="gold">year one · mapped</Pill><p className="golden-screen-lede">Five camps, one step at a time.</p></div>
        <SunMark size={48} mood="calm" />
      </div>
      <Progress dark value={completed.size} max={catalogDoor?.mappedSessions || 1} />
      <p className="golden-screen-muted">{completed.size} of {catalogDoor?.mappedSessions || 0} mapped lessons completed</p>
    </Card>

    <div className="golden-screen-stack" aria-label="Year one camps">
      {(catalogDoor?.camps || []).map((camp) => {
        const campSessions = sessions.filter((session) => session.camp === camp.camp);
        const authored = campSessions.filter((session) => session.canPreview).length;
        const done = campSessions.filter((session) => completed.has(session.lesson)).length;
        const firstLesson = campSessions[0]?.lesson || 1;
        return <Card key={camp.camp} onClick={onCamp ? () => onCamp(camp.camp) : undefined}>
          <div className="golden-screen-row golden-screen-between">
            <div>
              <Pill tone={camp.camp === getSession(door, currentLesson)?.camp ? 'gold' : 'quiet'}>camp {camp.camp}</Pill>
              <h2 className="golden-screen-card-title">{camp.name}</h2>
              <p className="golden-screen-muted">{camp.sessionCount} mapped lessons · {authored} manuscript previews</p>
            </div>
            <span className="golden-screen-arrow" aria-hidden="true">›</span>
          </div>
          <Progress value={done} max={camp.sessionCount || 1} />
          <p className="golden-screen-footnote">{done ? `${done} complete` : `starts at lesson ${firstLesson}`} · {authored ? 'preview text supplied' : 'content coming'}</p>
        </Card>;
      })}
    </div>

    <Card onClick={onRanges}>
      <div className="golden-screen-row golden-screen-between">
        <div><Pill tone="quiet">years 2–5 · outlined</Pill><h2 className="golden-screen-card-title">The Ranges</h2>
          <p className="golden-screen-muted">The longer view is here. The full lesson catalog is still being built.</p></div>
        <span className="golden-screen-arrow" aria-hidden="true">›</span>
      </div>
      <Notice tone="warning">Range outlines are not playable lessons. Missing catalog sections will not be filled with generated teaching.</Notice>
    </Card>
  </Shell>;
}

/** Lessons in a camp retain catalog order and show manuscript state per stop. */
export function CampDetailScreen({ door = 'HINDUISM', camp = 1, currentLesson = 1, completedLessons = [], onBack, onLesson }) {
  const campMeta = getDoor(door)?.camps.find((item) => item.camp === camp);
  const completed = new Set(completedLessons);
  const sessions = listDoorSessions(door, { camp });
  return <Shell eyebrow={`${DOOR_LABEL(door)} · year one`} title={campMeta?.name || `Camp ${camp}`} subtitle={`${sessions.length} mapped stops. Preview text appears only when a supplied manuscript exists.`} onBack={onBack}>
    <Card dark className="golden-screen-dark"><Pill tone="gold" dark>camp {camp}</Pill><p className="golden-screen-lede">A small practice, returned to often.</p><Progress dark value={sessions.filter((session) => completed.has(session.lesson)).length} max={sessions.length || 1} /></Card>
    {sessions.map((session) => {
      const isCurrent = session.lesson === currentLesson;
      return <Card key={session.id} onClick={() => onLesson?.(session.lesson)}>
        <Row
          title={lessonName(session)}
          detail={`lesson ${session.lesson} · ${statusLabel(session)}`}
          leading={<span className={`golden-screen-node ${completed.has(session.lesson) ? 'is-done' : isCurrent ? 'is-current' : ''}`}>{completed.has(session.lesson) ? '✓' : session.lesson}</span>}
          trailing={<Pill tone={session.canPreview ? 'gold' : 'quiet'}>{session.canPreview ? 'preview' : 'coming'}</Pill>}
          onClick={() => onLesson?.(session.lesson)}
        />
      </Card>;
    })}
    {!sessions.length && <Notice tone="warning">This camp has no mapped sessions in the supplied catalog.</Notice>}
  </Shell>;
}

/** A supplied manuscript can be previewed with its pending review status visible. */
export function LessonPreviewScreen({ door = 'HINDUISM', lesson = 1, onBack, onBegin, onGuide }) {
  const session = getSession(door, lesson);
  const availability = getSessionAvailability(door, lesson);
  if (!availability.canPreview || !session) {
    return <LessonComingScreen door={door} lesson={lesson} onBack={onBack} onGuide={onGuide} />;
  }
  const teach = session.segments.find((segment) => segment.type === 'the teach');
  const practice = session.segments.find((segment) => segment.type === 'the practice');
  return <Shell eyebrow={`${DOOR_LABEL(door)} · camp ${session.camp} · lesson ${session.lesson}`} title={lessonName(session)} subtitle={session.word ? `Today's word: ${session.word}` : 'A supplied manuscript preview.'} onBack={onBack}>
    <Card dark className="golden-screen-dark">
      <div className="golden-screen-row golden-screen-between"><Pill tone="gold">local manuscript preview</Pill><SunMark size={42} mood="calm" /></div>
      <p className="golden-screen-muted">Not approved for public release</p>
      {session.carry && <p className="golden-screen-lede">“{session.carry}”</p>}
    </Card>
    <Notice tone="warning">Keeper review and voice recording rights are pending. This supplied draft is for preview only.</Notice>
    {teach?.voice && <Card><Pill tone="quiet">from the supplied teaching</Pill><p className="golden-screen-copy">{teach.voice}</p></Card>}
    {practice?.voice && <Card><Pill tone="quiet">practice · supplied manuscript</Pill><p className="golden-screen-copy">{practice.voice}</p></Card>}
    <Card><p className="golden-screen-muted">{session.length ? `about ${session.length}` : 'lesson preview'} · camp {session.camp}</p>
      <div className="golden-screen-stack"><Button onClick={() => onBegin?.(session.lesson)}>Open this preview</Button><Button variant="ghost" onClick={onGuide}>Ask the Guide about this lesson</Button></div>
    </Card>
  </Shell>;
}

/** Missing lessons are an honest map stop, with no generated teaching. */
export function LessonComingScreen({ door = 'HINDUISM', lesson = 1, onBack, onGuide }) {
  const session = getSession(door, lesson);
  const availability = getSessionAvailability(door, lesson);
  return <Shell eyebrow={`${DOOR_LABEL(door)} · lesson ${lesson}`} title={session ? lessonName(session) : 'This stop is not mapped yet.'} subtitle="You can see the path ahead without being shown a lesson that has not been supplied." onBack={onBack}>
    <Card dark className="golden-screen-dark"><Pill tone="gold" dark>coming · outline only</Pill><p className="golden-screen-lede">The manuscript is still on its way.</p><p className="golden-screen-muted">{session?.campName || 'This lesson'} · {session?.word ? `word: ${session.word}` : 'no authored lesson text'}</p></Card>
    <Notice tone="warning">No lesson text is available for this stop. Golden will not invent a teaching or practice.</Notice>
    {!availability.canPreview && <Card><p className="golden-screen-muted">When reviewed source text is supplied, this map stop can open as a manuscript preview. Supplied previews also remain pending Keeper and voice approval.</p><Button variant="ghost" onClick={onGuide}>Explore the path with the Guide</Button></Card>}
  </Shell>;
}

/** Placement changes the lesson position only; it does not award practice days. */
export function PlacementResultScreen({ door = 'HINDUISM', lesson = 1, correct = 0, total = 0, message, onBack, onStart }) {
  const target = getSession(door, lesson);
  return <Shell eyebrow={`${DOOR_LABEL(door)} · placement`} title="Here’s where to begin." subtitle={message || 'Your answers suggest a starting point. You can change your position later.'} onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-row"><SunMark size={58} mood="happy" /><div><Pill tone="gold" dark>recommended start</Pill><p className="golden-screen-lede">{target ? `Lesson ${target.lesson} · ${lessonName(target)}` : `Lesson ${lesson}`}</p></div></div>
      {total > 0 && <p className="golden-screen-muted">{correct} of {total} answers matched</p>}
    </Card>
    <Notice>Placement sets your lesson position. Your showed-up days begin when you practice, and day one still counts as day one.</Notice>
    {target && <Card><Pill tone={target.canPreview ? 'gold' : 'quiet'}>{target.canPreview ? 'manuscript preview available' : 'lesson coming'}</Pill><p className="golden-screen-copy">{target.canPreview ? 'The supplied manuscript is a local preview and has not passed Keeper or voice approval.' : 'This stop is mapped, but its manuscript has not been supplied.'}</p></Card>}
    <Button onClick={() => onStart?.(lesson)}>Go to my starting point</Button>
  </Shell>;
}

/** Earned words, presented as the user's collected strand. */
export function StrandLibraryScreen({ door = 'HINDUISM', words = [], onBack, onWord, onReview }) {
  const usableWords = words.filter((word) => typeof word?.word === 'string' && word.word.trim());
  return <Shell eyebrow={`${DOOR_LABEL(door)} · your strand`} title="Words you’ve kept." subtitle="Each bead comes from a lesson you completed. Tap one to return to its meaning." onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-row"><SunMark size={48} mood="calm" /><div><Pill tone="gold" dark>your strand</Pill><p className="golden-screen-lede">{usableWords.length} {usableWords.length === 1 ? 'word' : 'words'}</p></div></div></Card>
    {usableWords.length ? <div className="golden-screen-beads">{usableWords.map((item) => <button className="golden-screen-bead" key={item.id || `${item.word}-${item.lesson}`} type="button" onClick={() => onWord?.(item)}>
      <span>{item.word}</span><small>{item.title || `lesson ${item.lesson}`}</small>
    </button>)}</div> : <Card><p className="golden-screen-lede">Your first word will land here.</p><p className="golden-screen-muted">Finish a preview lesson to add its supplied word to the strand.</p></Card>}
    {usableWords.length > 0 && <Button onClick={onReview}>Review words</Button>}
  </Shell>;
}

export function WordDetailScreen({ door = 'HINDUISM', item, onBack, onLesson, onReview }) {
  const session = item?.lesson ? getSession(door, item.lesson) : null;
  return <Shell eyebrow={`${DOOR_LABEL(door)} · your strand`} title={item?.word || 'A word from your path'} subtitle={item?.title || session?.title || 'An earned word'} onBack={onBack}>
    <Card dark className="golden-screen-dark"><Pill tone="gold" dark>{item?.due ? 'ready to revisit' : 'earned on your path'}</Pill><p className="golden-screen-word">{item?.word || session?.word || '✦'}</p>
      {item?.meaning && <p className="golden-screen-lede">{item.meaning}</p>}
    </Card>
    {session?.carry && <Card><Pill tone="quiet">line to carry</Pill><p className="golden-screen-lede">“{session.carry}”</p></Card>}
    {session && <Card><p className="golden-screen-muted">lesson {session.lesson} · {session.canPreview ? 'supplied manuscript preview' : 'mapped lesson'}</p><Button variant="ghost" onClick={() => onLesson?.(session.lesson)}>Return to this lesson</Button></Card>}
    <Button onClick={onReview}>Practice this word</Button>
  </Shell>;
}

/** Review hub and review result share only user-owned earned words. */
export function ReviewHubScreen({ words = [], onBack, onStart, onWord }) {
  const due = words.filter((item) => item.due || item.dueDate);
  const selected = (due.length ? due : words).slice(0, 3);
  return <Shell eyebrow="your strand · review" title="Keep the words." subtitle="A short return to words you have already earned. No hearts, no penalty." onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-row"><SunMark size={52} mood="calm" /><div><Pill tone="gold" dark>{selected.length} to revisit</Pill><p className="golden-screen-lede">A minute or two, at your pace.</p></div></div></Card>
    {selected.length ? selected.map((item) => <Card key={item.id || item.word}><Row title={item.word} detail={item.title || `lesson ${item.lesson}`} leading={<span className="golden-screen-node">✦</span>} trailing={<Pill tone="quiet">bead</Pill>} onClick={() => onWord?.(item)} /></Card>) : <Card><p className="golden-screen-lede">Your strand is ready when you are.</p><p className="golden-screen-muted">Complete a lesson to add a word for a future review.</p></Card>}
    <Button disabled={!selected.length} onClick={() => onStart?.(selected)}>Review {selected.length} {selected.length === 1 ? 'word' : 'words'}</Button>
  </Shell>;
}

export function ReviewResultScreen({ remembered = 0, total = 0, onBack, onAgain }) {
  const count = formatCount(total);
  const recalled = Math.min(formatCount(remembered), count);
  return <Shell eyebrow="your strand · review" title={`${recalled} of ${count}. Still yours.`} subtitle={recalled === count ? 'These words can wait a little longer before they return.' : 'The words you missed can come back sooner. Nothing is lost.'} onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-center"><SunMark size={72} mood="glow" /><Pill tone="gold" dark>review complete</Pill><p className="golden-screen-lede">Every return is practice.</p></div></Card>
    <Progress value={recalled} max={count || 1} />
    <Button onClick={onAgain}>Back to the path</Button>
  </Shell>;
}

/** Festivals remain previews until dates, hosts, and approved sessions exist. */
export function FestivalArrivalScreen({ door = 'HINDUISM', festival, onBack, onOpen }) {
  const available = Boolean(festival && festival.title);
  return <Shell eyebrow={`${DOOR_LABEL(door)} · festival`} title={available ? `A festival is near.` : 'A festival stop is on the map.'} subtitle={available ? festival.dateLabel || 'A seasonal moment on your path' : 'Festival dates and reviewed sessions have not been connected yet.'} onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-row"><SunMark size={54} mood="glow" /><div><Pill tone="gold" dark>festival preview</Pill><p className="golden-screen-lede">{available ? festival.title : 'A moment to pause and notice.'}</p></div></div></Card>
    <Notice tone="warning">Festival calendar and session providers are not connected. This preview does not announce an event or a live gathering.</Notice>
    {available && <Button onClick={() => onOpen?.(festival)}>Explore this festival preview</Button>}
  </Shell>;
}

export function FestivalDetailScreen({ door = 'HINDUISM', festival, onBack }) {
  const title = festival?.title || 'Festival preview';
  return <Shell eyebrow={`${DOOR_LABEL(door)} · festival preview`} title={title} subtitle={festival?.dateLabel || 'Date not verified'} onBack={onBack}>
    <Card dark className="golden-screen-dark"><Pill tone="gold" dark>preview · not an event listing</Pill><p className="golden-screen-lede">{festival?.description || 'A festival session can appear here after a reviewed source and date are supplied.'}</p></Card>
    <Notice tone="warning">No festival lesson or gathering is represented as approved or connected here.</Notice>
    {festival?.source && <Card><Pill tone="quiet">source</Pill><p className="golden-screen-muted">{festival.source}</p></Card>}
  </Shell>;
}

/** Only the documented Hinduism Camp 5 branches are offered as lineage choices. */
export function LineageChoiceScreen({ door = 'HINDUISM', choice, onBack, onChoose }) {
  const branches = door === 'HINDUISM' ? [
    ['karma', 'the path of action'],
    ['bhakti', 'the path of devotion'],
    ['jnana', 'the path of understanding'],
  ] : [];
  return <Shell eyebrow={`${DOOR_LABEL(door)} · your path`} title="Choose a way through." subtitle="This choice personalizes later lessons. Your progress carries over if you change it." onBack={onBack}>
    {branches.length ? branches.map(([id, description]) => <Card key={id} onClick={() => onChoose?.(id)}>
      <Row title={id} detail={description} leading={<span className="golden-screen-node">{choice === id ? '✓' : '·'}</span>} trailing={<Pill tone={choice === id ? 'gold' : 'quiet'}>{choice === id ? 'chosen' : 'choose'}</Pill>} onClick={() => onChoose?.(id)} />
    </Card>) : <Notice tone="warning">A lineage choice has not been specified for this door in the supplied curriculum.</Notice>}
    <Card><p className="golden-screen-muted">The documented Hinduism branches are karma, bhakti, and jnana. Other doors will show a choice only when their reviewed curriculum defines one.</p></Card>
  </Shell>;
}

export function MilestoneNoteScreen({ door = 'HINDUISM', milestone, note, onBack, onContinue }) {
  const count = Number.isFinite(milestone?.count) ? milestone.count : null;
  return <Shell eyebrow={`${DOOR_LABEL(door)} · a moment to keep`} title={milestone?.title || 'You made it here.'} subtitle={count == null ? 'A milestone in your practice' : `${count} lessons completed`} onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-center"><SunMark size={66} mood="happy" /><Pill tone="gold" dark>{milestone?.label || 'milestone'}</Pill>
      <p className="golden-screen-lede">{note || 'You showed up. Let that be enough for today.'}</p></div></Card>
    <Notice>This is a local reflection. No Keeper note, recording, or message delivery is implied.</Notice>
    {milestone?.word && <Card><Pill tone="quiet">a word from your strand</Pill><p className="golden-screen-lede">{milestone.word}</p></Card>}
    <Button onClick={onContinue}>Continue on the path</Button>
  </Shell>;
}

/** Ambassador placement is shown as preview data until a live account is supplied. */
export function AmbassadorPositionScreen({ door = 'HINDUISM', ambassador, onBack, onOpenStrand }) {
  const hasVerifiedPosition = ambassador?.connected === true && Number.isFinite(ambassador?.showedUp);
  return <Shell eyebrow={`${DOOR_LABEL(door)} · read by`} title={ambassador?.name || 'Your Ambassador'} subtitle="A person who walks this door with you." onBack={onBack}>
    <Card dark className="golden-screen-dark"><div className="golden-screen-row"><SunMark size={54} mood="calm" /><div><Pill tone="gold" dark>{hasVerifiedPosition ? 'position shared by the Ambassador' : 'position preview'}</Pill>
      <p className="golden-screen-lede">{hasVerifiedPosition ? `${ambassador.showedUp} days showed up` : 'Their practice position is not connected yet.'}</p></div></div>
      {ambassador?.position && <p className="golden-screen-muted">{ambassador.position}</p>}
    </Card>
    <Notice tone="warning">A real Ambassador position requires an account and verified practice data. Any sample profile details remain a preview.</Notice>
    {ambassador?.quote && <Card><Pill tone="quiet">supplied profile quote · preview</Pill><p className="golden-screen-copy">“{ambassador.quote}”</p></Card>}
    <Button variant="ghost" onClick={onOpenStrand}>See your strand</Button>
  </Shell>;
}

export const CURRICULUM_DOORS = Object.freeze(DOOR_CATALOG.map((door) => door.id));
