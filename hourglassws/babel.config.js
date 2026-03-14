module.exports = function (api) {
  // Cache based on environment so test/non-test get different configs.
  // nativewind/babel is excluded in test env (see below).
  const isTest = api.env('test') || process.env.JEST_WORKER_ID !== undefined;
  api.cache.using(() => String(isTest));

  return {
    // nativewind/babel returns { plugins: [...] } — a preset-shaped object, not a plugin.
    // Must go in presets. Excluded in test env where it returns invalid null entries.
    presets: isTest ? ['babel-preset-expo'] : ['babel-preset-expo', 'nativewind/babel'],
  };
};
