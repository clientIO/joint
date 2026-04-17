import { V } from '@joint/core';

/* subpath import: */
import * as standard from '@joint/core/shapes/standard';

/* equivalent @joint/core import: */
//import { shapes } from '@joint/core';
//const { standard } = shapes;

const vel = V('<g><rect/><text/></g>');
const namespace = {
    standard: standard
};

console.log('VNode', vel.node);
console.log('Shapes', namespace);
