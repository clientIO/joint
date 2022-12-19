module.exports = {
    geometry: {
        src: 'packages/core/src/g/index.mjs',
        umd: 'build/geometry.js',
    },
    vectorizer: {
        src: 'packages/core/src/V/index.mjs',
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
        'joint.shapes.basic': { src: 'packages/core/src/shapes/basic.mjs' }, // don't export this namespace to a separate file
        'joint.shapes.standard': { src: 'packages/core/src/shapes/standard.mjs' }, // don't export this namespace to a separate file
        'joint.shapes.erd': { src: 'packages/core/src/shapes/erd.mjs', export: true },
        'joint.shapes.fsa': { src: 'packages/core/src/shapes/fsa.mjs', export: true },
        'joint.shapes.org': { src: 'packages/core/src/shapes/org.mjs', export: true },
        'joint.shapes.chess': { src: 'packages/core/src/shapes/chess.mjs', export: true },
        'joint.shapes.pn': { src: 'packages/core/src/shapes/pn.mjs', export: true },
        'joint.shapes.devs': { src: 'packages/core/src/shapes/devs.mjs', export: true },
        'joint.shapes.uml': { src: 'packages/core/src/shapes/uml.mjs', export: true },
        'joint.shapes.logic': { src: 'packages/core/src/shapes/logic.mjs', export: true },
        'joint.layout.DirectedGraph': { src: 'packages/core/src/layout/DirectedGraph/DirectedGraph.mjs', export: true }
    }
};
