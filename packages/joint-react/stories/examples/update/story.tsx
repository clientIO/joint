import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import CodeWithColor from './code-color';
import CodeWithSVG from './code-svg';
import CodeWithNodeRemove from './code-add-remove-node';
import codeRaw from './code?raw';
import codeColorRaw from './code-color?raw';
import codeSvgRaw from './code-svg?raw';
import codeRemoveRaw from './code-add-remove-node?raw';

const meta = {
  title: 'Examples/Update',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Rename nodes from a side panel of inputs that write the new label back to each element with the useGraph setCell setter.',
      apiUrl: getAPILink('useGraph'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};

export const WithColorPicker: Story = {
  render: CodeWithColor,
  parameters: {
    showcase: {
      description:
        'Recolor a node from a color picker embedded inside it, writing the value to its data with the useGraph setCell setter.',
      code: codeColorRaw,
    },
  },
};

export const WithSVG: Story = {
  render: CodeWithSVG,
  parameters: {
    showcase: {
      description:
        'Render each element as an SVG rounded rectangle sized reactively from the selectElementSize selector.',
      apiUrl: getAPILink('selectElementSize'),
      code: codeSvgRaw,
    },
  },
};

export const WithNodeRemove: Story = {
  render: CodeWithNodeRemove,
  parameters: {
    showcase: {
      description:
        'Remove a node with the useGraph removeCell setter from a button inside it, or rename it from the side panel.',
      code: codeRemoveRaw,
    },
  },
};
