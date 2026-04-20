import {
    V,
    shapes,
    dia,
} from '@joint/core';
const standard = shapes.standard;

const vel = V('<g><rect/><text/></g>');
const namespace = {
    standard: standard
};
const graph = new dia.Graph({}, {
    cellNamespace: namespace,
});
const paper = new dia.Paper({
    model: graph,
});

console.log('VNode', vel.node);
console.log('Shapes', namespace);
console.log('Paper', paper);
