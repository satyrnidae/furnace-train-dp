const { say } = require('./lib');

// Action bar lines of the coupler and the shears
module.exports = {
  linkText: {
    first: say('train.link.first', 'Coupler: click the cart behind it'),
    coupled: say('train.link.coupled', 'Coupled'),
    cancelled: say('train.link.cancelled', 'Coupler: cancelled'),
    uncoupled: say('train.link.uncoupled', 'Uncoupled'),
    nothing: say('train.link.nothing', 'Nothing to uncouple'),
  },
};
