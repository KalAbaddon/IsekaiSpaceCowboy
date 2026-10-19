# 02 — SPECS (file tree, data formats, API contracts)

If anything you need is not in this file, STOP and ask the user. Do not invent it.

## 1. File tree (exact — create nothing else)

```
isekai-space-cowboy/
├─ index.html              entry page; loads js/main.js as a module
├─ README.md               user setup: backends, CORS, mixed content
├─ css/
│  └─ app.css
├─ js/
│  ├─ main.js              boot: load settings, mount UI, (Phase 2) mount scene
│  ├─ config.js            defaults + settings load/save (localStorage)
│  ├─ core/
│  │  ├─ events.js         tiny pub/sub event bus
│  │  ├─ chat.js           conversation state, prompt building
│  │  ├─ delay.js          light-delay clock + hold/degraded logic
│  │  └─ modes.js          terminal / radio / video orchestration
│  ├─ adapters/
│  │  ├─ http.js           fetch wrapper: timeout, errors, JSON
│  │  ├─ text.js           /v1/chat/completions
│  │  ├─ image.js          /v1/images/generations
│  │  ├─ tts.js            /v1/audio/speech
│  │  └─ video.js          /v1/videos job create/poll/download
│  ├─ cards/
│  │  ├─ png.js            PNG tEXt chunk reader (import-only)
│  │  └─ card.js           parse/validate/export character cards
│  ├─ store/
│  │  └─ db.js             IndexedDB: cards, chats, media blobs
│  ├─ ui/
│  │  ├─ panel.js          chat panel (log, input, mode bar)
│  │  ├─ settings.js       settings dialog
│  │  ├─ cardpicker.js     card list / import
│  │  └─ status.js         light-delay + signal status strip
│  └─ scene/               PHASE 2 ONLY — leave empty in Phase 1
│     ├─ scene.js
│     ├─ player.js
│     ├─ props.js
│     └─ camera.js
├─ vendor/                 PHASE 2: three.module.js (pinned version)
├─ assets/
│  ├─ models/              PHASE 2: .glb files
│  └─ cards/               one bundled example card (JSON)
└─ tests/
   └─ selftest.html        in-browser checks page (see 03-STEPS.md)
```

## 2. Settings (stored in localStorage key `isekai-space-cowboy.settings`)

```json
{
  "userName": "Captain",
  "text":  { "baseUrl": "", "apiKey": "", "model": "", "vision": false },
  "image": { "enabled": false, "baseUrl": "", "apiKey": "", "model": "", "size": "512x512" },
  "tts":   { "enabled": false, "baseUrl": "", "apiKey": "", "model": "", "voice": "" },
  "video": { "enabled": false, "baseUrl": "", "apiKey": "", "model": "", "seconds": 4, "size": "512x512" },
  "distance": "inner",
  "timeouts": { "text": 300, "image": 300, "tts": 120, "video": 900 }
}
```

- `baseUrl` is everything before `/v1/...`, e.g. `http://localhost:8888` (Unsloth Studio default). Never include a trailing slash.
- `userName` is the name characters call the player; blank falls back to `"Captain"`.
- If the API key is empty, send no `Authorization` header.
- The Settings UI must show a warning: keys are stored in this browser in plain text.

## 3. Distance presets (reply floor, seconds)

| id | label | floor_s |
|---|---|---|
| `ftl` | Instant (FTL link) — **default** | 0 |
| `inner` | Lunar orbit | 3 |
| `mars` | Near Mars | 20 |
| `belt` | Asteroid belt | 60 |
| `outer` | Outer system | 180 |

The floor applies to every reply in every mode. This table lives in `config.js` as a constant.
At floor 0 the floor logic is skipped entirely: no `held`/`degraded` states, just a "thinking…"
indicator until the backend finishes (see 01-OVERVIEW "The wait system"). The knob exists so
distance gameification can be switched on later without a rebuild. A preset's floor may also be a
floor in name only: presets whose real wait is an event (a backend generating content, say) are
legal — the reply lands when both the floor and the job have finished, with `degraded` simply
covering the overage. Do not optimize that case away.

## 4. API contracts (adapters must match exactly)

All requests: `Content-Type: application/json` unless noted, plus `Authorization: Bearer <key>` only when a key is set.

### 4.1 Text — `POST {baseUrl}/v1/chat/completions`

Request:
```json
{ "model": "<model>", "messages": [ {"role":"system","content":"..."}, {"role":"user","content":"..."} ], "stream": false }
```

Vision (only when `text.vision` is true): a user message's `content` becomes an array:
```json
[ {"type":"text","text":"..."}, {"type":"image_url","image_url":{"url":"data:image/png;base64,..."}} ]
```

Response: use `choices[0].message.content`.

