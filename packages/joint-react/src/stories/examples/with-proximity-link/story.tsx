import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
export type Story = StoryObj<typeof Code>;
import { makeRootDocumentation } from '../../utils/make-story';
// @ts-expect-error its storybook raw import
import CodeRaw from './code?raw';

export default {
  title: 'Examples/Proximity link',
  component: Code,
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
