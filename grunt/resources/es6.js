const getAllSources = function(modules) {
    return Object.keys(modules).reduce((res, key) => {
        if (key !== 'src') {
            res.push(modules[key].src)
        }
        return res;
    }, [])
};

const modules = {
    geometry: {
        src: 'src/geometry.js',
        iife: 'build/iife/geometry.js',
        umd: 'build/geometry.js',
    },
    vectorizer: {
        src: 'src/vectorizer.js',
        iife: 'build/iife/vectorizer.js',
        umd: 'build/vectorizer.js',
    },
    joint: {
        src: 'joint.mjs',
        umd: 'build/joint.js',
        iife: 'build/iife/joint.js'
    },
    jointCore: {
        src: 'wrappers/joint.core.js',
        iife: 'build/iife/joint.core.js',
    },
};

module.exports = Object.assign(
    modules,
    { src: getAllSources(modules) }
);
