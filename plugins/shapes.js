// This file must be maintained in order for the joint.dia.graph.js to be useable in the NodeJS environment.
// Edit this file whenever a new shape file is added or removed!

module.exports = {

    basic: require('./joint.shapes.basic'),
    erd: require('./joint.shapes.erd'),
    pn: require('./joint.shapes.pn'),
    chess: require('./joint.shapes.chess'),
    fsa: require('./joint.shapes.fsa'),
    uml: require('./joint.shapes.uml'),
    devs: require('./joint.shapes.devs'),
    org: require('./joint.shapes.org')
};