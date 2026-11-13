import { dia, g, shapes } from '@joint/core';
import { defaultElementGeometry, getPortOutlineWidth } from '../element-geometry';
import { elementPort, elementPorts, type ElementPort } from '../element-ports';
import { boundaryPoint } from '../connection-points';
import { GraphStore } from '../../store/graph-store';

const TRIANGLE_PATH = 'M -10 -10 L 10 0 L -10 10 Z';

// `@joint/mock-svg` counts a node as part of the render tree only when its mocked
// `getBBox()` is non-empty, and the mock is always empty. The paper suites render
// links, so every node is treated as rendered.
let checkVisibilitySpy: jest.SpyInstance;
beforeEach(() => {
  checkVisibilitySpy = jest.spyOn(SVGElement.prototype, 'checkVisibility').mockReturnValue(true);
});
afterEach(() => {
  checkVisibilitySpy.mockRestore();
});

function createElement(ports?: dia.Element.Attributes['ports']): dia.Element {
  return new shapes.standard.Rectangle({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
    ports,
  });
}

function bboxOf(geometry: g.Shape | null): string | undefined {
  return geometry && 'bbox' in geometry ? geometry.bbox()?.toString() : undefined;
}

describe('presets / element-geometry', () => {
  it('uses the default geometry for the element', () => {
    const element = createElement();
    expect(defaultElementGeometry({ model: element, port: null })).toBeNull();
  });

  it('returns an ellipse for an ellipse port', () => {
    const element = createElement(elementPorts({ out: { cx: 100, cy: 50, width: 20, height: 10 } }));
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(geometry?.type).toBe(g.types.Ellipse);
    expect(bboxOf(geometry)).toBe('-10@-5 10@5');
  });

  it('returns a rectangle for a rect port', () => {
    const element = createElement(elementPorts({ out: { shape: 'rect', width: 20, height: 10 } }));
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(geometry?.type).toBe(g.types.Rect);
    expect(geometry?.toString()).toBe('-10@-5 10@5');
  });

  it('returns a polygon for a path port', () => {
    const element = createElement(elementPorts({ out: { shape: TRIANGLE_PATH } }));
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(geometry?.type).toBe(g.types.Polygon);
    expect(bboxOf(geometry)).toBe('-10@-10 10@10');
  });

  it('supports arcs, relative and shorthand path commands', () => {
    const paths = [
      'M -10 0 A 10 10 0 1 0 10 0 A 10 10 0 1 0 -10 0 Z',
      'm -10 -10 l 20 0 l 0 20 l -20 0 z',
      'M -10 -10 H 10 V 10 H -10 Z',
      'M -10 10 Q 0 -30 10 10 Z',
    ];
    for (const path of paths) {
      const element = createElement(elementPorts({ out: { shape: path } }));
      const geometry = defaultElementGeometry({ model: element, port: 'out' });
      expect(geometry?.type).toBe(g.types.Polygon);
    }
  });

  it('keeps every subpath of a path port', () => {
    const element = createElement(elementPorts({
      out: { shape: 'M -20 -5 L -10 -5 L -10 5 L -20 5 Z M 10 -5 L 20 -5 L 20 5 L 10 5 Z' },
    }));
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(geometry?.type).toBe(g.types.Path);
    expect(bboxOf(geometry)).toBe('-20@-5 20@5');
    const line = new g.Line(new g.Point(15, 20), new g.Point(15, 0));
    expect(line.intersect(geometry as g.Path)).not.toBeNull();
  });

  it('uses the markup of the port item instead of the markup of its group', () => {
    const element = createElement({
      groups: { main: { position: { name: 'right' }, ...elementPort({ width: 20, height: 20 }) } },
      items: [{ id: 'out', group: 'main', markup: [{ tagName: 'circle', selector: 'custom' }] }],
    });
    expect(defaultElementGeometry({ model: element, port: 'out' })).toBeNull();
  });

  it('merges the attributes of the port item over the attributes of its group', () => {
    const element = createElement({
      groups: { main: { position: { name: 'right' }, ...elementPort({ width: 20, height: 20 }) } },
      items: [{ id: 'out', group: 'main', attrs: { port: { rx: 15 } } }],
    });
    expect(bboxOf(defaultElementGeometry({ model: element, port: 'out' }))).toBe('-15@-10 15@10');
  });

  it('reads the outline width from the port and from its group', () => {
    const element = createElement({
      groups: { main: { position: { name: 'right' }, ...elementPort({ outlineWidth: 4 }) } },
      items: [
        { id: 'a', group: 'main' },
        { id: 'b', group: 'main', attrs: { port: { style: { strokeWidth: 8 } } } },
        { id: 'c' },
      ],
    });
    expect(getPortOutlineWidth(element, 'a')).toBe(4);
    expect(getPortOutlineWidth(element, 'b')).toBe(8);
    expect(getPortOutlineWidth(element, 'c')).toBe(0);
    expect(getPortOutlineWidth(element, 'unknown')).toBe(0);
    expect(getPortOutlineWidth(createElement(elementPorts({ out: {} })), 'out')).toBe(0);
    expect(getPortOutlineWidth(createElement(), 'out')).toBe(0);
    expect(getPortOutlineWidth(createElement(elementPorts({ out: { outlineWidth: -4 } })), 'out')).toBe(0);
  });

  it('drops the cached geometry when a port is changed with portProp()', () => {
    const element = createElement(elementPorts({ out: { width: 20, height: 10 } }));
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    element.portProp('out', 'attrs/port/rx', 30);
    const nextGeometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(nextGeometry).not.toBe(geometry);
    expect(bboxOf(nextGeometry)).toBe('-30@-5 30@5');
  });

  it('reads the shape from the port group', () => {
    const element = createElement({
      groups: { main: { position: { name: 'right' }, ...elementPort({ width: 20, height: 20 }) } },
      items: [{ id: 'out', group: 'main' }],
    });
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(geometry?.type).toBe(g.types.Ellipse);
    expect(bboxOf(geometry)).toBe('-10@-10 10@10');
  });

  it('uses the default geometry for a port with any other markup', () => {
    const element = createElement({
      groups: { main: { position: { name: 'right' }, size: { width: 20, height: 10 } } },
      items: [{ id: 'out', group: 'main' }],
    });
    expect(defaultElementGeometry({ model: element, port: 'out' })).toBeNull();
  });

  it('uses the default geometry for a port with an invalid path', () => {
    const element = createElement(elementPorts({ out: { shape: 'not a path', width: 20, height: 10 } }));
    expect(defaultElementGeometry({ model: element, port: 'out' })).toBeNull();
  });

  it('uses the default geometry for a port body without the shape attributes', () => {
    const bodies = ['ellipse', 'rect', 'path', 'circle'];
    for (const tagName of bodies) {
      const element = createElement({
        items: [{ id: 'out', markup: [{ tagName, selector: 'port' }] }],
      });
      expect(defaultElementGeometry({ model: element, port: 'out' })).toBeNull();
    }
  });

  it('uses the default geometry for an empty path and for unknown ports', () => {
    const element = createElement(elementPorts({ out: { shape: '' } }));
    expect(defaultElementGeometry({ model: element, port: 'out' })).toBeNull();
    expect(defaultElementGeometry({ model: element, port: 'unknown' })).toBeNull();
    expect(defaultElementGeometry({ model: createElement(), port: 'out' })).toBeNull();
  });

  it('caches the port geometry until the ports change', () => {
    const element = createElement(elementPorts({ out: { width: 20, height: 10 } }));
    const geometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(defaultElementGeometry({ model: element, port: 'out' })).toBe(geometry);
    element.prop('ports', elementPorts({ out: { width: 40, height: 10 } }), { rewrite: true });
    const nextGeometry = defaultElementGeometry({ model: element, port: 'out' });
    expect(nextGeometry).not.toBe(geometry);
    expect(bboxOf(nextGeometry)).toBe('-20@-5 20@5');
  });

  it('is the geometry of the graph created by the graph store', () => {
    const store = new GraphStore({});
    try {
      const element = createElement(elementPorts({ out: { width: 20, height: 10 } }));
      store.graph.addCell(element);
      expect(store.graph.getPortGeometry(element, 'out').type).toBe(g.types.Ellipse);
      expect(store.graph.getElementGeometry(element).type).toBe(g.types.Rect);
    } finally {
      store.destroy(false);
    }
  });
});

