<!-- TODO: Manual review needed. Please delete this line after review. -->
# Train Collision Avoidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Furnace-led trains brake for any minecart on their traced rail path, and two furnace carts of different trains that hit hard explode, harmlessly to blocks, and drop as items.

**Architecture:** A per-tick sampler gives every furnace cart a velocity. Heads trace the rail path ahead every 20 ticks, staggered by cart id, age the resulting gap every tick, and yield through a new `halt = 3` state when a speed cap falls below 0.2. A per-tick crash check compares furnace carts of different trains and runs an effects-only explosion.

**Tech Stack:** mc-build 4.3.2 `.mcb` sources, hand-written JSON under `data/train`, Minecraft Java 26.3, format 121.

**Spec:** `docs/superpowers/specs/2026-11-09-train-collision-design.md`

## Global Constraints

- Target 26.3, pack format 121. mc-build 4.3.2, run with `npm run build` in `furnace_train`.
- Namespace `train`. Function paths follow files: `src/train/avoid.mcb` function `head` is `train:avoid/head`.
- Scoreboard objectives are `train.*` with fake players like `#gap train.tmp`. Constants live on `train.const`.
- Units: positions, gaps and speeds in 1/1000 block, speeds per tick. Saved motion and push in 1/10000.
- Heading enum on `train.dir`: 0 N, 1 E, 2 S, 3 W.
- Constants: `#period` 20, `#reach` 16, `#stop` 2500, `#hit` 100, `#10` 10, clear gap 99000.
- Cart tag `#train:carts` holds all seven minecart types and is used for every cart check.
- Hard hit: relative speed >= 0.1 blocks per tick and closing. Contact distance 1.15 blocks.
- Explosion: `damage ... 6 minecraft:explosion` within 3 blocks, then `damage @s 1000 minecraft:explosion` on both carts. No step touches a block.
- Style: American English, plain ASCII, `->` not arrows, terse fragment comments, no parenthetical asides, tabs in `.mcb`.
- `furnace_train` is not a git repository. Commit steps apply only if the project has been initialized, and commits must be signed.
- Tests run in game. The agent can only build. A step that says "run in game" is for the person running the world, who reports the chat output.

## Review Focus

- A cart that has just spawned or been teleported must not read as a hard hit. Pinned in Task 2 and Task 5.
- A trace that meets an unlisted or missing rail, such as a modded rail, must stop clear without an error. Pinned in Task 3.
- A head with no heading yet, parked at a station, must not trace or yield. Pinned in Task 4.
- A foreign cart already in the head's own block gives gap 0 and the head holds, with no division by zero. Pinned in Task 4.
- `train.mine` must never leak, whatever way a trace exits, or the next trace ignores real carts. Pinned in Task 3.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/train.mcb` | objectives, constants, tick wiring |
| `src/train/sample.mcb` | per tick furnace velocity and heading, `root_of` helper |
| `src/train/trace.mcb` | rail path walker, generated shape table, own-train marking |
| `src/train/avoid.mcb` | scheduler, gap aging, cap, yield state machine |
| `src/train/head.mcb` | gains `yield`, honors `halt = 3` in `rail` |
| `src/train/crash.mcb` | contact scan, hard-hit test, explosion |
| `src/train_test.mcb` | throwaway test namespace, arena builders, scenarios |
| `data/train/tags/entity_type/carts.json` | all seven minecart types |

---

### Task 1: Test harness, shared state and cart tag

**Files:**
- Create: `src/train_test.mcb`
- Modify: `src/train.mcb`, `data/train/tags/entity_type/carts.json`

**Interfaces:**
- Produces, in `train_test`: `lib/begin` as player, sets the arena origin marker `tt.origin` at the player's block center and clears old `tt` entities. `lib/flat` as player, builds a stone floor and clear air `x -1..46`, `z -4..4`, `y -1..4` around the origin. `lib/report` macro on storage `train_test:cur`, `{name}`, prints PASS when `#ok train_test` is 1, else FAIL. `lib/cleanup` removes `tt` entities.
- Produces, in `train`: objectives `train.ppx train.ppz train.svx train.svz train.dir train.gap train.chk`. Constants `#period #reach #stop #hit #10` on `train.const`, and `#noavoid` defaulting to 0.

