import * as joint from '../../build/esm/core';
import {V as vectorizer} from '../../build/esm/vectorizer';
import * as geometry from '../../build/esm/geometry';

import { Cell } from '../../src/cell';

console.log(joint);
console.log(joint.util.defaults({ a: 1 }, { b: 2 }));

console.log(joint.V('text'));
console.log(vectorizer('text'));

console.log(geometry);
console.log(geometry.Rect());
console.log(joint.g.Rect());

joint.util.breakText('text text text text text text text ', { width: 50, height: 50 });
