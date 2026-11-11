// Downloads the Mojang server jar for a version into .gametest/server and checks its SHA-1 against the manifest.
// Usage: node gametest/fetch-server.js [version]. Default version is 26.3. Hosts: piston-meta.mojang.com for the manifest, and whatever
// host the manifest names for the jar, piston-data.mojang.com. The jar needs Java 25 for 26.x.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

async function main() {
	const version = process.argv[2] || "26.3";
	const dir = path.resolve(__dirname, "..", ".gametest", "server");
	fs.mkdirSync(dir, { recursive: true });
	const manifest = await (await fetch("https://piston-meta.mojang.com/mc/game/version_manifest_v2.json")).json();
	const entry = manifest.versions.find((v) => v.id === version);
	if (!entry) throw new Error(`version ${version} is not in the Mojang manifest`);
	const server = (await (await fetch(entry.url)).json()).downloads.server;
	console.log(`downloading ${server.url}, ${server.size} bytes`);
	const bytes = Buffer.from(await (await fetch(server.url)).arrayBuffer());
	const sha1 = crypto.createHash("sha1").update(bytes).digest("hex");
	if (sha1 !== server.sha1) throw new Error(`sha1 mismatch, got ${sha1}, expected ${server.sha1}`);
	fs.writeFileSync(path.join(dir, "server.jar"), bytes);
	console.log(`wrote ${path.join(dir, "server.jar")}, sha1 ${sha1} verified`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
