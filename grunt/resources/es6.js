module.exports = {
    geometry: {
        src: 'src/geometry.js',
        umd: 'build/geometry.js',
    },
    vectorizer: {
        src: 'src/vectorizer.js',
        iife: 'build/iife/vectorizer.js',
        umd: 'build/vectorizer.js',
    },
    joint: {
        src: 'wrappers/joint.wrapper.mjs',
        umd: 'build/joint.js', // joint + plugins + vectorizer + geometry. no header. universal module
        iife: 'build/joint.nowrap.js',  // joint + plugins + vectorizer + geometry. browser-only version
        noDependencies: 'build/joint.nodeps.js' // joint + plugins (for unit testing)
    },
    jointCore: {
        src: 'wrappers/joint.core.wrapper.mjs',
        umd: 'build/joint.core.js', // joint + vectorizer + geometry. universal module
    },
};
