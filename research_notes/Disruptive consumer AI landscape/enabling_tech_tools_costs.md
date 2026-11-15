# Enabling AI tech for jaw-dropping consumer experiences: tools, maturity, costs (as of 2026-11-10)

Method note: about 19 searches and fetches, run 2026-11-10. Official pages were fetched where possible (Decart pricing docs, ElevenLabs API pricing, sync.so docs, Runway Characters page). Many figures come from third-party pricing trackers (UsagePricing, invideo's August 2026 normalized rate table, Costbench) and are flagged as such. Prices move monthly in this space, so check each number against the vendor page before budgeting.

## 1. Real-time / interactive video and streaming avatars

### Takeaway
Talking-head avatars you can video-chat with are production-ready now and cost about $0.10 to $0.35 per minute (Tavus, HeyGen LiveAvatar, Runway Characters). Real-time video transformation (Decart Lucy) is a working paid API at about $1.20/min. Fully interactive generated video worlds (Odyssey) are still free betas or demos with no published paid price.

### Cited Findings
- **Tavus CVI (conversational video interface):** the newest reported overage rates are $0.35/min (Builder), $0.31/min (Growth) and $0.26/min (Business), cut from earlier $0.37/$0.32. Plans were restructured in June 2026 into six tiers, from a $22/mo Starter up to a $975/mo Business tier. This comes from a third-party tracker citing archived snapshots of the official page — [UsagePricing](https://www.usagepricing.com/blueprint/activity/tavus-2026-06-24-cvi-ladder-expanded); the official [Tavus pricing](https://tavus.io/pricing) snapshot in search still showed $0.37/$0.32.
- Tavus bills in 6-second increments with a 30-second minimum per conversation — [UsagePricing](https://usagepricing.com/blueprint/tavus). Billing reportedly includes idle and wait time — [DailyAIFixs](https://dailyaifixs.com/blog/tavus-pricing-2026-the-per-minute-catch). Pre-rendered (non-live) Tavus video costs $1.00 / $0.90 / $0.80 per minute by tier — [UsagePricing](https://usagepricing.com/blueprint/tavus).
- **HeyGen LiveAvatar:** sold separately from the HeyGen API, at liveavatar.com, on its own credit system. Slots reportedly cost $49/month or $480/year — [HeyGen help](https://help.heygen.com/en/articles/10060327-heygen-api-pricing-explained), [Anam blog on HeyGen pricing](https://anam.ai/blog/heygen-pricing) (a competitor's blog). HeyGen says FULL mode hosts speech recognition, the LLM, the voice and turn-taking, while LITE mode renders only the avatar for your own stack at half the credits — [HeyGen blog](https://www.heygen.com/blog/best-real-time-ai-avatar-platforms). An older HeyGen plan (1 credit = 5 streaming minutes at $99/mo) worked out to about $0.20/min; treat it as historical only — [HeyGen help (older)](https://intercom.help/heygen/en/articles/10060327-new-heygen-api-plans).
- **Runway Characters** (real-time avatar from a single image, on Runway's developer platform): 2 credits to start a session, then 2 credits per 6 seconds of active session. One credit = $0.01 — [Runway Characters](https://runway.com/product/characters). By arithmetic that is about $0.20 per active minute. A third-party API catalog lists a 5-minute maximum per WebRTC session (unconfirmed) — [API Evangelist](https://apis.apievangelist.com/store/characters). Runway's Builders program offers seed-to-Series-C startups up to 500k free API credits (about $5,000) — [Runway Builders](https://runway.com/news/introducing-runway-builders).
- **Decart (official pricing docs, fetched 2026-11-10):** real-time models are billed per second of active generation at 720p. Lucy 2.6 / 2.5 cost $0.02/s ($1.20/min), with a 2x "fast mode" at $0.04/s. Lucy VTON (virtual try-on) is $0.02/s, Lucy Restyle 2 is $0.01/s ($0.60/min), and Oasis 3 Preview (real-time game world) is $0.02/s. There are no subscriptions and no minimum spend — [Decart pricing docs](https://docs.platform.decart.ai/getting-started/pricing). Lucy 2.5 runs at about 30 fps without drifting — [AlphaSignal](https://alphasignal.ai/news/decart-s-lucy-2-5-transforms-live-video-at-30-fps-without-drifting). It is also hosted on fal at about $0.04/s — [fal](https://fal.ai/models/decart/lucy-2-5/realtime/llms.txt).
- **Odyssey (interactive video / world model):** Odyssey-2 Pro offers 1,000,000 free "simulations" by API, first-come first-served, with up to 10 simultaneous runs per user. No published paid rate was found — [Stork](https://stork.ai/en/odyssey-2-pro). Odyssey-2 Max is reportedly private beta only — [MakerStack](https://makerstack.co/reviews/odyssey-2-max-review/). Odyssey-3 has only a contact form, a browser preview and no price — [OrcaRouter](https://www.orcarouter.ai/blog/odyssey-3-vs-grok-imagine-video).
- **Hedra Character-3** (pre-rendered talking characters, not live): 8 credits per second — [Hedra](https://www.hedra.com/video-models/hedra-character-3). One third-party guide converts this to about $0.05/s on the API — [NovoAds](https://novoads.ai/en/blog/hedra-pricing).

### Inferences
- For a "talk face-to-face with a celebrity guide or mascot" moment, the realistic choice is Tavus, HeyGen LiveAvatar (LITE mode with your own LLM and voice) or Runway Characters, at about $0.20 to $0.35 per minute of video plus LLM costs. A 5-minute daily chat for 10,000 daily users would cost roughly $10k to $17k a day. That only works as a rare, earned moment, not an everyday feature.
- Decart's $1.20/min is too expensive for long sessions but fine for short "wow" bursts (for example, 20 seconds of seeing yourself restyled as a painting costs about $0.40).
- A stylized mascot like Finn suits Runway Characters (one image in) better than photoreal digital-twin tools.

### Gaps
- No official current HeyGen LiveAvatar per-minute rate was found. The $0.01/min enterprise figure is HeyGen marketing and was not confirmed.
- D-ID real-time agent pricing and current Anam pricing were not researched (out of the call budget).
- No independent latency benchmarks for the avatar vendors (time from the user stopping speaking to the avatar replying) were found in this pass.

## 2. Real-time voice agents and conversational voice

### Takeaway
Voice agents are the most mature piece. ElevenLabs Agents costs about $0.08 to $0.10 per minute plus the LLM. OpenAI's realtime speech-to-speech models work out to roughly $0.07 to $0.45 per minute depending on caching. Cartesia is the cheapest and fastest text-to-speech option. Hume's EVI is reportedly shutting down on 2026-11-13, and Sesame is still in limited preview.

### Cited Findings
- **ElevenLabs Agents:** about $0.08/min overage on annual Business plans and about $0.10/min on Creator/Pro — [Layer3Labs](https://www.layer3labs.io/guides/elevenlabs-pricing). Calls beyond your concurrency cap are billed at double rate ($0.16/min) — [CloudZero](https://www.cloudzero.com/blog/elevenlabs-pricing/). The LLM and telephony are billed separately — [HappyRobot](https://www.happyrobot.ai/hub/elevenlabs-pricing). Plans range from $0 to $990/mo, plus Enterprise — [Costbench](https://costbench.com/software/ai-voice-tools/elevenlabs/calculator/).
- **OpenAI Realtime:** billed per token, not per minute. Secondary sources list gpt-realtime-2.x at $32 per 1M audio input tokens, $0.40 cached, and $64 per 1M audio output tokens — [TokenCost](https://tokencost.app/blog/openai-gpt-realtime-2-voice-pricing). At about 600 input and 1,200 output tokens per spoken minute, that is roughly $0.02/min of user speech and $0.08/min of agent speech. Whole-call estimates run from $0.07/min (with caching) to $0.43/min (without) over a 15-minute call — [CallSphere](https://callsphere.ai/blog/vw2c-openai-realtime-cost-per-minute-math-2026). Another estimate is $0.18 to $0.46/min, falling under $0.25 with caching — [Fora Soft](https://www.forasoft.com/blog/article/openai-realtime-api-pricing). Streaming transcription (gpt-realtime-whisper) is $0.017/min — [OpenAI docs](https://developers.openai.com/api/docs/models/gpt-realtime-whisper). The exact current model name (gpt-realtime-2 vs 2.1) differs between sources.
- **Hume EVI:** a developer site reports that Hume is sunsetting its TTS and EVI APIs, with access ending 2026-11-13 at 12:01 a.m. EST and account data deleted afterward — [Developers Digest](https://www.developersdigest.tech/voice-agents/hume-evi). Hume's own docs pages in search showed no notice, so this is unconfirmed — [Hume docs](https://dev.hume.ai/docs/speech-to-speech-evi/overview). Before that, EVI 4 Mini was reported at about $0.02/min on the Business tier — [UsagePricing](https://usagepricing.com/blueprint/activity/hume-ai-2026-06-30-packaging).
- **Cartesia Sonic-3:** about $0.00004 per character (roughly $0.05/min) vs about $0.00006 for Hume — [Costbench](https://costbench.com/compare/cartesia-vs-hume-ai/). Latency is about 40 ms to first audio, or under 90 ms depending on the source — [ToolQuestor](https://toolquestor.com/vs/cartesia-vs-hume-ai).
- **Sesame:** the commercial API is still in limited preview and English-centric, as of May 2026 — [youngju.dev](https://www.youngju.dev/blog/culture/2026-05-16-voice-ai-tts-2026-elevenlabs-cartesia-openai-voice-play-ht-hume-sesame-fish-deepgram-aura-deep-dive.en).

### Inferences
- For a talking guide in the app, ElevenLabs Agents (with your choice of LLM) or OpenAI Realtime is the safe production path. With caching and short sessions, budget about $0.10 to $0.25 per conversation minute in total.
- Do not build on Hume now, because of the reported shutdown.
- Licensed celebrity voices: ElevenLabs runs a voice marketplace and professional voice cloning, but the licensing terms for a celebrity voice must be negotiated with the talent. No vendor's terms grant that by default (not researched in detail; see gaps).

### Gaps
- No official ElevenLabs Agents or OpenAI Realtime pricing page was fetched, so figures are from trackers.
- Voice-cloning licensing terms (ElevenLabs Iconic Voices marketplace, consent rules) were not checked in this pass.
- Artificial Analysis speech arena rankings were not retrieved.

## 3. World models and generative 3D / game worlds

### Takeaway
Only World Labs Marble (exportable 3D worlds, with a public API since 2026-01-21) and Decart Oasis 3 Preview (a real-time playable stream at $0.02/s) can be wired into an app today. Google's Genie 3 is consumer-only (Project Genie, AI Ultra subscribers, about $200/mo). Genie 4 (announced 2026-10-27) is a trusted-tester preview with no public API or price.

### Cited Findings
- **World Labs Marble:** generally available since 2025-11-12; the public World API launched 2026-01-21 with prepaid credits — [World Labs](https://worldlabs.ai/blog/announcing-the-world-api), [Radiance Fields](https://radiancefields.com/world-labs-formally-launches-marble-a-generative-world-model). A third-party guide (August 2026) lists a free tier (4 generations), a $20/mo Standard tier with 20,000 credits (about 12 worlds), and about $1.20 to $1.28 per world — [Tech-Insider](https://tech-insider.org/genie-3-vs-marble-vs-nvidia-cosmos-world-models-2026/). World Labs' next model, Atlas, entered selective early access on 2026-09-01 with no API or price — [AI Revolution (JP)](https://ai-revolution.co.jp/media/what-is-world-labs-atlas/).
- **Google Project Genie (Genie 3):** opened in January 2026 as a prototype web app for US Google AI Ultra subscribers aged 18+, powered by Genie 3, Nano Banana Pro and Gemini — [Google blog](https://blog.google/innovation-and-ai/models-and-research/google-deepmind/project-genie/), [9to5Google](https://9to5google.com/2026/01/29/google-project-genie/). Genie 4 was announced 2026-10-27 as a research preview for trusted testers, "coming soon" to Ultra and to early-access partners in the Gemini API, with no date or price — [PPC Land](https://ppc.land/googles-genie-4-simulates-people-who-talk-back-in-real-time/), [Layer3Labs](https://www.layer3labs.io/guides/genie-4-explained).
- **Decart Oasis 3 Preview:** real-time, at $0.02/s, with enterprise pricing available — [Decart pricing docs](https://docs.platform.decart.ai/getting-started/pricing).
- **Odyssey:** free API beta (see section 1).

### Inferences
- Shippable today: generate Marble worlds offline (about $1.25 each) and display them in the app as 3D or Gaussian-splat scenes. That gives "walkable sacred places" at near-zero runtime cost. Live, infinitely generated worlds (Genie, Oasis) remain demo-grade for consumer apps, because of cost ($72 per active hour on Oasis), short sessions and lack of an API.
- This fits the owner's "places on the hill" direction. Pre-generated Marble worlds are already in use (see the earlier pipeline memory), so this is the low-risk path.

### Gaps
- Dynamics Lab (Mirage) status and pricing were not researched.
- Marble pricing came from a third-party guide; the official World Labs billing page was not fetched.

## 4. Consistent-character video and image, lip-sync, digital twins

### Takeaway
Clip generation is cheap and production-ready: about $0.05 to $0.40 per second, or about $0.40 to $3.20 for an 8-second clip. Veo 3.1 Lite and Fast and Kling 3.0 are the value picks, with native audio. Character consistency in images is best served by Nano Banana Pro (up to 14 reference images) or GPT Image 2. Lip-sync is about $0.04 to $0.13 per second (sync.so). Note that the Sora 2 API reportedly sunset on 2026-09-24.

### Cited Findings
- **Official per-second rates as of August 2026** ([invideo normalized table, dated 2026-08-06](https://invideo.io/blog/ai-video-model-pricing)):
  - Veo 3.1: $0.40/s at 720p to 1080p and $0.60/s at 4K, audio included.
  - Veo 3.1 Fast: $0.10/s (720p), $0.12/s (1080p), $0.30/s (4K).
  - Veo 3.1 Lite: $0.05/s (720p), $0.08/s (1080p).
  - Kling 3.0 Turbo: about ¥0.8/s (about $0.11) at 720p, with native audio since 2.6.
  - Seedance: billed by token, roughly $0.14/s at 1080p-class settings; Seedance Mini about $0.022/s.
  - Sora 2 API: $0.10/s (sora-2, 720p) to $0.70/s (sora-2-pro, 1080p). The API sunsets 2026-09-24.
  - MiniMax Hailuo H3: $0.13/s at 2K, with native audio and reference images (first 5 free, then $0.04 each).
  - Grok Imagine Video: $0.05/s (1.0), $0.08/s (1.5).
- Resellers often quote 2 to 3 times the official rates. Another comparison puts Kling 3.0 at $0.126/s at 720p with sound and $0.168/s at 1080p — [BuildFastWithAI](https://www.buildfastwithai.com/blogs/seedance-2-5-vs-veo-3-1-vs-kling-3-0-best-ai-video-2026). Seedance 2.5 now exists — [Atlas Cloud](https://www.atlascloud.ai/hi/blog/guides/gpt-image-2-api-guide).
- **Images:** Nano Banana Pro costs about $0.134 per 1K/2K image and $0.24 per 4K image; Nano Banana 2 costs about $0.067 — [MyArchitectAI](https://www.myarchitectai.com/blog/nano-banana-api-pricing). GPT Image 2 is reported at about $0.03 (1K) to $0.06 (4K), with wide disagreement between sources ($0.006 to $0.21) — [Unifically](https://unifically.com/blogs/gpt-image-2), [AIVideoBootcamp](https://aivideobootcamp.com/blog/chatgpt-images-2-review-2026/). Nano Banana Pro takes up to 14 reference images and keeps up to 5 people consistent per scene; GPT Image 2 takes up to 8 references — [Coverr](https://coverr.co/blog/nano-banana-pro-ai-image-character-consistency-2026). Reviews disagree on which is better for multi-frame stories — [Aireiter](https://aireiter.com/blog/gpt-image-2-vs-nano-banana-pro-2026).
- **Lip-sync (sync.so, official):** lipsync-2 costs $0.04 to $0.05/s; lipsync-2-pro costs $0.067 to $0.083/s; sync-3 costs up to $0.133/s (at 25 fps) — [sync.so models](https://sync.so/docs/models), [sync.so pricing](https://sync.so/pricing).
- **Hedra Character-3:** about $0.05/s by one third-party guide (see section 1).

### Inferences
- A 60-second episode built from 8 Veo 3.1 Fast shots costs about $6 to $8 in raw generation, before retakes. Expect 3 to 5 times that for selection waste. This is cheap enough to make a weekly series.
- For a consistent mascot across films, the workable pipeline today is: lock the character in images (Nano Banana Pro or GPT Image 2 with references), then animate with image-to-video (Veo, Kling or Hailuo with reference images), then apply lip-sync (sync.so) for speaking shots.

### Gaps
- Runway Gen-4 / Aleph / References and Midjourney video per-clip pricing were not found in this pass.
- No quality benchmark (Artificial Analysis video arena) was retrieved.

## 5. Music generation APIs and licensing

### Takeaway
ElevenLabs Music is the safest licensed music API for a business: $0.15/min on the official page, commercial use from the Starter plan up, and licensing deals with Merlin and Kobalt, plus a UMG deal (2026-09-10) for a separate remix platform. Udio has settled with Warner and UMG; Suno has settled with Warner, but its UMG/Sony talks were at an impasse as of April 2026. Stable Audio is cheap per generation and has open-weight options.

### Cited Findings
- **ElevenLabs Music API:** $0.15 per minute, up to 5 minutes per generation, with commercial use licensing on Starter and higher plans — [ElevenLabs API pricing](https://elevenlabs.io/pricing/api). Some third parties cite $0.30/min, which conflicts with the vendor page — [CometAPI](https://www.cometapi.com/ai-music-api-pricing/).
- ElevenLabs had licensing deals with Merlin and Kobalt before launching music — [Implicator](https://www.implicator.ai/elevenlabs-sidesteps-lawsuits-with-rare-licensing-deal-in-ai-music-launch.md). UMG and ElevenLabs signed a multi-year deal on 2026-09-10. It is opt-in by artist and covers a separate fan-remix platform, not the Music API — [Music Business Worldwide](https://www.musicbusinessworldwide.com/elevenlabss-11b-valuation-is-more-than-twice-the-size-of-sunos-its-just-struck-a-global-ai-music-deal-with-umg/), [The Next Web](https://thenextweb.com/news/umg-elevenlabs-licensed-ai-music-platform).
- **Suno and Udio:** Warner has settled with both; UMG has settled with Udio. UMG and Sony talks with Suno were reported at an impasse in April 2026 — [Opus Pro](https://www.opus.pro/blog/ai-music-news-april-2026). Neither Suno nor Udio offers an official public developer API, as far as this pass found (see gaps).
- **Stable Audio:** 2.5 costs $0.20 per generation (up to 3 minutes); 3.0 costs $0.26 per generation (up to 6 minutes). The open-weight Stable Audio 3 Small and Medium can be self-hosted under Stability's Community License (commercial use while revenue is under $1M) — [ApiFrame](https://apiframe.ai/blog/ai-music-api-pricing-2026), [AIVideoSensei](https://aivideosensei.com/guides/ai-music-generator-apis).
- Google Lyria 3 Pro is also offered as a music API — [Segmind](https://blog.segmind.com/ai-music-api-lyria-3-pro-vs-elevenlabs-music-vs-sonilo-and-which-are-safe-for-commercial-use/).

### Inferences
- For original songs in the app or films (for example Finn's drops), use ElevenLabs Music or Lyria. Avoid building on Suno or Udio through unofficial wrappers, because of licensing and terms risk. Real devotional music (bhajans) still needs human artists or licensed recordings.

### Gaps
- Official Suno/Udio API availability was not confirmed. Lyria 3 pricing was not found. Stability's license text was not fetched.

## 6. On-device and personalization tech

### Takeaway
At WWDC 2026, Apple's Foundation Models framework became multimodal on-device (images plus text, with OCR and barcode tools), with a plug-in protocol for cloud models (Gemini via Firebase). That gives free, private, on-device understanding for iOS apps. Android has an equivalent in Gemini Nano, which was not researched in this pass.

### Cited Findings
- Apps can pass images alongside text to the on-device model, and Vision tools (OCR, barcode reading) can be called by the model on-device — [Callstack](https://callstack.com/blog/on-device-ai-after-wwdc-2026-whats-new), [DEV](https://dev.to/hariharanjagan/whats-new-in-apples-foundation-models-framework-at-wwdc-2026-5227).
- Developers can swap in Gemini by initializing a session with GeminiLanguageModel instead of SystemLanguageModel — [Firebase blog](https://firebase.blog/posts/2026/06/apple-foundation-models-gemini). A public LanguageModel protocol lets any cloud provider plug in; reports say the framework is being open-sourced, and a new Core AI framework runs custom models locally — [Appbot](https://appbot.co/blog/apple-wwdc-2026-ai-foundation-model-update/), [Noqta](https://noqta.tn/en/blog/apple-foundation-models-framework-open-source-claude-gemini-swift-2026).
- Apple's new models were trained using Gemini but are Apple's, and run on-device and on Private Cloud Compute — [Kunal Ganglani](https://www.kunalganglani.com/blog/apple-gemini-foundation-models-developers).

### Inferences
- On-device models suit privacy-sensitive features (journaling reflections, "point your camera at this object or text") at zero per-call cost. This fits the project's rule not to log journal text or practice history. It needs a native iOS module (the Expo app would need a native bridge).
- Memory and "agents that act" are mostly app-level design built on LLM APIs, not separate products.

### Gaps
- Gemini Nano / Android AICore status, OpenAI and Anthropic memory APIs, and camera-understanding APIs (Gemini Live API pricing) were not researched within the call budget.
