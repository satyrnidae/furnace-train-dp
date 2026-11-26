// Every chain item has a block of the same id. One list for the coupler tag and the chain display, so they can't drift apart.
// iron_chain is checked, the copper family is from memory and a wrong id fails the load of the generated state functions.
const chains = [
	"iron_chain",
	"copper_chain",
	"exposed_copper_chain",
	"weathered_copper_chain",
	"oxidized_copper_chain",
	"waxed_copper_chain",
	"waxed_exposed_copper_chain",
	"waxed_weathered_copper_chain",
	"waxed_oxidized_copper_chain",
];

module.exports = { chains };
