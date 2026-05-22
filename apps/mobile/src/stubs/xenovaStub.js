// Stub for @xenova/transformers in the Metro bundle.
// The real on-device NLP will run via a native module or web worker (post-MVP).
// For MVP, analysis falls back to manual mood selection if no provider is registered.
module.exports = {
  pipeline: () => {
    throw new Error('@xenova/transformers is not available in the mobile bundle. Register an alternative provider.');
  },
};
