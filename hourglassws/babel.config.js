module.exports = function (api) {
  // Cache based on environment so test/non-test get different configs.
  // nativewind/babel is excluded in test env (see below).
  const isTest = api.env('test') || process.env.JEST_WORKER_ID !== undefined;
  api.cache.using(() => String(isTest));

  return {
    presets: ['babel-preset-expo'],
    // nativewind/babel returns { plugins: [null, ...] } in the jest/node environment,
    // which crashes babel validation. Exclude it during test runs.
    // NativeWind className transforms are not needed in tests — source-file analysis is used.
    plugins: isTest ? [] : ['nativewind/babel'],
  };
};