const DEFAULT_PORT: ElementPort = { width: 20, height: 20 };

function setup(getElementGeometry?: dia.Graph.ElementGeometryCallback, port = DEFAULT_PORT) {
  const container = document.createElement('div');
  document.body.append(container);
  const graph = new dia.Graph({}, { cellNamespace: shapes, getElementGeometry });
  const paper = new dia.Paper({
    el: container,
    model: graph,
    cellViewNamespace: shapes,
    width: 800,
    height: 600,
    async: false,
    frozen: false,
  });
  const element = createElement(elementPorts({ out: { cx: 100, cy: 50, ...port } }));
  const link = new shapes.standard.Link({ source: { id: element.id }, target: { x: 300, y: 300 } });
  graph.addCells([element, link]);
  const elementView = element.findView(paper) as dia.ElementView;
  const linkView = link.findView(paper) as dia.LinkView;
  const portNode = elementView.findPortNode('out', 'port') as SVGElement;
  return {
    elementView,
    linkView,
    portNode,
    cleanup: () => {
      paper.remove();
      container.remove();
    },
  };
}

describe('presets / connection-points — model geometry', () => {
  it('ends on the boundary of the ellipse port', () => {
    const context = setup(defaultElementGeometry);
    try {
      const line = new g.Line(new g.Point(200, 150), new g.Point(100, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('107.07@57.07');
    } finally {
      context.cleanup();
    }
  });

  it('extends the line when it stops short of the path port', () => {
    const context = setup(defaultElementGeometry, { shape: TRIANGLE_PATH });
    try {
      const line = new g.Line(new g.Point(200, 42), new g.Point(100, 42));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('94@42');
    } finally {
      context.cleanup();
    }
  });

  it('ends on the outer edge of the port outline', () => {
    const context = setup(defaultElementGeometry, { width: 20, height: 20, outlineWidth: 6 });
    try {
      const line = new g.Line(new g.Point(200, 50), new g.Point(100, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('113@50');
    } finally {
      context.cleanup();
    }
  });

  it('ignores an outline that is not set on the port', () => {
    const context = setup(defaultElementGeometry);
    try {
      const line = new g.Line(new g.Point(200, 50), new g.Point(100, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('110@50');
    } finally {
      context.cleanup();
    }
  });

  it('falls back to the rectangle connection point when the extended line misses the path port', () => {
    const context = setup(defaultElementGeometry, { shape: TRIANGLE_PATH });
    try {
      const line = new g.Line(new g.Point(200, 80), new g.Point(150, 80));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.toString()).toBe('150@80');
    } finally {
      context.cleanup();
    }
  });

  it('does not apply the outline when the link does not meet the port shape', () => {
    const context = setup(defaultElementGeometry, { shape: 'rect', width: 20, height: 20, outlineWidth: 6 });
    try {
      const line = new g.Line(new g.Point(200, 50), new g.Point(150, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.toString()).toBe('150@50');
    } finally {
      context.cleanup();
    }
  });

  it('does not extend the line for a rect port', () => {
    const context = setup(defaultElementGeometry, { shape: 'rect', width: 20, height: 20 });
    try {
      const line = new g.Line(new g.Point(200, 50), new g.Point(150, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.toString()).toBe('150@50');
    } finally {
      context.cleanup();
    }
  });

  it('keeps the connection point between the port and the start of the line', () => {
    const context = setup(defaultElementGeometry, { width: 20, height: 20, outlineWidth: 40 });
    try {
      const line = new g.Line(new g.Point(112, 50), new g.Point(100, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('111@50');
    } finally {
      context.cleanup();
    }
  });

  it('ends on the rectangle of the port when the graph has no geometry option', () => {
    const context = setup();
    try {
      const line = new g.Line(new g.Point(200, 150), new g.Point(100, 50));
      const point = boundaryPoint(line, context.elementView, context.portNode, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('110@60');
    } finally {
      context.cleanup();
    }
  });

  it('ends on the rectangle of the element for the root magnet', () => {
    const context = setup(defaultElementGeometry);
    try {
      const line = new g.Line(new g.Point(200, 50), new g.Point(50, 50));
      const point = boundaryPoint(line, context.elementView, context.elementView.el, {}, 'source', context.linkView);
      expect(point.round(2).toString()).toBe('100@50');
    } finally {
      context.cleanup();
    }
  });

  it('falls back to the rectangle connection point when there is no intersection', () => {
    const context = setup(defaultElementGeometry);
    try {
      const line = new g.Line(new g.Point(200, 50), new g.Point(150, 50));
      const point = boundaryPoint(line, context.elementView, context.elementView.el, {}, 'source', context.linkView);
      expect(point.toString()).toBe('150@50');
    } finally {
      context.cleanup();
    }
  });
});
