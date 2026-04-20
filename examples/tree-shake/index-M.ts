import { V } from '@joint/core';

import { shapes } from '@joint/core';
const standard = shapes.standard;

const vel = V('<g><rect/><text/></g>');
const namespace = {
    standard: standard
};

console.log('VNode', vel.node);
console.log('Shapes', namespace);
