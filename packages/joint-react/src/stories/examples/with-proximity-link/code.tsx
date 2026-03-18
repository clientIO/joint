/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  useMeasureNode,
  useElementId,
  useElements,
  useGraph,
} from '@joint/react';
import { util } from '@joint/core';
import '../index.css';
import { useEffect, useRef } from 'react';
import { PAPER_CLASSNAME, SECONDARY } from 'storybook-config/theme';
import type { dia } from '../../../../../joint-core/types';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 15 },
  '2': { label: 'Node 2', x: 100, y: 200 },
  '3': { label: 'Node 3', x: 280, y: 100 },
  '4': { label: 'Node 4', x: 15, y: 100 },
};

type BaseElementWithData = (typeof initialElements)[string];

const PROXIMITY_THRESHOLD = 60;

function getProximityLink(id: dia.Cell.ID, closeId: dia.Cell.ID) {
  const [source, target] = [String(id), String(closeId)].toSorted((first, second) =>
    first.localeCompare(second)
  );
  return {
    linkId: `${source}-${target}`,
    source,
    target,
  };
}

function ResizableNode({ label }: Readonly<BaseElementWithData>) {
  const id = useElementId();
  const nodeRef = useRef<HTMLDivElement>(null);

  const { graph } = useGraph();
  const element = graph.getCell(id);
  const closeIds = useElements(() => {
    const area = element.getBBox().inflate(PROXIMITY_THRESHOLD);
    const proximityElements = graph
      .findElementsInArea(area)
      .filter((element_) => element_.id !== id);
    return proximityElements.map((element_) => element_.id);
  }, util.isEqual);
  const { setLink, removeLink } = useGraph();

  useEffect(() => {
    for (const closeId of closeIds) {
      const { linkId, source, target } = getProximityLink(id, closeId);
      setLink(linkId, {
        source,
        target,
        color: SECONDARY,
        strokeWidth: 2,
        strokeDashArray: '5 5',
      });
    }
    return () => {
      for (const closeId of closeIds) {
        const { linkId } = getProximityLink(id, closeId);
        removeLink(linkId);
      }
    };
  }, [closeIds, id, removeLink, setLink]);

  const { width, height } = useMeasureNode(nodeRef);
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
    <GraphProvider elements={initialElements}>
      <Main />
    </GraphProvider>
  );
}
