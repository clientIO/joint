import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Examples/Markup Selectors',
  component: Code,
  tags: ['example'],
  parameters: {
    showcase: {
      description:
        'Register each stacked row as a named magnet with useMarkup so links can connect to specific parts of a React-rendered element.',
      apiUrl: getAPILink('useMarkup'),
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
