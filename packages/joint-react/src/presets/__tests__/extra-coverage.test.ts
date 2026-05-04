/* eslint-disable @typescript-eslint/no-explicit-any */
import { dia, shapes, g } from '@joint/core';
import { linkStyle, linkStyleLine, linkStyleWrapper } from '../link-style';
import { outwardsCurveConnector } from '../connectors';
import { rightAngleRouter } from '../routers';
import { elementPort } from '../element-ports';
import { boundaryPoint, anchorPoint } from '../connection-points';
import { LinkView } from '../link-view';
import { Paper } from '../paper';

describe('presets / element-ports / elementPort — group-positioned', () => {
  it('omits position when neither cx nor cy is supplied', () => {
    const port = elementPort({ shape: 'rect' });
    expect(port.position).toBeUndefined();
  });

  it('sets position when only cx is supplied', () => {
    const port = elementPort({ cx: 5 });
    expect(port.position).toBeDefined();
  });

  it('sets position when only cy is supplied', () => {
    const port = elementPort({ cy: 5 });
    expect(port.position).toBeDefined();
  });

  it('marks port magnet as passive when configured', () => {
    const port = elementPort({ passive: true });
    const attributes = port.attrs as { portBody: { magnet: string } };
    expect(attributes.portBody.magnet).toBe('passive');
  });
});

describe('presets / link-style — no-arg variants', () => {
  it('linkStyleLine() with no arguments returns defaults', () => {
    const out = linkStyleLine();
    expect(out).toBeDefined();
    expect(out!.connection).toBe(true);
  });

  it('linkStyleWrapper() with no arguments returns defaults', () => {
    const out = linkStyleWrapper();
    expect(out).toBeDefined();
    expect(out!.connection).toBe(true);
  });

  it('linkStyle() with no arguments builds line+wrapper', () => {
    const out = linkStyle();
    expect(out.line).toBeDefined();
    expect(out.wrapper).toBeDefined();
  });
});

describe('presets / connectors / rightAngleRouter', () => {
  it('returns a router that delegates to routerFns.rightAngle', () => {
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
    try {
      const source = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const target = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
      });
      graph.addCells([source, target, link]);
      const linkView = paper.findViewByModel(link) as dia.LinkView;

      const router = rightAngleRouter(15);
      const result = router([], { args: 1 } as any, linkView);
      expect(Array.isArray(result)).toBe(true);
    } finally {
      paper.remove();
      container.remove();
    }
  });
});

describe('presets / connectors / outwardsCurveConnector', () => {
  it('returns a path or string for given source/target with a real linkView', () => {
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
    try {
      const source = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const target = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
      });
      graph.addCells([source, target, link]);
      const linkView = paper.findViewByModel(link) as dia.LinkView;

      const sourcePoint = new g.Point(0, 50);
      const targetPoint = new g.Point(200, 50);
      const result = outwardsCurveConnector(
        sourcePoint as any,
        targetPoint as any,
        [],
        {} as any,
        linkView
      );
      expect(result).toBeDefined();
    } finally {
      paper.remove();
      container.remove();
    }
  });
});

interface PaperContext {
  paper: dia.Paper;
  graph: dia.Graph;
  link: dia.Link;
  linkView: dia.LinkView;
  source: dia.Element;
  target: dia.Element;
  cleanup: () => void;
}

function setupPaperWithLink(): PaperContext {
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
  const target = new shapes.standard.Rectangle({
    position: { x: 200, y: 0 },
    size: { width: 100, height: 100 },
  });
  const link = new shapes.standard.Link({
    source: { id: source.id },
    target: { id: target.id },
  });
  graph.addCells([source, target, link]);

  const linkView = paper.findViewByModel(link) as dia.LinkView;

  return {
    paper,
    graph,
    link,
    linkView,
    source,
    target,
    cleanup: () => {
      paper.remove();
      container.remove();
    },
  };
}

