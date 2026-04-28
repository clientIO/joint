import { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Data Defaults',
  component: Code,
  tags: ['example'],
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates including default styling (port maps, port styles, sizes, link styles) ' +
          'directly in element and link data, and using `useEffect` with `useGraph` to ' +
          'dynamically update all cells when the theme changes.',
      },
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
