import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
export type Story = StoryObj<typeof Code>;
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export default {
  title: 'Examples/Default Link',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description:
      'Demonstrates the `defaultLink` prop with a factory that reads the source port to set the link color. Drag from the colored ports to create links matching that color.',
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
