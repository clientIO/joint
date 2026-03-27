/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import { shapes, util } from '@joint/core';
import {
  GraphProvider,
  linkToAttributes,
  type CellAttributes,
  type RenderElement,
  type FlatLinkData,
} from '@joint/react';
import { useCallback } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { Paper } from '../../../components/paper/paper';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { data: { label: 'Node 1' }, x: 100, y: 15 },
  '2': { data: { label: 'Node 2' }, x: 100, y: 200 },
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

interface CustomLink extends FlatLinkData {
  readonly [key: string]: unknown;
  readonly color: string;
}

const links: Record<string, CustomLink> = {
  '1123': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

const mapLinkToAttributes = (options: { id?: string; link: FlatLinkData }): CellAttributes => {
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
      links={links as Record<string, FlatLinkData>}
      elements={initialElements}
      cellNamespace={{ LinkModel }}
      mapLinkToAttributes={mapLinkToAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
