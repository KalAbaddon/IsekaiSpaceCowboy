# 03 — BUILD STEPS (do ONE step, check, report, STOP)

## Protocol for every step

1. **Re-read** the relevant sections of 01-OVERVIEW.md and 02-SPECS.md named in the step.
2. **Restate** in 2–4 lines what you will change and which files you will touch. Only files named in the step.
3. **Do** the work.
4. **SELF-CHECK** — go through every item, answer each with PASS or FAIL plus one line of evidence:
   - [ ] Only the listed files were changed/created.
   - [ ] No new dependencies, no build step, no npm.
   - [ ] Every function you added has a JSDoc comment.
   - [ ] Each API shape matches 02-SPECS.md word for word (field names, paths).
   - [ ] No placeholder values, no fake URLs, no "TODO: implement" left behind (except TODOs the spec explicitly asks for).
   - [ ] The step's own checks below.
5. **USER-CHECK** — write the exact browser actions the user should take and what they should see.
6. **STOP.** Do not begin the next step until the user says "next" (or tells you to batch steps).

If any SELF-CHECK fails, fix it before reporting. If you cannot fix it, report the failure and stop.

**Serving the page for every test:** from the `isekai-space-cowboy/` folder, run:
```
python3 -m http.server 8000
```
Then open `http://localhost:8000/` (and `http://localhost:8000/tests/selftest.html` for checks).

---

## Step 0 — git repo + spec decisions (DONE 2026-10-19)

- [x] Local git repo only (no remote), one commit per step, step number in the message.
- [x] Rename to `isekai-space-cowboy` / `isekai_space_cowboy` applied across all docs (grep-clean).
- [x] Spec decisions applied: FTL default with dormant floor knob, radio press-to-receive,
  reload-orphan rule, plain-text rule, `userName` setting, Unsloth Studio as reference text
  backend, video-shape verification, `cancelled` poll status, zTXt chunk note.
- Old concept preserved as `00-OLD-COWBOY-CONCEPT.md` (Phase 3 lineage; never build from it).

---

## PHASE 1 — Flat chat

### 1.1 Skeleton
Files: `index.html`, `css/app.css`, `js/main.js`, `README.md`, all empty module files from the 02-SPECS.md §1 tree (each containing one comment line naming its job), `tests/selftest.html`.
Do: create the tree. `main.js` logs `Isekai Space Cowboy booting`. `selftest.html` has a tiny test runner: `test(name, fn)` prints PASS/FAIL lines.
Checks:
- [ ] The folder tree matches §1 exactly (list it).
- [ ] The page loads with zero console errors.
User-check: the console shows the boot line; selftest page shows "0 tests".

### 1.2 Event bus + settings
Files: `js/core/events.js`, `js/config.js`, `tests/selftest.html`.
Do: build pub/sub (`on`, `off`, `emit`). Build settings defaults per §2 with load/save, plus the distance table per §3.
Checks:
- [ ] Self-tests: emit reaches the listener; off stops it; settings round-trip through localStorage; missing keys get defaults.
User-check: all selftests PASS.

### 1.3 HTTP wrapper
Files: `js/adapters/http.js`, `tests/selftest.html`.
Do: `request(url, {method, headers, body, timeoutS, expect: "json"|"blob"})` with AbortController timeout. It throws errors with `{kind: "timeout"|"http"|"network"|"cors?", status, message}`.
Checks:
- [ ] A self-test against a nonexistent port yields `network`.
- [ ] A self-test with a 0.01 s timeout yields `timeout`.
User-check: selftests PASS.

### 1.4 Text adapter
Files: `js/adapters/text.js`, `tests/selftest.html`.
Do: implement �4.1, including vision content. Display only the `content` field of the response; reasoning arrives in a separate field and is ignored. No parsing or filtering of reply text.
Checks:
- [ ] Unit test: a response with both `content` and a reasoning field displays only `content`.
- [ ] The request body shape matches �4.1 exactly. Print it in the report.
User-check: the selftest has a "live text" button using saved settings. Point it at your real endpoint; the reply appears.

