// Typescript sanity check
import * as joint from '../../build/joint';

const graph = new joint.dia.Graph;

const element = new joint.shapes.standard.Rectangle();

graph.addCells([element]);

// ModelSetOptions
graph.set('test', true, { dry: true });
element.set('test', true, { silent: true, customOption: true });

const cylinder = new joint.shapes.standard.Cylinder({ z: 0 });
cylinder.set({ position: { x: 4, y: 5 }});
cylinder.set('z', cylinder.attributes.z + 1);

