# Magna (drinkmagna.com): website, e-commerce and packaging teardown (as of Nov 2026)

Method note: the homepage HTML was pulled directly on 2026-11-10 (fonts and hex colors below come from its CSS). After that, drinkmagna.com rate-limited every request (HTTP 429), so product-page detail comes from the mirror storefront try.drinkmagna.com/products/magna (same Shopify store, same image files). Dieline and New Consumer articles are paywalled past the intro. Instagram could not be fetched.

## 1. What is on the homepage, product pages, FAQ, store locator and popups (exact headlines and CTAs)?

### Takeaway
Magna runs a long, single-scroll Shopify homepage that goes: hero, flavors, Target, benefits, science stats, a competitor bar chart, product lines, reviews, a quality claim, community events, then the FAQ. Every block ends in a short CTA. The product page is a subscription-first "Starter Kit" offer: $39 a month with free gifts and a 60-day guarantee.

### Cited Findings
**Top bar and nav**
- Announcement marquee (lime text, CSS `--announcement-marquee-color: #f1ff67`) with two messages: "Introducing Shirley Temple" and "magna +creatine Now Available" — [drinkmagna.com homepage](https://www.drinkmagna.com)
- Nav: Shop Now, Store Locator, My Account, Cart (0), Ingredients, Reviews, Ambassador Program, Wholesale. The menu drawer holds product cards, each with a badge: "NEW Shirley Temple / New flavor", "BEST SELLER Core Hydration", "New magna +creatine / Now available", "Magna Bundle / Buy 3 get the 4th free", "Raspberry Iced Tea" — [homepage](https://www.drinkmagna.com)

**Homepage sections, in order (copy quoted exactly)**
1. Hero. H1: "Triple-Magnesium Electrolytes that hit harder, taste better, and work smarter." Sub: "The nostalgic icon, reimagined for what your body needs now." (this pairs with the Shirley Temple launch). CTA "Shop Now". Trust line underneath: "60-day money back guarantee", "Update or cancel anytime". The hero is a video with desktop and mobile posters (`shirley-hero-desktop-poster.jpg`, `shirley-hero-mobile-poster.jpg`) — [homepage](https://www.drinkmagna.com)
2. Flavors. "Tastes Great. Works Greater." / "Delicious meets functional, with no weird aftertaste." Flavor cards: Apple Juice, Tea Lemonade, Island Punch, Blood Orange, each with "Shop Now". Footer line: "8 Flavors All Powered By Magnesium" — [homepage](https://www.drinkmagna.com)
3. Retail. "Now Available At Target" / "Find Us In Every Target." / "Magna is now stocked in Target stores nationwide - in the hydration aisle, wherever you are." Chips: "In Stock Nationwide", "Hydration Aisle". CTA "Find Your Nearest Store" (links to /pages/store-locator) — [homepage](https://www.drinkmagna.com)
4. Benefits. "Not Just Hydration. A Full Body Upgrade." Four cards: Increased Energy (Magnesium Malate "fuels your natural energy—no spikes, just clean power."), Faster Recovery (Glycinate + Potassium "relax muscles, regulate cortisol, and speed recovery after movement."), Sharper Focus (Gluconate "...without the crash."), Max Hydration ("directs water straight into your cells—not your gut") — [homepage](https://www.drinkmagna.com)
5. Science stats. "500+ Peer-Reviewed Studies, over 30+ Years" / "Magnesium Is The Most Important Electrolyte". Three big numerals: "75% Americans don't get enough magnesium.", "15+ magnesium benefits linked to focus, energy, recovery & mood.", "100 of your body's energy production depends on magnesium." — [homepage](https://www.drinkmagna.com)
6. Comparison bar chart. Eyebrow "The Hydration Molecule", H2 "3x More Magnesium Than Our Competitors". Bars: Magna 210mg vs unnamed competitors at 60mg, 50mg, 26mg and 0mg. CTA "Learn More" — [homepage](https://www.drinkmagna.com)
7. Product line. "3,000+ FIVE STAR REVIEWS" / "Triple Magnesium Powered Electrolytes", with Energy, Recovery, Focus and Hydration (Sodium + Potassium) tiles. CTA "Get Hydrated →" — [homepage](https://www.drinkmagna.com)
8. Reviews. "Everyone is raving about Magna:" with filter tabs Featured / Hydration / Energy / Magnesium / Recovery. UGC video slider (looping `<video>` elements), named reviewers, "Verified buyer" tags, and review titles such as "Obsessed", "Magna Magic!", "Midday Pick-me-up!" — [homepage](https://www.drinkmagna.com)
9. Quality. "The highest quality ingredients. Trusted by doctors, demanded by athletes." CTA "Learn more", plus an NSF badge — [homepage](https://www.drinkmagna.com)
10. Community. "The Magna Community" / "...Join us at running clubs, fitness events and help us push the movement forward." Event tiles: "Renegade Running x Adidas LA 2026", "Softbar x Track Club Brooklyn 2026", "Cafe Tondo", "Session Training x PNTB Movement NYC 2025", "The LINE Hotel". CTA "Contact Us" — [homepage](https://www.drinkmagna.com)
11. FAQ accordion, grouped as About Magna / About Magnesium / Orders & Shipping / Refunds & Exchanges / Contact. Sample lines: "Magna is best consumed twice daily for maximum impact."; "There's no weird aftertaste, we promise."; "Unlike other forms of magnesium, it will not make you sleepy"; "Shipping is free on your first order, with no minimum."; 60-day refunds; unopened flavor exchanges within 30 days; US-only shipping; info@drinkmagna.com, 24-48h reply — [homepage](https://www.drinkmagna.com)
- Footer columns: Shop (Cart, My Account, Wholesale), About (Refund Policy, Privacy, Terms, Partners, EU Legal Notice), Connect (Instagram, TikTok, Store Locator). Email capture uses the placeholder "Your Email". Copyright "© Magna 2026. All Rights Reserved" — [homepage](https://www.drinkmagna.com)
- Site subpages linked from the homepage: /pages/ingredients, /pages/reviews, /pages/store-locator, /pages/wholesale, /pages/refund-policy, /products/magna, /products/creatine. Search also surfaced landing pages /pages/affiliate, /pages/lifestyle ("600+ FIVE STAR REVIEWS"), /pages/trial ("1,000+ FIVE STAR REVIEWS"), /pages/solutions, /products/the-sampler, /products/blue-ice-14-count and /products/magna-water-bottle. These look like older ad landing pages, judging by their lower review counts — [search results via WebSearch](https://www.drinkmagna.com/pages/trial)

**Product page (/products/magna, read from the try. mirror)**
- H1 "Magnesium Powered Electrolytes". Sub: "Magna combines three forms of magnesium with key vitamins to fuel daily focus, energy, and recovery." Other section heads: "The Magna Transformation", "Works Great. Tastes Greater." (the homepage flips this to "Tastes Great. Works Greater."), "Your doctor has taken Magnesium for years. Meet ours:", "Try It Now" — [try.drinkmagna.com/products/magna](https://try.drinkmagna.com/products/magna)
- Survey stat block (650+ people, 7 days): 92% felt more consistently hydrated, 71% steadier energy, 58% better focus, 62% better sleep — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- Experts named on the page: Michael Doney (MD, MPH...) and Kelly Pritchett (PhD, RDN, CSSD). Claim: "Over 5 Million Sold" — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)

**Popups and newsletter:** Klaviyo is loaded (klaviyo.js, onsite embed), but no popup copy appears in the server HTML. It is likely injected client-side and was not captured — [homepage source](https://www.drinkmagna.com)

### Inferences
- The homepage is built from repeated "ctr-" section blocks (CSS variables `--ctr-bg-color`, `--ctr-cta-bg-color`). That points to a modular landing-page builder, so sections get swapped often for each launch, as the Shirley Temple hero shows.
- The wording "the nostalgic icon, reimagined" is the hook for the Shirley Temple launch. The retro framing lives in the copy and in the flavor names, not in a retro visual style.

### Gaps
- The Shirley Temple product page returned 404 at /products/shirley-temple and 429 elsewhere. Its own copy was not captured.
- The store locator page, ingredients page and the exact popup offer could not be fetched (rate limit).

## 2. Brand colors, fonts, logo and recurring graphic devices

### Takeaway
The brand is essentially black, white and one acid lime-yellow (#F1FF67). Type is set in Lineto's Riforma (a neo-grotesk), with "Bull" for display type, a marker face and a typewriter face for accents. The logo is a blocky lowercase "magna" wordmark.

### Cited Findings
- Hex counts in homepage CSS: #000000 (64 uses), #FFFFFF (52), **#F1FF67 (21, the brand lime)**, #474747, #1e1e1e, #121212, #EBEBEB/#f7f7f7 (light greys), #cdcfce/#ced3d2 (stone-grey section backgrounds). Single accents: #ff5381 (pink), #23185c (deep indigo), #ffb81c (amber), #86bee2 (sky blue), #ff2a14 (red), #ce7b2b, #af402b, #a82220 (orange-reds). The accents are probably flavor colors — [homepage source](https://www.drinkmagna.com)
- Button system: `--ctr-cta-bg-color: #000000` or `#f1ff67`. Hover swaps to a black background with lime text (`--ctr-cta-hover-bg-color: #000000; --ctr-cta-hover-text-color: #f1ff67`). Labels/badges are lime fill with black text (`--ctr-label-bg-color: #f1ff67`) — [homepage source](https://www.drinkmagna.com)
- Fonts in @font-face/CSS: **'Riforma LL'** (files RiformaLLWeb-Bold, BoldItalic, Heavy, HeavyItalic; fallback "riforma, 'Helvetica Neue', sans-serif"; this is the primary font, `--ctr-primary-font`), **'Bull-5'** and **'Bull-5-Typewriter'** (hosted on cdn.shopify.com), **'HV Marker'** (a hand-marker accent), 'Visual Semibold', and 'Inter' for UI — [homepage source](https://www.drinkmagna.com)
- Logo: a black SVG wordmark (`Magna_Logo_Black.svg`). It is lowercase on the site ("magna", "magna +creatine"). Trend Hunter describes the packaging as "a stylish, yellow design with a blocky lowercase font" — [homepage](https://www.drinkmagna.com); [Trend Hunter via search](https://www.trendhunter.com/amp/trends/magna)
- Identity agency: **Some Days**, an Oakland creative studio — [Dieline headline: "Some Days' Magna Design is a Very Modern Take On Sports Drinks"](https://thedieline.com/some-days-magna-design-is-a-very-modern-take-on-sports-drinks/); [Trend Hunter](https://www.trendhunter.com/amp/trends/magna)
- Dieline's angle: the hydration message is old ("Gatorade has been doing this successfully for decades"), but the brand is built for "younger Millennials and Generation Z" — [Dieline](https://thedieline.com/some-days-magna-design-is-a-very-modern-take-on-sports-drinks/)
- Recurring devices: an underscore/plus naming style ("magna_+creatine_" in link text); big-numeral stat blocks; a horizontal competitor bar chart with Magna's bar highlighted; lime pill badges ("NEW", "BEST SELLER", "SOLD OUT"); scrolling marquee announcement bar; checkmark trust lines; and a row of certification icons (ZeroSugar, GlutenFree, vegan, keto-friendly, non-gmo SVGs) — [homepage](https://www.drinkmagna.com); [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)

### Inferences
- "LL" is the Lineto foundry suffix, so this is Lineto's Riforma (a paid licence). "Bull" appears to be a custom or boutique display face; its foundry was not confirmed.
- The visual formula to copy: a stark neutral base (black, white, stone grey), one neon accent used only for CTAs, badges and the marquee, plus a hand-marker font for scribbled callouts.

### Gaps
- No Fonts In Use or Brand New entry was found. The designer of "Bull-5" and "HV Marker" is unverified.
- The full Dieline article (logo rationale, flavor color system) is paywalled.

## 3. How each flavor is packaged and named

### Takeaway
Magna sells single-serve stick packs in boxes: 28-count on DTC, 10-count at Target, plus a 3-count trial and 14-count boxes. The newer flavors lean on nostalgic, everyday-drink names (Shirley Temple, Apple Juice, Island Punch, Iced Tea Lemonade, Blue Ice) rather than puns.

### Cited Findings
- Launch lineup (July 2024): Lemon Lime, Tea Lemonade, Watermelon Lime, Peach Mango. Each 30-serving box was $55 one-time or $45 on subscription — [Wellworthy via search](https://wellworthy.com/magna-magnesium-powered-hydration/)
- Current Starter Kit flavor dropdown: Variety Pack, Shirley Temple (NEW), Peach Iced Tea (NEW IN), Raspberry Iced Tea (NEW), Blue Ice, Iced Tea Lemonade, Blood Orange, Lemon Lime, Mint Lemonade, Watermelon Lime (SOLD OUT), Island Punch, Apple Juice, Pure Magna (unflavored). The page also says "Available in 11 flavors," which does not match the dropdown — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- Summer Berries existed earlier (image file `PDP_SummerBerries_01.png`, and it appears in older search snippets) — [homepage source](https://www.drinkmagna.com); [search](https://www.drinkmagna.com/products/magna)
- Flavor copy: Lemon Lime is "Our homage to a legacy flavor is tart, subtly sweet, and very refreshing." Watermelon Lime is sweet, juicy, with a citrusy zing. Mint Lemonade has a "cooling minty finish". Iced Tea Lemonade pairs earthy tea with lemon and compares itself to a well-known drink — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- magna +creatine (around Aug 2026): Raspberry Lemonade, Passion Fruit, Iced Tea Lemonade, plus a variety pack. 28 stick packs, $59, 5g NURA creatine — [Stack3d](https://www.stack3d.com/2026/08/magna-creatine/)
- Target listings: 10-ct boxes of Lemon Lime, Watermelon Lime, Iced Tea Lemonade, Apple Juice, Island Punch and Blue Ice at $16.99, and a "Shirley Temple Trial Pack, 3 ct" at $5.00. Lemon Lime was on clearance at $14.44 — [Target](https://www.target.com/p/-/A-94931978)
- Each box carries a full certification row (Zero Sugar, Gluten Free, Vegan, Keto Friendly, Non GMO) and NSF Certified for Sport, and claims 210mg magnesium. Natural colors come from turmeric and spirulina — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna); [homepage FAQ](https://www.drinkmagna.com)
- Asset files suggest the visual pattern: per-flavor "Flavor Icon" photo tiles (e.g. `Apple_Flavor_Icon`, `Tea_Lemonade_Flavor_Icon`), whole-fruit images (`Blood_Orange_Fruit_Image.jpg`), styled still lifes (`..._DBG_MAG_PRODUCT_STILL_RASPBERRY_LEMONADE_02`), and a launch box for Blue Ice (`Blue_Ice_Campaign_Launch_Box.png`). The Dieline lead images are product boxes and a bike photo shoot — [homepage source](https://www.drinkmagna.com); [Dieline](https://thedieline.com/some-days-magna-design-is-a-very-modern-take-on-sports-drinks/)
- No cans or ready-to-drink format was found. Merch found: a Magna water bottle (sold, and given free with the Starter Kit) — [search result](https://www.drinkmagna.com/products/magna-water-bottle); [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)

### Inferences
- The naming moved from fruit descriptors (2024) to "drinks you grew up with" (2025-26: Apple Juice, Island Punch, Shirley Temple, Blue Ice). The retro lies in the name, carried by the "nostalgic icon" line, while the packaging stays modern.
- Each flavor likely has its own box color, drawn from the accent hexes above. This is unconfirmed without the box images.

### Gaps
- No exact box or stick-pack dimensions, per-flavor hex codes, or dieline images were readable. The Instagram (@drinkmagna) feed could not be accessed.

## 4. Tone of voice: 15+ exact lines

### Takeaway
The voice is confident, punchy and benefit-first. It uses wordplay on "great/greater", contrasts ("Not just X. A full Y."), "no spikes / no crash" negatives, and casual reassurances ("we promise").

### Cited Findings (all quoted from [homepage](https://www.drinkmagna.com) unless marked otherwise)
1. "Triple-Magnesium Electrolytes that hit harder, taste better, and work smarter."
2. "The nostalgic icon, reimagined for what your body needs now."
3. "Tastes Great. Works Greater."
4. "Delicious meets functional, with no weird aftertaste."
5. "Find Us In Every Target."
6. "Not Just Hydration. A Full Body Upgrade."
7. "no spikes, just clean power."
8. "...without the crash."
9. "straight into your cells—not your gut"
10. "Magnesium Is The Most Important Electrolyte"
11. "The Hydration Molecule"
12. "3x More Magnesium Than Our Competitors"
13. "Get Hydrated →"
14. "Everyone is raving about Magna:"
15. "Trusted by doctors, demanded by athletes."
16. "help us push the movement forward."
17. "There's no weird aftertaste, we promise."
18. "Your doctor has taken Magnesium for years. Meet ours:" — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
19. "Our homage to a legacy flavor is tart, subtly sweet, and very refreshing." — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
20. "Pause, cancel or adjust anytime." — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- Founder framing: New Consumer describes a "post-Nike ideology". Founder Michael Preysman, ex-CEO of Everlane, says "magnesium is the most-searched on Google. Above everything." — [New Consumer](https://newconsumer.com/2024/07/magna-hydration-magnesium-michael-preysman/)

### Inferences
- The tone is functional-performance (Liquid IV/LMNT territory) made cooler by the visuals, not by jokes. The copy rarely uses puns; the swagger comes from the type, the lime color and the community events.

### Gaps
- No social captions were captured, because Instagram and TikTok could not be fetched.

## 5. Drops, bundles, merch, pricing and checkout/subscription mechanics

### Takeaway
The store is Shopify, with Skio for subscriptions and Klaviyo for email. It pushes a monthly Starter Kit subscription ($39 for 28 servings) with a free bottle and a "surprise flavor 2-pack", a 2-box tier, a buy-3-get-1 bundle, and frequent "NEW" flavor drops announced in the marquee.

### Cited Findings
- Plans: Starter Kit, "Most Popular": $55 struck through to $39, "Save 29%", 28 servings monthly, free water bottle plus free surprise-flavor 2-pack. Best Value: 2 boxes / 2 flavors, $110 struck to $70, "Save 36%". Buy It Once: $55. Magna Bundle: 4 boxes for $165 (struck $220), "Buy 3 boxes get the 4th Free" — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- Risk reversal: "60-Day Money Back Guarantee" (return shipping not included), "Fast & Free Shipping On First Order", "Update or cancel anytime". Also a monthly sweepstakes (no purchase necessary) — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- Tech: Skio (subscriptions) and Klaviyo (email, SMS, reviews) referenced in the page source — [homepage source](https://www.drinkmagna.com)
- Retail price: $16.99 for 10 count at Target ($1.70 per serving), versus about $1.39 per serving on DTC subscription — [Target](https://www.target.com/p/-/A-94931978); [try.drinkmagna.com](https://try.drinkmagna.com/products/magna)
- Drops and labels: "NEW", "NEW IN", "SOLD OUT" badges. Shirley Temple and magna +creatine announced in the marquee. A 3-ct trial pack at Target ($5) for the new flavor. Blue Ice had a "Campaign Launch Box" — [try.drinkmagna.com](https://try.drinkmagna.com/products/magna); [Target](https://www.target.com/p/-/A-94931978)
- Growth programs: Ambassador Program, affiliate page, wholesale, and community events with running clubs (Renegade Running x Adidas, Softbar x Track Club, The LINE Hotel) — [homepage](https://www.drinkmagna.com)
- Investor: Forerunner Ventures lists Magna in its portfolio — [Forerunner via search](https://www.forerunnerventures.com/investments/magna)

### Inferences
- "Surprise flavor 2-pack" and the trial packs act as a sampling engine for drops. The scarcity is real: a SOLD OUT badge on Watermelon Lime, not invented countdowns.

### Gaps
- No apparel merch store was found; only the water bottle. The checkout flow itself (cart drawer upsells, Skio portal) was not walked through.

## Image URLs for the moodboard
Prefix for the files below: `https://www.drinkmagna.com/cdn/shop/files/`. The same files are also served at `https://try.drinkmagna.com/cdn/shop/files/`.
- Magna_Logo_Black.svg (wordmark)
- logo.png
- MAGNA-OG-IMAGE-V2.png (social share image)
- V2.png
- preview_images/shirley-hero-desktop-poster.jpg
- preview_images/shirley-hero-mobile-poster.jpg
- FlavorMain-pdp-magna_e7bee520-b1ff-4955-baec-e95da7278931.png (Shirley Temple flavor main)
- FlavorMain-pdp-magna_2.png
- bottle-pdp-magna_29797d9c-47ca-419c-884c-8f8a01deec82.jpg
- bottle-pdp-magna_12.png
- bottle-pdp-magna_13.png
- starter-kit-pdp-magna_64.png (Starter Kit box)
- starter-kit-pdp-magna-2boxSubscription_53.png
- Group_20940_2x_e57fc747-55aa-4905-9a6e-b6a264693c3a.png (bundle)
- Blue_Ice_Campaign_Launch_Box.png
- Section_82_no_button.png (Core Hydration banner)
- Section_83_no_button.png (magna +creatine banner)
- 26-07_3646-16A_DBG_MAG_PRODUCT_STILL_RASPBERRY_LEMONADE_02_1.png (product still life)
- magna-bloodorange_13_of_65.png
- BloodOrange2_2997d8ef-eb10-405c-a00b-36edd23d06e6.png
- Blood_Orange_Fruit_Image.jpg
- PDP_SummerBerries_01.png
- MAGNA-HP-PROD-TEA-LEMONADE-01.jpg
- Apple_Flavor_Icon_4be6abc9-ada4-47b6-9438-c824682e474c.jpg
- Tea_Lemonade_Flavor_Icon_ded6de8f-bd9a-4c6b-85aa-e43d5e40bc77.jpg
- Island_Punch_Flavor_Selector.jpg
- Lemon_Lime_Flavor_Icon_cd652b7b-6729-4a43-98a8-42bcf24c1de1.jpg
- Watermelon_Lime_Flavor_Icon_9bc7a061-e6dd-465f-a496-d7034ed18071.jpg
- Mint_Lemonade_PDP.jpg
- Unflavored_-_Select.jpg
- nutrition-pdp-magna-6.webp
- ingredients-pdp-magna-9.png
- magnesium_is_important_720.png
- magnesium_is_important_mobile_720.png
- nfs-badge.png
- 240820_Magna_CW_003560_2_1.png (campaign photo)
- DBaum_Magna_Shot_2.png (campaign photo)
- Magna_SoftRun_057_McKenna.jpg (run club event)
- MAGNA-HP-UGC-NICOLE-WINTER_ed999988-dff4-4906-a501-1b90c4379916.jpg (UGC)
- renegade1_2.jpg (Renegade Running x Adidas)
- tondo1_7f6b1486-faf5-4b49-aef9-aa9392120b79.jpg (Cafe Tondo)
- CR1A8822_1.jpg
- 09A6959_1.png
- sample_selects-122.png

Dieline:
- https://thedieline.com/wp-content/uploads/2024/09/Magna-Product-Boxes-scaled.jpg
- https://thedieline.com/wp-content/uploads/2024/09/Magna-Shoot-Bike-scaled.jpg
