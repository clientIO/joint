/* eslint-disable sonarjs/pseudo-random */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */

import {
  createElements,
  createLinks,
  GraphProvider,
  useGraph,
  type GraphProps,
  type InferElement,
  Paper,
} from '@joint/react';
import '../../examples/index.css';
import { BUTTON_CLASSNAME, PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { dia } from '@joint/plus';
import { useRef, useState, useCallback } from 'react';

const defaultElements = createElements([
  { id: '1', label: 'Hello', x: 100, y: 0, width: 100, height: 50 },
  { id: '2', label: 'World', x: 100, y: 200, width: 100, height: 50 },
]);

const defaultLinks = createLinks([
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    attrs: {
      line: {
        stroke: PRIMARY,
      },
    },
  },
]);

type CustomElement = InferElement<typeof defaultElements>;
type CustomLink = (typeof defaultLinks)[number];

function RenderItem(props: CustomElement) {
  const { label, width, height } = props;
  return (
    <foreignObject width={width} height={height}>
      <div className="node">{label}</div>
    </foreignObject>
  );
}

interface PaperAppProps {
  readonly elements: readonly CustomElement[];
  readonly links: readonly CustomLink[];
  readonly onElementsChange: (items: readonly CustomElement[]) => void;
  readonly onLinksChange: (items: readonly CustomLink[]) => void;
}

function PaperApp({ elements, links, onElementsChange, onLinksChange }: PaperAppProps) {
  const graph = useGraph();
  const commandManager = useRef(new dia.CommandManager({ graph }));

  return (
    <div className="flex flex-col gap-4">
      <Paper width="100%" className={PAPER_CLASSNAME} height={400} renderElement={RenderItem} />
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            const newElement: CustomElement = {
              id: Math.random().toString(36).slice(7),
              label: 'New Node',
              x: Math.random() * 200,
              y: Math.random() * 200,
              width: 100,
              height: 50,
            } as CustomElement;
            onElementsChange([...elements, newElement]);
          }}
        >
          Add Element
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            if (elements.length > 0) {
              onElementsChange(elements.slice(0, -1));
              onLinksChange([]);
            }
          }}
        >
          Remove Last
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            onElementsChange(defaultElements);
            onLinksChange(defaultLinks);
          }}
        >
          Reset
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            commandManager.current.undo();
          }}
        >
          Undo
        </button>
        <button
          type="button"
          className={BUTTON_CLASSNAME}
          onClick={() => {
            commandManager.current.redo();
          }}
        >
          Redo
        </button>
      </div>
    </div>
  );
}

function Main(props: Readonly<GraphProps<dia.Graph, CustomElement, CustomLink>>) {
  const [elements, setElements] = useState<readonly CustomElement[]>(defaultElements);
  const [links, setLinks] = useState<readonly CustomLink[]>(defaultLinks);

  const handleElementsChange = useCallback((items: readonly CustomElement[]) => {
    setElements(items);
  }, []);

  const handleLinksChange = useCallback((items: readonly CustomLink[]) => {
    setLinks(items);
  }, []);

  return (
    <GraphProvider
      {...props}
      elements={elements}
      links={links}
      onElementsChange={handleElementsChange}
      onLinksChange={handleLinksChange}
    >
      <PaperApp
        elements={elements}
        links={links}
        onElementsChange={handleElementsChange}
        onLinksChange={handleLinksChange}
      />
    </GraphProvider>
  );
}

export default function App(props: Readonly<GraphProps<dia.Graph, CustomElement, CustomLink>>) {
  return <Main {...props} />;
}

