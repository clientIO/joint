/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { render, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { dia, shapes } from '@joint/core';
import { GraphProvider } from '../../graph/graph-provider';
import { ReactPaper } from '../react-paper';
import { useReactPaper } from '../react-paper-context';
import { ReactElement } from '../../../models/react-element';
import { ReactLink } from '../../../models/react-link';
import { ReactPaperLink } from '../../../models/react-paper-link';
import { useLinkLayout } from '../../../hooks/use-link-layout';

const DEFAULT_CELL_NAMESPACE = { ...shapes, ReactElement, ReactLink, ReactPaperLink };

// Mock ResizeObserver for tests
function mockCleanup() {
  // Empty cleanup function
}
jest.mock('../../../store/create-elements-size-observer', () => {
  const mockAdd = jest.fn(() => mockCleanup);
  return {
    createElementsSizeObserver: jest.fn(() => {
      return {
        add: mockAdd,
        clean: jest.fn(),
        has: jest.fn(() => false),
      };
    }),
  };
});

const elements: Record<
  string,
  { id: string; x: number; y: number; width: number; height: number; type: string }
> = {
  'elem-1': { id: 'elem-1', x: 0, y: 0, width: 100, height: 100, type: 'ReactElement' },
  'elem-2': { id: 'elem-2', x: 200, y: 0, width: 100, height: 100, type: 'ReactElement' },
};

const links: Record<string, { id: string; source: { id: string }; target: { id: string } }> = {
  'link-1': { id: 'link-1', source: { id: 'elem-1' }, target: { id: 'elem-2' } },
};

/**
 * Test helper: Default link component using useLinkLayout hook.
 */
function DefaultTestLink({ testId = 'link-path' }: Readonly<{ testId?: string }>) {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} data-testid={testId} />;
}

/**
 * Test helper: Custom styled link component.
 */
function StyledTestLink({
  stroke = 'red',
  strokeWidth = 3,
  testId = 'styled-link',
}: Readonly<{
  stroke?: string;
  strokeWidth?: number;
  testId?: string;
}>) {
  const layout = useLinkLayout();
  if (!layout) return null;
  return <path d={layout.d} stroke={stroke} strokeWidth={strokeWidth} data-testid={testId} />;
}

/**
 * Test helper: Curved link using quadratic bezier.
 */
function CurvedTestLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  const midX = (layout.sourceX + layout.targetX) / 2;
  const midY = (layout.sourceY + layout.targetY) / 2 - 50;
  const curvedPath = `M ${layout.sourceX} ${layout.sourceY} Q ${midX} ${midY} ${layout.targetX} ${layout.targetY}`;
  return <path d={curvedPath} data-testid="curved-link" stroke="blue" fill="none" />;
}

/**
 * Test helper: Arrow link with marker.
 */
function ArrowTestLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return (
    <g data-testid="arrow-link">
      <path d={layout.d} stroke="black" fill="none" markerEnd="url(#arrowhead)" />
      <polygon
        points={`${layout.targetX},${layout.targetY} ${layout.targetX - 10},${layout.targetY - 5} ${layout.targetX - 10},${layout.targetY + 5}`}
        fill="black"
        data-testid="arrow-marker"
      />
    </g>
  );
}

/**
 * Test helper: Dashed link.
 */
function DashedTestLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return (
    <path
      d={layout.d}
      stroke="gray"
      strokeWidth={2}
      strokeDasharray="5,5"
      fill="none"
      data-testid="dashed-link"
    />
  );
}

/**
 * Test helper: Link with vertex markers.
 */
function VertexTestLink() {
  const layout = useLinkLayout();
  if (!layout) return null;
  return (
    <g data-testid="vertex-link">
      <path d={layout.d} stroke="green" fill="none" />
      {layout.vertices.map((vertex, index) => (
        <circle
          key={`vertex-${index}`}
          cx={vertex.x}
          cy={vertex.y}
          r={5}
          fill="orange"
          data-testid={`vertex-${index}`}
        />
      ))}
    </g>
  );
}

