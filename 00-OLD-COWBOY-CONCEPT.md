# Isekai Space Cowboy (working title)

A rural gunslinger vibes (Spike Spiegel energy — the game is NOT about him; he's
just the weather) dropped into a universe that was minted for him alone.

## The premise

- You wake up. That's the opening of every game, forever.
- You live in a **randomly generated solar system** — high tech, spaceships
  exist — and you live there until you **die**. One life, one universe.
- Then a **new universe must be generated**. Maybe you wait a day. Maybe less.
- Exploration and **breaking the cycle** are the point. "Who am I?" is a thread,
  not the pitch. The world is the main character, not the dude.

## Generation is the game (not a menu screen)

- Worlds are **simulated, not noise-filtered**: orbital layout, ecosystem drift,
  and a **history pass** (who rose, what ruins exist, where the wrecks are, who's
  buried where). The world has *remembered things happening before you woke up*.
- Generation time is a real design resource:
  - **Local bake (free):** your desktop takes its sweet time. 40 min? 6 hours? Fine.
  - **Cloud bake (paid):** real cost + tiny overhead, no obnoxious nonsense.
    Honest pitch isn't *faster* — it's **deeper**: more simulated millennia,
    denser history, richer universe.
- After death, a wait (~a day?) before the next life mints. The wait is diegetic:
  you're in the white space while the next creation bakes.
- The player may keep **one skill or item** from the last run. That's the whole
  carry-over. Knowledge in their own head is the rest.
- (Scope may narrow: "the big different world each time" might become "not so much."
  Open question.)

## Architecture: the Baker and the Viewer

- **Baker:** standalone headless generator. Input: `seed + cowboy tags`.
  Output: a world package (orbital layout, terrain fields, settlement plans with
  real interiors, ship classes, a history event table). Deterministic by
  integer/fixed-point math (demoscene trick; faked physics runs on it too) so a
  local bake and a cloud bake come out byte-identical. Same binary, different box.
- **Viewer:** the game engine (leaning **Godot 4, desktop first**) — just an
  interpreter of baked packages. Engine-agnostic insurance: the Baker outlives
  any engine.

## Cowboy tags

- `high tech + spaceships` is ALWAYS on. Everything else is drawn from a big
  list of cowboy memes, several per world:
  `cow_or_cow_like_creatures_held_in_high_regard`, `riding_animals_not_cars`,
  `rural_vs_city`, `underground_world`, `skyscrapers_with_rooftop_pastures_and_
  bridges`, `dust`, `saloons`, ...
- Plus a world **schema**: surface world / all-underground / tower-city-with-
  bridges / etc.
- It does not all have to make sense. Tags feed the seed, so it stays
  deterministic. The tag list IS the content pipeline: write new tags, get new
  worlds.

## Look and tech (rural demoscene)

- **3D low-poly, seamless, zero-loading.** Walk from grass, climb a ship, sky
  fades blue→violet→black, orbit, reach a moon, come back. No loading screens
  between planets, moons, or into interiors/tunnels.
- Terrain is **pure math functions** computed from the seed — store the seed,
  derive the dirt. Save file ≈ seed + event log. Cheap. Archive dead universes
  as permanent gravestones for pennies.
- Small planets (~1–3 km). **Cinematic astronomy**: distances compressed to play
  distance — gas giant looming over a pasture as a skybox decal. Star Wars sky;
  NASA uninvited.
- Rural palette (ochre, bone, dusk blue) = free fog that hides LOD popping.
  Particle effects + goofy 90s tricks doing the heavy lifting. No Man's Sky is
  the *ceiling*; we live well below it, proudly. No glittery cyberpunk.
- Physics: minimal and **faked** — scripted orbits on rails, constant-down near
  grass, ramp-to-center on ascent. The physics lies politely.
- Established engine over hand-rolled everything (inspired by "every window is a
  real room" procedural-interiors tech — but done as a *kit + rules generator*,
  and rural-appropriate, not a mountain of identical stock offices).

