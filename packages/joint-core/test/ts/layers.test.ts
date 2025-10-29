import { dia } from '../../';

const graph = new dia.Graph();

const layer1 = new dia.GraphLayer({ id: 'layer1', layerAttribute: 1 });

graph.addLayer(layer1);
graph.addLayer({ id: 'layer2', layerAttribute: 2 }, { flag: 1 });
graph.moveLayer('layer1', { before: 'cells' });
graph.moveLayer(layer1, { index: 2,flag: 1 });
graph.removeLayer('layer2');
graph.removeLayer(layer1, { flag: 1});
