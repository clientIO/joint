import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';
// @ts-expect-error its storybook raw import
import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Card',
  component: Code,
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
