# 01 — PROJECT OVERVIEW (read this first, every session)

Name: **Isekai Space Cowboy** (final, set 2026-10-19; formerly worked under the temporary name — all identifiers are `isekai-space-cowboy` in files/keys and `isekai_space_cowboy` in JS identifiers and card extensions).
Ancestor concept kept for history and Phase 3 lineage: `00-OLD-COWBOY-CONCEPT.md`.

## What this is

A browser-only chat front end for any OpenAI-compatible LLM endpoint, with SillyTavern-style character cards. It is themed as a lonely ship far from Earth: replies can be made to arrive after a **delay** (FTL by default — see "The wait system"; the delay knob is the future game lever).

Three ways to talk to a character:

| Mode | In-world prop (Phase 2) | What happens |
|---|---|---|
| Terminal | Keyboard / terminal | Text chat. Optional pictures both ways. |
| Radio | Old radio station | Text in, character's reply spoken aloud (TTS). |
| Video call | Little TV | You type, the character replies with a ~4 s generated video clip with audio. |

## Phases (only build the phase you are told to build)

- **Phase 1 — Flat chat.** Plain HTML page. Card loader, chat log, the three modes as buttons, settings for endpoints, the light-delay system. Ugly is fine. Must work end to end.
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
 ├─ core/      chat state, light-delay clock, mode logic
 ├─ adapters/  one file per backend type (text, image, tts, video)
 ├─ cards/     character card import/export
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
needs it). The user states Studio can serve everything we need; where a media
endpoint is missing today, the fix/shim happens when its step lands — do not
substitute other backends without being told. Rules: **(a) the coding agent
NEVER sends any request to that server — all live testing is done by the user
clicking in the app; (b) API keys are pasted by the user into the Settings panel
(Step 1.9) and live only in that browser — the agent never handles backend
keys.** Text details from revision 1 still hold: OpenAI-compatible API, always
`stream: false` (their Cloudflare `--secure` tunnel drops SSE — matches §4.1).
Revision-1 history note, kept: at spec time (morning 2026-10-19) Studio's media
endpoints were not confirmed; revision 2 supersedes that with "make it work
per step, with the user's live app as the test vehicle".

## The wait system: FTL by default, light delay as a dormant knob

Decided 2026-10-19: for now the link is **FTL** — a reply appears the moment the backend
finishes; the wait is simply "the person is thinking". Do NOT remove the mechanism, though:
the distance knob is the intended future gameification lever, and the plumbing must be ready.

- Settings choose a **distance preset**; its floor (seconds) is the **minimum** time any reply
  can take. Delivery time = the later of "floor elapsed since send" and "backend finished".
- `ftl` (floor 0) is the default preset. At floor 0 the status strip just shows a "thinking…"
  state and the floor logic is skipped — `held` and `degraded` never fire.
- With a nonzero floor: early replies are **held** until the floor; if the backend runs past
  the floor the UI shows in-world flavor ("signal degraded", static), not an error, until the
  reply lands.
- Model reasoning is never shown; only the `content` field is displayed.
- Real failures (HTTP error, timeout) are shown honestly as "signal lost" plus the actual error
  text in a small details line.
- Radio delivery is **press-to-receive** at any distance: when the reply is ready the panel shows
  an "INCOMING TRANSMISSION — press to receive" state; clicking it starts audio playback and
  reveals the text. (Browsers block autoplay far from a user gesture; the click is also diegetic.)

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