describe('presets / connection-points — real Paper integration', () => {
  it('boundaryPoint calls rectangle on root magnet', () => {
    const ctx = setupPaperWithLink();
    try {
      const targetView = ctx.paper.findViewByModel(ctx.target) as dia.ElementView;
      const line = new g.Line(new g.Point(0, 50), new g.Point(250, 50));
      const point = boundaryPoint(
        line as any,
        targetView,
        targetView.el,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('boundaryPoint calls boundary for non-port custom magnet', () => {
    const ctx = setupPaperWithLink();
    try {
      const targetView = ctx.paper.findViewByModel(ctx.target) as dia.ElementView;
      const customMagnet = targetView.el.querySelector('rect') as unknown as SVGElement;
      const line = new g.Line(new g.Point(0, 50), new g.Point(250, 50));
      const point = boundaryPoint(
        line as any,
        targetView,
        customMagnet,
        {} as any,
        'target',
        ctx.linkView
      );
      expect(point).toBeDefined();
    } finally {
      ctx.cleanup();
    }
  });

  it('anchorPoint uses rectangle on custom magnet (DOM geometry)', () => {
    const ctx = setupPaperWithLink();
    try {
      const targetView = ctx.paper.findViewByModel(ctx.target) as dia.ElementView;
      const customMagnet = targetView.el.querySelector('rect') as unknown as SVGElement;
      const line = new g.Line(new g.Point(0, 50), new g.Point(250, 50));
      const point = anchorPoint(
        line as any,
        targetView,
        customMagnet,
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

describe('presets / link-view / LinkView', () => {
  it('toggles connecting class around arrowhead move', () => {
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
      linkView: LinkView,
    });

    try {
      const source = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const target = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
      });
      graph.addCells([source, target, link]);

      const linkView = paper.findViewByModel(link) as InstanceType<typeof LinkView>;
      expect(linkView).toBeInstanceOf(LinkView);

      // Call protected methods directly to exercise the override paths.
      const data: Record<string, unknown> = {};
      (linkView as unknown as { _beforeArrowheadMove: (d: unknown) => void })._beforeArrowheadMove(data);
      expect(linkView.el.classList.contains('jj-is-connecting')).toBe(true);

      // _snapArrowhead is invoked during drag; calling parent requires a magnet at coords.
      // Instead, simulate parent returning false via our toggle logic by spying.
      // But to hit the line, just invoke and let parent run; on an empty area it returns undefined.
      const snapResult = (linkView as unknown as {
        _snapArrowhead: (event_: dia.Event, x: number, y: number) => unknown;
      })._snapArrowhead({} as dia.Event, 5000, 5000);
      // After snap with no target, snapped class is false, connecting class is true
      expect(linkView.el.classList.contains('jj-is-snapped')).toBe(!!snapResult);

      (linkView as unknown as { _afterArrowheadMove: (d: unknown) => void })._afterArrowheadMove(data);
      expect(linkView.el.classList.contains('jj-is-connecting')).toBe(false);
      expect(linkView.el.classList.contains('jj-is-snapped')).toBe(false);
    } finally {
      paper.remove();
      container.remove();
    }
  });

  it('sets snapped class when _snapArrowhead returns truthy', () => {
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
      linkView: LinkView,
    });

    try {
      const source = new shapes.standard.Rectangle({
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
      });
      const target = new shapes.standard.Rectangle({
        position: { x: 200, y: 0 },
        size: { width: 100, height: 100 },
      });
      const link = new shapes.standard.Link({
        source: { id: source.id },
        target: { id: target.id },
      });
      graph.addCells([source, target, link]);

      const linkView = paper.findViewByModel(link) as InstanceType<typeof LinkView>;

      // Stub the parent's _snapArrowhead to control return value via prototype override.
      const parentProto = Object.getPrototypeOf(Object.getPrototypeOf(linkView));
      const original = parentProto._snapArrowhead;
      parentProto._snapArrowhead = function () {
        return { magnet: 'fake' };
      };
      try {
        const snapResult = (linkView as unknown as {
          _snapArrowhead: (event_: dia.Event, x: number, y: number) => unknown;
        })._snapArrowhead({} as dia.Event, 1, 1);
        expect(snapResult).toBeTruthy();
        expect(linkView.el.classList.contains('jj-is-snapped')).toBe(true);
        expect(linkView.el.classList.contains('jj-is-connecting')).toBe(false);
      } finally {
        parentProto._snapArrowhead = original;
      }
    } finally {
      paper.remove();
      container.remove();
    }
  });
});

describe('presets / paper module / Paper', () => {
  it('can be instantiated and applies preset options', () => {
    const container = document.createElement('div');
    document.body.append(container);
    const graph = new dia.Graph({}, { cellNamespace: shapes });
    const paper = new Paper({
      el: container,
      model: graph,
      cellViewNamespace: shapes,
      width: 100,
      height: 100,
    });

    try {
      expect(paper).toBeInstanceOf(dia.Paper);
      expect(paper.el.classList.contains('jj-paper')).toBe(true);
      expect(paper.el.classList.contains('joint-paper')).toBe(true);
    } finally {
      paper.remove();
      container.remove();
    }
  });
});
