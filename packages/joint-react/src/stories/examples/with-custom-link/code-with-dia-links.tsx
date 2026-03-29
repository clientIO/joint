/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import { shapes, util } from '@joint/core';
import {
  GraphProvider,
  linkToAttributes,
  type CellAttributes,
  type Element,
  type Link,
} from '@joint/react';
import { Paper } from '../../../components/paper/paper';
import type { PortalLinkRecord } from '../../../types/data-types';

type ElementData = { label: string; color: string };
const initialElements: Record<string, Element<ElementData>> = {
  '1': {
    data: { label: 'Node 1', color: PRIMARY },
    position: { x: 100, y: 15 },
    size: {
      width: 140,
      height: 50,
    },
  },
  '2': {
    data: { label: 'Node 2', color: PRIMARY },
    position: { x: 100, y: 200 },
    size: {
      width: 140,
      height: 50,
    },
  },
};

class LinkModel extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(super.defaults, {
      type: 'LinkModel',
      attrs: LinkModel.getPresentationAttributes(PRIMARY),
    });
  }

  static getPresentationAttributes(color: string): dia.Cell.Selectors {
    return {
      line: {
        connection: true,
        stroke: color,
        strokeWidth: 10,
        strokeLinejoin: 'round',
        sourceMarker: {
          type: 'circle',
          r: 8,
        },
        targetMarker: {
          type: 'circle',
          r: 8,
        },
      },
      wrapper: {
        connection: true,
        strokeWidth: 10,
        strokeLinejoin: 'round',
      },
    };
  }
}

function Main() {
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper defaultLink={() => new LinkModel()} className={PAPER_CLASSNAME} height={280} />
    </div>
  );
}

interface CustomLink extends PortalLinkRecord {
  readonly color: string;
}

const links: Record<string, CustomLink> = {
  '1123': {
    source: { id: '1' },
    target: { id: '2' },
    color: PRIMARY,
  },
};

const mapLinkToAttributes = (options: { id?: string; link: Link }): CellAttributes => {
  const data = options.link as CustomLink;
  const attributes = linkToAttributes(options);
  const { color } = data;
  return {
    ...attributes,
    type: 'LinkModel',
    attrs: LinkModel.getPresentationAttributes(color),
  };
};

export default function App() {
  return (
    <GraphProvider
      links={links as Record<string, Link>}
      elements={initialElements}
      cellNamespace={{ LinkModel }}
      mapLinkToAttributes={mapLinkToAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
