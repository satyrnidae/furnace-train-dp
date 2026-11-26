// Fails when the translate components in src/text and the en_us lang files in resourcepack drift apart. Every key used has to be in
// the lang file with the same text as its fallback, and a lang key nothing uses is stale.
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const used = new Map();
function walk(node) {
	if (Array.isArray(node)) return node.forEach(walk);
	if (!node || typeof node !== "object") return;
	if (typeof node.translate === "string") used.set(node.translate, node.fallback);
	Object.values(node).forEach(walk);
}
for (const file of fs.readdirSync(path.join(root, "src", "text"))) {
	if (file === "lib.js" || !file.endsWith(".js")) continue;
	const exported = require(path.join(root, "src", "text", file));
	for (const group of Object.values(exported)) for (const value of Object.values(group)) walk(JSON.parse(value));
}

const langs = {};
for (const ns of fs.readdirSync(path.join(root, "resourcepack", "assets"))) {
	const file = path.join(root, "resourcepack", "assets", ns, "lang", "en_us.json");
	if (fs.existsSync(file)) Object.assign(langs, JSON.parse(fs.readFileSync(file, "utf8")));
}

let errors = 0;
for (const [key, fallback] of used) {
	if (!(key in langs)) { console.error(`missing in en_us.json: ${key}`); errors += 1; }
	else if (langs[key] !== fallback) { console.error(`differs from the fallback: ${key}`); errors += 1; }
}
for (const key of Object.keys(langs)) if (!used.has(key)) { console.error(`unused in en_us.json: ${key}`); errors += 1; }
console.log(errors ? `${errors} lang problems` : `${used.size} lang keys in sync`);
process.exit(errors ? 1 : 0);