### 1.5 Light-delay clock
Files: `js/core/delay.js`, `tests/selftest.html`.
Do: `track(promise, floorS)` emits `held`, `degraded`, `delivered` or `lost` per 01-OVERVIEW. Delivery time = max(floor, actual). At floor 0 skip the floor logic: deliver on settle (rejects → `lost`), no `held`/`degraded`. `delay.js` is reason-agnostic: it deals in state names only — no user-facing strings (all flavor lives in `ui/status.js`, Step 1.8), because these states will later stand for different situations (see 02-SPECS §3, event-driven floors).
Checks:
- [ ] Floor 0 (default `ftl`): resolves as soon as the fake job settles; no `held`/`degraded` emitted.
- [ ] Fake 1 s job with a 3 s floor → delivered at ~3 s.
- [ ] Fake 5 s job with a 3 s floor → `degraded` at 3 s, `delivered` at ~5 s.
- [ ] Rejected job → `lost` carrying the error.
- [ ] `delay.js` contains no user-facing strings (grep proof).
User-check: selftests PASS, with timings printed.

### 1.6 Cards (CCv3 — rewritten 2026-10-19 to match 02-SPECS §6)
Files: `js/cards/png.js`, `js/cards/card.js`, `assets/cards/example.charx`, `tests/selftest.html`.
Do: implement §6 — CHARX import/export (hand-rolled zip inside `card.js`:
`DecompressionStream("deflate-raw")` reads, stored entries write), PNG tEXt
chunk reader (`ccv3` → `chara` fallback, `zTXt` inflate, clear `iTXt` error,
read-only `chara-ext-asset_*`), plain JSON import, V2 backfill per spec
(`creator_notes` warning + decorator strip), asset model (icon `main` picking,
`ccdefault:`, `embeded://`, `https:`, `data:`, `x_voice`/`x_transmission`/
`x_ambient`), lorebook parse-and-keep. Export = CHARX only; sets
`modification_date`; unknown fields/assets untouched. `assets/cards/
example.charx` is an original character (cheerful mission-control tech) built
with Python's `zipfile` from a `card.json` + tiny real assets (icon PNG named
`main`, one `x_ambient` sample), extension fields filled.
Asset extraction into IndexedDB happens in Step 1.7 (until then assets stay in
memory for the session).
Checks:
- [ ] Round trip: CHARX import → export → import deep-equals (unknown fields and unknown assets preserved; `modification_date` excepted).
- [ ] A V2-only card parses: backfill warning in `creator_notes`, decorators stripped from entry content.
- [ ] A V3 PNG card and plain V3 JSON both import; `ccv3` wins over `chara`.
- [ ] Icon rule: several icons ⇒ the one named `main` is the avatar.
User-check: the user imports a real SillyTavern PNG card in the selftest page; its name and description print correctly; then imports `example.charx` and sees the icon.

### 1.7 Storage
Files: `js/store/db.js`, `tests/selftest.html`.
Do: implement §8 stores, CRUD functions, and media blob save/get.
Checks:
- [ ] Self-tests: save/load card, chat, and a blob; data survives a page reload.
User-check: reload the selftest; the persisted test passes.

### 1.8 Chat core + Terminal mode
Files: `js/core/chat.js`, `js/core/modes.js`, `js/ui/panel.js`, `js/ui/status.js`, `js/ui/cardpicker.js`, `js/main.js`, `css/app.css`.
Do: prompt assembly per §7. Terminal mode: send → delay.track → show the reply. The status strip shows the distance; at `ftl` (default) a "thinking…" state while the backend works; with a nonzero floor a countdown ("signal ETA ≥ 3 s") then a "signal degraded" state. First open shows `first_mes`. Disable send while a reply is pending — implemented as one gate function ("may we send right now?") consulted by the send path, so future locks plug in without touching chat logic. On load, re-mark stored `held`/`degraded` messages `lost` ("connection dropped").
Checks:
- [ ] Held replies are not visible before the floor (set `inner` to test).
- [ ] A reply left pending across a reload shows as `lost ("connection dropped")`.
- [ ] The chat persists across reload.
- [ ] Thinking never appears.
User-check: pick the example card, chat 5 turns at `ftl` and at `mars`, and confirm the delays feel right.

