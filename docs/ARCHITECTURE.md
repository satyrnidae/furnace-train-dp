# Architecture

Reference for the furnace-train datapack. Written to be linked from other projects and sessions. Player facing notes live in README.md.

## Summary

- Vanilla datapack, no mods. Couple minecarts with any chain item, a train follows its head furnace cart with a chain display between each pair.
- Namespace `train`, pack format 121 (26.3), version in `package.json`.
- Written in mcb (mc-build 4.3.2). `src/` is source, `data/` is build output and gitignored whole.
- Only the head is driven by the world, as in vanilla. Followers get their Motion written every tick from the cart ahead.
- Origin repo `satyrnidae/furnace-train-dp`.

## Build pipeline

```
src/**/*.mcb + src/**/*.js + src/*.mcbt -> mcb build -> data/train/**, data/global/**
mcb.config.js                           -> eq objective names, pack name, format
resourcepack/                           -> optional lang files, zipped as is
pack.mcmeta                             -> only hand-written file in the datapack
gametest/mc/                            -> separate mcb project for the test namespace, never built into data/
```

- mcb never deletes stale output and a parse error keeps the last good output. Rename or remove a function: delete `data/`, rebuild, from the project root.
- eq objectives are renamed to `train.eq.var` and `train.eq.const` so other mcb packs don't share them.
- Every JSON object is declared in `src/`. Functions, tags, predicates, item modifiers and advancements are all generated, so `data/` is fully ignored.
- `npm test` runs `scripts/check-lang.js` and then `gametest/run.js`. See Tests.

## Source layout

| Path | Role |
|---|---|
| `src/train.mcb` | Shared load, `train:tick`, `train:uninstall`, root advancement, tags, predicate, item modifier |
| `src/global.mcb` | Shared advancement parents `global:root` and `global:satyrnidae/author` |
| `src/train/*.mcb` | One file per feature, each with its own load and uninstall |
| `src/objectives.js` | Every scoreboard objective by owning module |
| `src/chains.js` | The chain item ids, used by chain.mcb and the couplers tag |
| `src/math.mcbt` | Score math templates `abs`, `cap`, `floor`, `clamp` |
| `src/text/*.js` | Every chat, action bar and advancement string as a JSON string |
| `scale.js` | `UNIT` and `u(blocks)`, the fixed point scale |
| `resourcepack/` | Optional lang files, mirror `src/text` |
| `scripts/check-lang.js` | Fails when `src/text` and `en_us.json` drift |
| `gametest/` | Headless gametest runner, generator, and the tests |

Every `.mcb` file puts its header description first, then one import block, then the code.

## Fixed point scale

- Positions, gaps and speeds are scores in units of 1/64 block, `UNIT` in `scale.js`. Sources write constants in blocks as `<%u(2.5)%>`.
- 64 is a power of two, so a position converts from a double without rounding and a chunk is 1024 units.
- Saved motion and push are a separate scale, ten thousandths. They are small numbers and never positions.
- Reading a position: `data get entity @s Pos[0] <%UNIT%>`. Writing a Motion: `store result entity @s Motion[0] double <%1 / UNIT%>`.
- `eq` expressions do the score math. A `train.eq.var` is used behind the scenes, so `eq` never goes after `execute`.

## Runtime model

### Load

`minecraft:load` runs every module's `function load minecraft:load`. `train.mcb` declares only the shared objectives `train.tmp` and `train.const` and the constants. Each module declares its own objectives from `src/objectives.js`.

Config scores in `train.const`:

| Holder | Meaning | Default |
|---|---|---|
| `#spacing` | Gap between carts, 2 blocks | set each load |
| `#chunkload` | 0 off, anything else on | 1 when unset, kept over `/reload` |
| `#noavoid` | 1 turns braking off, for testing | 0 |
| `#holdmax` | Ticks a follower holds for a leader in another dimension | 60 |
| `#period`, `#reach`, `#stop`, `#hit` | Collision avoidance, see avoid.mcb | set each load |

### Tick

`train:tick` runs in this order, and the order matters:

1. `sample/tick`: every furnace cart stores its velocity, first so everything below sees this tick's.
2. `crash/tick`: two furnaces of different trains meeting hard explode.
3. `avoid/tick`: look-ahead braking for heads, before `head/rail` so an unpowered rail still wins.
4. Click catchers: stored clicks run `click/hit`.
5. `head/rail` for every head, `follow/tick` for every follower, `fuel/check` for heads.
6. `chain/check`, once every 20 ticks, frees orphaned chain displays.
7. `click/arm`, then the tick counters, and every fifth tick `chunks/pass`.

