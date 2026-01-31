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
      attrs: LinkModel.getPresentationAttributes(PRIMARY),
    });
  }

  static getPresentationAttributes(color: string): dia.Cell.Selectors {
    return {
        line: {
            connection: true,
            stroke: color,
            strokeWidth: 10,
            strokeDasharray: '5,5',
            strokeLinejoin: 'round',
            targetMarker: {
                'type': 'path',
                'd': 'M 10 -5 0 0 10 5 z'
            }
        },
        wrapper: {
            connection: true,
            strokeWidth: 10,
            strokeLinejoin: 'round'
        }
    };
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
  readonly color: string;
}

const links: Record<string, CustomLink> = {
  '1123': {
    source: '1',
    target: '2',
    color: PRIMARY,
  },
};

const mapDataToLinkAttributes = ({
  data,
  defaultAttributes,
}: LinkToGraphOptions<GraphLink>): dia.Cell.JSON => {
  // eslint-disable-next-line sonarjs/no-unused-vars
  const { attrs: _, ...defaultAttributesRest } = defaultAttributes();
  const { color } = data as CustomLink;
  return {
    ...defaultAttributesRest,
    type: 'LinkModel',
    attrs: LinkModel.getPresentationAttributes(color)
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
