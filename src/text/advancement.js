const { say } = require('./lib');

// The shared global nodes carry the same keys in every pack by satyrnidae
module.exports = {
  advText: {
    globalRoot: say('global.advancement.root.title', 'Installed Datapacks'),
    authorTitle: say('global.advancement.satyrnidae.title', 'satyrnidae'),
    authorDescription: say('global.advancement.satyrnidae.description', 'Datapacks Created by satyrnidae!'),
    rootTitle: say('train.advancement.root.title', 'Furnace Minecart Trains', 'gold'),
    rootDescription: say('train.advancement.root.description', 'Chain furnace minecarts into self-driving trains!', 'yellow'),
  },
};
