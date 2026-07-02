import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';
import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Transaction',
  tags: ['example'],
  component: Code,
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description:
      '`useGraph().transaction` runs many graph edits as one atomic step: a single undo entry, ' +
      'a single React update (even across `await`s), and automatic rollback if the callback throws.',
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
