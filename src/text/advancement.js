const { say } = require('./lib');

// The shared global nodes carry the same keys in every pack by satyrnidae
module.exports = {
  advText: {
    globalRoot: say('global.advancement.root.title', 'Installed Datapacks'),
    authorTitle: say('global.advancement.satyrnidae.title', 'satyrnidae'),
    authorDescription: say('global.advancement.satyrnidae.description', 'Datapacks Created by satyrnidae!'),
    rootTitle: say('train.advancement.root.title', 'Furnace Train Carts', 'gold'),
    rootDescription: say('train.advancement.root.description', 'Attach minecarts together in trains!', 'yellow'),
    chainGangTitle: say('train.advancement.chain_gang.title', 'Chain Gang'),
    chainGangDescription: say('train.advancement.chain_gang.description', 'Attach two carts with a chain'),
  },
};
