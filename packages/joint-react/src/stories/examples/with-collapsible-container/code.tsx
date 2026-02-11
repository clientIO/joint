/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { useCallback, useEffect } from 'react';
import { dia, elementTools } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCellId,
  useGraph,
  TextNode,
  type GraphElement,
  type GraphLink,
} from '@joint/react';
import { PAPER_CLASSNAME } from 'storybook-config/theme';
import '../index.css';

// ============================================================================
// Constants
// ============================================================================

const HEADER_HEIGHT = 30;
const PADDING = 10;

// Colors
const CONTAINER_HEADER_COLOR = '#4666E5';
const CONTAINER_BODY_COLOR = '#FCFCFC';
const CONTAINER_STROKE_COLOR = '#DDDDDD';
const CHILD_BODY_COLOR = '#F9DBDF';
const CHILD_STROKE_COLOR = '#FF4365';
const SHADOW_COLOR = '#000000';
const TEXT_COLOR = '#222222';
const LINK_COLOR = '#222222';

// ============================================================================
// Utilities
// ============================================================================

function fitContainer(container: dia.Element, collapsed: boolean) {
  if (collapsed) {
    container.resize(140, HEADER_HEIGHT);
    return;
  }

  container.fitToChildren({
    padding: {
      top: HEADER_HEIGHT + PADDING,
      left: PADDING,
      right: PADDING,
      bottom: PADDING,
    },
  });
}

// ============================================================================
// Types
// ============================================================================

const ElementType = {
  Container: 'container',
  Child: 'child',
} as const;

type ElementType = (typeof ElementType)[keyof typeof ElementType];

interface BaseContainerElement extends GraphElement {
  elementType: ElementType;
}

interface ContainerElement extends BaseContainerElement {
  elementType: typeof ElementType.Container;
  title: string;
  collapsed: boolean;
}

interface ChildElement extends BaseContainerElement {
  elementType: typeof ElementType.Child;
  label: string;
}

type ContainerGraphElement = ContainerElement | ChildElement;

// ============================================================================
// Initial Data
// ============================================================================

const elements: Record<string, ContainerGraphElement> = {
  'container-a': {
    elementType: ElementType.Container,
    title: 'Container A',
    collapsed: false,
    x: 50,
    y: 50,
    width: 340,
    height: 280,
    z: 1,
  },
  'container-b': {
    elementType: ElementType.Container,
    title: 'Container B',
    collapsed: false,
    x: 280,
    y: 180,
    width: 180,
    height: 130,
    z: 3,
    parent: 'container-a',
  },
  'child-1': {
    elementType: ElementType.Child,
    label: '1',
    x: 150,
    y: 100,
    width: 50,
    height: 50,
    z: 2,
    parent: 'container-a',
  },
  'child-2': {
    elementType: ElementType.Child,
    label: '2',
    x: 100,
    y: 200,
    width: 50,
    height: 50,
    z: 2,
    parent: 'container-a',
  },
  'child-3': {
    elementType: ElementType.Child,
    label: '3',
    x: 200,
    y: 200,
    width: 50,
    height: 50,
    z: 2,
    parent: 'container-a',
  },
  'child-4': {
    elementType: ElementType.Child,
    label: '4',
    x: 300,
    y: 220,
    width: 50,
    height: 50,
    z: 4,
    parent: 'container-b',
  },
  'child-5': {
    elementType: ElementType.Child,
    label: '5',
    x: 390,
    y: 220,
    width: 50,
    height: 50,
    z: 4,
    parent: 'container-b',
  },
};

