# 01 — PROJECT OVERVIEW (read this first, every session)

Name: **Isekai Space Cowboy** (final, set 2026-10-19; formerly worked under the temporary name — all identifiers are `isekai-space-cowboy` in files/keys and `isekai_space_cowboy` in JS identifiers and card extensions).
Ancestor concept kept for history and Phase 3 lineage: `00-OLD-COWBOY-CONCEPT.md`.

## Importance & assumptions — set by the user only (read before everything else)

- **Never assume.** If anything is ambiguous, missing or merely "sounds likely", stop and ask the user ONE short question with options — then continue working on other parts. Never state an unconfirmed fact (whether some backend endpoint exists, whether some chunk or field appears, anything) as fact: mark it UNVERIFIED and let the step that needs it verify.
- **The user is the only test client.** All the models share one server; the agent NEVER sends requests to the user's backends — no curl, no fetch, no browser automation — a stray request can collide with model loading. Agent testing ceiling: selftests with fake timers/local data, plus ready-made live-test buttons and exact USER-CHECK steps. Results the user reports back are recorded as dated observations and become spec facts only when the user says so.
- **Only the user sets importance** — never inferred from how much space a topic takes up in these docs. Items marked **BACKBURNER**: do not build, do not discuss, do not design around — only do not block.
- The differentiators of this app are its media modes — text + pictures/vision + voice (TTS) + video calls. ALL are core; never suggest dropping them. A chat-only client is not the point of this project.
- Backend easy mode (current, not locked in): all four slots point at the user's local Unsloth Studio. Studio will provide all four capabilities in some form (user-confirmed) — the exact endpoints and payload shapes it exposes are **UNVERIFIED** and get discovered per step by the user's live test. Never bake Studio specifics into code: the app speaks only generic OpenAI-compatible shapes with user-supplied URLs and keys.
- User priority notes (only lines the user dictated; nothing may be added here otherwise):
  - **BACKBURNER: FTL / light-delay machinery** (see "The wait system").

## What this is

