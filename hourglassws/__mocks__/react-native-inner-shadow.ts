// Mock for react-native-inner-shadow — Jest/node environment
// Renders InnerShadow as a host element so render tree assertions work.

const React = require('react');

module.exports = {
  __esModule: true,
  InnerShadow: ({ children, ...props }: any) =>
    React.createElement('InnerShadow', props, children),
};
