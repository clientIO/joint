import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMarkup } from './use-markup';
import { RenderItemDecorator, type SimpleElement } from '../../.storybook/decorators/with-simple-data';
import '../stories/examples/index.css';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../stories/utils/make-story';
import { useNodeLayout } from './use-node-layout';
import { useCallback } from 'react';
import type { FlatLinkData } from '../types/link-types';
import { PRIMARY } from '../../.storybook/theme';
import type { FlatElementData } from '../types/element-types';

const elements: Record<string, FlatElementData> = {
  '1': {
    x: 100,
    y: 20,
    width: 150,
    height: 50,
    z: 1,
  },
  '2': {
    x: 200,
    y: 250,
    width: 150,
    height: 50,
    z: 1,
  },
};

const links: Record<string, FlatLinkData> = {
    'l-1': {
        source: '1',
        sourceMagnet: 'my-selector',
        target: '2',
        targetMagnet: 'my-selector',
        color: PRIMARY,
        z: 2
    },
};

function Hook() {
    const { width, height } = useNodeLayout();
    const { selectorRef } = useMarkup();
    return (
        <>
            <rect width={width} height={height} fill="#f6c744" rx={4} />
            <text ref={selectorRef('my-selector')} x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="central" fontSize={12}>
                Selector registered
            </text>
        </>
    );
}

function Story() {
    const renderElement = useCallback(
        (_element: SimpleElement) => <Hook />,
        []
    );
    return <RenderItemDecorator renderElement={renderElement} elements={elements} links={links} />;
}

export type StoryType = StoryObj<typeof Story>;
const API_URL = getAPILink('useMarkup');
const meta: Meta<typeof Story> = {
    title: 'Hooks/useMarkup',
    component: Story,
    tags: ['hook'],
    parameters: makeRootDocumentation({
        description:
            '`useMarkup` provides utilities for working with JointJS markup selectors in React-rendered elements. The returned `selectorRef` creates ref callbacks that register SVG sub-elements as named selectors on the element view, enabling links to target specific parts of a React-rendered element by selector name (e.g. `item-0`, `item-1`). Must be used inside `renderElement`.',
        apiURL: API_URL,
        code: `import { useMarkup } from '@joint/react';

function MyComponent({ labels }) {
  const { selectorRef } = useMarkup();
  return (
    <>
      {labels.map((label, index) => (
        <g ref={selectorRef(\`item-\${index}\`)} key={label}>
          <text>{label}</text>
        </g>
      ))}
    </>
  );
}`,
    }),
};

export default meta;

export const Default: StoryType = {};
