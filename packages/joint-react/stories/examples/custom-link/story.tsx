import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import CodeWithCreateLinks from './code-create-links';
import CodeWithCreateLinkClassName from './code-create-links-classname';
import CodeWithDiaLinks from './code-dia-links';
import createLinksRaw from './code-create-links?raw';
import classNameRaw from './code-create-links-classname?raw';
import classNameCssRaw from './code-create-links-classname.css?raw';
import diaLinksRaw from './code-dia-links?raw';

const meta = {
  title: 'Examples/Custom link',
  component: CodeWithCreateLinks,
  tags: ['example'],
  parameters: {
    showcase: {
      description: 'Style link color, width, and dash pattern directly on its cell record.',
      apiUrl: getAPILink('Paper'),
      code: createLinksRaw,
    },
  },
} satisfies Meta<typeof CodeWithCreateLinks>;

export default meta;

export type Story = StoryObj<typeof CodeWithCreateLinks>;

export const WithCreateLinks: Story = {};

export const WithCreateLinkClassName: Story = {
  render: () => <CodeWithCreateLinkClassName />,
  parameters: {
    showcase: {
      description: 'Animate a link by giving it a CSS class with a dashed-stroke keyframe animation.',
      files: [
        { name: 'code.tsx', code: classNameRaw },
        { name: 'styles.css', code: classNameCssRaw },
      ],
    },
  },
};

export const WithDiaLinks: Story = {
  render: () => <CodeWithDiaLinks />,
  parameters: {
    showcase: {
      description:
        'Render a fully custom link by registering a JointJS dia.Link subclass through the graph cell namespace.',
      code: diaLinksRaw,
    },
  },
};
