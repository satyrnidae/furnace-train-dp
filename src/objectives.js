// Every objective of the pack by the module that owns it. A module adds its own in its load function and removes them in its uninstall
// function, both from this one list, so a new objective can't be added without its removal.
module.exports = {
	objectives: {
		link: ["id", "prev", "sel", "len"],
		follow: ["strain", "lost", "lmx", "lmz", "wait", "cdir", "cgap", "cdet", "lpx", "lpz", "lpt", "lvx", "lvz"],
		chain: ["ox", "oy", "oz"],
		head: ["halt", "smx", "smz", "spx", "spz"],
		sample: ["ppx", "ppz", "svx", "svz", "pvx", "pvz", "dir"],
		avoid: ["gap", "chk", "tdir"],
		chunks: ["cgen", "cpres"],
		shared: ["tmp", "const"],
	},
};