## Interiors: no room without a reason

- Rooms exist because the world's **history put them there**, not because a
  window needed a room behind it. (Barn + hayloft because there was a herd event;
  shack + porch because a hermit.)
- The baker **precomputes visibility**: only windows a player could stand near
  get rooms behind them. Facing a cliff? It's a wall. Tower-worlds: perimeter
  rooms + precomputed lit-window table.
- One shared **room-kit system** assembles buildings AND ships. A ship is a
  structure that moves: real interior while flying, portholes are real low-res
  viewports, gravity faked inside, "porch" = a room with its door open.

## Ships

- **No ship at start.** Ships are earned mid-life: buy her, fix her (the history
  sim scatters **derelicts** — every world has wrecks with real logbooks, i.e.
  actual simulation output of what killed her), win her, inherit her, borrow her
  and stop borrowing.
- First orbit should be as a **hitchhiker** in someone's cargo hold full of
  cow-creatures. You ride the stage before you own a horse.
- **Ships do not carry over.** Each universe's ships are its own, styled by its
  culture (herd-haulers in cow worlds, sky-skiffs in tower worlds, ugly tea-
  stained rockhound tugs in belts). Ships are places you *lived*, plural — never
  garage-gacha inventory.
- A big enough ship = a house. Squatting in a dead town-sized hulk is a valid
  dream. Cowboy squats; landlord don't exist out here.

## Death

- Lives are finite; length is an **open knob** (30-minute lives vs multi-day —
  different games, TBD).
- **"Haha the sand killed you" deaths are acceptable** — the arcade contract —
  *depending on bake time*: if regeneration gets near-instant, cruelty is cheap
  and fine. It's a dial, not a creed. Not the focus; allowed to happen.
- One hard line: **lethal may be unfair, never *illegible***. Every danger has a
  tell written in its tag's language (no birds on the killing sands; bones in
  straight lines; the herd won't walk on it; the old drover detours). Inhabitants
  and animals ARE the tutorial. Dying teaches a rule you carry across universes —
  cross-world pattern recognition is the knowledge meta.
- The world is indifferent, never cheating.

## The cycle and the mystery

- Outer Wilds inspiration (the scout alien whose universe resets).
- Random worlds, **invariant thread**: the same figure / melody / brand / phrase
  recurs in every universe in costume — maybe even the same hand-painted eye on
  every ship prow, the same scratched name under three coats of paint. Rhyme, not
  reuse. Mechanically every world obeys its own tags; cross-world, you are
  learning a **language**. Learning the language = breaking the cycle.
- Death-wait + gravestones: dead universes could persist as archives you (or
  others) can revisit. Cheap to store. TBD.

## Build order (spikes)

1. **Spike A — the soul (first):** the lift-off reel. Small planet, terrain from
   math, sky fade, fake gravity, one moon, one grazing cow placed by a stubbed
   history table. No gameplay. Pass = after landing, you want to take off again.
   (Tech route: try Voxel Tools / existing seamless-planet addons in Godot first;
   hand-rolled icosphere as fallback. This is a tech test, not the game's opener.)
2. **Spike B — the mind:** Baker as CLI. seed + 3 tags → world file (system
   layout, one settlement, ~20 history lines). Bake twice → identical hashes.
   Measure real bake times — that decides the death dial and the monetization.
3. **Spike C — the windows:** load the baked settlement; every door/window near
   a walkable path opens into a real low-poly room; a cow in a barn. Measure cost.

**M1:** wake → do stuff → die → wait → new bake → keep one thing.

## Open questions

- Life length (the pacing knob).
- How different are successive worlds (full re-mint vs rhyming pool)?
- Cloud shape: who hosts, what exactly do we pay and charge.
- What actually kills you (hazards, age, other people) — needs the fairness dial.
- The mysterious unfinished "but..." from the ship discussion. :)
