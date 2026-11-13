import { dia, g, shapes } from '../../';

const graph = new dia.Graph({}, {
    cellNamespace: shapes,
    getElementGeometry: ({ model, port }) => {
        if (port !== null) return new g.Rect(-5, -5, 10, 10);
        if (model.get('type') !== 'standard.Ellipse') return null;
        const { width, height } = model.size();
        return g.Ellipse.fromRect(new g.Rect(0, 0, width, height));
    }
});

const element = new shapes.standard.Ellipse();
const link = new shapes.standard.Link();
const line = new g.Line();

const elementGeometry: g.Shape = graph.getElementGeometry(element);
const portGeometry: g.Shape = graph.getPortGeometry(element, 'port1');
const linkEndPoint: g.Point = graph.getLinkEndPoint(link, 'source');
const linkEndPoints: [g.Point, g.Point] = graph.getLinkEndPoints(link);
const geometryIntersection: g.Point | null = element.getGeometryIntersection(line);
const portGeometryIntersection: g.Point | null = element.getPortGeometryIntersection('port1', line);
