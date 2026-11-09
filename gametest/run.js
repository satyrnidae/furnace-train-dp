// TODO: Manual review needed. Please delete this line after review.
// Runs every test instance headless against a fresh build. Steps: mcb build, generate the gametest pack, assemble a packs folder next to
// the server jar, run net.minecraft.gametest.Main, print each result, exit with the number of failures.
// Environment: GAMETEST_SERVER, a folder holding server.jar, default .gametest/server, see gametest/fetch-server.js.
//              GAMETEST_JAVA, a Java 25 executable, default java on the path.
//              GAMETEST_TESTS, a test filter, default train_test:*.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { generate } = require("./generate.js");

const root = path.resolve(__dirname, "..");
const server = path.resolve(process.env.GAMETEST_SERVER || path.join(root, ".gametest", "server"));
const java = process.env.GAMETEST_JAVA || "java";
const filter = process.env.GAMETEST_TESTS || "train_test:*";

function run(cmd, args, cwd) {
	const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
	if (r.error) throw r.error;
	return r.status;
}

if (!fs.existsSync(path.join(server, "server.jar"))) {
	console.error(`no server.jar in ${server}, run node gametest/fetch-server.js or set GAMETEST_SERVER`);
	process.exit(-1);
}
// mcb exits 0 on a compile error and keeps the last good output, so the build output is read for it, a stale pack would pass or fail for the wrong reasons
const build = spawnSync(process.execPath, [path.join(root, "node_modules", "mc-build", "dist", "mcb.js"), "build"], { cwd: root, encoding: "utf8" });
process.stdout.write(build.stdout || "");
process.stderr.write(build.stderr || "");
if (build.status !== 0 || /(Compiler|Parser|Syntax) ?Error/i.test(`${build.stdout}${build.stderr}`)) {
	console.error("build failed, not running tests");
	process.exit(-1);
}
const gametestPack = generate(root);

const packs = path.join(server, "packs");
fs.rmSync(packs, { recursive: true, force: true });
fs.mkdirSync(path.join(packs, "train"), { recursive: true });
fs.copyFileSync(path.join(root, "pack.mcmeta"), path.join(packs, "train", "pack.mcmeta"));
fs.cpSync(path.join(root, "data"), path.join(packs, "train", "data"), { recursive: true });
fs.cpSync(gametestPack, path.join(packs, "gametest"), { recursive: true });

const report = path.join(server, "report.xml");
fs.rmSync(report, { force: true });
const status = run(java, ["-DbundlerMainClass=net.minecraft.gametest.Main", "-jar", "server.jar", "--packs", "./packs", "--universe", "./uni", "--report", "./report.xml", "--tests", filter], server);

if (!fs.existsSync(report)) { console.error(`no report written, exit ${status}`); process.exit(status === 0 ? -1 : status); }
const xml = fs.readFileSync(report, "utf8");
const cases = [...xml.matchAll(/<testcase [^>]*name="([^"]+)"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/g)];
let failures = 0;
for (const [, name, body] of cases) {
	const failure = body && body.match(/<failure message="([^"]*)"/);
	if (failure) failures += 1;
	console.log(`${failure ? "FAIL" : "PASS"} ${name}${failure ? `  ${failure[1]}` : ""}`);
}
console.log(`${cases.length - failures}/${cases.length} passed`);
process.exit(failures || (status === 0 ? 0 : status));
