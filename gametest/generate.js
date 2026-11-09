// Writes the gametest data pack into .gametest/pack: one structure, environment and test instance per entry of tests.js.
// The structure is a binary NBT file, written here by hand because a data pack can't ship it as text. Key names are the 26.x ones, id
// in place of Name and lowercase properties, and DataVersion is 5023 for 26.3.
// Layout, all at z 0 and y 0: start test block x0, repeating command block x1 facing up, accept test block x4, fail test block x6.
// The start block powers the command block when the test begins and it runs every tick. The poll function it runs powers the accept block by
// placing redstone above it at ~3 ~1 ~, or the fail block at ~5 ~1 ~, relative to the command block.
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
const { gametest } = require("./tests.js");

const DATA_VERSION = 5023;

const str = (v) => { const b = Buffer.from(v, "utf8"); const h = Buffer.alloc(2); h.writeUInt16BE(b.length); return Buffer.concat([h, b]); };
const i32 = (v) => { const b = Buffer.alloc(4); b.writeInt32BE(v); return b; };
const i64 = (v) => { const b = Buffer.alloc(8); b.writeBigInt64BE(BigInt(v)); return b; };
const i8 = (v) => Buffer.from([v & 0xff]);
const tag = (type, name, payload) => Buffer.concat([i8(type), str(name), payload]);
const list = (type, payloads) => Buffer.concat([i8(type), i32(payloads.length), ...payloads]);
const compound = (fields) => Buffer.concat([...fields.map(([t, n, p]) => tag(t, n, p)), i8(0)]);

function structure(command, size) {
	const testBlock = (mode) => compound([[8, "id", str("minecraft:test_block")], [10, "properties", compound([[8, "mode", str(mode)]])]]);
	const palette = [
		compound([[8, "id", str("minecraft:air")]]),
		testBlock("start"),
		compound([[8, "id", str("minecraft:repeating_command_block")], [10, "properties", compound([[8, "conditional", str("false")], [8, "facing", str("up")]])]]),
		testBlock("accept"),
		testBlock("fail"),
	];
	const commandBlock = compound([
		[8, "id", str("minecraft:command_block")], [8, "Command", str(command)],
		[1, "auto", i8(0)], [1, "conditionMet", i8(0)], [1, "powered", i8(0)],
		[3, "SuccessCount", i32(0)], [1, "TrackOutput", i8(1)], [1, "UpdateLastExecution", i8(1)], [4, "LastExecution", i64(0)],
	]);
	const block = (x, state, nbt) => {
		const fields = [[9, "pos", list(3, [i32(x), i32(0), i32(0)])], [3, "state", i32(state)]];
		if (nbt) fields.unshift([10, "nbt", nbt]);
		return compound(fields);
	};
	const root = compound([
		[9, "size", list(3, size.map(i32))],
		[9, "entities", list(10, [])],
		[9, "blocks", list(10, [block(0, 1), block(1, 2, commandBlock), block(4, 3), block(6, 4)])],
		[9, "palette", list(10, palette)],
		[3, "DataVersion", i32(DATA_VERSION)],
	]);
	return zlib.gzipSync(Buffer.concat([i8(10), str(""), root]));
}

function generate(root) {
	const out = path.join(root, ".gametest", "pack");
	fs.rmSync(out, { recursive: true, force: true });
	const data = path.join(out, "data", "train_test");
	for (const d of ["structure", "test_environment", "test_instance"]) fs.mkdirSync(path.join(data, d), { recursive: true });
	// The scenario functions, built by mcb from gametest/mc, see run.js. Copied first, the files written below sit beside them
	const built = path.join(root, "gametest", "mc", "data");
	if (!fs.existsSync(path.join(built, "train_test", "function"))) throw new Error("gametest/mc has not been built, run gametest/run.js");
	fs.cpSync(built, path.join(out, "data"), { recursive: true });
	// Runs every tick of the test server and never in a real world, this pack is only loaded by gametest/run.js. Keeps the arena chunks of
	// every scenario forceloaded, they are at 100 64 100 and far from the structures, and counts the global clock the test windows use. Chunks
	// load in real time and the headless server ticks much faster than it generates, so the clock waits for all of them, the arena, the one
	// chunk of the chunk claim test at 3008 3004 and the far arena of the 25 million test, a window never starts before its chunks are there.
	// lib/ref clones to z up to 100 + 24
	fs.mkdirSync(path.join(data, "function"), { recursive: true });
	fs.writeFileSync(path.join(data, "function", "gt_tick.mcfunction"), [
		"execute unless loaded 100 64 100 run forceload add 90 90 160 130",
		"execute unless loaded 3010 64 3004 run forceload add 3008 3004",
		"execute unless loaded 25000000 64 100 run forceload add 24999990 90 25000060 130",
		"execute if loaded 100 64 100 if loaded 160 64 130 if loaded 3010 64 3004 if loaded 25000000 64 100 if loaded 25000060 64 130 run scoreboard players add #clock train_test 1",
		"",
	].join("\n"));
	fs.mkdirSync(path.join(out, "data", "minecraft", "tags", "function"), { recursive: true });
	fs.writeFileSync(path.join(out, "data", "minecraft", "tags", "function", "tick.json"), JSON.stringify({ values: ["train_test:gt_tick"] }));
	fs.writeFileSync(path.join(out, "pack.mcmeta"), JSON.stringify({ pack: { description: "train gametests", min_format: 121, max_format: 121 } }, null, 2));
	for (const t of gametest.tests) {
		fs.writeFileSync(path.join(data, "structure", `${t.id}.nbt`), structure(`function train_test:gt/${t.id}`, gametest.size));
		fs.writeFileSync(path.join(data, "test_environment", `${t.id}.json`), JSON.stringify({ type: "minecraft:all_of", definitions: [] }));
		fs.writeFileSync(path.join(data, "test_instance", `${t.id}.json`), JSON.stringify({
			type: "minecraft:block_based", environment: `train_test:${t.id}`, structure: `train_test:${t.id}`,
			max_ticks: t.start + t.last + gametest.margin, setup_ticks: 1,
		}));
	}
	return out;
}

module.exports = { generate };
if (require.main === module) console.log("wrote", generate(path.resolve(__dirname, "..")));
