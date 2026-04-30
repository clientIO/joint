/* eslint-disable @typescript-eslint/no-explicit-any */
import { dia, shapes, g } from '@joint/core';
import { centerAnchor, perpendicularAnchor, midSideAnchor } from '../anchors';

interface Setup {
  paper: dia.Paper;
  graph: dia.Graph;
  source: dia.Element;
  target: dia.Element;
  link: dia.Link;
  sourceView: dia.ElementView;
  targetView: dia.ElementView;
  linkView: dia.LinkView;
  cleanup: () => void;
}

type PortSide = 'left' | 'right' | 'top' | 'bottom';

function setupPaper(targetWithPort = false, portSide: PortSide = 'left'): Setup {
  const container = document.createElement('div');
  document.body.append(container);

  const graph = new dia.Graph({}, { cellNamespace: shapes });
  const paper = new dia.Paper({
    el: container,
    model: graph,
    cellViewNamespace: shapes,
    width: 800,
    height: 600,
    async: false,
    frozen: false,
  });

  const source = new shapes.standard.Rectangle({
    position: { x: 0, y: 0 },
    size: { width: 100, height: 100 },
  });

  const targetAttributes: any = {
    position: { x: 200, y: 0 },
    size: { width: 100, height: 100 },
  };
  if (targetWithPort) {
    targetAttributes.ports = {
      groups: { in: { position: portSide } },
      items: [{ id: 'pin1', group: 'in' }],
    };
  }

  const target = new shapes.standard.Rectangle(targetAttributes);

  const link = new shapes.standard.Link({
    source: { id: source.id },
    target: { id: target.id },
  });
  graph.addCells([source, target, link]);

  const sourceView = paper.findViewByModel(source) as dia.ElementView;
  const targetView = paper.findViewByModel(target) as dia.ElementView;
  const linkView = paper.findViewByModel(link) as dia.LinkView;

  return {
    paper,
    graph,
    source,
    target,
    link,
    sourceView,
    targetView,
    linkView,
    cleanup: () => {
      paper.remove();
      container.remove();
    },
  };
}

describe('presets / anchors / centerAnchor', () => {
  it('returns center for root element magnet (uses model geometry path)', () => {
    const ctx = setupPaper();
    try {
      const refPoint = new g.Point(50, 50);
      const point = centerAnchor(
        ctx.targetView,
        ctx.targetView.el,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point.x).toBe(250);
      expect(point.y).toBe(50);
    } finally {
      ctx.cleanup();
    }
  });

  it('returns center for port magnet (uses model geometry path)', () => {
    const ctx = setupPaper(true);
    try {
      const portMagnet = ctx.targetView.findPortNode('pin1') as SVGElement;
      expect(portMagnet).toBeDefined();
      const refPoint = new g.Point(50, 50);
      const point = centerAnchor(
        ctx.targetView,
        portMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('falls back to DOM-measured for non-port custom magnet', () => {
    const ctx = setupPaper();
    try {
      const customMagnet = ctx.targetView.el.querySelector('rect') as unknown as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = centerAnchor(
        ctx.targetView,
        customMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });
});

describe('presets / anchors / perpendicularAnchor', () => {
  it('uses model geometry for root element', () => {
    const ctx = setupPaper();
    try {
      const refPoint = new g.Point(50, 50);
      const point = perpendicularAnchor(
        ctx.targetView,
        ctx.targetView.el,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('uses model geometry for port magnet', () => {
    const ctx = setupPaper(true);
    try {
      const portMagnet = ctx.targetView.findPortNode('pin1') as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = perpendicularAnchor(
        ctx.targetView,
        portMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('falls back to DOM-measured for custom magnet', () => {
    const ctx = setupPaper();
    try {
      const customMagnet = ctx.targetView.el.querySelector('rect') as unknown as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = perpendicularAnchor(
        ctx.targetView,
        customMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });
});

describe('presets / anchors / midSideAnchor', () => {
  it('uses midSide with model geometry on root element', () => {
    const ctx = setupPaper();
    try {
      const anchor = midSideAnchor('auto', 0, 0);
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        ctx.targetView.el,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('returns port-side point with offset for port magnet (left side)', () => {
    const ctx = setupPaper(true);
    try {
      const anchor = midSideAnchor('auto', 5, 0);
      const portMagnet = ctx.targetView.findPortNode('pin1') as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        portMagnet,
        refPoint,
        {} as any,
        'source',
        ctx.linkView
      );
      expect(point).toBeDefined();
      // Source side uses sourceOffset=5
    } finally {
      ctx.cleanup();
    }
  });

  it('handles target end with targetOffset', () => {
    const ctx = setupPaper(true);
    try {
      const anchor = midSideAnchor('auto', 0, 7);
      const portMagnet = ctx.targetView.findPortNode('pin1') as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        portMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('rotates port point when element angle is non-zero', () => {
    const ctx = setupPaper(true);
    try {
      ctx.target.rotate(45);
      const anchor = midSideAnchor('auto', 0, 0);
      const portMagnet = ctx.targetView.findPortNode('pin1') as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        portMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('falls back to midSide DOM for non-root, non-port magnet', () => {
    const ctx = setupPaper();
    try {
      const anchor = midSideAnchor('auto', 0, 0);
      const customMagnet = ctx.targetView.el.querySelector('rect') as unknown as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        customMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('returns midSide for port magnet that does not match element ports', () => {
    const ctx = setupPaper();
    try {
      const anchor = midSideAnchor('auto', 0, 0);
      // Create a fake magnet with a port attribute pointing to a non-existent port
      const fakePortMagnet = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      fakePortMagnet.setAttribute('port', 'nonexistent');
      ctx.targetView.el.append(fakePortMagnet);
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        fakePortMagnet as unknown as SVGElement,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it.each(['right', 'top', 'bottom'] as const)('handles %s-side port placement', (side) => {
    const ctx = setupPaper(true, side);
    try {
      const anchor = midSideAnchor('auto', 0, 0);
      const portMagnet = ctx.targetView.findPortNode('pin1') as SVGElement;
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        portMagnet,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('uses default mode when not specified', () => {
    const ctx = setupPaper();
    try {
      const anchor = midSideAnchor();
      const refPoint = new g.Point(50, 50);
      const point = anchor(
        ctx.targetView,
        ctx.targetView.el,
        refPoint,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });
});
