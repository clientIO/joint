/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable react-perf/jsx-no-new-function-as-prop */
import { PAPER_CLASSNAME, PRIMARY } from 'storybook-config/theme';
import type { dia } from '@joint/core';
import { shapes, util } from '@joint/core';
import { GraphProvider, type GraphProps, type RenderElement, type LinkToGraphOptions, type GraphLink } from '@joint/react';
import { useCallback } from 'react';
import { HTMLNode } from 'storybook-config/decorators/with-simple-data';
import { Paper } from '../../../components/paper/paper';

const initialElements: Record<string, { label: string; x: number; y: number }> = {
  '1': { label: 'Node 1', x: 100, y: 0 },
  '2': { label: 'Node 2', x: 100, y: 200 },
};

class LinkModel extends shapes.standard.Link {
  defaults() {
    return util.defaultsDeep(super.defaults, {
      type: 'LinkModel',
      attrs: {
        line: {
          stroke: PRIMARY,
          strokeWidth: 10,
          strokeDasharray: '5,5',
        },
      },
    });
  }
}

type BaseElementWithData = (typeof initialElements)[string];

function Main() {
  const renderElement: RenderElement<BaseElementWithData> = useCallback(
    (element) => <HTMLNode className="node">{element.label}</HTMLNode>,
    []
  );
  return (
    <div style={{ display: 'flex', flexDirection: 'row' }}>
      <Paper
        defaultLink={() => new LinkModel()}
        width="100%"
        className={PAPER_CLASSNAME}
        height={280}
        renderElement={renderElement}
      />
    </div>
  );
}

interface CustomLink extends GraphLink {
  readonly type: string;
  readonly attrs?: { line: { stroke: string } };
}

const links: Record<string, CustomLink> = {
  '1123': {
    source: '1',
    target: '2',
    type: 'LinkModel',
    attrs: { line: { stroke: PRIMARY } },
  },
};

const mapDataToLinkAttributes = ({
  data,
  defaultAttributes,
}: LinkToGraphOptions<GraphLink>): dia.Cell.JSON => {
  const result = defaultAttributes();
  const { type, attrs } = data as CustomLink;
  return {
    ...result,
    ...(type && { type }),
    ...(attrs && { attrs }),
  };
};

export default function App(props: Readonly<GraphProps>) {
  return (
    <GraphProvider
      {...props}
      links={links}
      elements={initialElements}
      cellNamespace={{ LinkModel }}
      mapDataToLinkAttributes={mapDataToLinkAttributes}
    >
      <Main />
    </GraphProvider>
  );
}
