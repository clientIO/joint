module.exports = {
    geometry: {
        src: 'src/g/index.mjs',
        umd: 'build/geometry.js',
    },
    vectorizer: {
        src: 'src/V/index.mjs',
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
    plugins: {
        'joint.shapes.erd': { src: 'src/shapes/erd.mjs' },
        'joint.shapes.fsa': { src: 'src/shapes/fsa.mjs' },
        'joint.shapes.org': { src: 'src/shapes/org.mjs' },
        'joint.shapes.chess': { src: 'src/shapes/chess.mjs' },
        'joint.shapes.pn': { src: 'src/shapes/pn.mjs' },
        'joint.shapes.devs': { src: 'src/shapes/devs.mjs' },
        'joint.shapes.uml': { src: 'src/shapes/uml.mjs' },
        'joint.shapes.logic': { src: 'src/shapes/logic.mjs' },
        'joint.layout.DirectedGraph': { src: 'src/layout/DirectedGraph/DirectedGraph.mjs' }
    }
};
