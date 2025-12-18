/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { createElements, GraphProvider, Paper, type InferElement, useNodeSize } from '@joint/react';
import '../index.css';
import { useRef } from 'react';
import { shapes, util } from '@joint/core';
import { PAPER_CLASSNAME, SECONDARY } from 'storybook-config/theme';
import type { dia } from '../../../../../joint-core/types';
import { useCellChangeEffect } from '../../../hooks/use-cell-change-effect';

const initialElements = createElements([
  { id: '1', label: 'Node 1', x: 100, y: 0 },
  { id: '2', label: 'Node 2', x: 100, y: 200 },
  { id: '3', label: 'Node 3', x: 280, y: 100 },
  { id: '4', label: 'Node 4', x: 0, y: 100 },
]);

type BaseElementWithData = InferElement<typeof initialElements>;

class DashedLink extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(
      {
        type: 'DashedLink',
        attrs: {
          line: {
            stroke: SECONDARY,
            strokeWidth: 2,
            strokeDasharray: '5,5',
            sourceMarker: {
              d: 'M 10 -5 0 0 10 5 z',
            },
          },
        },
      },
      super.defaults
    );
  }
}

const PROXIMITY_THRESHOLD = 60;

function getLinkId(id: dia.Cell.ID | null, closeId: dia.Cell.ID | null) {
  return `${id}-${closeId}`;
}

function shouldReactToChange(
  change: { readonly cell?: dia.Cell } | undefined,
  elementId: dia.Cell.ID
): boolean {
  if (!change) {
    return true;
  }

  const changedCell = change.cell;
  if (!changedCell) {
    return true;
  }

  // Ignore changes to links (they are instances of Link, not Element)
  if (changedCell.isLink()) {
    return false;
  }

  // Only react if the changed cell is the element we're tracking
  return changedCell.id === elementId;
}

function removeOldLinks(
  graph: dia.Graph,
  managedLinks: Set<string>,
  currentLinkIds: Set<string>
): void {
  for (const linkId of managedLinks) {
    if (!currentLinkIds.has(linkId)) {
      graph.getCell(linkId)?.remove();
      managedLinks.delete(linkId);
    }
  }
}

function createProximityLinks(
  graph: dia.Graph,
  elementId: dia.Cell.ID,
  closeIds: readonly dia.Cell.ID[],
  managedLinks: Set<string>
): void {
  for (const closeId of closeIds) {
    const linkId = getLinkId(elementId, closeId);
    const linkIdString = String(linkId);
    // Check if the link or the reverse link already exists
    if (graph.getCell(linkId)) {
      managedLinks.add(linkIdString);
      continue;
    }
    if (graph.getCell(getLinkId(closeId, elementId))) {
      continue;
    }

    const link = new DashedLink({
      id: linkId,
      source: { id: elementId },
      target: { id: closeId },
    });
    graph.addCell(link, { async: false });
    managedLinks.add(linkIdString);
  }
}

function ResizableNode({ id, label, width, height }: Readonly<BaseElementWithData>) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const managedLinksRef = useRef<Set<string>>(new Set());

  useCellChangeEffect(
    ({ graph, change }) => {
      if (!shouldReactToChange(change, id)) {
        return;
      }

      const element = graph.getCell(id);
      if (!element || element.isLink()) {
        return;
      }

      const area = element.getBBox().inflate(PROXIMITY_THRESHOLD);
      const proximityElements = graph
        .findElementsInArea(area)
        .filter((element_) => element_.id !== id);
      const closeIds = proximityElements.map((element_) => element_.id);

      // Clean up old links that are no longer needed
      const currentLinkIds = new Set<string>();
      for (const closeId of closeIds) {
        const linkId = getLinkId(id, closeId);
        currentLinkIds.add(String(linkId));
      }

      removeOldLinks(graph, managedLinksRef.current, currentLinkIds);
      createProximityLinks(graph, id, closeIds, managedLinksRef.current);

      return () => {
        for (const linkId of managedLinksRef.current) {
          graph.getCell(linkId)?.remove();
        }
        managedLinksRef.current.clear();
      };
    },
    [id]
  );

  useNodeSize(nodeRef);
  return (
    <foreignObject width={width} height={height}>
      <div ref={nodeRef} className="node">
        {label}
      </div>
    </foreignObject>
  );
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', position: 'relative' }}>
      <Paper
        width="100%"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={ResizableNode}
        defaultAnchor={{
          name: 'perpendicular',
          args: { useModelGeometry: true },
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <GraphProvider elements={initialElements} cellNamespace={{ DashedLink }}>
      <Main />
    </GraphProvider>
  );
}
