<!-- TODO: Manual review needed. Please delete this line after review. -->
# Train collision avoidance and furnace crashes

Date 2026-11-09. Target 26.3, format 121. Project: furnace_train, mc-build 4.3.2.

## Goal

Furnace-led trains brake for any other minecart on their track and stop short of it, the common case being a train parked at a station refueling. If two furnace carts from different trains still collide hard, both explode in a small explosion that never harms blocks, and both drop as items.

Success:
- A head approaching a parked cart or train stops at least 2 blocks short, with no explosion, on straights, curves and slopes.
- A forced head-on, with braking disabled, destroys both furnace carts, drops two furnace cart items, hurts nearby non-cart entities a little, and changes no blocks.
- A gentle touch, and furnaces of the same train touching, never explode.
- A blocked head resumes its saved speed once the way is clear.

## Decisions

| Question | Answer |
|---|---|
| Obstacle | any minecart not in the head's own train, coupled or not |
| Explodes | any two furnace carts of different trains, head or follower, lone furnaces included |
| Threshold | hard hit only, relative speed >= 0.1 blocks per tick and closing |
| Damage | 6 within 3 blocks to non-cart entities, riders included, never blocks |
| Lookahead | C-lite: traced rail path with occupancy, no reservations |
| Check rate | once per 20 ticks per head, staggered by cart id |
| Cart tag | `#train:carts` extended to every minecart type, used everywhere |

## Architecture

Existing modules stay. `head.mcb` gets one state. Four modules are new, plus a test namespace.

- `data/train/tags/entity_type/carts.json`: add `hopper_minecart`, `tnt_minecart`, `spawner_minecart` and `command_block_minecart` to the three types already listed. Every minecart type is then coupleable and gets click catchers.
- `src/train/sample.mcb`: per tick position sampler for every furnace cart. Same file holds the `root_of` helper.
- `src/train/trace.mcb`: rail path walker. Generated shape table from a JS block.
- `src/train/avoid.mcb`: staggered scheduler, gap aging, cap law, yielding state transitions.
- `src/train/crash.mcb`: per tick contact check and the explosion.
- `src/train.mcb`: new constants in `load`, new calls in `tick`.
- `src/train/head.mcb`: `train.halt = 3` documented and honored, see yielding.

Tick order: sample, crash, avoid, `head/rail`, follow, the rest. An unpowered powered rail always wins over yielding.

## State

New objectives, all per cart unless noted.

| Objective | Meaning | Unit |
|---|---|---|
| `train.ppx`, `train.ppz` | position at last tick, furnace carts | 1/1000 block |
| `train.svx`, `train.svz` | velocity, position change per tick, clamped to 450 | 1/1000 block per tick |
| `train.dir` | last known heading, 0 N, 1 E, 2 S, 3 W | enum |
| `train.gap` | path distance to the first foreign cart, aged every tick | 1/1000 block |

Constants on `train.const`: `#period` 20, `#reach` 16, `#stop` 2500, `#hit` 100, `#10` 10.
Debug flag `#noavoid` on `train.const`, 1 disables braking so a head-on can be tested.
`halt` gains value 3, yielding.

## Sampler

Every tick, for every furnace cart: previous position minus current gives `svx` and `svz`, then current position is stored. Heads update `train.dir` from the dominant axis and sign of the velocity when speed is at least 0.02, otherwise keep the old heading. A head with no heading yet does not trace.

Every furnace cart is sampled, not only heads, because the crash check needs follower velocities.

## Trace

Runs in a head's context, aligned to its block. Skipped when the head is off the rails, which counts as clear.

Per step, at the current block:
1. The block must match `#minecraft:rails`, else stop, clear.
2. If a cart outside the head's own train is in the block, `@e[type=#train:carts,tag=!train.mine,dx=0,dy=0,dz=0]` from the block corner, record `gap = steps * 1000` and stop.
3. Look up the block `shape` and the current heading in the generated table. No entry means the cart cannot enter that way, stop, clear.
4. Move one block along the exit heading, try the candidates in order, and continue until `#reach` steps.

Shape table, entry edge is the opposite of the heading:

| Shape | Edges, high edge in caps for slopes |
|---|---|
| north_south | N, S |
| east_west | E, W |
| ascending_east, west, north, south | the named side is high, the opposite is low |
| south_east, south_west, north_west, north_east | the two named sides |

Exit edge is the other edge of the shape. The new heading is the exit edge. 20 valid shape and heading pairs, 4 straight, 8 slope and 8 curve.