- [ ] **Step 1: Write the failing test.** In `src/train_test.mcb`, `function self_check` with assertions: each new objective exists, `#period train.const` is 20, `#reach` 16, `#stop` 2500, `#hit` 100, `#10` 10, and `summon` of `minecraft:hopper_minecart` at the origin is matched by `@e[type=#train:carts,tag=tt.probe]`, repeated for `tnt_minecart`, `spawner_minecart`, `command_block_minecart`. Prints through `lib/report` with name `"t0 shared state"`.
- [ ] **Step 2: Build and run in game.** `npm run build`, then `/reload` and `/function train_test:self_check`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add the objectives and constants to `train:load` in `src/train.mcb`, and extend `carts.json` with the four missing types. Write the four `lib/*` functions.
- [ ] **Step 4: Build and run in game.** Same commands. Expected: PASS for `t0 shared state`.
- [ ] **Step 5: Commit**, if the project is a repository: `git add src data docs && git commit -S -m "feat: test harness, shared state, all minecart types in carts"`.

---

### Task 2: Sampler

**Files:**
- Create: `src/train/sample.mcb`
- Modify: `src/train.mcb` for the tick call, `src/train_test.mcb` for tests

**Interfaces:**
- Produces: `train:sample/tick`, called first in `train:tick`. `train:sample/cart` as a furnace cart, at it. After it runs, `@s train.svx` and `@s train.svz` hold the position change since last tick, in 1/1000 block, 0 on a first sample or when either axis exceeds 450. `@s train.ppx` and `@s train.ppz` hold the current position. For a furnace cart that is not a follower and moving at `|vx| + |vz| >= 20`, `@s train.dir` is set from the dominant axis and its sign.
- Produces: `train:sample/root_of` as a cart. Sets `#root train.tmp` to the id of the head of its train, walking `train.prev` up until a cart that is not a follower. A cart with no id is given one first.
- Consumes: `train:link/assign_id` as a cart with no id.

- [ ] **Step 1: Write the failing tests.** `train_test:t1/start` summons furnace carts `tt.a` at origin +3 with `Motion:[0.2d,0d,0d]` on a flat rail strip, and `tt.b` unfueled and stationary. After 10 ticks `train_test:t1/check` asserts: `tt.a train.svx` between 150 and 250, `tt.a train.dir` is 1, `tt.b train.svx` is 0, and `tt.b train.dir` is unset. A second case summons a cart far from the origin by `tp` after sampling and asserts `train.svx` is 0 on the next tick, not 450. A third case sets up two coupled carts through `train:link/apply`, and asserts `root_of` on the follower returns the head's id, and a lone cart with no id returns a new id different from both.
- [ ] **Step 2: Build and run in game.** `/function train_test:t1/start`. Expected: FAIL.
- [ ] **Step 3: Implement `function tick` and `function cart` in `src/train/sample.mcb`.** Init rule: when `ppx` is unset, store the position and set `svx` and `svz` to 0. Add `function root_of` with a bounded walk of 32 links. Call `train:sample/tick` first in `train:tick`.
- [ ] **Step 4: Build and run in game.** Expected: PASS for `t1 sampler`, including the teleport and root cases.
- [ ] **Step 5: Commit.** `git add src && git commit -S -m "feat: furnace cart sampler and root_of"`, if a repository.

---

### Task 3: Rail tracer

**Files:**
- Create: `src/train/trace.mcb`
- Modify: `src/train_test.mcb`

**Interfaces:**
- Produces: `train:trace/run` as a cart, at it. Reads `@s train.dir` and `#reach train.const`. Tags its own train `train.mine`, traces, untags on every exit, and leaves `#gap train.tmp` as the path distance to the first foreign cart in 1/1000 block, or 99000 when clear.
- Produces: `train:trace/step`, the recursive walker, positioned at a block corner, state in `#h train.tmp` heading and `#n train.tmp` steps taken. Generated shape table, 20 valid shape and heading pairs, one `execute if score #h ... if block ~ ~ ~ #minecraft:rails[shape=...] run return run function train:trace/<move>_<dir>` line each. Move functions `go_n go_e go_s go_w` try the next block at y then y-1, and `up_n up_e up_s up_w` try y+1 only. A pair with no table entry ends the trace clear.
- Consumes: the own-train walk uses `train.prev` and `train.id`.