### 1.9 Settings UI
Files: `js/ui/settings.js`, `js/main.js`, `css/app.css`.
Do: form for every §2 field, a "Test" button per backend (text: 1-word ping; others: their smallest call), and the plain-text-key warning.
Checks:
- [ ] Failed tests show the error kind and message. A CORS-looking failure shows a hint pointing at the README.
User-check: each Test button gives a clear pass/fail against your real backends.

### 1.10 Pictures in Terminal
Files: `js/adapters/image.js`, `js/core/modes.js`, `js/ui/panel.js`.
Do: attach images to send (only if `text.vision`; otherwise the attach button is hidden with a tooltip). Add a "/pic <description>" command that generates an image via §4.2 and delivers it under the light-delay rules.
Checks:
- [ ] Images are stored as media blobs, not data URLs in messages.
User-check: send a photo; the model comments on it. `/pic` returns an image after the delay.

### 1.11 Radio mode
Files: `js/adapters/tts.js`, `js/core/modes.js`, `js/ui/panel.js`.
Do: same as Terminal, but the reply text is sent to §4.3 TTS (voice = `card.tts_voice` or the settings voice). When text + audio are ready the panel shows "INCOMING TRANSMISSION — press to receive"; clicking starts playback and reveals the text together (browsers block autoplay far from a click).
Checks:
- [ ] If TTS fails, the text still delivers, with a "voice channel lost" note.
User-check: say hello; press receive; you hear the reply.

### 1.12 Video call mode
Files: `js/adapters/video.js`, `js/core/modes.js`, `js/ui/panel.js`.
Do: the §5 pipeline exactly, including the JSON retry and fallback, polling, MP4 playback with subtitle, and the voice-ref TODO.
Checks:
- [ ] The poll loop stops on completed, failed, and timeout. No runaway timers (show how).
- [ ] The multipart field names match §4.4.
User-check: say hello at `belt`; a clip of the character arrives, with sound.

### 1.13 Phase 1 wrap-up
Files: `README.md` only.
Do: document setup per 01-OVERVIEW "Known gotcha", the endpoint shapes per backend, and how to import cards.
Checks:
- [ ] Every setting in §2 is explained.
User-check: read the README; a stranger could follow it.

**Phase 1 gate:** the user confirms all three modes work on their machine before any Phase 2 step.

---

## PHASE 2 — Ship walkaround (open questions answered first)

**Before 2.1 the user must answer:**
- first- or third-person view?
- supply reference pictures for the ship look.

**Design constraints (future-feature flags, 2026-10-19):** the game is played by clicking and
typing at consoles, not by active flying — interaction stays point-click-type. Movement and props
follow 02-SPECS §10 (input sources + props are data, click-to-use from 2.4).

### 2.1 Vendor Three.js + empty scene
Files: `vendor/three.module.js`, `js/scene/scene.js`, `js/main.js`, `index.html` (import map).
Checks:
- [ ] The version is pinned and recorded.
- [ ] A rotating cube renders behind the UI.
- [ ] Pixel ratio is capped at 1.5.

### 2.2 Room + props from primitives
Files: `js/scene/scene.js`, `js/scene/props.js`.
Checks:
- [ ] A room of about 6×4 m.
- [ ] Three labelled prop boxes (terminal, radio, TV).
- [ ] Triangle count logged under budget.

### 2.3 Player movement
Files: `js/scene/player.js`.
Checks:
- [ ] WASD/mouse works.
- [ ] Touch tap-to-walk works.
- [ ] The player cannot walk through walls.

### 2.4 Interact + camera zoom
Files: `js/scene/camera.js`, `js/scene/props.js`, `js/main.js`.
Checks:
- [ ] Within 1.5 m, the "E: use" hint shows.
- [ ] Pressing E runs the 0.6 s tween, then calls `openMode`.
- [ ] Esc returns the camera.
- [ ] The scene imports nothing outside the §9 API (grep proof).

### 2.5 Real art swap
Files: `assets/models/*.glb`, `js/scene/props.js`.
Do: replace the primitives with the user-supplied low-poly models.
Checks:
- [ ] Still within the performance budget.
- [ ] 30+ fps on the user's weakest target machine.

**Phase 2 gate:** user sign-off. Phase 3 gets a separate handoff.
