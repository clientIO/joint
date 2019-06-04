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
    jointPlugins: {
        'joint.shapes.erd': {
            src: 'plugins/shapes/joint.shapes.erd.js',
            iife: 'build/joint.shapes.erd.js'
        },
        'joint.shapes.fsa': {
            src: 'plugins/shapes/joint.shapes.fsa.js',
            iife: 'build/joint.shapes.fsa.js'
        },
        'joint.shapes.org': {
            src: 'plugins/shapes/joint.shapes.org.js',
            iife: 'build/joint.shapes.org.js'
        },
        'joint.shapes.chess': {
            src: 'plugins/shapes/joint.shapes.chess.js',
            iife: 'build/joint.shapes.chess.js'
        },
        'joint.shapes.pn': {
            src: 'plugins/shapes/joint.shapes.pn.js',
            iife: 'build/joint.shapes.pn.js'
        },
        'joint.shapes.devs': {
            src: 'plugins/shapes/joint.shapes.devs.js',
            iife: 'build/joint.shapes.devs.js'
        },
        'joint.shapes.uml': {
            src: 'plugins/shapes/joint.shapes.uml.js',
            iife: 'build/joint.shapes.uml.js'
        },
        'joint.shapes.logic': {
            src: 'plugins/shapes/joint.shapes.logic.js',
            iife: 'build/joint.shapes.logic.js'
        },
        'joint.layout.DirectedGraph': {
            src: 'plugins/layout/DirectedGraph/joint.layout.DirectedGraph.js',
            iife: 'build/joint.layout.DirectedGraph.js'
        }
    }
};
