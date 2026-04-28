import type { Meta, StoryObj } from '@storybook/react';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Collapsible subtrees',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
