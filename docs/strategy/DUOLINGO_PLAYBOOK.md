# The Duolingo playbook, read for Infinite Hill

As of 2026-10-01. This is a living document: add new rows as Duolingo publishes new letters, posts and talks.

**Summary (5 lines)**

1. Duolingo grew by keeping the people it already had. Getting more of yesterday's users to come back today mattered about five times more than anything else they measured.
2. The streak (with "freezes" that forgive a missed day), friend streaks, weekly leaderboards and a small number of well-written reminders did most of that work. Each one was tested and then tuned in small steps.
3. They check every change two ways: did people come back, and did they actually learn? They have dropped changes that made money but drove people away.
4. Their mistakes are public: copied game mechanics that fell flat, a referral program that barely moved, an "AI-first" memo that angered users, and charging too much for things the free version should include.
5. For us: borrow the habit mechanics and the testing habit, write every word ourselves, keep prayer and scripture screens free of ads and guilt, stay private by default, and put our real advantage (Keepers, celebrity voices, faith communities) at the moments that bring people back.

How to read the tables. "For Infinite Hill" says where we stand today, from the code in this repository:
**applied** (built), **partly** (built but not switched on, or only part of it), **not yet**, or **don't adopt** (wrong for a faith app).
Numbers come from pages we opened. Anything from memory is marked *unverified*. Numbers marked *computed* are our own sums of figures from the linked page.

---

## 1. Growth model and metrics

