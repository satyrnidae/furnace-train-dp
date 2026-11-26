// Shared helpers for text components. Every module in this folder exports finished JSON strings, and the .mcb sources splice them in
// with <%name.key%>. Each translate has its English as the fallback, so the pack reads fine without the resource pack, and the
// resource pack lang files carry the same keys, see scripts/check-lang.js.
const tr = (key, fallback, ...args) => ({ translate: key, fallback, ...(args.length ? { with: args } : {}) });
const colored = (component, color) => ({ ...component, color });

// A translated message with no arguments, the common case for status lines
const say = (key, fallback, color) => JSON.stringify(color ? colored(tr(key, fallback), color) : tr(key, fallback));

module.exports = { tr, colored, say };
