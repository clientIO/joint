// Typescript sanity check
import * as joint from '../../build/joint';

const graph = new joint.dia.Graph;

const element = new joint.shapes.standard.Rectangle();

graph.addCells([element]);

// ModelSetOptions
graph.set('test', true, { dry: true });
element.set('test', true, { silent: true, customOption: true });