Entities tagged `global.ignore` or `global.ignore.pos` are skipped by head and follower control.

### Throttles

- `#p5` and `#p20` are tick counters mod 5 and 20.
- Chunk touch and sweep run every fifth tick. A cart covers 2 blocks in 5 ticks at most and its square reaches 7.5, so the chunks ahead stay loaded.
- Head trace for braking runs once per `#period` ticks, spread by cart id.
- A leader's velocity is sampled once per tick however many followers it has and cached on the leader.

## Modules

| File | Role |
|---|---|
| `sample.mcb` | Velocity of every furnace cart, position change per tick. A move over 0.45 blocks is a teleport and reads 0. Also `root_of`, the id of a train's head |
| `head.mcb` | Head furnace on powered rails. `train.halt` is 0 running, 1 stopped, 2 coasting to the rail center, 3 yielding to a cart ahead. Saved motion and push resume it |
| `follow.mcb` | Follower control. Speed is the leader's along the heading plus a correction to the spacing. Handles detours along rails, blocked chains, portal transit, wait and relink |
| `link.mcb` | Coupling and cutting. First click picks the leader, second the follower. Cycle guard, unlink |
| `click.mcb` | Interaction entities parked on carts while a player sneaks with a coupler or shears, since sneaking turns the click into a pass |
| `chain.mcb` | The block display between a pair, one per follower. Placed, stretched and aimed every tick, dropped when freed |
| `avoid.mcb` | Heads trace the rail ahead and cap their speed to stop 2.5 blocks short of a foreign cart |
| `trace.mcb` | Rail path tracer, curves and slopes followed exactly. Also `connect`, which finds whether a follower's rails lead to its leader, and train marking |
| `crash.mcb` | Collision explosions for furnaces of different trains closing at 0.1 blocks per tick or more. No block is touched |
| `fuel.mcb` | Tops up a head from coal or charcoal in a chest cart behind it |
| `chunks.mcb` | Forceloading around coupled trains |

### Data model

Per cart scores:

| Objective | Meaning |
|---|---|
| `train.id`, `train.prev` | Id of the cart, id of the cart it follows |
| `train.len`, `train.strain` | Gap estimate, ticks at the break distance |
| `train.cdir`, `train.cgap`, `train.cdet` | Rails to the leader: exit direction plus 1, units of path, 1 on a detour |
| `train.lpx`, `train.lpz`, `train.lpt`, `train.lvx`, `train.lvz` | Leader position at the last sample, tick stamp, cached velocity |
| `train.lost`, `train.lmx`, `train.lmz`, `train.wait` | Portal transit, see below |
| `train.ppx`, `train.ppz`, `train.svx`, `train.svz`, `train.pvx`, `train.pvz`, `train.dir` | Furnace sampler: position, velocity, last velocity, last heading |
| `train.gap`, `train.chk`, `train.tdir` | Braking: path gap, tick of the last trace, heading it looked along |
| `train.halt`, `train.smx`, `train.smz`, `train.spx`, `train.spz` | Head hold state, saved motion and push |
| `train.ox`, `train.oy`, `train.oz` | Where a chain display hangs from its follower while the leader is away |
| `train.sel` | Player's selected leader mid-coupling |

Tags: `train.follower`, `train.chain`, `train.hit`, `train.target`, `train.lead_now`, `train.me`, `train.boom`, `train.hold_now`. Other tags are short lived markers used by the walks in `trace.mcb` and `follow.mcb`.

Chunk keys are fake players named `c<dimension>_<x>_<z>` on `train.cgen` and `train.cpres`. Storage `train:chunks` holds the registry of claimed chunks in `active`. Storage `train:tmp` holds scratch values such as `pos`, `train:chunk` the macro args, and `train:drop` the chain drop.

Tags in `data/train/tags`: `entity_type/carts`, `item/fuel`, `item/tools`, `item/couplers`, `function/uninstall`.

## Following

A follower copies the leader's speed along the line to it, plus a correction toward 2 blocks of spacing:

- Too close backs off 2.5 times harder than too far catches up. Caps are 0.45 blocks per tick, 0.65 when more than a block back.
- Within 0.3 blocks the heading means nothing and no Motion is written, so vanilla's push between carts is left alone.
- Where the follower's rails lead to the leader and the line isn't roughly along the way out of its block, within 31 degrees, the follower drives along the rails instead, never backward. A leader on a parallel track has no rails to it, so the line is all there is.
- A cart standing between a follower and its leader, not at either end, means the chain order isn't the rail order. The follower snaps its chain, see issue 9.
- A gap held at the break distance too long breaks the chain too.

The chain display sits at the midpoint of the pair, raised 0.4. Its y scale is the length and a 90 degree x rotation lays it along the aim.

