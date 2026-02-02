/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { useCallback, useEffect, useState } from 'react';
import type { dia } from '@joint/core';
import {
  GraphProvider,
  Paper,
  useCellId,
  useGraph,
  TextNode,
  type GraphElement,
  type GraphLink,
} from '@joint/react';
import { useCellActions } from '../../../hooks/use-cell-actions';
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

function fitContainer(element: dia.Element, collapsed: boolean) {
  if (collapsed) {
    element.resize(140, HEADER_HEIGHT);
    return;
  }

  element.fitToChildren({
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

function ExpandButton({ collapsed, transform, onClick }: Readonly<{ collapsed: boolean; transform?: string; onClick: () => void }>) {
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

function RemoveButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <g transform="translate(0, 0)" onClick={onClick} style={{ cursor: 'pointer' }}>
      <circle cx={0} cy={0} r={8} fill="#FF4365" stroke="#FFFFFF" strokeWidth={1} />
      <path d="M -3 -3 L 3 3 M -3 3 L 3 -3" stroke="#FFFFFF" strokeWidth={1.5} />
    </g>
  );
}

function ContainerNode({ title, collapsed = false, width = 140, height = 100 }: Readonly<ContainerElement>) {
  const [isHovered, setIsHovered] = useState(false);
  const id = useCellId();
  const { set, remove } = useCellActions<ContainerElement>();
  const graph = useGraph();

  const handleToggle = useCallback(() => {
    const cell = graph.getCell(id);
    if (!cell?.isElement()) return;
    const element = cell as dia.Element;

    const isCollapsed = !collapsed;

    cell.prop('data/collapsed', isCollapsed, { silent: true });
    fitContainer(element, isCollapsed);

    set(id, (previous) => ({
      ...previous,
      // collapsed: isCollapsed,
      x: (previous.x ?? 0) + 1
    }));

  }, [id, graph, collapsed, set]);

  const handleRemove = useCallback(() => {
    const cell = graph.getCell(id);
    if (cell?.isElement()) {
      const embedded = (cell as dia.Element).getEmbeddedCells();
      for (const child of embedded) {
        child.remove();
      }
    }
    remove(id);
  }, [graph, id, remove]);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
      {/* Remove button (on hover) */}
      {isHovered && (
        <RemoveButton onClick={handleRemove} />
      )}
    </g>
  );
}

function ChildNode({ label, width = 50, height = 50 }: Readonly<ChildElement>) {
  const [isHovered, setIsHovered] = useState(false);
  const id = useCellId();
  const { remove } = useCellActions<ChildElement>();

  const handleRemove = useCallback(() => {
    remove(id);
  }, [id, remove]);

  return (
    <g
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
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
      {/* Remove button (on hover) */}
      {isHovered && (
        <g transform="translate(0, 0)">
          <RemoveButton onClick={handleRemove} />
        </g>
      )}
    </g>
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
      const element = cell as dia.Element;

      // Check if this is a container by looking at its embeds
      const embeds = element.getEmbeddedCells().filter((c) => c.isElement());
      if (embeds.length === 0) return;

      fitContainer(element, element.prop('data/collapsed'));
    };

    const handleChange = (cell: dia.Cell) => {
      if (cell.isLink()) return;
      const parent = (cell as dia.Element).getParentCell();
      updateContainerSize(parent);
    };

    const handleEmbeds = (cell: dia.Cell) => {
      if (cell.isLink()) return;
      updateContainerSize(cell);
    };

    graph.on('change:position', handleChange);
    graph.on('change:size', handleChange);
    graph.on('remove', handleChange);
    graph.on('change:embeds', handleEmbeds);

    return () => {
      graph.off('change:position', handleChange);
      graph.off('change:size', handleChange);
      graph.off('remove', handleChange);
      graph.off('change:embeds', handleEmbeds);
    };
  }, [graph]);
}

// ============================================================================
// Main Component
// ============================================================================

function Main() {
  useContainerAutoResize();

  const graph = useGraph();

  // Cell visibility callback - hides children when parent is collapsed
  const cellVisibility = useCallback(
    (cell: dia.Cell) => {
      const hasCollapsedAncestor = (element: dia.Cell) => {
        return element.getAncestors().some((ancestor) => ancestor.prop('data/collapsed') === true);
      };

      if (cell.isLink()) {
        const link = cell as dia.Link;
        const source = link.getSourceCell();
        const target = link.getTargetCell();
        // Hide link if source or target (or their ancestors) is collapsed
        if (source && hasCollapsedAncestor(source)) return false;
        if (target && hasCollapsedAncestor(target)) return false;
        return true;
      }

      return !hasCollapsedAncestor(cell);
    },
    []
  );

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
    const containers = graph.getElements().filter(
      (graphElement) => graphElement.prop('data/elementType') === ElementType.Container
    );
    for (const container of containers) {
      fitContainer(container, container.prop('data/collapsed'));
    }
  }, [graph]);

  return (
    <Paper
      width="100%"
      height={500}
      className={PAPER_CLASSNAME}
      renderElement={renderElement}
      cellVisibility={cellVisibility}
      interactive={{ linkMove: false }}
      background={{ color: '#F3F7F6' }}
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
