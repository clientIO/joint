import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Custom } from './custom';
import { highlighters } from '@joint/core';
import { PRIMARY } from 'storybook-config/theme';
import { makeRootDocumentation, makeStory } from '@joint/react/src/stories/utils/make-story';
import { getAPILink } from '@joint/react/src/stories/utils/get-api-documentation-link';
import { forwardRef, type PropsWithChildren } from 'react';
import { useElement } from '../../hooks';

const API_URL = getAPILink('Highlighter/variables/Custom', 'namespaces');

export type Story = StoryObj<typeof Custom>;
const meta: Meta<typeof Custom> = {
  title: 'Components/Highlighter/Custom',
  component: Custom,
  decorators: [SimpleRenderItemDecorator],
  parameters: makeRootDocumentation({
    description: `
Custom is a component that allows you to use a custom highlighter. You must provide the \`onAdd\` which must return jointjs highlighter.
    `,
    apiURL: API_URL,
    code: `import { Highlighter } from '@joint/react'
<Highlighter.Custom
  onAdd={...}
  options={{ ... }}
>
  <rect rx={10} ry={10} width={100} height={50} fill={"blue"} />
</Highlighter.Custom>
    `,
  }),
};

// we need to use forwardRef to pass the ref to the rect element, so highlighter can use it
function RectRenderComponent(_: PropsWithChildren, ref: React.Ref<SVGRectElement>) {
  const { width, height } = useElement();
  return <rect ref={ref} rx={10} ry={10} width={width} height={height} fill={PRIMARY} />;
}
const RectRender = forwardRef(RectRenderComponent);

export default meta;

export const CustomWithOpacity = makeStory<Story>({
  args: {
    onAdd: (cellView, element, highlighterId, options) => {
      return highlighters.opacity.add(cellView, element, highlighterId, options);
    },
    options: {
      alphaValue: 0.2,
    },
    children: <RectRender />,
  },
  apiURL: API_URL,
  description: 'Custom highlighter using the built-in stroke highlighter with custom options.',
  code: `<Highlighter.Custom
    onAdd={(cellView, element, highlighterId, options) => {
        return highlighters.opacity.add(cellView, element, highlighterId, options);
    }}
    options={{ alphaValue: 0.2 }}
  >
    <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />
  </Highlighter.Custom>`,
});

export const CustomWithMask = makeStory<Story>({
  args: {
    onAdd: (cellView, element, highlighterId, options) => {
      return highlighters.mask.add(cellView, element, highlighterId, options);
    },
    options: {
      mask: {
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
      },
    },
    children: <RectRender />,
  },
  apiURL: API_URL,
  description: 'Custom highlighter using the built-in mask highlighter with custom options.',
  code: `<Highlighter.Custom
    onAdd={(cellView, element, highlighterId, options) => {
        return highlighters.mask.add(cellView, element, highlighterId, options);
    }
    options={{ mask: { fill: 'red', stroke: 'black', strokeWidth: 2 } }}
  >
    <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />
  </Highlighter.Custom>`,
});

export const CustomWithStroke = makeStory<Story>({
  args: {
    onAdd: (cellView, element, highlighterId, options) => {
      return highlighters.stroke.add(cellView, element, highlighterId, options);
    },
    options: {
      stroke: {
        stroke: 'red',
        strokeWidth: 2,
        fill: 'blue',
        fillOpacity: 0.5,
      },
    },
    children: <RectRender />,
  },
  apiURL: API_URL,
  description: 'Custom highlighter using the built-in stroke highlighter with custom options.',
  code: `<Highlighter.Custom
    onAdd={(cellView, element, highlighterId, options) => {
        return highlighters.stroke.add(cellView, element, highlighterId, options);
    }
    options={{ stroke: { stroke: 'red', strokeWidth: 2, fill: 'blue', fillOpacity: 0.5 } }}
  >
    <rect rx={10} ry={10} width={width} height={height} fill={"blue"} />
  </Highlighter.Custom>`,
});
