import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Portal Selectors',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      canvasHeight: 660,
      description:
        'Renders React content into built-in JointJS shapes with a custom portalSelector, plus click-to-select highlighting and a live minimap.',
      apiUrl: getAPILink('PortalSelector', 'Types'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
