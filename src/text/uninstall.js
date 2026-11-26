const { say } = require('./lib');

module.exports = {
  uninstallText: {
    start: say('train.uninstall.start', 'Furnace Minecart Trains: uninstalling'),
    manual: say('train.uninstall.manual', "Remove the data pack folder or zip from the world's datapacks folder, it could not be disabled by name", 'yellow'),
    done: say('train.uninstall.done', 'Furnace Minecart Trains: uninstalled', 'green'),
  },
};