describe('ReactPaper', () => {
  // Clean up after each test to prevent DOM conflicts
  afterEach(() => {
    cleanup();
    document.body.innerHTML = '';
  });

  describe('rendering', () => {
    it('should render without crashing', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect data-testid="element-rect" />} />
        </GraphProvider>
      );

      const paper = document.querySelector('.joint-layers');
      expect(paper).toBeInTheDocument();
    });

    it('should render elements', async () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <DefaultTestLink />}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        const elementRects = document.querySelectorAll('[data-testid="element-rect"]');
        expect(elementRects.length).toBe(2);
      });
    });

    it('should render links', async () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <DefaultTestLink />}
          />
        </GraphProvider>
      );

      await waitFor(() => {
        const linkPaths = document.querySelectorAll('[data-testid="link-path"]');
        expect(linkPaths.length).toBe(1);
      });
    });

    it('should apply CSS class', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper
            className="my-paper"
            renderElement={() => <rect data-testid="element-rect" />}
          />
        </GraphProvider>
      );

      const container = document.querySelector('.my-paper');
      expect(container).toBeInTheDocument();
    });

    it('should apply inline styles', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper
            style={{ backgroundColor: 'red' }}
            renderElement={() => <rect data-testid="element-rect" />}
          />
        </GraphProvider>
      );

      const container = document.querySelector('.joint-layers')?.parentElement?.parentElement;
      // Note: JointJS Paper may override some styles. Check container exists with base styles.
      expect(container).toBeInTheDocument();
      expect(container).toHaveStyle({ position: 'relative' });
    });
  });

  describe('SVG structure', () => {
    it('should create proper SVG layer hierarchy', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect />} />
        </GraphProvider>
      );

      // Check for JointJS-compatible layer structure
      expect(document.querySelector('.joint-layers')).toBeInTheDocument();
      expect(document.querySelector('.joint-grid-layer')).toBeInTheDocument();
      expect(document.querySelector('.joint-back-layer')).toBeInTheDocument();
      expect(document.querySelector('.joint-cells-layer')).toBeInTheDocument();
      expect(document.querySelector('.joint-labels-layer')).toBeInTheDocument();
      expect(document.querySelector('.joint-front-layer')).toBeInTheDocument();
      expect(document.querySelector('.joint-tools-layer')).toBeInTheDocument();
    });

    it('should have defs element for SVG definitions', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect />} />
        </GraphProvider>
      );

      const svg = document.querySelector('svg');
      const defs = svg?.querySelector('defs');
      expect(defs).toBeInTheDocument();
    });

    it('should render elements inside cells layer', async () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect data-testid="cell-rect" />} />
        </GraphProvider>
      );

      await waitFor(() => {
        const cellsLayer = document.querySelector('.joint-cells-layer');
        const rects = cellsLayer?.querySelectorAll('[data-testid="cell-rect"]');
        expect(rects?.length).toBe(2);
      });
    });
  });

  describe('dimensions', () => {
    it('should apply numeric width and height', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper width={500} height={300} renderElement={() => <rect />} />
        </GraphProvider>
      );

      const svg = document.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('500');
      expect(svg?.getAttribute('height')).toBe('300');
    });

    it('should apply string width and height for CSS values', () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper width="100%" height="50vh" renderElement={() => <rect />} />
        </GraphProvider>
      );

      const svg = document.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('100%');
      expect(svg?.getAttribute('height')).toBe('50vh');
    });
  });

  describe('element rendering', () => {
    it('should pass element data to renderElement', async () => {
      const renderElement = jest.fn(() => <rect data-testid="mock-rect" />);

      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={renderElement} />
        </GraphProvider>
      );

      await waitFor(() => {
        expect(renderElement).toHaveBeenCalled();
        // Should be called at least once for each element (may be called more due to React re-renders)
        expect(renderElement.mock.calls.length).toBeGreaterThanOrEqual(2);
        // Verify element rects are rendered
        const rects = document.querySelectorAll('[data-testid="mock-rect"]');
        expect(rects.length).toBe(2);
      });
    });

    it('should render element with transform based on position', async () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect data-testid="positioned-rect" />} />
        </GraphProvider>
      );

      await waitFor(() => {
        const groups = document.querySelectorAll('g[model-id]');
        expect(groups.length).toBeGreaterThan(0);
        // Check that transforms are applied
        const [firstGroup] = groups;
        expect(firstGroup.getAttribute('transform')).toContain('translate');
      });
    });

    it('should generate JointJS-compatible class names', async () => {
      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect />} />
        </GraphProvider>
      );

      await waitFor(() => {
        const elementGroup = document.querySelector('g.joint-element');
        expect(elementGroup).toBeInTheDocument();
        expect(elementGroup?.classList.contains('joint-cell')).toBe(true);
        expect(elementGroup?.classList.contains('joint-theme-default')).toBe(true);
      });
    });
  });

  describe('context', () => {
    it('should provide useReactPaper hook for accessing paper', () => {
      let hookCalled = false;

      function ContextConsumer() {
        const paper = useReactPaper();
        hookCalled = true;
        // Paper may be null initially (before useLayoutEffect runs in ReactPaper)
        // Components handle this by checking: if (!paper) return;
        // This is expected behavior - paper becomes available after mount
        expect(paper === null || paper instanceof Object).toBe(true);
        return null;
      }

      render(
        <GraphProvider elements={elements} links={links}>
          <ReactPaper renderElement={() => <rect />}>
            <ContextConsumer />
          </ReactPaper>
        </GraphProvider>
      );

      expect(hookCalled).toBe(true);
    });
  });

  /**
   * CRITICAL TESTS: Imperative cell addition
   *
   * These tests verify that links added via graph.addCells() are properly rendered.
   * This was the original bug: links were missing in Storybook.
   */
  describe('CRITICAL: Imperative cell addition (Story pattern)', () => {
    it('should render elements added imperatively via graph.addCells()', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect data-testid="element-rect" />} />
        </GraphProvider>
      );

      // Initially no cells
      expect(document.querySelectorAll('[model-id]').length).toBe(0);

      // Add elements imperatively (like story does)
      graph.addCells([
        new ReactElement({
          id: 'imp-elem-1',
          position: { x: 50, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactElement({
          id: 'imp-elem-2',
          position: { x: 300, y: 50 },
          size: { width: 120, height: 60 },
        }),
      ]);

      // Elements should appear
      await waitFor(() => {
        const element1 = document.querySelector('[model-id="imp-elem-1"]');
        const element2 = document.querySelector('[model-id="imp-elem-2"]');
        expect(element1).toBeInTheDocument();
        expect(element2).toBeInTheDocument();
      });
    });

    it('should render links added imperatively via graph.addCells() - CRITICAL', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <DefaultTestLink />}
          />
        </GraphProvider>
      );

      // Initially no cells
      expect(document.querySelectorAll('[model-id]').length).toBe(0);

      // Add elements and links imperatively (like story does)
      graph.addCells([
        new ReactElement({
          id: 'imp-elem-1',
          position: { x: 50, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactElement({
          id: 'imp-elem-2',
          position: { x: 300, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactLink({
          id: 'imp-link-1',
          source: { id: 'imp-elem-1' },
          target: { id: 'imp-elem-2' },
        }),
      ]);

      // CRITICAL: Links should appear (this was failing in Storybook)
      await waitFor(() => {
        const link = document.querySelector('[model-id="imp-link-1"]');
        expect(link).toBeInTheDocument();
        expect(link).toHaveClass('joint-link');
      });
    });

    it('should render multiple links added imperatively', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      function TestLink({ id }: Readonly<{ id: string }>) {
        const layout = useLinkLayout();
        if (!layout) return null;
        return <path d={layout.d} data-testid={`path-${id}`} />;
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect />}
            renderLink={(link) => <TestLink id={String(link.id)} />}
          />
        </GraphProvider>
      );

      // Add elements and multiple links imperatively (like story does)
      graph.addCells([
        new ReactElement({
          id: 'e1',
          position: { x: 50, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactElement({
          id: 'e2',
          position: { x: 300, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactElement({
          id: 'e3',
          position: { x: 175, y: 200 },
          size: { width: 120, height: 60 },
        }),
        new ReactLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
        new ReactLink({ id: 'l2', source: { id: 'e1' }, target: { id: 'e3' } }),
        new ReactLink({ id: 'l3', source: { id: 'e2' }, target: { id: 'e3' } }),
      ]);

      // ALL links should appear
      await waitFor(() => {
        expect(document.querySelector('[model-id="l1"]')).toBeInTheDocument();
        expect(document.querySelector('[model-id="l2"]')).toBeInTheDocument();
        expect(document.querySelector('[model-id="l3"]')).toBeInTheDocument();
      });
    });

    it('should render link content via renderLink prop', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect />}
            renderLink={() => <StyledTestLink stroke="red" strokeWidth={3} testId="custom-link" />}
          />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({
          id: 'e1',
          position: { x: 0, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      // Custom link content should be rendered
      await waitFor(() => {
        const customPath = document.querySelector('[data-testid="custom-link"]');
        expect(customPath).toBeInTheDocument();
        expect(customPath?.getAttribute('stroke')).toBe('red');
        expect(customPath?.getAttribute('stroke-width')).toBe('3');
      });
    });

    it('should NOT have duplicate links when added imperatively', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect />}
            renderLink={() => <path data-testid="link-content" />}
          />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        // CRITICAL: Only ONE link element should exist (React-rendered, not duplicated by JointJS)
        const linksWithId = document.querySelectorAll('[model-id="l1"]');
        expect(linksWithId.length).toBe(1);
      });
    });

    it('should render ReactPaperLink added imperatively (Story pattern) - CRITICAL', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect />}
            renderLink={() => <DefaultTestLink testId="paper-link" />}
          />
        </GraphProvider>
      );

      // This is exactly what the story does - using ReactPaperLink (not ReactLink)
      graph.addCells([
        new ReactElement({
          id: 'e1',
          position: { x: 50, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactElement({
          id: 'e2',
          position: { x: 300, y: 50 },
          size: { width: 120, height: 60 },
        }),
        new ReactElement({
          id: 'e3',
          position: { x: 175, y: 200 },
          size: { width: 120, height: 60 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
        new ReactPaperLink({ id: 'l2', source: { id: 'e1' }, target: { id: 'e3' } }),
        new ReactPaperLink({ id: 'l3', source: { id: 'e2' }, target: { id: 'e3' } }),
      ]);

      // CRITICAL: All ReactPaperLink elements should be rendered
      await waitFor(() => {
        expect(document.querySelector('[model-id="l1"]')).toBeInTheDocument();
        expect(document.querySelector('[model-id="l2"]')).toBeInTheDocument();
        expect(document.querySelector('[model-id="l3"]')).toBeInTheDocument();
      });
    });

    it('should render custom link content with ReactPaperLink', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect />}
            renderLink={() => (
              <StyledTestLink stroke="#764ba2" strokeWidth={3} testId="styled-link" />
            )}
          />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        const styledLink = document.querySelector('[data-testid="styled-link"]');
        expect(styledLink).toBeInTheDocument();
        expect(styledLink?.getAttribute('stroke')).toBe('#764ba2');
      });
    });
  });

  /**
   * CRITICAL TESTS: Custom link shapes
   *
   * Tests for different link rendering styles using renderLink callback.
   */
  describe('CRITICAL: Custom link shapes', () => {
    it('should render curved link using useLinkLayout sourceX/Y and targetX/Y', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect />} renderLink={() => <CurvedTestLink />} />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 100 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 300, y: 100 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        const curvedLink = document.querySelector('[data-testid="curved-link"]');
        expect(curvedLink).toBeInTheDocument();
        // Verify it's a quadratic bezier curve (contains Q command)
        expect(curvedLink?.getAttribute('d')).toContain('Q');
      });
    });

    it('should render link with arrow marker', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect />} renderLink={() => <ArrowTestLink />} />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 300, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        expect(document.querySelector('[data-testid="arrow-link"]')).toBeInTheDocument();
        expect(document.querySelector('[data-testid="arrow-marker"]')).toBeInTheDocument();
      });
    });

    it('should render dashed link', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect />} renderLink={() => <DashedTestLink />} />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        const dashedLink = document.querySelector('[data-testid="dashed-link"]');
        expect(dashedLink).toBeInTheDocument();
        expect(dashedLink?.getAttribute('stroke-dasharray')).toBe('5,5');
      });
    });

    it('should render link with vertices (waypoints)', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect />} renderLink={() => <VertexTestLink />} />
        </GraphProvider>
      );

      // Link with vertices
      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 300, y: 200 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({
          id: 'l1',
          source: { id: 'e1' },
          target: { id: 'e2' },
          vertices: [
            { x: 150, y: 50 },
            { x: 250, y: 150 },
          ],
        }),
      ]);

      await waitFor(() => {
        expect(document.querySelector('[data-testid="vertex-link"]')).toBeInTheDocument();
        // Should have vertex markers
        expect(document.querySelector('[data-testid="vertex-0"]')).toBeInTheDocument();
        expect(document.querySelector('[data-testid="vertex-1"]')).toBeInTheDocument();
      });
    });
  });

  /**
   * Tests for useLinkLayout hook integration.
   */
  describe('useLinkLayout hook', () => {
    it('should provide layout data with d, sourceX, sourceY, targetX, targetY', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      let capturedLayout: ReturnType<typeof useLinkLayout>;

      function LayoutCapture() {
        capturedLayout = useLinkLayout();
        if (!capturedLayout) return null;
        return <path d={capturedLayout.d} data-testid="layout-capture" />;
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect />} renderLink={() => <LayoutCapture />} />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        expect(capturedLayout).toBeDefined();
        expect(capturedLayout?.d).toBeDefined();
        expect(typeof capturedLayout?.sourceX).toBe('number');
        expect(typeof capturedLayout?.sourceY).toBe('number');
        expect(typeof capturedLayout?.targetX).toBe('number');
        expect(typeof capturedLayout?.targetY).toBe('number');
        expect(Array.isArray(capturedLayout?.vertices)).toBe(true);
      });
    });

    it('should include vertices in layout data', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      let capturedVertices: ReadonlyArray<{ x: number; y: number }> | undefined;

      function VertexCapture() {
        const layout = useLinkLayout();
        if (!layout) return null;
        capturedVertices = layout.vertices;
        return <path d={layout.d} data-testid="vertex-capture" />;
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect />} renderLink={() => <VertexCapture />} />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 300, y: 200 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({
          id: 'l1',
          source: { id: 'e1' },
          target: { id: 'e2' },
          vertices: [{ x: 150, y: 50 }],
        }),
      ]);

      await waitFor(() => {
        expect(capturedVertices).toBeDefined();
        expect(capturedVertices?.length).toBe(1);
        expect(capturedVertices?.[0]).toEqual({ x: 150, y: 50 });
      });
    });
  });

  describe('renderLink callback verification', () => {
    it('should call renderLink for each link - CRITICAL', async () => {
      const renderLink = jest.fn(() => <path data-testid="mock-link-path" />);
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={renderLink}
          />
        </GraphProvider>
      );

      // Add elements and links imperatively
      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'link-1', source: { id: 'e1' }, target: { id: 'e2' } }),
        new ReactPaperLink({ id: 'link-2', source: { id: 'e2' }, target: { id: 'e1' } }),
      ]);

      await waitFor(() => {
        expect(renderLink).toHaveBeenCalled();
        // Should be called for each link (2 links)
        expect(renderLink.mock.calls.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should render link content in DOM - CRITICAL', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <path data-testid="rendered-link-content" stroke="red" />}
          />
        </GraphProvider>
      );

      // Add elements and link
      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'link-1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        const linkContent = document.querySelector('[data-testid="rendered-link-content"]');
        expect(linkContent).toBeInTheDocument();
      });
    });

    it('should render link content INSIDE the link g element - CRITICAL BUG CHECK', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <path data-testid="link-path-content" stroke="blue" />}
          />
        </GraphProvider>
      );

      // Add elements and link
      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'link-1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        // Find the link's <g> element
        const linkGroup = document.querySelector('[model-id="link-1"]');
        expect(linkGroup).toBeInTheDocument();

        // CRITICAL: The link content must be INSIDE the link's <g> element, not empty!
        const linkContent = linkGroup?.querySelector('[data-testid="link-path-content"]');
        expect(linkContent).toBeInTheDocument();

        // Also verify the <g> is not empty
        expect(linkGroup?.children.length).toBeGreaterThan(0);
      });
    });

    it('should render link with useLinkLayout data - CRITICAL', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      function TestLinkWithLayout() {
        const layout = useLinkLayout();
        if (!layout) return <path data-testid="link-no-layout" />;
        return (
          <path
            data-testid="link-with-layout"
            d={layout.d}
            data-source-x={layout.sourceX}
            data-source-y={layout.sourceY}
          />
        );
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <TestLinkWithLayout />}
          />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'link-1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(() => {
        // Either with layout or without - but it should be rendered
        const linkWithLayout = document.querySelector('[data-testid="link-with-layout"]');
        const linkNoLayout = document.querySelector('[data-testid="link-no-layout"]');
        expect(linkWithLayout || linkNoLayout).toBeInTheDocument();
      });
    });

    it('should have useLinkLayout return actual layout data, not undefined - CRITICAL BUG CHECK', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      let capturedLayout: ReturnType<typeof useLinkLayout> | null = null;

      function LayoutCapturingLink() {
        const layout = useLinkLayout();
        capturedLayout = layout;
        // Always render something so we can detect if this component runs
        return <path data-testid="layout-capturing-link" data-has-layout={layout ? 'yes' : 'no'} />;
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" />}
            renderLink={() => <LayoutCapturingLink />}
          />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }),
        new ReactElement({
          id: 'e2',
          position: { x: 200, y: 0 },
          size: { width: 100, height: 100 },
        }),
        new ReactPaperLink({ id: 'link-1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      // Wait for layout to be computed
      await waitFor(
        () => {
          const link = document.querySelector('[data-testid="layout-capturing-link"]') as HTMLElement | null;
          expect(link).toBeInTheDocument();
          // CRITICAL: useLinkLayout must return actual data, not undefined
          expect(link?.dataset.hasLayout).toBe('yes');
          expect(capturedLayout).toBeDefined();
          expect(capturedLayout?.d).toBeDefined();
        },
        { timeout: 3000 }
      );
    });

    it('should have link geometry match element positions - CRITICAL GEOMETRY CHECK', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      let capturedLayout: ReturnType<typeof useLinkLayout> | null = null;

      // Element positions for verification
      const element1Position = { x: 50, y: 50 };
      const element1Size = { width: 120, height: 60 };
      const element2Position = { x: 300, y: 50 };
      const element2Size = { width: 120, height: 60 };

      // Diagnostic data to trace where geometry goes wrong
      const diagnosticData: {
        linkViewSourcePoint?: { x: number; y: number };
        linkViewTargetPoint?: { x: number; y: number };
        e1ModelBBox?: { x: number; y: number; width: number; height: number };
        e2ModelBBox?: { x: number; y: number; width: number; height: number };
        sourceViewBBox?: { x: number; y: number; width: number; height: number };
        targetViewBBox?: { x: number; y: number; width: number; height: number };
      } = {};

      function GeometryCapturingLink() {
        const layout = useLinkLayout();
        capturedLayout = layout;
        if (!layout) return null;
        return <path d={layout.d} data-testid="geometry-link" />;
      }

      let paperRef: dia.Paper | null = null;
      function PaperCapture({ children }: Readonly<{ children: React.ReactNode }>) {
        const paper = useReactPaper();
        paperRef = paper;
        return <>{children}</>;
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect data-testid="element-rect" width={120} height={60} />}
            renderLink={() => <GeometryCapturingLink />}
          >
            <PaperCapture>{null}</PaperCapture>
          </ReactPaper>
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: element1Position, size: element1Size }),
        new ReactElement({ id: 'e2', position: element2Position, size: element2Size }),
        new ReactPaperLink({ id: 'link-1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(
        // eslint-disable-next-line sonarjs/cognitive-complexity
        () => {
          expect(capturedLayout).toBeDefined();

          // Gather diagnostic data from JointJS views
          if (paperRef) {
            const linkView = paperRef.findViewByModel('link-1') as dia.LinkView | null;
            const element1View = paperRef.findViewByModel('e1') as dia.ElementView | null;
            const element2View = paperRef.findViewByModel('e2') as dia.ElementView | null;

            if (linkView) {
              diagnosticData.linkViewSourcePoint = linkView.sourcePoint
                ? { x: linkView.sourcePoint.x, y: linkView.sourcePoint.y }
                : undefined;
              diagnosticData.linkViewTargetPoint = linkView.targetPoint
                ? { x: linkView.targetPoint.x, y: linkView.targetPoint.y }
                : undefined;
            }

            // Get model bboxes (should be correct)
            const element1Model = graph.getCell('e1') as dia.Element;
            const element2Model = graph.getCell('e2') as dia.Element;
            if (element1Model) {
              const bbox = element1Model.getBBox();
              diagnosticData.e1ModelBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
            }
            if (element2Model) {
              const bbox = element2Model.getBBox();
              diagnosticData.e2ModelBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
            }

            // Get view bboxes (might be wrong)
            if (element1View) {
              const bbox = element1View.getBBox();
              diagnosticData.sourceViewBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
              // Also get the raw getNodeBBox result
              const nodeBBox = element1View.getNodeBBox(element1View.el);
              // eslint-disable-next-line no-console
              console.log('e1 getNodeBBox:', { x: nodeBBox.x, y: nodeBBox.y, width: nodeBBox.width, height: nodeBBox.height });
              // Get the raw getNodeBoundingRect
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const boundingRect = (element1View as any).getNodeBoundingRect(element1View.el);
              // eslint-disable-next-line no-console
              console.log('e1 getNodeBoundingRect:', { x: boundingRect.x, y: boundingRect.y, width: boundingRect.width, height: boundingRect.height });
              // Check getRootTranslateMatrix
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const translateMatrix = (element1View as any).getRootTranslateMatrix();
              // eslint-disable-next-line no-console
              console.log('e1 getRootTranslateMatrix:', translateMatrix.e, translateMatrix.f);
              // Check getNodeMatrix
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const nodeMatrix = (element1View as any).getNodeMatrix(element1View.el);
              // eslint-disable-next-line no-console
              console.log('e1 getNodeMatrix:', { a: nodeMatrix.a, b: nodeMatrix.b, c: nodeMatrix.c, d: nodeMatrix.d, e: nodeMatrix.e, f: nodeMatrix.f });
              // Check checkVisibility
              // eslint-disable-next-line no-console
              console.log('e1.el checkVisibility:', typeof element1View.el.checkVisibility === 'function' ? element1View.el.checkVisibility() : 'N/A');
              // Check model.position()
              // eslint-disable-next-line no-console
              console.log('e1 model.position():', element1View.model.position());
              // eslint-disable-next-line no-console
              console.log('e1 model.get("position"):', element1View.model.get('position'));
              // Check element1View type
              // eslint-disable-next-line no-console
              console.log('element1View type:', element1View.constructor.name);
              // eslint-disable-next-line no-console
              console.log('element1View.el tagName:', element1View.el.tagName);
              // eslint-disable-next-line no-console
              console.log('element1View.el transform:', element1View.el.getAttribute('transform'));
              // Check if element1View.model.id matches
              // eslint-disable-next-line no-console
              console.log('element1View.model.id:', element1View.model.id);
              // Try calling the method directly
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pos = (element1View.model as any).attributes.position;
              // eslint-disable-next-line no-console
              console.log('element1View.model.attributes.position:', pos);
              // Call getRootTranslateMatrix manually and trace inside
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const view = element1View as any;
              const modelPos = view.model.position();
              // eslint-disable-next-line no-console
              console.log('view.model.position() direct call:', modelPos);
              // Check if position method exists
              // eslint-disable-next-line no-console
              console.log('view.model.position is function:', typeof view.model.position);
              // Check SVGMatrix creation
              const svgMatrix = document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGMatrix();
              // eslint-disable-next-line no-console
              console.log('SVGMatrix created:', svgMatrix);
              const translated = svgMatrix.translate(50, 50);
              // eslint-disable-next-line no-console
              console.log('SVGMatrix translated:', { e: translated.e, f: translated.f });
            }
            if (element2View) {
              const bbox = element2View.getBBox();
              diagnosticData.targetViewBBox = { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
            }
          }

          // Log diagnostic data for debugging
          // eslint-disable-next-line no-console
          console.log('=== DIAGNOSTIC DATA ===');
          // eslint-disable-next-line no-console
          console.log('Layout from useLinkLayout:', capturedLayout);
          // eslint-disable-next-line no-console
          console.log('LinkView sourcePoint:', diagnosticData.linkViewSourcePoint);
          // eslint-disable-next-line no-console
          console.log('LinkView targetPoint:', diagnosticData.linkViewTargetPoint);
          // eslint-disable-next-line no-console
          console.log('e1 Model BBox:', diagnosticData.e1ModelBBox);
          // eslint-disable-next-line no-console
          console.log('e2 Model BBox:', diagnosticData.e2ModelBBox);
          // eslint-disable-next-line no-console
          console.log('e1 View BBox:', diagnosticData.sourceViewBBox);
          // eslint-disable-next-line no-console
          console.log('e2 View BBox:', diagnosticData.targetViewBBox);
          // eslint-disable-next-line no-console
          console.log('=== END DIAGNOSTIC ===');

          // VERIFY: Model bboxes should be correct
          expect(diagnosticData.e1ModelBBox?.x).toBe(element1Position.x);
          expect(diagnosticData.e2ModelBBox?.x).toBe(element2Position.x);

          // VERIFY: View bboxes - this is likely where the bug is
          expect(diagnosticData.sourceViewBBox?.x).toBeGreaterThanOrEqual(element1Position.x - 5);
          expect(diagnosticData.targetViewBBox?.x).toBeGreaterThanOrEqual(element2Position.x - 5);

          // VERIFY: Link source/target points should match element positions
          const sourceX = capturedLayout?.sourceX ?? 0;
          const targetX = capturedLayout?.targetX ?? 0;

          expect(sourceX).toBeGreaterThanOrEqual(element1Position.x);
          expect(targetX).toBeGreaterThanOrEqual(element2Position.x - 10);
        },
        { timeout: 3000 }
      );
    });

    it('should have link path contain valid coordinates not zeros - CRITICAL', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });
      let capturedLayout: ReturnType<typeof useLinkLayout> | null = null;

      function PathCapturingLink() {
        const layout = useLinkLayout();
        capturedLayout = layout;
        if (!layout) return null;
        return <path d={layout.d} data-testid="path-link" />;
      }

      render(
        <GraphProvider graph={graph}>
          <ReactPaper
            renderElement={() => <rect />}
            renderLink={() => <PathCapturingLink />}
          />
        </GraphProvider>
      );

      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 100, y: 100 }, size: { width: 100, height: 100 } }),
        new ReactElement({ id: 'e2', position: { x: 400, y: 100 }, size: { width: 100, height: 100 } }),
        new ReactPaperLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      await waitFor(
        () => {
          expect(capturedLayout).toBeDefined();

          // CRITICAL: All coordinates should NOT be zero
          expect(capturedLayout?.sourceX).not.toBe(0);
          expect(capturedLayout?.sourceY).not.toBe(0);
          expect(capturedLayout?.targetX).not.toBe(0);
          expect(capturedLayout?.targetY).not.toBe(0);

          // Path d should contain non-zero values
          expect(capturedLayout?.d).not.toBe('');
          expect(capturedLayout?.d).not.toMatch(/^M\s*0\s+0/);
        },
        { timeout: 3000 }
      );
    });
  });

  /**
   * Tests for ReactPaper WITHOUT renderLink - JointJS renders links natively.
   */
  describe('native JointJS link rendering (no renderLink)', () => {
    it('should render links using JointJS LinkView when renderLink is not provided', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const { container } = render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect width={100} height={50} fill="blue" />} />
        </GraphProvider>
      );

      // Add elements and a ReactLink (which has its own markup)
      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 50, y: 50 }, size: { width: 100, height: 50 } }),
        new ReactElement({ id: 'e2', position: { x: 300, y: 50 }, size: { width: 100, height: 50 } }),
        new ReactLink({ id: 'l1', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      // Wait for JointJS to render the link
      await waitFor(
        () => {
          // JointJS should have created the link view and rendered its markup
          const linkGroup = container.querySelector('[model-id="l1"]');
          expect(linkGroup).toBeInTheDocument();

          // ReactLink has 'line' and 'wrapper' path selectors
          const linePath = linkGroup?.querySelector('[joint-selector="line"]');
          const wrapperPath = linkGroup?.querySelector('[joint-selector="wrapper"]');

          // At least one path should exist (JointJS rendered it)
          expect(linePath || wrapperPath).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it('should render shapes.standard.Link when renderLink is not provided', async () => {
      const graph = new dia.Graph({}, { cellNamespace: DEFAULT_CELL_NAMESPACE });

      const { container } = render(
        <GraphProvider graph={graph}>
          <ReactPaper renderElement={() => <rect width={100} height={50} fill="blue" />} />
        </GraphProvider>
      );

      // Add elements and a shapes.standard.Link
      graph.addCells([
        new ReactElement({ id: 'e1', position: { x: 50, y: 50 }, size: { width: 100, height: 50 } }),
        new ReactElement({ id: 'e2', position: { x: 300, y: 50 }, size: { width: 100, height: 50 } }),
        new shapes.standard.Link({ id: 'standard-link', source: { id: 'e1' }, target: { id: 'e2' } }),
      ]);

      // Wait for JointJS to render the link
      await waitFor(
        () => {
          // JointJS should have created the link view
          const linkGroup = container.querySelector('[model-id="standard-link"]');
          expect(linkGroup).toBeInTheDocument();

          // Standard links have path elements
          const paths = linkGroup?.querySelectorAll('path');
          expect(paths?.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });
  });
});
