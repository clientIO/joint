// `test` builds are source-mapped - coverage reports must map tests to `src/`
// `build/test/` is NOT distributed (`packages/joint-core/grunt/config/copy.js`)
module.exports = {
    geometry: {
        src: 'src/g/index.mjs',
        umd: 'build/geometry.js',
        test: 'build/test/geometry.js',
    },
    vectorizer: {
        src: 'src/V/index.mjs',
        umd: 'build/vectorizer.js',
        test: 'build/test/vectorizer.js',
    },
    joint: {
        src: 'wrappers/joint.wrapper.mjs',
        umd: 'build/joint.js', // joint + plugins + vectorizer + geometry. no header. universal module
        iife: 'build/joint.nowrap.js',  // joint + plugins + vectorizer + geometry. browser-only version
        test: 'build/test/joint.nodeps.js' // joint + plugins, no vectorizer or geometry. for unit testing
    },
    plugins: {
        'joint.shapes.standard': { src: 'src/shapes/standard.mjs' }, // don't export this namespace to a separate file
    }
};