Next block candidates after moving one block in the exit direction:
- Exit through a high edge: y + 1 only.
- Any other exit: y, then y - 1.

The own train is tagged `train.mine` by walking the chain at the start of a trace and untagged at the end. Nothing is tagged between traces.

## Scheduler and gap aging

A head traces when `(train.id + #gen) % #period == 0`, so heads spread over the 20 ticks. A head with no id is given one first.

Every tick, between traces, `gap -= |v|` with `|v|` taken as max(|vx|, |vz|) plus 0.4 of the smaller, floored at 0. A clear trace sets `gap` to a large constant.

## Braking

Applies to heads with `halt` 0 or 3 and `#noavoid` 0.

`cap = (gap - #stop) / 10`, per tick, never below 0.

- cap >= 200, and `halt` is 3: `head/resume`, which restores saved motion and push.
- cap < 200, `halt` is 0: save motion and push through the existing `head/track` values, set `halt = 3`.
- `halt` is 3, cap < 200: zero `PushX` and `PushZ`, write `Motion` as the cardinal heading times cap, or 0 under 0.02.

Fuel keeps burning. A furnace adds its push to motion every tick before its speed clamp, so clamping motion alone does not brake, the push has to be zeroed.

`halt` 1 and 2 belong to the rail code. Yielding skips those and rail halts take over from state 3, using the saved values from before the yield.

Followers are untouched, their spacing controller stops them with the head.

## Crash and explosion

Every tick, for each furnace cart A not tagged `train.boom`, look for a furnace cart B within 1.15 blocks, not A, not tagged `train.boom`.

A and B are in different trains when `root_of(A) != root_of(B)`. `root_of` walks `prev` links up to a cart that is not a follower and returns its id, giving the cart an id if it has none. Lone furnaces therefore get unique roots.

Hard hit when both hold:
- relative speed squared `(svx_A - svx_B)^2 + (svz_A - svz_B)^2 >= #hit^2`
- closing, `(v_A - v_B) . (p_B - p_A) > 0`

On a hit, tag both `train.boom`, then:
1. Particle `minecraft:explosion` and sound `entity.generic.explode` at each cart.
2. Once at A, `damage` 6 `minecraft:explosion` to entities within 3 blocks, excluding `#train:carts`, items, interaction, marker, item_display, block_display, text_display, `#minecraft:boat`, painting, item_frame, glow_item_frame and leash_knot.
3. Both carts get `damage @s 1000 minecraft:explosion`. A minecart pops above 5 damage, drops its item and ejects its riders. Entity drops follow the `doEntityDrops` gamerule.

No step touches a block.

## Edge cases and limits

- Uncoupled cart ahead: foreign by definition, the head brakes.
- Cut link: nothing to reset, no root is stored.
- Head dies while yielding: leftover scores are rewritten by the next head or a re-coupled cart.
- Trace stops at unlisted rail such as modded rails, or after `#reach`.
- Two trains converging on a junction in the same second are not seen until one is on it, the cost of C-lite.
- A 20 tick period with a closing speed up to 0.4 per tick is why reach is 16.
- Probes and area damage use a cart's block or hitbox, so a derailed cart off the path is not seen.
- If `damage` does not pop a furnace cart in 26.3, fall back to summoning the `furnace_minecart` item and removing the cart. Verify before relying on it.

## Testing

No unit runner exists for data packs. A throwaway namespace `train_test`, `src/train_test.mcb`, builds scenarios in a flat world, runs them, and prints PASS or FAIL with `tellraw`. Each test is written first and watched failing, then the code is added.

Tracer:
- Straight, curve and slope strips: the reported gap matches the block distance to a placed cart, for all 20 shape and heading pairs.

Braking:
1. Lone parked cart on a straight: head stops at least 2 blocks short, no explosion.
2. Parked coupled train at a station: same.
3. Curve east to south with a cart around the bend: head stops short.
4. Slope with a cart over the crest: head stops short.
5. Obstacle removed: head leaves state 3 and push is restored.
6. Two heads trace on different ticks.

Crash, with `#noavoid` set:
7. Head-on: both destroyed, two furnace cart items dropped, a sentinel block layout unchanged.
8. Contact below 0.1 blocks per tick: no explosion.
9. Furnaces of the same train touching: no explosion.

## Files changed

New: `src/train/sample.mcb`, `src/train/trace.mcb`, `src/train/avoid.mcb`, `src/train/crash.mcb`, `src/train_test.mcb`.
Edited: `src/train.mcb`, `src/train/head.mcb`, `data/train/tags/entity_type/carts.json`.