Always send `"stream": false` (required; Unsloth Studio's `--secure` Cloudflare tunnel drops SSE streams — and we hold replies anyway).

Response: display only `choices[0].message.content`. Ignore `reasoning_content` and any other reasoning field. No parsing or filtering of reply text.

### 4.2 Image — `POST {baseUrl}/v1/images/generations`

Request:
```json
{ "model": "<model>", "prompt": "...", "size": "<size>", "response_format": "b64_json", "n": 1 }
```

Response: `data[0].b64_json`. If it is absent, fall back to `data[0].url`.

### 4.3 TTS — `POST {baseUrl}/v1/audio/speech`

Request:
```json
{ "model": "<model>", "input": "...", "voice": "<voice>", "response_format": "mp3" }
```

Response: raw audio bytes. Read as a Blob and play via an object URL.

### 4.4 Video — OpenAI-style video jobs

- Create: `POST {baseUrl}/v1/videos` as **multipart/form-data**.
  - Fields: `model`, `prompt`, `seconds`, `size`.
  - Optional `input_reference`: one reference image file taken from the card.
- Poll: `GET {baseUrl}/v1/videos/{id}` every 2 s. `status` is one of `queued`, `in_progress`, `completed`, `failed`, `cancelled` (the poll loop must stop on any of the last three; `cancelled` reports as lost).
- Download: `GET {baseUrl}/v1/videos/{id}/content` returns MP4 bytes with audio.
- On `failed`, show the `error` field text.

**USER TO CONFIRM:** that their LTX / MiniMax H3 server (or a small shim in front of it) exposes this shape. The adapter must not support any other shape without being told.
**Verified 2026-10-19:** this exact shape is the real OpenAI videos jobs API (`POST /v1/videos` → poll → `GET /v1/videos/{id}/content`). fal, ltx.io, MiniMax and Azure all use different shapes, so "a small shim" is a real component, not a formality. Unsloth Studio has no video API endpoint yet either (see 01-OVERVIEW). Video mode stays `enabled: false` until a confirmed endpoint exists.

## 5. Video-call pipeline (modes.js)

1. The user types a message.
2. The text adapter gets the normal chat prompt **plus** an instruction to reply ONLY with this JSON:
```json
{ "line": "what the character says aloud, max ~12 words", "action": "short visible action, e.g. waves and grins" }
```
3. Parse the JSON. If parsing fails, retry once with "Reply with valid JSON only". If it fails again, show the text reply as a terminal message and mark the video as "signal too weak".
4. Build the video prompt from the template in `config.js`:
```
{card.extensions.isekai_space_cowboy.video_style}. {card.name}, {card.extensions.isekai_space_cowboy.appearance}, {action}, looking into camera, says: "{line}"
```
5. Send it to the video adapter with a reference image: the `icon` asset named `main`, else the first image asset (§6). **REVISIT once video mode is usable** — user wants to feel it before freezing this rule. The clip plays in the panel; `line` is shown as a subtitle under it.
6. Voice reference files: stored on the card as `x_voice` assets (§6) but **not sent** in Phase 1, because no standard field exists for them. Leave a clearly marked TODO in `video.js`.

## 6. Character cards — CCv3 (decision 2026-10-19, supersedes the earlier draft)

Standard: **Character Card V3 (CCv3)** — spec:
<https://github.com/kwaroran/character-card-spec-v3/blob/main/SPEC_V3.md>.
Read the spec in full before writing card code. CCv3 is a superset of V2; all
card fields live under `data`. The importer accepts V2 where the spec says so.

**Native format: CHARX** — a zip whose root contains `card.json` (the
CharacterCardV3 object) plus embedded assets. Asset URIs look like
`embeded://assets/icon/images/main.png` — **one "d", exactly as the spec spells
it**; paths are case-sensitive and `/`-separated. Export writes **CHARX only**
(`.charx`); PNG and plain JSON are import formats only. Zip handling is
hand-rolled inside `js/cards/` (DecompressionStream `deflate-raw` for reading,
stored entries for writing) — no third-party zip library (rule 2 stays intact).

Import formats:
- **CHARX** (`.charx`): read `card.json`; collect assets (see asset model below).
- **PNG card**: `tEXt` chunk `ccv3` first (utf-8 → base64 JSON), falling back to
  `chara` (V2); if both exist, `ccv3` wins. A V2 backfill gets the spec's warning
  text prepended to `creator_notes` and has `@@` lorebook decorators removed
  from entry content. Compressed `zTXt` chunks: inflate and parse; `iTXt`: fail
  with the clear message "card uses chunk type <x> — not supported", never
  silently. Extra `chara-ext-asset_:{path}` tEXt chunks (URI form
  `__asset:{path}`) may be read but are never written (the spec deprecates them
  for new apps). When the card came from PNG, the PNG itself is the `ccdefault:`
  icon — the avatar.
- **Plain JSON**: a CharacterCardV3 object (or V2, same backfill rules as above).

Asset model — `data.assets`, an array of `{type, uri, name, ext}`:
- Undefined ⇒ treat as `[{ type: "icon", uri: "ccdefault:", name: "main", ext: "png" }]`.
- URIs: `embeded://…`, `https://…`, `data:…`, `ccdefault:` (import also accepts
  `ccdefault://`; export writes `ccdefault:`). `ext` is lowercase, no dot.
- Standard types: `icon` (with several icons, exactly one has `name:"main"` and
  is the avatar), `background`, `user_icon`, `emotion` (`name` identifies the
  emotion; `neutral` is the default).
- Our custom media types: `x_voice` (voice reference/sample), `x_transmission`
  (video clips), `x_ambient` (ambient/BGM loops).

Our extension — the **single home** for all app-specific card data, named after
the game (never add new top-level fields):
```json
"extensions": {
  "isekai_space_cowboy": {
    "appearance": "one-line visual description for video prompts",
    "video_style": "low-res webcam footage, slight static",
    "tts_voice": "voice id for the TTS backend"
  }
}
```
Playback/light-delay settings and triggers join this object as sub-keys when
their steps define them (Step 1.8+). The old draft fields `reference_images`
and `voice_ref` are retired — their roles are served by assets (images and
`x_voice`). An old card carrying them keeps the fields untouched as unknown data
(round-trip rule) while the app reads assets instead.

**Naming rule (user, 2026-10-19):** every identifier follows this game —
`isekai-space-cowboy` (files, localStorage, IndexedDB) / `isekai_space_cowboy`
(JS, card extension). The ancestor project name ("Lost Signals" /
`lostsignal`) is dead legacy and must appear nowhere in code, data, or docs.

Round-trip safety (spec rule): unknown fields and unknown assets survive
import → export byte-for-byte; export sets `modification_date` (unix seconds)
and never invents top-level fields.

**Lorebook** (`data.character_book`): follow the V3 Lorebook object. Phase 1 =
parse and keep, including `@@…` decorators in entry content (kept, stripped
from displayed text where we act on content; decorator behaviors come later).
When prompts start using lorebooks (Step 1.8) that step defines which fields we
honor first — everything else is preserved unchanged.

## 7. System prompt assembly (chat.js)

Order:
1. `data.system_prompt`, or this default:
```
You are {{char}}. Stay in character. You are talking to {{user}} over a long-distance space link.
```
2. description
3. personality
4. scenario
5. mes_example
6. the transcript
7. `post_history_instructions`

Replace `{{char}}` with `data.nickname` when it is non-empty, else `data.name` (CCv3 rule); `{{user}}` comes from settings (`userName`, default "Captain").

## 8. Persistence (IndexedDB database `isekai-space-cowboy`, version 1)

| Store | Key | Contents |
|---|---|---|
| `cards` | `id` (uuid) | the card JSON |
| `chats` | `id` | `{cardId, createdAt, distance, messages[]}` |
| `media` | `id` | Blobs for images, audio and video |

Messages reference media by id; never store data URLs inside messages.
Card assets (`embeded://…` from CHARX files, and `data:` URIs) are extracted into `media` on import and served from there; the stored card JSON keeps its original URIs untouched (round-trip rule, §6). The extraction itself is wired in Step 1.7 (cards land before the database).

Message shape:
```json
{ "id":"", "role":"user|assistant", "mode":"terminal|radio|video", "text":"", "mediaIds":[], "sentAt":0, "shownAt":0, "status":"held|degraded|delivered|lost" }
```

Recovery: on app load, any stored message still marked `held` or `degraded` is re-marked `lost` with reason "connection dropped" — pending backend calls do not survive a reload, so nothing may hang forever.

## 9. Public API the 3D scene may call (Phase 2)

```
openMode(mode)   // e.g. "terminal" | "radio" | "video" (open set) — shows the panel in that mode
closePanel()
onPanelClosed(callback)
```

Nothing else. The scene must not import from `core/`, `adapters/`, `cards/` or `store/`.
The `mode` string is open-ended: `scene/` passes through whatever its prop carries and never
validates it against a fixed list — later props may open panel types that do not exist yet.

## 10. Phase 2 scene spec

- Three.js, vendored, version pinned in a comment at the top of `scene.js`.
- **Low-poly ship interior**: one room, about 6×4 m, built from primitives first. `.glb` art from `assets/models/` replaces the primitives later (user will supply reference pictures).
- **Player**: first-person *or* third-person — **USER TO DECIDE** before Step 2.1. Controls: WASD plus mouse. On touch devices, tap-to-walk.
- **Three props**: terminal, radio, TV. When the player is within 1.5 m of one, show the hint "E: use". Pressing E tweens the camera (~0.6 s) to a fixed close-up of the prop, then calls `openMode`. Esc closes the panel and tweens back.
- The chat panel stays a DOM overlay, positioned over the prop's screen area. It is never rendered inside WebGL.
- **Performance budget**: pixel ratio capped at 1.5, at most 50k triangles, no realtime shadows by default, 30+ fps on integrated graphics.
- **Props are data**: each interactive prop carries its action (e.g. a mode string); interaction code iterates the table and never enumerates props. Both proximity "E: use" and clicking the prop itself (raycast) trigger the same path — click-to-use exists from Step 2.4 on, because the game is meant to be played point-click-type, not WASD-and-E.
- **Input is sources, not keyboard**: `player.js` feeds a desired-movement abstraction (keyboard vector + walk-to target point; touch tap-to-walk is already a walk-to). A future click-to-walk adds a source and never touches camera or movement code.
