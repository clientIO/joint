// Typescript sanity check
import * as joint from '../../build/joint';

const graph = new joint.dia.Graph;

const rectangle = new joint.shapes.standard.Rectangle();

graph.addCells([
    rectangle,
    new joint.shapes.standard.Circle(),
    new joint.shapes.standard.Ellipse(),
    new joint.shapes.standard.Path(),
    new joint.shapes.standard.Polygon(),
    new joint.shapes.standard.Polyline(),
    new joint.shapes.standard.Image(),
    new joint.shapes.standard.BorderedImage(),
    new joint.shapes.standard.EmbeddedImage(),
    new joint.shapes.standard.InscribedImage(),
    new joint.shapes.standard.HeaderedRectangle(),
    new joint.shapes.standard.Circle(),
    new joint.shapes.standard.Ellipse(),
    new joint.shapes.standard.Link(),
    new joint.shapes.standard.DoubleLink(),
    new joint.shapes.standard.ShadowLink(),
]);

// `cells` attribute is a collection of cells
const cell = graph.get('cells').at(0);
cell.getBBox().inflate(5);

// ModelSetOptions
graph.set('test', true, { dry: true });
rectangle.set('test', true, { silent: true, customOption: true });

// a child inherits attributes from `dia.Element`
const cylinder = new joint.shapes.standard.Cylinder({ z: 0 });
cylinder.set({ position: { x: 4, y: 5 }});
cylinder.set('z', cylinder.attributes.z + 1);