- [ ] **Step 1: Write the failing tests.** In `train_test`, `trace/curve`: rails `east_west` at x 0..4, `south_west` at x 5, `north_south` at z 1..4 with x 5, a foreign `minecart` at z 4, head on x 0 with `train.dir` 1. Assert `#gap train.tmp` is 9000. `trace/up`: flat x 0..2, `ascending_east` at x 3, flat at y+1 x 4..7, foreign cart at x 7, assert 7000. `trace/down`: flat x 0..1, `ascending_west` at x 2, flat at y-1 x 3..5, foreign cart at x 5, assert 5000. `trace/clear`: 17 plain rails and no cart, assert 99000. `trace/modded`: a rail block replaced by `stone` after 3 blocks, assert 99000 with no error output. `trace/leak`: after every case above, assert `execute unless entity @e[tag=train.mine]`. A JS block in `train_test.mcb` generates `trace/shape_<shape>_<heading>` for all 20 valid pairs: a head rail with that shape, the next rail in the exit direction by the spec's candidate order, a foreign cart on it, assert gap 1000.
- [ ] **Step 2: Build and run in game.** `/function train_test:trace/run_all`. Expected: FAIL on every case, `train:trace/run` missing.
- [ ] **Step 3: Implement `trace.mcb`.** A JS block generates the table and move functions from one shape table, edges and high edge per shape, heading enum as in Global Constraints. `function run` handles marking with a recursive walk, the trace, then untagging in a function reached by every path, never an early `return` past it. Foreign check from the block corner: `@e[type=#train:carts,tag=!train.mine,dx=0,dy=0,dz=0]`.
- [ ] **Step 4: Build and run in game.** Expected: all `trace/*` PASS and 20 shape lines PASS.
- [ ] **Step 5: Commit.** `git add src && git commit -S -m "feat: rail path tracer"`, if a repository.

---

### Task 4: Avoid scheduler and yielding

**Files:**
- Create: `src/train/avoid.mcb`
- Modify: `src/train/head.mcb`, `src/train.mcb`, `src/train_test.mcb`

**Interfaces:**
- Produces: `train:avoid/tick`, called in `train:tick` after `train:crash/tick` and before the head rail call. `train:avoid/head` as a furnace cart that is not a follower, at it. `train:head/yield` as a head with `halt 3`, consumes `#cap train.tmp`, zeroes `PushX` and `PushZ` after copying any nonzero push into `train.spx` and `train.spz`, writes `Motion` as cap along `train.dir`, or 0 under 20.
- Modifies `train:head/rail`: a head with `halt 3` returns before `head/track`.
- Consumes: `train:trace/run`, `train.svx`, `train.svz`, `train.dir` from the sampler, `train:head/resume`, saved `train.sm*` and `train.sp*`.
- State: `train.gap` aged each tick by `max(|svx|, |svz|) + 0.4 * min` floored at 0. A head traces when `(train.id + #gen) % #period == 0`, writing the tick to `train.chk`. Unset `train.gap` is 99000.

- [ ] **Step 1: Write the failing tests.** All on a straight strip of 40 rails, heads fueled with `Fuel:3000s,PushX:1.0d`. `t2/start`: foreign `minecart` parked at x 30, head at x 3. `t2/check` after 400 ticks asserts: head x at least 2000 milli short of the cart, `halt` is 3, `svx` between -10 and 10, no `item` entities. `t3/start`: same with a coupled parked train of three carts, same assertions. `t4/start`: head stopped as in t2, then the parked cart is killed, `t4/check` 100 ticks later asserts `halt` 0 and `svx` above 100. `t5/start`: two heads with ids differing by 7, `t5/check` asserts their `train.chk` values differ mod 20. `t6/start`: a head with push but no heading yet, parked in front of a foreign cart at distance 2, asserts no trace is run, `halt` stays 0 and `train.gap` stays 99000. `t7/start`: foreign cart placed in the head's own block, asserts `halt` 3, `train.gap` 0, and no command errors in the log.
- [ ] **Step 2: Build and run in game.** `/function train_test:t2/start` and the rest. Expected: FAIL.
- [ ] **Step 3: Implement `avoid.mcb`.** `function head` skips on `#noavoid` 1, on `halt` 1 or 2, and when `train.dir` is unset. It sets unset `train.gap` to 99000, assigns an id if missing, runs `train:trace/run` on its slot and stores `#gap` into `train.gap`, otherwise ages it. `#cap = (gap - #stop) / #10`, floored at 0. `halt` 0 and cap < 200: set `halt 3`. `halt` 3 and cap >= 200: `train:head/resume`. `halt` 3 otherwise: `train:head/yield`. Edit `head/rail` as specified.
- [ ] **Step 4: Build and run in game.** Expected: PASS for t2 to t7 and the curve and slope cases from Task 3 repeated as braking runs, `t8` with the curve strip and `t9` with the slope strip, a head stopping short of the parked cart in each.
- [ ] **Step 5: Commit.** `git add src && git commit -S -m "feat: staggered look-ahead braking with yielding"`, if a repository.