## Portal transit

A follower whose leader isn't within 8 blocks but exists in another dimension holds for up to `#holdmax` ticks:

- `train.lost` counts the hold. The chain stays on and rides with the follower, its display teleports along through `chain/hop` since a Pos write can't change dimension.
- On a rail the follower coasts at the Motion it last wrote, for 20 ticks. Off a rail it is left alone.
- The head of a train waiting to cross is not a derail, `chunks.mcb` sets `#transit` and keeps the claims.
- Once the leader is back in range, `follow/relink` restarts the gap from 2 blocks and zeroes the leader jump. A follower that lands within 1.5 blocks of its leader waits up to 40 ticks, `train.wait`, until it drives clear.

## Chunk loading

- Every cart in a coupled train forceloads the chunks its 15x15 block square touches. Squares overlap down the train, so the head has lead and the tail has follow time.
- Claims are stamped with the pass tick in `train.cgen`. The sweep drops whatever wasn't touched, which covers out of range chunks, a derailed train, a cut link and a dead cart.
- A chunk already forceloaded when first touched is marked `train.cpres` 1 and never removed.
- A `global.forceload` marker entity is summoned per claimed chunk and removed on release, unless another pack's marker is in the same chunk.
- Only the overworld, nether and end are handled.
- After a restart the sweep skips 20 passes, `#grace`, so carts have time to load.
- `#chunkload` 0 stops new claims and the sweep frees everything within five ticks.

## Conventions

Follows the [datapack conventions](https://mc-datapacks.github.io/en/):

- Advancement tree: `global:root`, `global:satyrnidae/author`, then `train:root`. The global nodes are the same files in every pack by satyrnidae.
- `global.ignore`, `global.ignore.pos`, `global.ignore.kill` on carts, `global.ignore.gui` on players.
- `train:uninstall` removes everything the pack made and disables it. It runs `#train:uninstall`, a tag each module adds its own `function uninstall train:uninstall` to, then removes the shared objectives and the pack by name.
- No message on reload.

## Text and translations

- Every chat, action bar and advancement string is a `translate` component with its English as the fallback. They are built in `src/text/*.js` with the helpers in `lib.js` and spliced into sources with `<%linkText.first%>`.
- `resourcepack/assets/train/lang/en_us.json` and `assets/global/lang/en_us.json` carry the same keys. A translation overrides the fallback, so a lang change needs the resource pack re-zipped and reloaded with F3+T.
- `scripts/check-lang.js` fails on a missing key, a text that differs from its fallback, or an unused key.
- Do not write tellraw or title JSON inline in `.mcb`.

## Tests

`node gametest/run.js` builds the pack and the test namespace, generates a gametest pack from `gametest/tests.js`, and runs `net.minecraft.gametest.Main` headless against the 26.x server jar.

- Environment: `GAMETEST_SERVER` a folder with `server.jar`, `GAMETEST_JAVA` a Java 25 executable, `GAMETEST_TESTS` a filter, default `train_test:*`. `node gametest/fetch-server.js` downloads the jar.
- Each run gets its own folder under `server/runs`, with its own port and `server.properties`, so concurrent runs don't collide. It is removed on exit.
- A function that fails to load, or a registry error, fails the run.
- The test namespace builds from `gametest/mc` and never into `data/`. A leftover `data/train_test` fails the run.

## Gotchas

- `execute as @e[...] if score ... run function` applies the `if` to every candidate before any function runs, so a recursive walk changing `#cur` does not break its siblings.
- Selectors with `distance` in a function run at a position, see the `seen` note in `chain.mcb` for the cross-dimension case.
- mcb has no top level `load {}`. Each file uses `function load minecraft:load`, and mcb merges them into the tag.
- In templates, negative script values need `word` args and `Number()` arithmetic, not `int`.
- A function cannot see which entity was clicked. That is why `click.mcb` exists.
- A furnace cart zeroes its push the moment fuel runs out, so `fuel.mcb` tops up while fuel is above 0.
- Vanilla carts shove each other when hitboxes inflated by 0.2 touch, about 1.4 blocks apart. The spacing of 2 blocks stays outside that.

## Adding things

1. A new objective: add it to its module's list in `src/objectives.js`. Load and uninstall pick it up.
2. A new module: `src/train/<name>.mcb` with its own `load` and `uninstall train:uninstall`, and an entry in `objectives.js`.
3. Text goes in `src/text/<name>.js` with matching keys in `en_us.json`. Run `npm run lang:check`.
4. A constant in blocks: `<%u(n)%>`, never a bare unit count.
5. A test: add an entry to `gametest/tests.js`.