A browser-only chat front end for any OpenAI-compatible LLM endpoint, with SillyTavern-style character cards. It is themed as a lonely ship far from Earth: replies arrive the moment the backend finishes (FTL is today's reality; the delay idea is **BACKBURNER** — see "The wait system").

Three ways to talk to a character:

| Mode | In-world prop (Phase 2) | What happens |
|---|---|---|
| Terminal | Keyboard / terminal | Text chat. Optional pictures both ways. |
| Radio | Old radio station | Text in, character's reply spoken aloud (TTS). |
| Video call | Little TV | You type, the character replies with a ~4 s generated video clip with audio. |

## Phases (only build the phase you are told to build)

- **Phase 1 — Flat chat.** Plain HTML page. Card loader, chat log, the three modes as buttons, settings for endpoints. Replies land as soon as the backend finishes (FTL). Ugly is fine. Must work end to end.
- **Phase 2 — Ship walkaround.** Three.js low-poly ship interior. Walk up to a prop → camera zooms → the Phase 1 chat UI opens in that mode. The 3D scene is a *skin*: it only opens modes. No chat logic moves into 3D code.
- **Phase 3 — Game.** NOT in scope for this handoff. Outline only (see bottom). Will get its own handoff.

## Hard rules for the coding agent

1. **No build step.** Plain ES modules (`<script type="module">`), plain JavaScript with JSDoc comments. No npm, no bundler, no framework, no TypeScript.
2. **Allowed dependencies:** only `three` (Phase 2), vendored as a file in `vendor/`. Nothing else without asking the user first.
3. **Static only.** Phases 1–2 must run from any static file host (GitHub Pages, `python3 -m http.server`). No backend code in this repo for Phases 1–2.
4. **Follow the file tree in 02-SPECS.md exactly.** Do not create, rename or move files that are not listed there. If you think a new file is needed, stop and ask.
5. **One step at a time.** Do exactly one step from 03-STEPS.md, run its checks, report, then STOP and wait for the user.
6. **Never guess an API shape.** All endpoint formats are in 02-SPECS.md. If something is missing, stop and ask.
7. **Chat logic never lives in 3D code.** `scene/` may only call the public functions listed in 02-SPECS.md.
8. **No secrets in the repo.** Endpoint URLs and API keys come from the in-app Settings panel and are saved in the browser only.
9. **Plain text only.** All model output, user input and card data are inserted with `textContent` (or equivalent safe APIs). Never `innerHTML`, never markdown/HTML rendering. Nothing that comes from a card, a backend or the user may ever be parsed as markup.
10. **Git + GitHub.** Local git repo; commit once per completed step with the step number in the message. A remote exists (`origin` = the user's GitHub repo) on the user's explicit instruction of 2026-10-19, which overrides the old "no remote, no push" rule. Work on the `phase1` branch; push to it only when the user has approved that push — never automatically, and never touch `main`.
11. **Naming follows the game.** Every identifier follows *Isekai Space Cowboy*: `isekai-space-cowboy` (files, localStorage, IndexedDB) and `isekai_space_cowboy` (JS identifiers, card extension). The ancestor project's name ("Lost Signals" / `lostsignal`) is dead legacy — it must appear in NO file, key, field, module, or doc, ever.
12. **`local/` is private.** The repo carries a git-ignored `local/` folder of private design material (single copy, this machine only — flag it to the user if it ever grows in value). Never commit it, never push it, never quote or paraphrase it anywhere a player or tester could see: app text, README, wiki, commit messages, push requests. Phase 3 and narrative steps read it where relevant, but anything that must affect the public repo gets re-expressed in spoiler-free spec terms first. The spec docs are the only things any public artifact may rely on.

## Architecture (Phases 1–2)

```
Browser (static files)
 ├─ ui/        DOM chat panel, settings, card picker
 ├─ core/      chat state, reply states, mode logic
 ├─ adapters/  one file per backend type (text, image, tts, video)
 ├─ cards/     character card import
 ├─ store/     IndexedDB persistence
 └─ scene/     Three.js ship (Phase 2 only)
        │
        ▼  plain fetch() to user-supplied URLs
User's own backends (their responsibility):
  text  → any OpenAI-compatible /v1/chat/completions (reference backend: Unsloth Studio;
          also Ollama, llama.cpp, LiteLLM, cloud APIs)
  image → OpenAI-compatible /v1/images/generations
  tts   → OpenAI-compatible /v1/audio/speech
  video → OpenAI-style video jobs API (/v1/videos), see 02-SPECS.md
```

The user runs and wires their own backends. The app only speaks these documented shapes.

**Reference backend — revision 2 (2026-10-19, user decision).** ALL four backend
slots (text, image, TTS, video) point at the user's **Unsloth Studio on
`http://192.168.42.52:<port>`** (port filled in via Settings; the agent never
needs it). Studio will provide all four capabilities in some form
(user-confirmed); which endpoints and payload shapes it actually exposes is
**UNVERIFIED** — each adapter's step discovers the real shape through the
user's live test, and the spec is updated from that dated observation. Whether
to shim in front of Studio or adjust the app is decided with the user at that
point; do not substitute other backends without being told. Rules: **(a) the
coding agent NEVER sends any request to that server — the user is the only
test client; (b) API keys are pasted by the user into the Settings panel
(Step 1.9) and live only in that browser — the agent never handles backend
keys.** `stream: false` is an app decision (partial replies are never shown);
the revision-1 claim that their Cloudflare `--secure` tunnel drops SSE streams
is kept as an unverified user-reported observation. Revision-1 history note,
kept: at spec time (morning 2026-10-19) Studio's media endpoints were not
confirmed; revision 2 = "make it work per step, with the user's live app as
the test vehicle".

## The wait system — BACKBURNER (user demotion 2026-10-19)

Today's reality is FTL: a reply appears the moment the backend finishes; the wait is simply "the person is thinking". Do NOT build delay machinery (no floors, no `held`/`degraded` states, no countdowns) and do not discuss it — only do not block it. The non-blocking minimum stays as dormant data: the `distance` settings key, the preset table (02-SPECS §3) and the message `status` field (02-SPECS §8), so a later switch needs no rebuild.

Not part of the backburner, stays regardless of distance: radio **press-to-receive** ("INCOMING TRANSMISSION — press to receive"; the click starts audio because browsers block autoplay far from a user gesture); model reasoning is never shown, only `content`; real failures show honestly as "signal lost" plus the actual error text in a small details line.

## Known gotcha: browser → local backend

- Backends must send CORS headers allowing the page's origin. For example, Ollama needs `OLLAMA_ORIGINS` set. This goes in the README for users.
- An `https://` page (GitHub Pages) **cannot** call `http://192.168.x.x` because the browser blocks it as mixed content. `http://localhost` is allowed. Newer Chrome may also show a "local network access" permission prompt.
- So the README must say: for LAN backends, either open the page locally (`python3 -m http.server`) or put the backend behind https.

## Phase 3 outline (do NOT build — context only)

- **A backend becomes required.** The game hides a generated star system from the player, so the map, seed and prompt assembly must live server-side. Anything sent to the browser is visible to the player.
- **Information asymmetry.** The character model gets the full map plus a detail tier (compact for weak models, full atlas for strong ones). The model gets **no** player state: only the card, the map, and the transcript. The player gets only what they see, plus a private notebook.
- **The engine, not the model, decides win/fail** by checking the player's real position.
- **Worlds.** Seeded fake "Kerbal-like" star systems are the main game. A real solar-system sky is a bonus mode. A dumber model means vaguer directions, so a harder game.
- **Candidate all-in-one backend:** Unsloth Studio with a custom config serving text, image, video and TTS. Not yet verified; confirm its API before the Phase 3 handoff.
- Private design canon for Phase 3's story lives in `local/` (rule 12); it is not summarized here, and this outline is deliberately vague.
