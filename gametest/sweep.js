// Runs one test, or a filter, once per trace phase 0..19 and prints which phases fail. A test that fails on some phases and not others
// depends on when its head happens to trace, see GAMETEST_PHASE in gametest/generate.js. Run order of the full suite changes the phase, so
// this is the repeatable version of a flake.
// Usage: GAMETEST_TESTS=train_test:t16_cold_start node gametest/sweep.js [phases, default 20]
// Environment as in gametest/run.js
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const phases = Number(process.argv[2] || 20);
const failing = [];
for (let phase = 0; phase < phases; phase++) {
	const r = spawnSync(process.execPath, [path.join(__dirname, "run.js")], { encoding: "utf8", env: { ...process.env, GAMETEST_PHASE: String(phase) }, maxBuffer: 256 * 1024 * 1024 });
	const out = `${r.stdout || ""}${r.stderr || ""}`;
	const fails = [...out.matchAll(/^FAIL (\S+)/gm)].map((m) => m[1]);
	const why = [...out.matchAll(/gt why (\S+)/g)].map((m) => m[1]);
	console.log(`phase ${String(phase).padStart(2)} ${fails.length ? `FAIL ${fails.join(" ")}  ${[...new Set(why)].join(" ")}` : "ok"}`);
	if (fails.length) failing.push(phase);
}
console.log(failing.length ? `failed on phases ${failing.join(", ")}` : "passed on every phase");
process.exit(failing.length ? 1 : 0);
