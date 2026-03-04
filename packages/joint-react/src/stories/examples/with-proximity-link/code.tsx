/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import { GraphProvider, Paper, useNodeSize, useCellId, useElements, useGraph } from '@joint/react';
import '../index.css';
import { useEffect, useRef } from 'react';
import { shapes, util } from '@joint/core';
import { PAPER_CLASSNAME, SECONDARY } from 'storybook-config/theme';
import type { dia } from '../../../../../joint-core/types';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 0 },
  '2': { label: 'Node 2', x: 100, y: 200 },
  '3': { label: 'Node 3', x: 280, y: 100 },
  '4': { label: 'Node 4', x: 0, y: 100 },
};

type BaseElementWithData = (typeof initialElements)[string];

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

function getLinkId(id: dia.Cell.ID, closeId: dia.Cell.ID) {
  return `${id}-${closeId}`;
}

function ResizableNode({ label }: Readonly<BaseElementWithData>) {
  const id = useCellId();
  const nodeRef = useRef<HTMLDivElement>(null);

  const graph = useGraph();
  const element = graph.getCell(id);
  const closeIds = useElements(() => {
    const area = element.getBBox().inflate(PROXIMITY_THRESHOLD);
    const proximityElements = graph
      .findElementsInArea(area)
      .filter((element_) => element_.id !== id);
    return proximityElements.map((element_) => element_.id);
  });

  useEffect(() => {
    for (const closeId of closeIds) {
      const linkId = getLinkId(id, closeId);
      // Check if the link or the reverse link already exists
      if (graph.getCell(linkId)) continue;
      // eslint-disable-next-line sonarjs/arguments-order
      if (graph.getCell(getLinkId(closeId, id))) continue;

      const link = new DashedLink({
        id: linkId,
        source: { id },
        target: { id: closeId },
      });
      graph.addCell(link, { async: false });
    }
    return () => {
      for (const closeId of closeIds) {
        const linkId = getLinkId(id, closeId);
        graph.getCell(linkId)?.remove();
      }
    };
  }, [closeIds, graph, id]);

  const { width, height } = useNodeSize(nodeRef);
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
