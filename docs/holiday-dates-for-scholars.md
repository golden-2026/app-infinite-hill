# Holiday dates: check sheet for the Keepers

Checked 2026-11-08 against the sources linked in each row. Ten-minute read: WRONG rows sit at the top of each table.

**What we checked**
- **New app** (`prototypes/greybox/hill-app.html`, the `HOLY` list): the holiday windows that pick which episode
  drops on Friday at 7pm and which cards become "holy-day edition". 11 windows, Nov 2026 to May 2027.
- **Advent calendar page** (`prototypes/greybox/advent.html`): 25 daily doors, Nov 30 to Dec 24, 2026.
- **Old app** (`apps/app/src/content/seasons.ts`, frozen): the seasons and new-year table for 2026-2028. Rows already
  in the past are left out.

**Three things that move every date**
- Jewish days start at sundown the evening before. Our dates are the first full day (Hanukkah "Dec 4" means the first
  candle on the evening of Dec 4).
- Islamic months start with the new moon. The date can move a day by country and by method (sighting vs. calculation).
- Hindu, Sikh and Buddhist dates follow lunar or solar calendars and differ by region and by school.

**Count:** 3 WRONG, 15 DEPENDS, the rest OK.

---

## Islam

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Ramadan 2027 (new app) | Feb 8 – **Mar 9** | Feb 8 – Mar 8 (last fast Mar 8 if 29 days) | [moonsighting.com (FCNA)](https://moonsighting.com/ramadan-eid.html), [The National](https://www.thenationalnews.com/news/uae/2026/10/06/ramadan-2027-uae-dates-eid-al-fitr-holiday/) | **WRONG**: runs one day too long. North America's Fiqh Council puts Eid on Mar 9, so the app would still say "ramadan" on Eid morning. Our old app already has Mar 8. | Do we follow the Fiqh Council (calculation) or local moon sighting for US users? |
| Eid al-Fitr 2027 (new app) | **Mar 10** – Mar 12 | Mar 9 (Mar 10 if the moon isn't seen) | same as above | **WRONG**: starts a day late. Fix to Mar 9 – Mar 12, so the window still holds the Friday Mar 12 drop. | Is a 3-day Eid window right, or should it be the day itself? |
| Ramadan 2027 (old app) | Feb 8 – Mar 8, Eid Mar 9 | Feb 8 – Mar 8, Eid Mar 9 | [moonsighting.com (FCNA)](https://moonsighting.com/ramadan-eid.html) | OK (DEPENDS on the moon, ±1 day) | The first taraweeh prayer is the night before, Feb 7. Should the window open that evening? |
| Islamic New Year 2027 (old app) | Jun 6 | Jun 6 (some calendars Jun 5) | [islamic.app](https://islamic.app/hijri/hijri-new-year/2027) | DEPENDS: moon, ±1 day | Many Shia communities mark Muharram as mourning (Ashura ~Jun 15), not a celebration. How should "your year on the hill" sound for them? |
| Ramadan 2028 (old app) | Jan 28 – Feb 25, Eid Feb 26 | Jan 28 start; Eid Feb 26 or 27 | [IslamiCity](https://www.islamicity.org/calendar?theYear=2028) | DEPENDS: moon, ±1 day | none |

## Christianity (the Christian door) and Catholicism

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Easter 2027 (new app, both doors) | Mar 21 – Apr 4 | Palm Sunday Mar 21, Good Friday Mar 26, **Easter Mar 28**, Divine Mercy Sunday Apr 4 | [Catholic Church Times](https://www.catholicchurchtimes.com/calendar/easter/2027) | **WRONG** (in effect): the window opens on Palm Sunday, so the "empty tomb" / "the stone" episode drops on **Good Friday, Mar 26**, two days before Easter. Fix: start the Easter window Mar 28, or give Holy Week its own window and episode. | Is anything other than the Passion right for a Good Friday drop? |
| Lent 2027 (new app, Catholic only) | Feb 10 – Mar 20 | Ash Wednesday Feb 10; Lent runs to Holy Thursday evening, Mar 25 | [Catholic Church Times](https://www.catholicchurchtimes.com/calendar/easter/2027) | DEPENDS: ends 5 days early because Holy Week was folded into "easter". The Christian door has no Lent window at all. | Should the Christian (Protestant) door get Lent too? Many churches keep it, some don't. |
| Advent 2026 (new app) | Nov 29 – Dec 23 | Nov 29 (first Sunday) to Dec 24 | [Wikipedia: Advent Sunday](https://en.wikipedia.org/wiki/Advent_Sunday) | OK: Dec 24 is handed to the Christmas window on purpose | Catholic Advent drops include Simeon (Feb 2 story) on Dec 18, before the birth. Should Simeon and the Magi move into the Christmas season? |
| Christmas 2026 (new app) | Dec 24 – Dec 26 | Christmas Eve to Dec 26 is fine; the Catholic Christmas season runs to the Baptism of the Lord, **Jan 10, 2027** (US Epiphany Sunday **Jan 3**) | [Wikipedia: Baptism of the Lord](https://en.wikipedia.org/wiki/Feast_of_the_Baptism_of_the_Lord) | DEPENDS: 3 days is short. The Magi episode never drops, since Epiphany is outside every window. | Add an Epiphany window (Jan 3 US / Jan 6 elsewhere) for the Magi? |
| Orthodox Easter 2027 | not in either app | May 2, 2027 | [Catholic Church Times](https://www.catholicchurchtimes.com/calendar/easter/2027) | DEPENDS: Orthodox users would get Easter content five weeks early | Does the Christian door need an Orthodox option, or is it out of scope for now? |
| Advent calendar page: Sundays | Nov 29, Dec 6, 13, 20 | same (Christmas 2026 is a Friday) | [Wikipedia: Advent Sunday](https://en.wikipedia.org/wiki/Advent_Sunday) | OK | none |
| Advent calendar page: saints' days | St Andrew Nov 30, St Barbara Dec 4, St Nicholas Dec 6, Immaculate Conception Dec 8, Guadalupe Dec 12, St Lucy Dec 13 | same fixed dates | General Roman Calendar | DEPENDS: in 2026, Dec 6 and Dec 13 are Advent Sundays, so in church the Sunday replaces St Nicholas and St Lucy. Folk customs still happen. | Fine to tell the saint's story on the Sunday, as long as we say it's the second / third Sunday of Advent first? |
| Advent calendar page: Las Posadas, O Antiphons | Posadas from Dec 16; O Antiphons Dec 17 – 23 | Posadas Dec 16 – 24; O Antiphons Dec 17 – 23 in this order | Liturgy of the Hours | OK | none |
| Lent (old app) 2027, 2028 | 40 days from Feb 10, 2027 / Mar 1, 2028 | Ash Wednesday Feb 10, 2027 (Easter Mar 28); Mar 1, 2028 (Easter Apr 16) | [Wikipedia: Ash Wednesday](https://en.wikipedia.org/wiki/Ash_Wednesday) | DEPENDS: the 40-day quest ends on Palm Sunday, so Holy Week is left out | Lent's "40 days" skip Sundays. Is a 40-day quest that stops at Palm Sunday okay, or should it run to Easter? |
| Advent (old app) 2027, 2028 | Nov 28 – Dec 24, 2027; Dec 3 – Dec 24, 2028 | same | [Wikipedia: Advent Sunday](https://en.wikipedia.org/wiki/Advent_Sunday) | OK | none |

## Judaism

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Hanukkah 2026 (new app) | Dec 4 – Dec 12 | first candle evening of Fri Dec 4; ends nightfall Sat Dec 12 | [Hebcal 2026-27](https://www.hebcal.com/holidays/2026-2027) | OK. The Friday 7pm drop lands as the first candle is lit. | The first candle falls on Friday night, so it's lit before the Shabbat candles. Should the drop note that? |
| Days of Awe 2027 (old app) | Oct 2 – Oct 11 | Rosh Hashanah from sundown Oct 1; Yom Kippur sundown Oct 10 to nightfall Oct 11 | [Hebcal 2027-28](https://www.hebcal.com/holidays/2027-2028) | OK (day dates; the evening before counts) | none |
| Omer 2027 (old app) | from Apr 23, 49 days | first count on the night of Apr 22; Shavuot from sundown Jun 10 (day Jun 11) | [Hebcal 2026-27](https://www.hebcal.com/holidays/2026-2027) | OK | none |
| Rosh Hashanah 2028 (old app) | Sep 21 | from sundown Sep 20 | [Hebcal](https://www.hebcal.com/holidays/2028-2029) | OK | none |
| Holidays not in the new app | none | Purim Mar 23, 2027; Passover from sundown Apr 21, 2027 | [Hebcal 2026-27](https://www.hebcal.com/holidays/2026-2027) | DEPENDS: gaps, not errors | Passover is the biggest family holiday of the year. Should it get a window? |

## Hinduism

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Diwali 2026 (new app) | Nov 5 – Nov 11 | Dhanteras Nov 6, Lakshmi Puja Nov 8, Govardhan Nov 10, Bhai Dooj Nov 11 (New Delhi) | [Drik Panchang 2026](https://www.drikpanchang.com/diwali/diwali-puja-calendar.html?year=2026) | OK (Nov 5 is one harmless day early) | In the South, Naraka Chaturdashi morning is the main day, and Gujaratis mark the new year on Nov 10. Is one "homecoming" (Rama) episode right for all? |
| Holi 2027 (new app) | Mar 20 – Mar 23 | Holika Dahan Sun Mar 21, colours Mon Mar 22 | [Drik Panchang Holika Dahan 2027](https://www.drikpanchang.com/festivals/holi/festivals-holika-dahan-timings.html?year=2027) | OK on dates. See app note 1: no Friday falls in the window, so the Holi episode never drops. | Bengal's Dol Jatra is about Krishna, not Holika. Does the Holika story fit every family? |
| Navratri 2027 (old app) | Sep 30 – Oct 8, Vijayadashami Oct 9 | same | [Drik Panchang Navratri 2027](https://www.drikpanchang.com/navratri/ashwin-shardiya-navratri-dates.html?year=2027) | OK | Bengal's Durga Puja dates differ by a day. One window, or a regional note? |
| Diwali 2027, 2028 (old app) | Oct 27 – 31, 2027 (Lakshmi Puja Oct 29); Oct 15 – 19, 2028 (Oct 17) | 2027: Oct 27 – 31, Lakshmi Puja Oct 29. 2028: Dhanteras Oct 15, Lakshmi Puja Oct 17, Bhai Dooj Oct 19 | [Drik Panchang 2027](https://www.drikpanchang.com/diwali/diwali-puja-calendar.html?year=2027), [2028](https://www.drikpanchang.com/diwali/diwali-puja-calendar.html?year=2028) | OK | none |
| Diwali as "new year" (old app) | Oct 29, 2027 | Diwali Oct 29 | Drik Panchang | DEPENDS: the Hindu new year differs by region (Ugadi / Gudi Padwa in spring, Vishu, Gujarati new year after Diwali) | Which new year should "your year on the hill" use, or should families pick? |

## Sikhism

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Vaisakhi 2027 (new app) | Apr 12 – Apr 15 | Apr 14 (Nanakshahi fixed date and the solar date agree in 2027) | [Drik Panchang Vaisakhi 2027](https://www.drikpanchang.com/festivals/vaisakhi/vaisakhi-date-time.html?year=2027) | OK on dates. See app note 1: no Friday in the window, so the "five beloved" episode never drops. | none for 2027 |
| Vaisakhi 2028 (old app) | Apr 13 | Apr 13 by the solar (Bikrami) count; Apr 14 by the original Nanakshahi calendar | [Drik Panchang](https://www.drikpanchang.com/festivals/vaisakhi/vaisakhi-date-time.html) | DEPENDS: the Nanakshahi vs. Bikrami dispute | Which calendar do we follow: SGPC's (Bikrami-based) or the original Nanakshahi (used by many gurdwaras abroad)? |
| Guru Nanak Gurpurab 2026 (old app) | Nov 18 – Nov 24 (run-up) | Nov 24, Kartik Purnima | [Wikipedia](https://en.wikipedia.org/wiki/Guru_Nanak_Gurpurab), [Office Holidays (Punjab)](https://www.officeholidays.com/holidays/india/punjab/guru-nanak-birthday) | DEPENDS: SGPC hasn't published it in anything we found; it can move a day | The new app has no Gurpurab window, and it's 16 days away. Add one? |
| Bandi Chhor Divas 2026 | not in either app | Nov 8, the same day as Diwali | Drik Panchang (Diwali date) | DEPENDS: a gap | Sikh families celebrate Bandi Chhor on Diwali. Should the Sikh door get its own window and story, not the Hindu one? |

## Buddhism

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Vesak 2027 (new app) | May 18 – May 21 | May 20 (Singapore, Sri Lanka; Sri Lanka adds May 21) | [publicholidays.sg](https://publicholidays.sg/vesak-day/), [Office Holidays (Sri Lanka)](https://www.officeholidays.com/holidays/sri-lanka/wesak-day) | DEPENDS: Theravada date is right. East Asian Buddha's Birthday is about May 13, 2027 (Korea); Japan keeps Apr 8; Tibetan Saga Dawa often falls a month later. | Which school's date do we lead with, and do Mahayana users get their own? |
| Vesak 2028 (old app) | May 9 (Sri Lanka May 23) | May 9 (Singapore) | [publicholidays.sg](https://publicholidays.sg/vesak-day/) | DEPENDS: in 2028 Sri Lanka's date is two weeks later because of an extra lunar month | Same question as above |
| Vassa / rains retreat 2027, 2028 (old app) | Jul 19, 2027 (Asalha Puja Jul 18); Jul 8, 2028 | July full moon Jul 18, 2027 | [Wikipedia: Vassa](https://en.wikipedia.org/wiki/Vassa) | DEPENDS: differs by country | none |

## My own religion

| holiday | our dates | verified dates | source | status | question for the scholar |
|---|---|---|---|---|---|
| Solstices, Jan 1 (old app) | Jun 21 / Dec 21, 2026-2028; Dec 21, 2027 | Dec 21, 2027 in the Americas (Dec 22 in UTC) | [timeanddate](https://www.timeanddate.com/calendar/seasons.html) | OK (already noted in the file) | none |

---

## App notes for the team (not dates, but they change what users see)

1. **Two holidays can never be the Friday drop.** The drop lands every Friday at 7pm, and the Holi window (Mar 20–23,
   2027) and the Vaisakhi window (Apr 12–15, 2027) have no Friday in them. Cards still get the holy-day edition, but
   the Holi and Vaisakhi episodes never drop. Fix: open both windows on the Friday before (Mar 19, Apr 9).
2. **The Eid fix needs the Friday.** Change Eid to Mar 9 – Mar 12 (not Mar 9 – 11) so the Friday Mar 12 drop is still Eid.
3. **New app and old app disagree** on Ramadan and Eid 2027 by one day. The old app (Mar 9 Eid) matches the
   Fiqh Council. Use one table for both.
4. The new app has no windows for Gurpurab (Nov 24), Bandi Chhor (Nov 8), Passover, Orthodox Easter or Epiphany.
   These are gaps to decide on, not errors.
5. The app should keep saying "dates may vary by community" (the old app already does).
