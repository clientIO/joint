// Jest preset for testing JointJS: it installs `@joint/mock-svg` and makes the
// `@joint/*` packages transformable.
//
// Jest shallow-merges a preset *under* the consumer's own config, so every
// value here is a default they can still override - see the note on
// `transformIgnorePatterns` below, where that matters.
//
// `setupFiles` rather than `setupFilesAfterEnv`: the mocks patch the
// environment's SVG globals, and they need to be in place before the test
// framework - and anything a test file imports at module scope - starts
// looking at them.
//
// `testEnvironment` is pinned because the mocks require a DOM: they read
// `globalThis.SVGSVGElement.prototype`, which does not exist under the `node`
// environment. Jest 28+ does not bundle `jest-environment-jsdom`, so consumers
// on those versions install it themselves; it is a peer dependency here rather
// than a dependency so that the version stays theirs to choose.
//
// `transformIgnorePatterns` is the half nobody guesses. Jest does not transform
// `node_modules`, the `@joint/*` packages ship ES modules, and so a test that
// imports one dies with `SyntaxError: Unexpected token 'export'` before any
// mock is reached. The pattern below is Jest's usual behaviour plus a single
// exception, so only `@joint/*` becomes transformable and every other
// dependency is left alone.
//
// The trailing slash belongs *inside* the lookahead. `node_modules/(?!@joint)/`
// - the form usually copied around - requires a literal `/` right after the
// lookahead, so it matches no real path at all: it silently empties the ignore
// list and transforms the whole of `node_modules`. That works, slowly, and
// hides the mistake.
//
// NOTE: it is one setting, not a merge. A consumer who sets
// `transformIgnorePatterns` themselves - for some other ESM dependency -
// replaces this array wholesale and silently loses the `@joint` exception. They
// have to carry it themselves:
//
//     transformIgnorePatterns: ['node_modules/(?!@joint/|some-other-esm-dep/)']
module.exports = {
    testEnvironment: 'jsdom',
    setupFiles: [require.resolve('@joint/mock-svg')],
    transformIgnorePatterns: ['node_modules/(?!@joint/)'],
};