---

### Task 5: Crash detection and explosion

**Files:**
- Create: `src/train/crash.mcb`
- Modify: `src/train.mcb`, `src/train_test.mcb`

**Interfaces:**
- Produces: `train:crash/tick`, called in `train:tick` right after `train:sample/tick`. `train:crash/scan` as a furnace cart not tagged `train.boom`, at it. `train:crash/pair` as the other furnace cart with the scanner tagged `train.me`. `train:crash/boom` as the scanner.
- Consumes: `train.svx`, `train.svz`, `train.ppx` from the sampler, `train:sample/root_of`, `#hit train.const`.
- Effects of `boom`: particle `minecraft:explosion` and sound `entity.generic.explode` at both carts. One `damage` of 6 `minecraft:explosion` at the scanner, radius 3, excluding `#train:carts`, `item`, `interaction`, `marker`, `item_display`, `block_display`, `text_display`, `#minecraft:boat`, `painting`, `item_frame`, `glow_item_frame`, `leash_knot`. Then `damage @s 1000 minecraft:explosion` on both.

- [ ] **Step 1: Write the failing tests.** All with `#noavoid` 1 and `lib/flat`. Before running, `clone` the arena region to a reference area. `t10/start`: furnace heads at x 5 and x 25, fueled and pushing toward each other. `t10/check` after 300 ticks asserts: `execute unless entity @e[type=minecraft:furnace_minecart,tag=tt]`, exactly two `minecraft:furnace_minecart` item entities, `execute if blocks` between the arena and the reference is `all` equal, and a `tt.pig` placed at distance 2 from the impact took damage while one at distance 6 did not. `t11/start`: furnace A stationary, furnace B moving at 0.05, asserts both exist after 60 ticks. `t12/start`: two furnaces coupled through `train:link/apply` and touching with the follower at relative speed 0.3, asserts neither destroyed. `t13/start`: two furnaces spawned 0.9 blocks apart, asserts neither destroyed on the first tick, from the sampler init rule. `t14/start`: a boom followed by a coupled cart standing 2 blocks from the impact, asserts that cart survives.
- [ ] **Step 2: Build and run in game.** Expected: FAIL on `t10`, others may pass.
- [ ] **Step 3: Implement `crash.mcb`.** Scan finds furnace carts within 1.15 blocks. `pair` computes `root_of` for both, skips equal roots, then needs relative speed squared at least `#hit^2` and `(v_A - v_B) . (p_B - p_A) > 0`. On a hit, tag both `train.boom` and run `boom`.
- [ ] **Step 4: Build and run in game.** Expected: PASS for t10 to t14. If `damage 1000` does not pop a furnace cart, record it and use the spec fallback of summoning the `furnace_minecart` item and removing the cart.
- [ ] **Step 5: Commit.** `git add src && git commit -S -m "feat: furnace crash detection and explosion"`, if a repository.

---

### Task 6: Regression and cleanup

**Files:**
- Modify: `src/train_test.mcb`

- [ ] **Step 1: Add `train_test:run_all`** that runs t0 to t14 in sequence, each test 500 ticks after the last, printing the PASS and FAIL lines.
- [ ] **Step 2: Build.** `npm run build`. Expected: exit 0, no unknown item or function errors in the output.
- [ ] **Step 3: Run in game.** `/reload`, then check the log for any `Failed to load function`, then `/function train_test:run_all`. Expected: every line PASS.
- [ ] **Step 4: Replay the existing scenarios by hand.** Couple a three cart train, run it over a powered rail, refuel from a chest cart, derail it. Expected: behavior unchanged from before this work.
- [ ] **Step 5: Decide what ships.** `train_test` stays out of any release zip. Commit if a repository: `git add -A && git commit -S -m "test: train_test run_all"`.
