// Fixed point scale of every position, gap and speed score in the pack, UNIT scores to a block. A power of two, so a position, which is a
// double, converts without rounding, a chunk is a whole number of units, and so is half a block. 64 is a quarter of a texel and saturates
// 32 bit scores at 33.5 million blocks, past the world border at 30 million, where 1000 saturated at 2.1 million.
// u turns a distance in blocks, or a speed in blocks per tick, into units, rounded. Sources write every constant in blocks, as <%u(2.5)%>.
// Saved motion and push are a separate scale, ten thousandths, they are small numbers and never positions. Nothing here needs changing
// for the pack to work at another UNIT, only for the tests to keep their windows, a speed of 0.2 is 12.8 units at 64 and 3.2 at 16.
const UNIT = 64;
const u = (blocks) => Math.round(blocks * UNIT);

module.exports = { UNIT, u };
