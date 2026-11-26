module.exports = {
	// 26.x pack.mcmeta has no pack_format, so mcb can't sniff the folder naming. 121 = 26.3
	formatVersion: 121,
	generatedDirName: "__generated__",
	internalScoreboardName: "train.internal",
	// eq temporaries and constants, named here so the pack owns them and does not share mcb.eq.* with other packs
	eqVarScoreboardName: "train.eq.var",
	eqConstScoreboardName: "train.eq.const",
	header: "# Furnace Minecart Trains, data pack prototype\n# Built using mc-build (https://github.com/mc-build/mc-build)",
};
