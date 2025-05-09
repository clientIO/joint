import type { Meta, StoryObj } from '@storybook/react/*';
import '../index.css';
import Code from './code';
import CodeWithBuildInShapes from './code-with-build-in-shapes';
export type Story = StoryObj<typeof Code>;
import { makeRootDocumentation } from '../../utils/make-story';
// @ts-expect-error its storybook raw import
import CodeRaw from './code?raw';
// @ts-expect-error its storybook raw import
import CodeWithBuildInShapesRaw from './code-with-build-in-shapes?raw';

export default {
  title: 'Examples/Automatic layout',
  component: Code,
  parameters: makeRootDocumentation({
    code: CodeRaw,
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
export const WithBuildInShapes: Story = {
  render: () => <CodeWithBuildInShapes />,
  parameters: makeRootDocumentation({
    code: CodeWithBuildInShapesRaw,
  }),
};