const links: Record<string, GraphLink> = {
  'link-1-2': {
    source: 'child-1',
    target: 'child-2',
    z: 2,
    color: LINK_COLOR,
    width: 1,
    targetMarker: {
      d: 'M 4 -4 0 0 4 4 M 7 -4 3 0 7 4 M 10 -4 6 0 10 4',
      fill: 'none',
    },
  },
  'link-1-3': {
    source: 'child-1',
    target: 'child-3',
    z: 2,
    color: LINK_COLOR,
    width: 1,
    targetMarker: {
      d: 'M 4 -4 0 0 4 4 M 7 -4 3 0 7 4 M 10 -4 6 0 10 4',
      fill: 'none',
    },
  },
  'link-4-5': {
    source: 'child-4',
    target: 'child-5',
    z: 4,
    color: LINK_COLOR,
    width: 1,
    targetMarker: {
      d: 'M 4 -4 0 0 4 4 M 7 -4 3 0 7 4 M 10 -4 6 0 10 4',
      fill: 'none',
    },
  },
  'link-1-b': {
    source: 'child-1',
    target: 'container-b',
    z: 4,
    color: LINK_COLOR,
    width: 1,
    targetMarker: {
      d: 'M 4 -4 0 0 4 4 M 7 -4 3 0 7 4 M 10 -4 6 0 10 4',
      fill: 'none',
    },
  },
};

// ============================================================================
// Components
// ============================================================================

function ExpandButton({
  collapsed,
  transform,
  onClick,
}: Readonly<{ collapsed: boolean; transform?: string; onClick: () => void }>) {
  const d = collapsed ? 'M -4 0 4 0 M 0 -4 0 4' : 'M -4 0 4 0';

  return (
    <g transform={transform} onClick={onClick} style={{ cursor: 'pointer' }}>
      <rect
        fill={SHADOW_COLOR}
        fillOpacity={0.2}
        stroke="#FFFFFF"
        strokeWidth={0.5}
        x={-7}
        y={-7}
        width={14}
        height={14}
      />
      <path d={d} fill="none" stroke="#FFFFFF" strokeWidth={1} pointerEvents="none" />
    </g>
  );
}

function ContainerNode({
  title,
  collapsed = false,
  width = 140,
  height = 100,
}: Readonly<ContainerElement>) {
  const id = useCellId();
  const graph = useGraph();

  const handleToggle = useCallback(() => {
    const cell = graph.getCell(id);
    if (!cell?.isElement()) return;
    const container = cell as dia.Element;

    const isCollapsed = !collapsed;

    container.prop('data/collapsed', isCollapsed);
    fitContainer(container, isCollapsed);
  }, [id, graph, collapsed]);

  return (
    <>
      {/* Body */}
      <rect
        width={width}
        height={height}
        fill={CONTAINER_BODY_COLOR}
        stroke={CONTAINER_STROKE_COLOR}
        strokeWidth={1}
      />
      {/* Header */}
      <rect
        width={width}
        height={HEADER_HEIGHT}
        fill={CONTAINER_HEADER_COLOR}
        stroke={CONTAINER_HEADER_COLOR}
        strokeWidth={0.5}
      />
      {/* Header text */}
      <TextNode
        x={8}
        y={HEADER_HEIGHT / 2}
        dominantBaseline="middle"
        textAnchor="start"
        fill="#FFFFFF"
        fontSize={16}
        fontFamily="sans-serif"
        letterSpacing={1}
        style={{ textShadow: '1px 1px #222222' }}
        width={width - 40}
        textWrap={{
          maxLineCount: 1,
          ellipsis: '*',
        }}
      >
        {title}
      </TextNode>
      {/* Expand/Collapse button */}
      <ExpandButton
        transform={`translate(${width - HEADER_HEIGHT / 2}, ${HEADER_HEIGHT / 2})`}
        collapsed={collapsed}
        onClick={handleToggle}
      />
    </>
  );
}

function ChildNode({ label, width = 50, height = 50 }: Readonly<ChildElement>) {
  return (
    <>
      {/* Body */}
      <rect
        width={width}
        height={height}
        fill={CHILD_BODY_COLOR}
        stroke={CHILD_STROKE_COLOR}
        strokeWidth={1}
      />
      {/* Label */}
      <text
        x={width / 2}
        y={height / 2}
        dominantBaseline="middle"
        textAnchor="middle"
        fill={TEXT_COLOR}
        fontSize={14}
        fontFamily="sans-serif"
      >
        {label}
      </text>
    </>
  );
}

