/* eslint-disable react-perf/jsx-no-new-object-as-prop */
import {
  GraphProvider,
  Paper,
  useElementId,
  useGraph,
  type Element,
  DefaultElement,
  useElements,
} from '@joint/react';
import { util } from '@joint/core';
import '../index.css';
import { useEffect } from 'react';
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';

interface NodeData {
  readonly [key: string]: unknown;
  readonly label: string;
}

const initialElements: Record<string, Element<NodeData>> = {
  '1': { data: { label: 'Node 1' }, position: { x: 100, y: 15 } },
  '2': { data: { label: 'Node 2' }, position: { x: 100, y: 200 } },
  '3': { data: { label: 'Node 3' }, position: { x: 280, y: 100 } },
  '4': { data: { label: 'Node 4' }, position: { x: 15, y: 100 } },
};

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

function ResizableNode({ label }: Readonly<NodeData>) {
  const id = useElementId();

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
        color: PRIMARY,
        width: 2,
        dasharray: '5 5',
      });
    }
    return () => {
      for (const closeId of closeIds) {
        const { linkId } = getProximityLink(id, closeId);
        removeLink(linkId);
      }
    };
  }, [closeIds, id, removeLink, setLink]);

  return <DefaultElement label={label} />;
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
