import type { Meta, StoryObj } from '@storybook/react-vite';
import { useMarkup } from './use-markup';
import { RenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import '../stories/examples/index.css';
import { getAPILink } from '../stories/utils/get-api-documentation-link';
import { makeRootDocumentation } from '../stories/utils/make-story';
import { useCallback } from 'react';
import { PRIMARY } from '../../.storybook/theme';
import type { Element } from '../types/data-types';
import type { Link } from '../types/data-types';
import { useElementSize } from './use-element-size';

const elements: Record<string, Element> = {
  '1': {
    size: { width: 150, height: 50 },
    position: { x: 100, y: 20 },
    z: 1,
  },
  '2': {
    size: { width: 150, height: 50 },
    position: { x: 200, y: 250 },
    z: 1,
  },
};

const links: Record<string, Link> = {
  'l-1': {
    source: { id: '1', magnet: 'my-selector' },
    target: { id: '2', magnet: 'my-selector' },
    color: PRIMARY,
    z: 2,
  },
};

function Hook() {
  const { width, height } = useElementSize();
  const { selectorRef } = useMarkup();
  return (
    <>
      <rect width={width} height={height} fill="#f6c744" rx={4} />
      <text
        ref={selectorRef('my-selector')}
        x={width / 2}
        y={height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
      >
        Selector registered
      </text>
    </>
  );
}

function Story() {
  const renderElement = useCallback(() => <Hook />, []);
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
