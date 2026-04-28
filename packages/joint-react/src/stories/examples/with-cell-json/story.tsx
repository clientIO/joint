import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Cell JSON data',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