// ============================================================================
// Container Auto-Resize Hook
// ============================================================================

function useContainerAutoResize() {
  const graph = useGraph();

  useEffect(() => {
    const updateContainerSize = (cell: dia.Cell | null) => {
      if (!cell?.isElement()) return;
      const container = cell as dia.Element;

      // Check if this is a container by looking at its embeds
      const embeds = container.getEmbeddedCells().filter((c) => c.isElement());
      if (embeds.length === 0) return;

      fitContainer(container, container.prop('data/collapsed'));
    };

    const handleChange = (cell: dia.Cell) => {
      if (cell.isLink()) return;
      const container = (cell as dia.Element).getParentCell();
      updateContainerSize(container);
    };

    const handleParentChange = (child: dia.Cell, newParentId?: string) => {
      if (child.isLink()) return;
      // Use the new parent id if it is defined,
      // otherwise use the previous parent id (for when the child is removed)
      const containerId = newParentId || child.previous('parent');
      const container = graph.getCell(containerId);
      updateContainerSize(container);
    };

    graph.on('change:position', handleChange);
    graph.on('change:size', handleChange);
    graph.on('change:parent', handleParentChange);

    return () => {
      graph.off('change:position', handleChange);
      graph.off('change:size', handleChange);
      graph.off('change:parent', handleParentChange);
    };
  }, [graph]);
}

// ============================================================================
// Main Component
// ============================================================================

function Main() {
  useContainerAutoResize();

  const graph = useGraph();

  // Cell visibility callback - hides children when parent container is collapsed
  const cellVisibility = useCallback((cell: dia.Cell) => {
    const hasCollapsedAncestor = (cellToCheck: dia.Cell) => {
      return cellToCheck
        .getAncestors()
        .some((ancestor) => ancestor.prop('data/collapsed') === true);
    };

    if (cell.isLink()) {
      const link = cell as dia.Link;
      const sourceCell = link.getSourceCell();
      const targetCell = link.getTargetCell();
      // Hide link if source or target (or their ancestors) is collapsed
      if (sourceCell && hasCollapsedAncestor(sourceCell)) return false;
      if (targetCell && hasCollapsedAncestor(targetCell)) return false;
      return true;
    }

    return !hasCollapsedAncestor(cell);
  }, []);

  const renderElement = useCallback((element: ContainerGraphElement) => {
    switch (element.elementType) {
      case ElementType.Container: {
        return <ContainerNode {...element} />;
      }
      case ElementType.Child: {
        return <ChildNode {...element} />;
      }
    }
  }, []);

  // Initial setup - fit containers to their children on first render
  useEffect(() => {
    const containers = graph
      .getElements()
      .filter((element) => element.prop('data/elementType') === ElementType.Container);
    for (const container of containers) {
      fitContainer(container, container.prop('data/collapsed'));
    }
  }, [graph]);

  const handleElementMouseEnter = useCallback(
    ({ elementView }: { elementView: dia.ElementView }) => {
      elementView.removeTools();
      elementView.addTools(
        new dia.ToolsView({
          tools: [
            new elementTools.Remove({
              useModelGeometry: true,
              y: 0,
              x: 0,
            }),
          ],
        })
      );
    },
    []
  );

  const handleElementMouseLeave = useCallback(
    ({ elementView }: { elementView: dia.ElementView }) => {
      elementView.removeTools();
    },
    []
  );

  return (
    <Paper
      height={500}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
      cellVisibility={cellVisibility}
      interactive={{ linkMove: false }}
      background={{ color: '#F3F7F6' }}
      onElementMouseEnter={handleElementMouseEnter}
      onElementMouseLeave={handleElementMouseLeave}
      async
    />
  );
}

export default function App() {
  return (
    <GraphProvider elements={elements} links={links}>
      <Main />
    </GraphProvider>
  );
}
