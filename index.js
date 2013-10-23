// These are all the exports for the NodeJS environment.
// The idea is that JointJS can be used exactly the same way in the browser and also in Node.

module.exports = {

    dia: {
        Graph: require('./src/joint.dia.graph').Graph,
        Link: require('./src/joint.dia.link').Link,
        Element: require('./src/joint.dia.element').Element
    },
    util: require('./src/core').util,
    shapes: require('./plugins/shapes')
};
