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
        //TODO v.talas remove
        iife: 'build/iife/geometry.js',
        umd: 'build/geometry.js',
    },
    vectorizer: {
        src: 'src/vectorizer.js',
        iife: 'build/iife/vectorizer.js',
        umd: 'build/vectorizer.js',
    },
    joint: {
        src: 'wrappers/joint.wrapper.mjs',
        umd: 'build/joint.js',
        iife: 'build/joint.nowrap.js'
    },
    jointCore: {
        src: 'wrappers/joint.core.wrapper.mjs',
        umd: 'build/joint.core.js',
        iife: 'build/iife/joint.core.js',
    },
};

module.exports = Object.assign(
    modules,
    { src: getAllSources(modules) }
);
