import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import { shapes, util, dia } from '@joint/core';
import '../index.css';
import {
  GraphProvider,
  Paper,
  type Element,
  type Link,
  type RenderElement,
  useElements,
  useElementSize,
  PortalElement,
  PortalLink,
} from '@joint/react';
import { useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

const SECONDARY = '#6366f1';

/**
 * Element user data: raw JointJS cell JSON — nested `position`/`size`,
 * with custom properties (`label`, `color`) at the top level.
 * The mapper is near-identity.
 */
interface ElementData {
  readonly [key: string]: unknown;
  readonly label: string;
  readonly color: string;
}

interface LinkData {
  readonly [key: string]: unknown;
  readonly type: string;
}

// ============================================================================
// Data
// ============================================================================

const initialElements: Record<string, Element<ElementData>> = {
  'node-1': {
    position: { x: 70, y: 100 },
    size: { width: 160, height: 60 },
    type: 'MyPortalElement',
    data: {
      label: 'Node 1',
      color: PRIMARY,
    },
  },
  'node-2': {
    position: { x: 370, y: 70 },
    size: { width: 160, height: 60 },
    type: 'MyPortalElement',
    data: {
      label: 'Node 2',
      color: SECONDARY,
    },
  },
  'node-3': {
    position: { x: 220, y: 250 },
    size: { width: 160, height: 60 },
    type: 'MyPortalElement',
    data: {
      label: 'Node 3',
      color: '#10b981',
    },
  },
};

const initialLinks: Record<string, Link<LinkData>> = {
  'link-1': {
    data: {
      type: 'PortalLink',
    },
    source: { id: 'node-1' },
    target: { id: 'node-2' },
  },
  'link-2': {
    data: {
      type: 'PortalLink',
    },
    source: { id: 'node-1' },
    target: { id: 'node-3' },
  },
};

// Derive pick keys from the user data so the reverse mappers stay in sync
// with the types automatically — add a property to the data and it flows through.
const ELEMENT_KEYS = Object.keys(Object.values(initialElements)[0]);
const LINK_USER_DATA_KEYS = Object.keys(Object.values(initialLinks)[0].data as object);

/**
 * Reverse mapper: pick only the keys defined in the data format.
 * Wraps custom fields in `data` so useElementData() can access them.
 */
const mapAttributesToElement = (options: { element: Element<ElementData> }): dia.Element.Attributes => {
  return util.pick(options.element, ELEMENT_KEYS);
};

/**
 * Forward mapper for links: data is already cell JSON — pass it through as-is.
 * The store handles `id` automatically.
 */
const mapLinkToAttributes = ({
  id,
  link,
}: {
  id?: string;
  link: Link<LinkData>;
}): dia.Cell.JSON => {
  const userData = link.data ?? {};
  return {
    ...userData,
    source: link.source,
    target: link.target,
    id,
  } as unknown as dia.Cell.JSON;
};

/**
 * Reverse mapper: pick only the keys defined in the data format.
 */
const mapAttributesToLink = (attributes: dia.Link.Attributes): Link<LinkData> => {
  const userData = util.pick(attributes, LINK_USER_DATA_KEYS) as LinkData;
  return {
    data: userData,
    source: attributes.source,
    target: attributes.target,
  } as Link<LinkData>;
};

// ============================================================================
// Element Shape
// ============================================================================

function ElementShape({ label, color }: Readonly<ElementData>) {
  const { width, height } = useElementSize();
  return (
    <>
      <rect
        rx={8}
        ry={8}
        width={width}
        height={height}
        fill={color}
        stroke="#333"
        strokeWidth={2}
      />
      <text
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill="white"
        fontSize={14}
        fontWeight="bold"
      >
        {label}
      </text>
    </>
  );
}

// ============================================================================
// Data Panel — shows live raw cell JSON
// ============================================================================

function DataPanel() {
  const elements = useElements<ElementData>();
  return (
    <div className="p-4 min-w-[200px] text-sm font-mono">
      <h3 className="text-base font-bold mb-3">Cell JSON Data</h3>
      {[...elements.entries()].map(([id, element]) => (
        <div key={id} className="mb-3 p-2 rounded bg-gray-800">
          <div className="font-bold mb-1">{element.data?.label}</div>
          <div>
            position: {'{'}x: {Math.round(element.position?.x ?? 0)}, y:{' '}
            {Math.round(element.position?.y ?? 0)}
            {'}'}
          </div>
          <div className="text-gray-400 text-xs mt-1">
            size: {element.size?.width ?? 0} &times; {element.size?.height ?? 0}
          </div>
          <div className="text-gray-400 text-xs">type: {element.type}</div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Main
// ============================================================================

const PAPER_STYLE = { flex: 1 };

function Main() {
  const renderElement: RenderElement<ElementData> = useCallback(
    (props) => <ElementShape {...props} />,
    []
  );
  return (
    <div className="flex w-full h-full">
      <Paper
        className={PAPER_CLASSNAME}
        height={400}
        renderElement={renderElement}
        style={PAPER_STYLE}
      />
      <DataPanel />
    </div>
  );
}

// ============================================================================
// App
// ============================================================================

export default function App() {
  const graph = useMemo(() => {
    return new dia.Graph({}, {
      cellNamespace: {
        ...shapes,
        PortalLink,
        MyPortalElement: PortalElement,
      }
    });
  }, []);
  return (
    <GraphProvider
      graph={graph}
      elements={initialElements}
      links={initialLinks}
      mapElementToAttributes={mapAttributesToElement}
      mapLinkToAttributes={mapLinkToAttributes}
      mapAttributesToLink={mapAttributesToLink}
    >
      <Main />
    </GraphProvider>
  );
}
