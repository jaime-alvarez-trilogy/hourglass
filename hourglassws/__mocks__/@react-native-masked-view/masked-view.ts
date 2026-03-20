// Mock for @react-native-masked-view/masked-view — Jest/node environment
// Renders MaskedView as a host element so render tree assertions work.

const React = require('react');

module.exports = {
  __esModule: true,
  default: ({ children, maskElement }: any) =>
    React.createElement('MaskedView', { maskElement }, children),
};
