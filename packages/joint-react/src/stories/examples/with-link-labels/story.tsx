import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import Code from './code';
import CodeRaw from './code?raw';
import { makeRootDocumentation } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Link Labels',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description: 'Demonstrates adding labels to links.',
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
