const enabled = (process.env.DEBUG_LOG || 'false').toLowerCase() === 'true';
const breakEnabled = (process.env.DEBUG_BREAK || 'false').toLowerCase() === 'true';

function dlog(...args) {
  if (enabled) {
    const ts = new Date().toISOString();
    console.log('[DEBUG]', ts, ...args);
  }
}

function dbreak() {
  if (breakEnabled) {
    debugger;
  }
}

module.exports = { dlog, dbreak };
