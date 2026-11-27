# Furnace Train Data Pack

Recreates some aspects of the trains from the great TrainCarts as a somewhat janky datapack.

<img width="1232" height="673" alt="don't look too hard at the trains bouncing back and forth on the hairpin turns then breaking as they furnace head gets too far away, it's fine." src="https://github.com/user-attachments/assets/06f88a43-0143-46eb-8281-7690e855ea1c" />

*This is fixed now but it's still funny to me.*

Trains stop on unpowered rails and resume when they're powered. They also refuel from attached chest minecarts if they contain some coal or charcoal.

Link train cars from head to tail (important: velocity of the train is determined solely by the head!) with any variety of chain you desire.

Trains load chunks as they pass through them, so they can run completely autonomously! To turn that off, run `/scoreboard players set #chunkload train.const 0`; any chunks the pack loaded are released within five ticks, or up to 5 seconds after a reload. Set it back to 1 to turn it on again. It defaults to on and survives `/reload`.

Also, you can do whatever this is:

<img width="1232" height="673" alt="goofy parallel minecart action; one furnace cart reciprocates while adjacent linked minecarts follow back and forth on their own rails." src="https://github.com/user-attachments/assets/d0c458ba-7f8b-42aa-8596-53f8b422fe1c" />

*This could maybe be useful in a mob farm or something?*

## Uninstalling

Run `/function train:uninstall` as an operator. It breaks the chains, releases the chunks the pack forceloaded, removes its objectives, tags and storage, then disables the pack. Linked carts stay as they are. If the pack can't be disabled by name it says so, and the folder or zip can be removed from the world's datapacks folder.

## Conventions

Follows the [datapack conventions](https://mc-datapacks.github.io/en/): the pack advancement sits under `global:satyrnidae/author`, forceloaded chunks carry a `global.forceload` marker, and carts tagged `global.ignore`, `global.ignore.pos` or `global.ignore.kill`, and players tagged `global.ignore.gui`, are left alone.

## Translations

Every chat, action bar and advancement string is defined in `src/text/*.js` as a `translate` component with its English as the fallback, so the data pack alone reads fine. The optional resource pack in `resourcepack/` carries the lang files. Zip its contents, add it to the client, and add a `<lang>.json` per language under `resourcepack/assets/train/lang/`. `npm run lang:check` fails when `src/text` and `en_us.json` drift apart, and `npm test` runs it first.

## AI Usage Disclosure

This datapack's code was developed with a big ol' plagiarism machine (Claude Code by Anthropic). No art asset files were generated using the LLM.

## License

CC0 1.0 Universal, see `LICENSE`.
