import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
export type Story = StoryObj<typeof Code>;
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export default {
  title: 'Examples/Element Ports',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description:
      'Demonstrates the simplified element ports API. Define ports as a flat array with `cx`, `cy`, `color`, and `shape` properties instead of the verbose JointJS ports format.',
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
