import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/With resizable node',
  component: Code,
  parameters: {
    docs: {
      source: {
        code: RawCode,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