| Lesson (one plain sentence) | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Sort every person, every day, into one of a few states: new, current, came back after a week, came back after a month, slipping, gone. | Seven states, none overlapping. In 2023, 90% of daily users were "current" users. | [Duolingo blog: Meaningful metrics](https://blog.duolingo.com/growth-model-duolingo/) | not yet | Count the same states from opt-in, anonymous, number-only events (we already send `day_returned`). No door names, no beliefs. |
| The single biggest lever is the share of yesterday's users who come back today. They call it CURR. | CURR had 5x the effect on daily users of the next-best number. Raising it cut daily churn by more than 40% and helped grow daily users 4.5x in four years. | [Jorge Mazal, Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | not yet | Make "came back today" our headline number in every weekly review, ahead of signups. |
| Focusing on current users meant deliberately not chasing new-user retention first. | Mazal names this as one of the biggest benefits of the focus. | [Mazal, Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | partly | Keep the first-week flow good, but put most effort into people already in their first month. |
| How often monthly users show up daily has roughly doubled over five years. | Daily ÷ monthly users went from 19% to 22% (2019 to 2020). In Q2 2026 it was 58.7M ÷ 140.6M, about 42% (*computed*). Current-user return rate is at an all-time high of 84%. | [S-1 (2021)](https://www.sec.gov/Archives/edgar/data/1562088/000162828021013065/duolingos-1.htm); [Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) | not yet | Use 20% as a "we have a habit product" floor and 40% as the best-in-class mark. |
| Most growth came from word of mouth, not ads. | About 90% of 2020 growth came from organic sources. | [S-1 (2021)](https://www.sec.gov/Archives/edgar/data/1562088/000162828021013065/duolingos-1.htm) | partly | Lantern links and share cards already exist (`lib/share-card.ts`, `lib/walkers.ts`). Measure how many new people arrive through them. |
| A slow app quietly loses people before the first screen. | On cheap Android phones, people waiting 5+ seconds at startup fell from 39% to 8%, worth "hundreds of thousands" of daily users. Delaying ads saved 20,000 people a day from quitting before they got in. | [Duolingo blog: Android performance](https://blog.duolingo.com/android-app-performance/) | partly | The app is code-split and caches for offline use. Time the first open on a cheap phone over 3G and set a budget for it. |

## 2. Retention mechanics

### Streaks and freezes

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| The first week of a streak matters most. | People who reach a 7-day streak are 3.6x more likely to finish their course. | [Duolingo blog: streak and habit research](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) | applied | The streak screen and goal offer exist (`app/done/lit.tsx`, `app/done/goal.tsx`). Make day 7 a real moment. |
| Celebrate milestone days with special animations. | Milestone animations raised 7-day retention for new learners by 1.7%. | [same post](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) | applied | Milestones at 3, 7, 14, 30, 50, 100, 365 (`packages/domain/src/streak.js`) with the sunrise (`app/done/light.tsx`). |
| Forgiveness keeps streaks alive: a little slack motivates more than rigid rules. | Letting people hold two freezes instead of one raised daily active learners by 0.38%. | [same post](https://blog.duolingo.com/how-duolingo-streak-builds-habit/) | applied | Rest days: start with 2, earn 1 back every 7 days, spent automatically, shown as soft moons and never red. |
| Around 10 days, a streak starts protecting itself. | A 10-day streak lined up with much lower dropout. 7+ day streaks tripled and now make up more than half of daily users. | [Mazal, Lenny's Newsletter](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | applied | Our goal ladder starts at 7. Consider a gentle "10 days" note. |
| Weekends are weak days. A weekend pass helped. | Use drops 5–10% on weekends. A Friday "weekend amulet" made people 4% more likely to return a week later and 5% less likely to lose their streak. | [Duolingo blog: how streaks keep learners committed (2017)](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/) | partly | Rest days cover this generally. Next: rest days that know each tradition's holy day (Shabbat, Friday prayer, Sunday) so the day of rest never costs anything. |
| Betting your streak (a "wager") lifts early return a lot. | The streak wager raised day-7 retention by 14%. | [same 2017 post](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/) | don't adopt | No betting on prayer. The free "earn it back" (two lessons within 3 days) does the same job without stakes. |
| Never let your own outage break someone's streak. | Their "Big Red Button" had protected more than 2 million streaks by 2021. | [Duolingo blog: protecting streaks](https://blog.duolingo.com/protecting-streaks-from-site-issues/) | applied | Our streak is worked out on the phone from local dates, so a server outage can't break it. Keep it that way. |
| Bring someone back after a lapse with a big, shared moment. | The 2026 Streak Revival campaign had 15.4M participants and was "one of our most successful campaigns". | [Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) | not yet | A seasonal "come home" week tied to a festival calendar (Lent, Ramadan, Navratri), with no guilt. |

### Friends, leaderboards, quests

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Doing it with a friend works. | People with at least one Friend Streak finished 22% more daily lessons. 57% have at least one friend on Duolingo. Capped at 5 friend streaks. | [Duolingo blog: 5 lessons from Friend Streak](https://blog.duolingo.com/product-lessons-friend-streak/) | applied | Friend streaks, fixed-text cheers and an anonymous friend ID exist (`api/friends.js`, up to 30 friends). |
| The biggest drop-off in a social feature is the very first invite. | They mapped a 6-step funnel and put most effort into the invite step. | [same post](https://blog.duolingo.com/product-lessons-friend-streak/) | partly | Offer the lantern invite at the warmest moments (day 1 done, day 7, a milestone) as one tap. |
| Build the cheapest real version first, then a full "V1", not a half-built MVP. | Their first friend-streak test ran on the phone only, with no server. | [same post](https://blog.duolingo.com/product-lessons-friend-streak/) | applied | Matches how `lib/walkers.ts` started. Keep doing it. |
| Weekly leaderboards raise effort. | Leaderboards (2018) raised learning time by 17%. There are 10 leagues, you're matched with people of similar habits and time zone, and you can turn it off. | [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth); [Duolingo blog: leagues](https://blog.duolingo.com/duolingo-leagues-leaderboards/) | partly | We have an opt-in, friends-only weekly board with nicknames only. **Don't adopt** public leagues with strangers for prayer. |
| Daily quests and shared quests give a reason to open the app today. | Bigger rewards for finishing all three daily quests. Friends Quests now pair you with someone even if you have no friends on the app. | [Duolingo blog: 2025 highlights](https://blog.duolingo.com/product-highlights/) | partly | "Today's three" and seasonal quests exist (`lib/three.ts`, `lib/quests.ts`). A shared quest within one's own Table or community: not yet. |
| Rewards should push people forward on the path, not reward grinding easy things. | Monthly challenges switched from points to quests to stop bulk grinding. | [Duolingo blog: Time Spent Learning Well](https://blog.duolingo.com/time-spent-learning-well/) | applied | Today's three is based only on what really happened (finished lesson, kept line). Keep it that way. |

### Session end and onboarding

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Let people try a lesson before asking them to sign up. | A former growth lead says moving sign-up back a few steps raised daily users about 20% (second-hand quote, no primary source given). | [How They Grow](https://www.howtheygrow.co/p/how-duolingo-grows) | applied | Pick a door and do a lesson before any account. "Save your day" comes later (`app/done/save.tsx`). |
| Day-1 return can be engineered up a lot. | Von Ahn: day-1 retention rose from about 13% to about 50% (from the episode page as summarized). | [Acquired, Luis von Ahn](https://www.acquired.fm/acq2-episodes/why-duolingo-worked-with-luis-von-ahn-ceo) | not yet | We can't improve what we don't measure. Turn on day-1 counts first (see Top 10). |
| Short lessons fit into small moments. | About 3-minute lessons, not 30. | [Acquired](https://www.acquired.fm/acq2-episodes/why-duolingo-worked-with-luis-von-ahn-ceo) | applied | Our ~5-minute lesson. Watch for lessons that run long. |
| The lesson-end screens are prime time. Keep investing in them. | New streak-milestone and lesson-end animations shipped in 2025. | [2025 highlights](https://blog.duolingo.com/product-highlights/) | applied | The after-lesson series exists (`app/done/*`). Put a Keeper's line or a voice here once rights are signed. |
| A home-screen widget works about as well as reminders. | Half of widget users have a streak of at least 6 months. | [Duolingo blog: widget](https://blog.duolingo.com/widget-feature/) | not yet | Not possible on the web app. Plan a sunrise widget for the iPhone and Android builds. |

## 3. Notifications

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Protect the channel: improve what you send, don't send more. | Better timing, wording and images, not more volume, gave "dozens" of small wins that added up to big yearly gains. | [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | applied | One a day, quiet hours 10 pm–7 am, never on a day already done (`lib/reminder-plan.ts`). |
| The "streak saver" reminder has a lot of upside. | Named as an area with considerable room to improve. | [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | applied | 8 pm, only when missing would break the streak, never on heavy-mood or bedtime days. |
| Fresh wording beats repeated wording, so rotate. | Their reminder chooser raised total daily users by 0.5% and new-user retention by 2%. Sending the same reminder as last time cut its effect by about 0.5%. | [Yancey & Settles, KDD 2020](https://research.duolingo.com/papers/yancey.kdd20.pdf) | partly | We have 4 daily lines per language. Add more in the mascot's voice and per tradition. Don't repeat one inside about two weeks. |
| A reminder "worked" if a lesson followed within two hours. | That's the scoring rule in their study (about 200 million reminders over 34–35 days). | [KDD 2020 paper](https://research.duolingo.com/papers/yancey.kdd20.pdf); [Duolingo blog: how Duo picks notifications](https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/) | not yet | Use the same simple rule, counted on the phone and sent only as a number if analytics is on. |
| The same words work differently in each language. | Treating each translation separately raised the gain from 1.2% to 1.8%. A German opt-in message explaining why notifications help raised opt-ins 8%. The same idea didn't work in Spanish. | [KDD 2020 paper](https://research.duolingo.com/papers/yancey.kdd20.pdf); [Duolingo blog: copy testing](https://blog.duolingo.com/copy-testing-experiments/) | partly | We write English and Spanish separately. Test the reminder-permission wording in each. |
| Back off when reminders aren't working. | Duolingo is known for a "we'll stop sending these" note (*unverified*: exact wording and timing from memory). Our 23.5-hour daily timing is also modeled on Duolingo (*unverified*). | memory | applied | After 5 quiet days: one last note in our own words, then silence until they come back. |
| Reminders must actually be delivered. | — | repo | partly | Only the iPhone build schedules reminders. Web push isn't switched on yet. This is the biggest gap. |

## 4. Learning science and spaced repetition

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Bring things back right before they're forgotten, and learn each person's forgetting speed. | Their model ("half-life regression") cut prediction error by 45%+ and raised daily engagement 12% in a live test. | [Settles & Meeder, ACL 2016](https://research.duolingo.com/papers/settles.acl16.pdf) | partly | `lib/missed.ts` brings back slipped words after 1, 3, 7 and 14 days. Later, adjust the gaps per person. |
| Mix old material in with new along the path. | The 2022 path redesign was built on spacing. In their studies, the new path scored better on reading and listening. | [Duolingo blog: home screen redesign](https://blog.duolingo.com/new-duolingo-home-screen-design/); [4 learnings from efficacy studies](https://blog.duolingo.com/results-duolingo-efficacy-studies/) | partly | "One from before" questions inside later lessons exist. Add one per lesson as standard. |
| Consistency beats perfection. | Bozena Pajak (learning science lead): doing it every day, or almost, matters most. | [Glasp talk with Bozena Pajak](https://glasp.co/posts/bozena-pajak-how-to-build-duolingo-s-learning-engine-with-science-and-ai-glasp-talk-50) | applied | The streak counts a finished lesson, never a score. |
| Harder recall exercises teach better but can cut engagement at first. Design them to feel easy. | Pajak describes the early dip and the fix. | [Glasp talk](https://glasp.co/posts/bozena-pajak-how-to-build-duolingo-s-learning-engine-with-science-and-ai-glasp-talk-50) | applied | Recall is a gentle three-line choice (`session/recall.ts`), never a test you can fail. |
| Measure "good time", not just time, so engagement tricks can't fake progress. | Time on new path lessons counts fully and other activities count half. Rebalancing points added about 1.8M minutes a day. Shorter lessons scored worse on this measure. | [Time Spent Learning Well](https://blog.duolingo.com/time-spent-learning-well/) | not yet | Define "minutes practiced well" (finished lesson minutes, already timed in `lib/year.ts`) as a safety check on every test. |
| The right difficulty keeps people coming back. | Pajak: how hard the content is strongly affects whether people stick with it. | [Glasp talk](https://glasp.co/posts/bozena-pajak-how-to-build-duolingo-s-learning-engine-with-science-and-ai-glasp-talk-50) | partly | `lib/level.ts` moves the level up after three clean runs and down after a rough patch. |
| Prove it works with real studies. | People who finished 5 sections knew as much as students after 5 university semesters. More than 90% of AI-feature users felt ready to use the language. | [4 learnings from efficacy studies](https://blog.duolingo.com/results-duolingo-efficacy-studies/) | partly | "Did it land?" answers are kept (`app/done/landed.tsx`). Later: a small study with Keepers on whether practice became a habit. |

## 5. AI content and quality control

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| People design, the AI drafts, experts choose and fix. | Fill-in-the-blank prompts produce about ten drafts in seconds. Experts pick and fix them because some sound "stilted". | [Duolingo blog: how AI creates lessons faster](https://blog.duolingo.com/large-language-model-duolingo-lessons/); [humans and AI work together](https://blog.duolingo.com/how-duolingo-experts-work-with-ai/) | partly | Year 1–2 scripts were written with a 20% audit. Keeper review is still pending and nothing is approved for release. |
| People write the AI conversation scenarios, check AI answers for facts and tone, and let users flag bad ones. | At the Max launch, experts wrote the Roleplay scenarios and users could press and hold to report a message. | [Duolingo blog: Duolingo Max](https://blog.duolingo.com/duolingo-max/) | partly | The Guide falls back to lesson text and links sources. Add a one-tap "this doesn't sound right" on Guide answers that goes to Keeper review. |
| AI makes content fast. Review is the bottleneck. | 148 new courses in under a year, versus about 12 years for the first 100. 20,500 course units in Q1 2026, versus 7,100 a quarter in 2025. | [Q1 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000156208825000098/q1fy25duolingo3-31x25share.htm); [Glasp talk](https://glasp.co/posts/bozena-pajak-how-to-build-duolingo-s-learning-engine-with-science-and-ai-glasp-talk-50); [Q1 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026029790/q1fy26duolingo3-31x26share.htm) | partly | Plan Keeper review time per lesson, not writing time. That is our real speed limit and our moat. |
| AI costs show up in the margins. | Gross margin fell about 0.4 points to 72.5% because of AI and hosting costs. | [Q3 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm) | applied | Daily AI limits per person and site-wide, plus outage alerts (`api/_usage.js`, `api/ai-watch.js`). |
| Talking publicly about "AI-first" can backfire. | The April 2025 memo drew loud criticism. Von Ahn later defended it. | [TechCrunch, Aug 2025](https://techcrunch.com/2025/08/17/duolingo-ceo-says-controversial-ai-memo-was-misunderstood) | don't adopt | Say "Keepers first". AI is a helper, never the authority on faith. |

## 6. Experimentation and product review

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Test almost everything. | A few hundred tests at once, and 2,000+ in three years (2020). About 2,000 a year according to von Ahn. | [Duolingo blog: one experiment at a time](https://blog.duolingo.com/improving-duolingo-one-experiment-at-a-time/); [Acquired](https://www.acquired.fm/acq2-episodes/why-duolingo-worked-with-luis-von-ahn-ceo) | not yet | We only have on/off feature switches (`lib/flags.ts`). Add a simple 50/50 split for opted-in users. |
| Every test checks learning as well as return visits, and money only where it applies. | A Plus promotion raised signups but hurt retention, so it was shut down. CTO Severin Hacker: tests look at teaching, engagement and money. | [one experiment at a time](https://blog.duolingo.com/improving-duolingo-one-experiment-at-a-time/); [Swisspreneur, Severin Hacker](https://www.swisspreneur.org/podcast/severin-hacker-ep252) | not yet | Our three checks: came back, practiced well, felt good (no guilt). A test that wins on one and loses on another doesn't ship. |
| A small group of leaders reviews every feature to avoid slowly drifting into bad habits ("boiling the frog"). | Five leaders review every feature (from the episode page as summarized). | [Acquired](https://www.acquired.fm/acq2-episodes/why-duolingo-worked-with-luis-von-ahn-ceo) | partly | The owner reviews. Add a short review list: privacy, guilt, Keeper accuracy, ad-free practice. |
| Use data to inform decisions, then make the judgment call. | Cem Kansu: sometimes accept lower short-term numbers for a stronger base. | [RevenueCat, Cem Kansu](https://www.revenuecat.com/blog/growth/cem-kansu-duolingo-sub-club-podcast-2026) | applied | Already how faith decisions are made here. |
| Test the wording too. | An in-house wording-test tool. A Spanish "Don't give up!" exit message lowered quit rates. | [copy testing](https://blog.duolingo.com/copy-testing-experiments/) | not yet | Test our own words, but never guilt lines like "don't give up" on a prayer screen. |

## 7. Mascot, brand and social

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Build a cast of characters from the mascot's own shapes. Take time and include many cultures. | 18 months of design work, launched November 2020. Humans drawn using Duo's shape rules. A deliberately diverse cast. They appear when you answer right and as mid-lesson rewards. | [Duolingo blog: building character](https://blog.duolingo.com/building-character/) | partly | Our mascot ("the guy") reacts in lessons (`session/juice.tsx`). Later: a cast drawn from his shapes, one per path, never a sacred figure. |
| Simple shapes make a mascot easy to animate and read. The brand lives between the meme and the mission. | The head of art calls Duo "basically a chicken nugget with a face". The owl is green because of a co-founder prank. | [Advertising Week](https://advertisingweek.com/aw360/news/the-surprising-reason-why-the-duolingo-owl-is-green/2524) | applied | Round yellow face, infinity mask, hoodie. For us: joke about ourselves, never about the faith (brand book). |
| Derive the whole identity, even the lettering, from the mascot, and write rules that reach beyond the app. | 2019 refresh by Johnson Banks and Fontsmith. The logotype was drawn from the owl's shapes, with guidelines down to airport ads. | [branding.news](https://www.branding.news/2019/09/30/duolingos-mascot-sets-tone-of-their-new-visual-identity/) | partly | We have a brand book (`docs/brand/brand-book.html`). Our own lettering could come from the infinity mask. |
| Give each character a clear personality. | Ten named humans, from an anxious achiever to a sarcastic teen and a mysterious grandmother. | [DuoPlanet: character names](https://duoplanet.com/duolingo-character-names/) | not yet | Our own names and personalities. Never reuse theirs (see section 11). |
| A tiny, fast, in-house social team beats agencies. | TikTok grew from 50,000 to 16M followers in 4+ years with a team of 3. The "dead Duo" campaign went from idea to launch in 6 days. | [The Drum, Zaria Parvez](https://www.thedrum.com/news/2025/02/25/duolingo-s-tiktok-mastermind-its-unhinged-social-strategy-and-killing-its-mascot) | not yet | One in-house creator per community (faith creators, Keepers' students). Approvals within a week. |
| A story campaign can bring lapsed users back. | The "dead Duo" story: 1.7 billion free impressions and a noticeable rise in new and returning users. | [Q1 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000156208825000098/q1fy25duolingo3-31x25share.htm) | don't adopt (the death part) | Never a death joke near faith. A seasonal "lanterns home" story is the faith-safe version. |
| Edgy humor needs a brake. | They posted less "unhinged" content after community feedback, then brought it back. | [Q3 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm) | don't adopt | Warm and playful, never edgy, about religion. |
| Creators carry new markets. | About two-thirds of social impressions in China, Indonesia and India came from creator content. | [Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) | not yet | Community and celebrity voices are our creators. Only once signed. |
| Even a 5-second ad can be made in-house. | The 2024 Super Bowl spot was 5 seconds, made without an agency. | [Duolingo blog: Super Bowl](https://blog.duolingo.com/super-bowl-commercial-2024/) | not yet | Small, cheap, in-house moments around festivals. |

## 8. Monetization and pricing

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Free first: a big free audience pays for itself through word of mouth. | About 5% of monthly users paid in 2021, 8.9% in Q1 2025, and 12.7M subscribers in Q2 2026. | [S-1](https://www.sec.gov/Archives/edgar/data/1562088/000162828021013065/duolingos-1.htm); [Q1 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000156208825000098/q1fy25duolingo3-31x25share.htm); [Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm) | applied | "The house is free forever" is already in the app strings. |
| Protect the free experience. They paid to put value back into it. | More than $50M of bookings given up to make the free version better. Kansu: locking too much behind a paywall weakens the growth engine. | [Q4 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm); [RevenueCat, Cem Kansu](https://www.revenuecat.com/blog/growth/cem-kansu-duolingo-sub-club-podcast-2026) | applied | The daily lesson, streak and rest days stay free. Never sell streak repairs. |
| Ads only after a lesson, never during. | Free users saw an ad at the end of each lesson. Ads were 17% of revenue in 2020 and about 7% in Q2 2026 ($21.1M of $298.5M, *computed*). | [S-1](https://www.sec.gov/Archives/edgar/data/1562088/000162828021013065/duolingos-1.htm); [Q2 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm); [Kansu](https://www.revenuecat.com/blog/growth/cem-kansu-duolingo-sub-club-podcast-2026) | don't adopt | No ads on prayer or scripture screens, ever. Ads are a shrinking share of their revenue anyway. |
| A pricier tier built around a live conversation partner. | Max (GPT-4) launched March 2023. Video Call is moving to the main tier, about 10x more access. | [Duolingo Max](https://blog.duolingo.com/duolingo-max/); [Q4 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm) | partly | Plans exist but payments aren't connected. A premium "time with a Keeper / voice" tier fits the moat. |
| Family plans grow. | The family plan contributed meaningfully in Q1 2025 and helped ARPU rise 7% in Q3 2025. (A 29% share of subscribers was reported elsewhere: *unverified*.) | [Q1 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000156208825000098/q1fy25duolingo3-31x25share.htm); [Q3 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm) | partly | The Table plan and kids' streaks exist. Stripe isn't connected and the prices are prototype values. |
| Usage limits (energy) raise conversion. | Energy increased daily users, good learning time and subscriber conversion on iOS. | [Q2 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000156208825000165/q2fy25duolingo6-30x25share.htm) | don't adopt | No limits on practice, no hearts ("no hearts" is already in our strings). |
| They earned no money for five years and focused on retention. | No revenue until 2017 (launched 2012). | [Acquired](https://www.acquired.fm/acq2-episodes/why-duolingo-worked-with-luis-von-ahn-ceo) | applied | Beta is free. Earn trust before charging. |

## 9. Organization and hiring

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Engineers and makers run the company. | Founded by two engineers. In 2021, 400+ staff with 170+ engineers. 800+ staff by 2025. | [S-1](https://www.sec.gov/Archives/edgar/data/1562088/000162828021013065/duolingos-1.htm); [Duolingo handbook](https://blog.duolingo.com/handbook/) | partly | Small team now. Backend partner later. |
| Write down a few operating principles and teach them on day one. | Take the long view, raise the bar, ship it, show don't tell, make it fun. | [Duolingo handbook](https://blog.duolingo.com/handbook/) | not yet | Ours could be: learners first, Keepers first, private by default, no guilt, ship small. |
| Hire great people, let them test, then double down on what works. | "The Green Machine". | [handbook](https://blog.duolingo.com/handbook/) | partly | Shaan recruits Keepers (scholars) himself. Keep that personal. |
| Keep creative teams in-house and fast. | Social team of 3. The Super Bowl ad was made in-house. | [The Drum](https://www.thedrum.com/news/2025/02/25/duolingo-s-tiktok-mastermind-its-unhinged-social-strategy-and-killing-its-mascot); [Super Bowl post](https://blog.duolingo.com/super-bowl-commercial-2024/) | not yet | One in-house creator before any agency. |
| Telling staff that headcount depends on AI can backfire publicly. | The AI-first memo tied hiring to automation and drew backlash. | [TechCrunch](https://techcrunch.com/2025/08/17/duolingo-ceo-says-controversial-ai-memo-was-misunderstood) | don't adopt | Never frame Keepers or writers as replaceable. |

## 10. Mistakes they admit

| Lesson | Evidence / number | Source | For Infinite Hill | What we'd do |
|---|---|---|---|---|
| Copying another game's mechanic without its fun doesn't work. | A moves counter borrowed from Gardenscapes didn't improve retention: "a boring, tacked-on nuisance". | [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | applied | Borrow the why, not the widget. Every mechanic gets a faith-native form (sun, lantern, rest days). |
| Referral rewards barely moved. | An Uber-style referral program added only about 3% new users, because the best users already paid. | [Mazal](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth) | partly | Our gift and lantern links aren't rewards. Don't build paid referral credits. |
| Money now can cost people later. | The Plus promo was shut down despite the revenue. Later, more than $50M was moved back into the free experience. | [one experiment at a time](https://blog.duolingo.com/improving-duolingo-one-experiment-at-a-time/); [Q4 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm) | applied | Free core, forever. |
| Growth slows when you lean on monetization. | Daily-user growth slowed through 2025 and 2026 is guided at about 20%. A/B tests now favor user growth over money. | [Q4 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm); [Q3 2025 letter](https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm) | applied | Same priority order for us. |
| Their biggest learning gap was speaking. | Speaking was "historically the biggest gap". Video Call doubled the words spoken per user. | [Q1 2026 letter](https://www.sec.gov/Archives/edgar/data/0001562088/000162828026029790/q1fy26duolingo3-31x26share.htm) | partly | Our version: saying a prayer or line aloud (the "say it" game exists in `session/games.tsx`). |
| Measuring the wrong thing rewarded grinding. | Older measures pushed easy, short activities, so they built "time spent learning well". | [TSLW](https://blog.duolingo.com/time-spent-learning-well/) | not yet | Define our guardrail before the first test. |
| The AI-first memo hurt trust. | Loud criticism and a public walk-back. | [TechCrunch](https://techcrunch.com/2025/08/17/duolingo-ceo-says-controversial-ai-memo-was-misunderstood) | don't adopt | Keepers first, in public and in private. |

---

## 11. Staying different: trademarks, copyright, patents

**The owner says this is very, very important. This is not legal advice.** It is a research summary to take to an IP attorney before public launch.

### What Duolingo owns that we must stay clear of

| What | Detail | Source | Risk for us |
|---|---|---|---|
| **DUOLINGO** word mark | Reg. **4588574** (serial 86171435), registered Aug 19, 2014, renewed, live. Covers language-learning software and instruction. Duolingo owns about 33 US marks in total. | [Trademarkia: 86171435](https://www.trademarkia.com/duolingo-86171435); [Trademarkia: Duolingo Inc. marks](https://www.trademarkia.com/owners/duolingo-inc) | Low. Our name is unrelated. Never use "-lingo", "Duo" or a look-alike name. |
| **Owl design** mark | Reg. **6660235** (serial 88718551), registered Mar 1, 2022: an owl with large eyes, a beak and three half-circle chest feathers. **No color claimed**, so it protects the owl shape in any color. | [USPTO TSDR 88718551](https://tsdr.uspto.gov/statusview/sn88718551); [Trademarkia](https://www.trademarkia.com/x-88718551) | Never use an owl, in any color. |
| **Owl-eyes color** mark | Reg. **7255487** (serial 90181934), registered Dec 26, 2023: two white eyes with black pupils, an orange beak and green feathers on a green background. **Colors green, black, white and orange are claimed.** | [USPTO TSDR 90181934](https://tsdr.uspto.gov/statusview/sn90181934); [Trademarkia](https://www.trademarkia.com/x-90181934) | Never use big round eyes plus an orange beak on green as an icon. |
| More logo marks | Owl and logo marks also cover clothing (hoodies, shirts), stickers and teaching services (e.g. serials 88718547, 90181929, 90157399, 98134090). | [Trademarkia owner list](https://www.trademarkia.com/owners/duolingo-inc) | Our merch must never show an owl or their logo. Our hoodie says "infinite hill". |
| **Characters** (copyright) | Duo and a cast of 10 named humans (Bea, Eddy, Falstaff, Junior, Lily, Lin, Lucy, Oscar, Vikram, Zari). Drawn using Duo's shape rules, 18 months of design. | [DuoPlanet](https://duoplanet.com/duolingo-character-names/); [building character](https://blog.duolingo.com/building-character/) | Never reuse these names, looks or personalities. Never draw a "teen with a lilac bob" style copy. |
| **Brand green** | A bright, saturated green is their signature, and green is part of their color-claimed mark. Their primary "feather green" is about #58CC02, with a lighter green around #89E219 (*unverified*: hex values from memory; their design-guidelines page now redirects). | [Advertising Week](https://advertisingweek.com/aw360/news/the-surprising-reason-why-the-duolingo-owl-is-green/2524); memory | Never use a bright green as our main color. |
| **Typeface** | Custom lettering drawn from the owl's shapes (Johnson Banks and Fontsmith, 2019). | [branding.news](https://www.branding.news/2019/09/30/duolingos-mascot-sets-tone-of-their-new-visual-identity/) | We use Manrope, Inter and Baloo 2 (open fonts). Fine. |

### Patents

| Patent | What it covers | Status | Touches what we build? | Source |
|---|---|---|---|---|
| US 2017/0068986 A1, "Interactive sponsored exercises" (Duolingo) | Sponsors' branded sentences used as teaching exercises. | **Abandoned** | No. We won't put sponsors in lessons anyway. | [Google Patents](https://patents.google.com/patent/US20170068986A1/en) |
| US 2017/0116870 A1, "Automatic test personalization" (Duolingo) | Adaptive testing plus recorded video answers (the English Test). | **Abandoned** | No. | [Google Patents](https://patents.google.com/patent/US20170116870A1/en) |
| Font patent fight (Modern Font Applications) | Here Duolingo was the one *accused*. It sued in 2021 to be cleared of infringing font-embedding patents that weren't its own. Reports say the patents were later held invalid (Dec 2025, *unverified*: from a search summary only). | — | Shows that ordinary app features attract patent trolls. Another reason for a clearance review. | [govinfo case record](https://www.govinfo.gov/app/details/USCOURTS-cand-5_21-cv-06132) |
| Streaks, spaced repetition, reminders | We found **no Duolingo patent** on streaks, streak freezes, spaced repetition or reminder choosing (searched Google Patents). Spaced repetition is decades-old public research: Ebbinghaus (1885, cited in Duolingo's own paper), the Leitner box system (1970s) and SuperMemo (1980s; dates *unverified*). Duolingo published its reminder method openly as an academic paper. | — | Low as far as we can see. An attorney's freedom-to-operate check is still needed: others, not Duolingo, may hold patents. | [ACL 2016 paper](https://research.duolingo.com/papers/settles.acl16.pdf); [KDD 2020 paper](https://research.duolingo.com/papers/yancey.kdd20.pdf) |

(Searching surfaced US 9,754,504 B2 as a "Duolingo" patent. When opened, it belongs to IBM, not Duolingo.)

### Our assets, checked

| Our asset (from the repo) | Compared with | Verdict |
|---|---|---|
| Name "Infinite Hill" / "infinite hill" | DUOLINGO word mark | **clearly distinct** |
| Mascot: round yellow face, infinity mask (glasses), backwards cap, white hoodie, joggers (`docs/brand/brand-book.html`) | Owl marks 6660235 / 7255487, Duo | **clearly distinct**. A human figure, not a bird. No beak, no owl eyes, not green. |
| Mascot's character names (none of Duolingo's found in `apps/app/src`) | Duo, Lily, Zari, etc. | **clearly distinct**. Keep it that way when naming a cast. |
| Main brand color lemon #EEFF6A plus black and white (`packages/brand/src/index.js`, `public/site.html`) | Duolingo green | **clearly distinct** |
| Secondary token `green: #8DE24A` (used once in the You tab, about 3 times on the site) | Duolingo's lighter green (~#89E219, *unverified*) | **check**. It's close to their light green. Keep it minor, or swap for a hue that's clearly ours. |
| Streak icon: a sun, "the sun is our flame", with rest days as moons, never red (`apps/app/src/ui/streak.tsx`) | Duolingo's orange streak flame | **clearly distinct** |
| Streak finish: sunrise over the hill (`app/done/light.tsx`) | Duolingo milestone animations | **clearly distinct** |
| Reminder copy "i'll stop nudging for now. the door stays open, whenever you're ready." (`lib/reminder-plan.ts`) | Duolingo's well-known "we'll stop" reminder (*unverified* wording) | **clearly distinct** in words. Same idea, our voice. Code comments mention Duolingo. Fine internally, but never in shipped text. |
| Words "rest days", "earn it back", "today's three", "lantern", "weekly board" | Streak Freeze, Streak Repair, Daily Quests, Leagues | **clearly distinct** |
| App text "no paid streak repairs", "no hearts" | Duolingo feature names used to compare | **check**. Fine as plain description, but get the attorney's view before using them in ads. |
| Sounds: a synthesized 528 Hz bell (`lib/sound.ts`) | Duolingo's sound effects | **clearly distinct** |
| Fonts: Manrope, Inter, Baloo 2 | Duolingo's custom typeface | **clearly distinct** |

### Rules going forward

1. Never use an owl, in any color, anywhere (app, site, merch, stickers).
2. Never make bright Duolingo-style green a main color. Lemon, black and white stay ours.
3. Never use their character names, looks, catchphrases or famous lines, even as a joke or homage.
4. Borrow mechanics, never wording. Every line is written fresh in our voice.
5. No "-lingo", "Duo" or owl puns in names, features or campaigns.
6. Name Duolingo in marketing only after an attorney has reviewed it.
7. **Before public launch:** get a trademark clearance search (name, mascot, logo, in each launch country) and a freedom-to-operate review (streaks, reminders, spaced review, AI Guide) from an IP attorney. Register our own marks.

---

## Top 10 next moves (ranked by expected effect on day-1 and day-7 return)

1. **Actually deliver reminders on the web and Android, not just the iPhone build.** The daily note, the streak saver and the last note are written but mostly unsent. Source: [Mazal: notifications and streak saver](https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth).
2. **Turn on opt-in, number-only counts for day-1, day-7 and "came back today" (CURR).** We can't improve what we can't see. Source: [Duolingo growth model](https://blog.duolingo.com/growth-model-duolingo/).
3. **Ask for reminder permission after the first lesson, with tested wording in each language that explains the benefit.** Source: [copy testing, +8% opt-in](https://blog.duolingo.com/copy-testing-experiments/).
4. **Make days 1–7 a guided first week, with a real day-7 moment** (7-day streaks mean 3.6x completion, and milestone animations added +1.7% day-7 retention). Source: [streak habit post](https://blog.duolingo.com/how-duolingo-streak-builds-habit/).
5. **Add a simple 50/50 test switch with three checks (came back, practiced well, no guilt).** Source: [one experiment at a time](https://blog.duolingo.com/improving-duolingo-one-experiment-at-a-time/).
6. **Rotate many reminder lines in the mascot's voice, never repeating one within about two weeks** (+2% new-user retention for them). Source: [KDD 2020 paper](https://research.duolingo.com/papers/yancey.kdd20.pdf).
7. **Make the friend invite one tap at the warmest moments** (day 1 done, day 7, milestones). Friend streaks raised lesson completion 22%. Source: [Friend Streak lessons](https://blog.duolingo.com/product-lessons-friend-streak/).
8. **Rest days that know each tradition's holy day**, so Shabbat, Friday prayer or Sunday never costs a streak (weekend pass: +4% return). Source: [2017 streak post](https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/).
9. **Set a first-open speed budget on cheap phones.** Slow starts cost them hundreds of thousands of daily users. Source: [Android performance](https://blog.duolingo.com/android-app-performance/).
10. **Put a Keeper's line or a signed celebrity voice at the lesson-end moment on days 1, 3 and 7** (once rights are signed), our version of characters at high-engagement moments. Source: [building character](https://blog.duolingo.com/building-character/).

---

## Sources (all opened for this document)

- Mazal, J. "How Duolingo reignited user growth." Lenny's Newsletter. https://www.lennysnewsletter.com/p/how-duolingo-reignited-user-growth
- Duolingo blog, Meaningful metrics (growth model). https://blog.duolingo.com/growth-model-duolingo/
- Duolingo blog, The streak uses habit research (2022-01-31). https://blog.duolingo.com/how-duolingo-streak-builds-habit/
- Duolingo blog, How streaks keep learners committed (2017-05-10). https://blog.duolingo.com/how-streaks-keep-duolingo-learners-committed-to-their-language-goals/
- Duolingo blog, Protecting streaks from site issues (2021). https://blog.duolingo.com/protecting-streaks-from-site-issues/
- Duolingo blog, 5 product lessons from Friend Streak (2024-09-20). https://blog.duolingo.com/product-lessons-friend-streak/
- Duolingo blog, Leagues and leaderboards (2023-05-03). https://blog.duolingo.com/duolingo-leagues-leaderboards/
- Duolingo blog, 2025 product highlights (2025-12-10). https://blog.duolingo.com/product-highlights/
- Duolingo blog, Time Spent Learning Well (2024-06-13). https://blog.duolingo.com/time-spent-learning-well/
- Duolingo blog, Home screen redesign (2022-11-01). https://blog.duolingo.com/new-duolingo-home-screen-design/
- Duolingo blog, Widget. https://blog.duolingo.com/widget-feature/
- Duolingo blog, Android performance (2025-06-11). https://blog.duolingo.com/android-app-performance/
- Duolingo blog, How Duo decides which notification to send (2020-09-03). https://blog.duolingo.com/hi-its-duo-the-ai-behind-the-meme/
- Duolingo blog, Copy testing (2022-01-14). https://blog.duolingo.com/copy-testing-experiments/
- Duolingo blog, Improving Duolingo one experiment at a time (2020-01-10). https://blog.duolingo.com/improving-duolingo-one-experiment-at-a-time/
- Duolingo blog, How AI creates lessons faster (2023-06-22). https://blog.duolingo.com/large-language-model-duolingo-lessons/
- Duolingo blog, Humans and AI work together (2022-09-14). https://blog.duolingo.com/how-duolingo-experts-work-with-ai/
- Duolingo blog, Introducing Duolingo Max (2023-03-14). https://blog.duolingo.com/duolingo-max/
- Duolingo blog, 4 learnings from efficacy studies (2024-09-26). https://blog.duolingo.com/results-duolingo-efficacy-studies/
- Duolingo blog, The Duolingo Method (2023-02-02). https://blog.duolingo.com/duolingo-teaching-method/
- Duolingo blog, Handbook (2025-02-10). https://blog.duolingo.com/handbook/
- Duolingo blog, Super Bowl commercial (2024-02-12). https://blog.duolingo.com/super-bowl-commercial-2024/
- Duolingo blog, Building character. https://blog.duolingo.com/building-character/
- Settles & Meeder, A Trainable Spaced Repetition Model (ACL 2016). https://research.duolingo.com/papers/settles.acl16.pdf
- Yancey & Settles, A Sleeping, Recovering Bandit Algorithm for Optimizing Recurring Notifications (KDD 2020). https://research.duolingo.com/papers/yancey.kdd20.pdf
- Duolingo S-1 (2021-06-28). https://www.sec.gov/Archives/edgar/data/1562088/000162828021013065/duolingos-1.htm
- Shareholder letter Q1 2025. https://www.sec.gov/Archives/edgar/data/1562088/000156208825000098/q1fy25duolingo3-31x25share.htm
- Shareholder letter Q2 2025. https://www.sec.gov/Archives/edgar/data/1562088/000156208825000165/q2fy25duolingo6-30x25share.htm
- Shareholder letter Q3 2025. https://www.sec.gov/Archives/edgar/data/1562088/000162828025049514/q3fy25duolingo9-30x25share.htm
- Shareholder letter Q4/FY 2025. https://www.sec.gov/Archives/edgar/data/1562088/000162828026012246/q4fy25duolingo12-31x25shar.htm
- Shareholder letter Q1 2026. https://www.sec.gov/Archives/edgar/data/0001562088/000162828026029790/q1fy26duolingo3-31x26share.htm
- Shareholder letter Q2 2026. https://www.sec.gov/Archives/edgar/data/0001562088/000162828026053299/q2fy26duolingo6-30x26share.htm
- Acquired, "Why Duolingo Worked" with Luis von Ahn. https://www.acquired.fm/acq2-episodes/why-duolingo-worked-with-luis-von-ahn-ceo
- Glasp Talk #50, Bozena Pajak. https://glasp.co/posts/bozena-pajak-how-to-build-duolingo-s-learning-engine-with-science-and-ai-glasp-talk-50
- Swisspreneur, Severin Hacker. https://www.swisspreneur.org/podcast/severin-hacker-ep252
- RevenueCat Sub Club, Cem Kansu (2026). https://www.revenuecat.com/blog/growth/cem-kansu-duolingo-sub-club-podcast-2026
- The Drum, Zaria Parvez (2025-02-25). https://www.thedrum.com/news/2025/02/25/duolingo-s-tiktok-mastermind-its-unhinged-social-strategy-and-killing-its-mascot
- TechCrunch, AI memo (2025-08-17). https://techcrunch.com/2025/08/17/duolingo-ceo-says-controversial-ai-memo-was-misunderstood
- How They Grow, How Duolingo grows. https://www.howtheygrow.co/p/how-duolingo-grows
- Advertising Week, Why the owl is green. https://advertisingweek.com/aw360/news/the-surprising-reason-why-the-duolingo-owl-is-green/2524
- branding.news, 2019 identity (2019-09-30). https://www.branding.news/2019/09/30/duolingos-mascot-sets-tone-of-their-new-visual-identity/
- DuoPlanet, Character names. https://duoplanet.com/duolingo-character-names/
- Trademarkia: DUOLINGO 86171435 (https://www.trademarkia.com/duolingo-86171435), owl 88718551 (https://www.trademarkia.com/x-88718551), owl-eyes 90181934 (https://www.trademarkia.com/x-90181934), owner list (https://www.trademarkia.com/owners/duolingo-inc)
- USPTO TSDR: https://tsdr.uspto.gov/statusview/sn88718551 and https://tsdr.uspto.gov/statusview/sn90181934
- Google Patents: https://patents.google.com/patent/US20170068986A1/en ; https://patents.google.com/patent/US20170116870A1/en ; https://patents.google.com/patent/US9754504B2/en (IBM, not Duolingo)
- govinfo, Duolingo v. Modern Font Applications. https://www.govinfo.gov/app/details/USCOURTS-cand-5_21-cv-06132

Not opened (so not used for numbers): uspto.report and Justia pages (blocked, HTTP 403), Duolingo's design-guidelines color page (redirects), the Birdbrain post.
