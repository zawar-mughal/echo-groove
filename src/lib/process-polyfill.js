// Process polyfill for browser compatibility with Node.js libraries
export const process = {
  env: {},
  version: 'v16.0.0',
  versions: {
    node: '16.0.0'
  },
  platform: 'browser',
  browser: true,
  nextTick: (fn, ...args) => {
    Promise.resolve().then(() => fn(...args));
  }
};

// Make it available globally
if (typeof window !== 'undefined') {
  window.process = process;
}
if (typeof globalThis !== 'undefined') {
  globalThis.process = process;
}
