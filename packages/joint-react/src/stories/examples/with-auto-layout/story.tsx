import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
import CodeWithBuildInShapes from './code-with-build-in-shapes';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/With automatic layout',
  component: Code,
} satisfies Meta<typeof Code>;

export const Default: Story = {};
export const WithBuildInShapes: Story = {
  render: () => <CodeWithBuildInShapes />,
};
