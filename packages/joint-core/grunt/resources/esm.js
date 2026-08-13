// `test` builds are sourcemapped so that coverage maps back to src/ instead of the
// bundle. They live in build/test/, which copy:dist excludes, so neither they nor
// their .map files can ever reach dist/ and be published.
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
        noDependencies: 'build/test/joint.nodeps.js' // joint + plugins (for unit testing)
    },
    plugins: {
        'joint.shapes.standard': { src: 'src/shapes/standard.mjs' }, // don't export this namespace to a separate file
    }
};
