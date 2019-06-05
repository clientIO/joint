module.exports = {
    geometry: {
        src: 'src/g/index.mjs',
        umd: 'build/geometry.js',
    },
    vectorizer: {
        src: 'src/Vectorizer.mjs',
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
            src: 'src/shapes/erd.mjs',
            iife: 'build/joint.shapes.erd.js'
        },
        'joint.shapes.fsa': {
            src: 'src/shapes/fsa.mjs',
            iife: 'build/joint.shapes.fsa.js'
        },
        'joint.shapes.org': {
            src: 'src/shapes/org.mjs',
            iife: 'build/joint.shapes.org.js'
        },
        'joint.shapes.chess': {
            src: 'src/shapes/chess.mjs',
            iife: 'build/joint.shapes.chess.js'
        },
        'joint.shapes.pn': {
            src: 'src/shapes/pn.mjs',
            iife: 'build/joint.shapes.pn.js'
        },
        'joint.shapes.devs': {
            src: 'src/shapes/devs.mjs',
            iife: 'build/joint.shapes.devs.js'
        },
        'joint.shapes.uml': {
            src: 'src/shapes/uml.mjs',
            iife: 'build/joint.shapes.uml.js'
        },
        'joint.shapes.logic': {
            src: 'src/shapes/logic.mjs',
            iife: 'build/joint.shapes.logic.js'
        },
        'joint.layout.DirectedGraph': {
            src: 'src/layout/DirectedGraph/DirectedGraph.mjs',
            iife: 'build/joint.layout.DirectedGraph.js'
        }
    }
};
