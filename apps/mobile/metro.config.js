const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @xenova/transformers uses import.meta which Metro doesn't support.
// Stub it out — the real provider will be swapped in post-MVP via a
// native module or a web worker approach.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@xenova/transformers') {
    return {
      filePath: require.resolve('./src/stubs/xenovaStub.js'),
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
