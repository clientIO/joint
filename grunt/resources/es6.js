const getAllSources = function(modules) {
    return Object.keys(modules).reduce((res, key) => {
        if (key !== 'src') {
            res.push(modules[key].src)
        }
        return res;
    }, [])
};

const modules = {
    config: {
        src: 'src/config.js',
        iife: 'build/iife/config.js',
    },
    geometry: {
        src: 'src/geometry.js',
        iife: 'build/iife/geometry.js',
    },
    vectorizer: {
        src: 'src/vectorizer.js',
        iife: 'build/iife/vectorizer.js',
    },
    util: {
        src: 'src/util.js',
        iife: 'build/iife/util.js',
    },
    graph: {
        src: 'src/graph.js',
        iife: 'build/iife/graph.js',
    },
    ports: {
        src: 'src/ports.js',
        iife: 'build/iife/ports.js',
    },
};

module.exports = Object.assign(
    modules,
    { src: getAllSources(modules) }
);
