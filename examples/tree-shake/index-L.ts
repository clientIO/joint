// TRY ALTERNATING BETWEEN THESE TWO OPTIONS:
/*
import { V } from '@joint/core';
import { shapes } from '@joint/core';
import { dia } from '@joint/core';
const { standard } = shapes;
*/

import V from '@joint/core/V';
import * as standard from '@joint/core/shapes/standard';
import * as dia from '@joint/core/dia';


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
