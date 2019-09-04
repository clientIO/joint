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
        'joint.shapes.basic': { src: 'src/shapes/basic.mjs' }, // don't export this namespace to a separate file
        'joint.shapes.standard': { src: 'src/shapes/standard.mjs' }, // don't export this namespace to a separate file
        'joint.shapes.erd': { src: 'src/shapes/erd.mjs', export: true },
        'joint.shapes.fsa': { src: 'src/shapes/fsa.mjs', export: true },
        'joint.shapes.org': { src: 'src/shapes/org.mjs', export: true },
        'joint.shapes.chess': { src: 'src/shapes/chess.mjs', export: true },
        'joint.shapes.pn': { src: 'src/shapes/pn.mjs', export: true },
        'joint.shapes.devs': { src: 'src/shapes/devs.mjs', export: true },
        'joint.shapes.uml': { src: 'src/shapes/uml.mjs', export: true },
        'joint.shapes.logic': { src: 'src/shapes/logic.mjs', export: true },
        'joint.layout.DirectedGraph': { src: 'src/layout/DirectedGraph/DirectedGraph.mjs', export: true }
    }
};
