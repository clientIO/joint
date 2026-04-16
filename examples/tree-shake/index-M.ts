// TRY ALTERNATING BETWEEN THESE TWO OPTIONS:
/*
import { V } from '@joint/core';
import { shapes } from '@joint/core';
const { standard } = shapes;
*/

import V from '@joint/core/V';
import * as standard from '@joint/core/shapes/standard';


const vel = V('<g><rect/><text/></g>');
const namespace = {
    standard: standard
};

console.log('VNode', vel.node);
console.log('Shapes', namespace);
