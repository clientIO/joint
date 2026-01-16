import type { Meta, StoryObj } from '@storybook/react';
import '../index.css';
import Code from './code';
export type Story = StoryObj<typeof Code>;
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export default {
  title: 'Examples/Automatic layout',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
