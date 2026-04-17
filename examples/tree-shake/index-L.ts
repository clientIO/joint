import { V } from '@joint/core';

/* subpath import: */
import * as standard from '@joint/core/shapes/standard';
import * as dia from '@joint/core/dia';

/* equivalent @joint/core import: */
//import { shapes } from '@joint/core';
//import { dia } from '@joint/core';
//const { standard } = shapes;

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
