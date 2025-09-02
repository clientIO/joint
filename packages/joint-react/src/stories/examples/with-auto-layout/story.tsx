import type { Meta, StoryObj } from '@storybook/react';
import '../index.css';
import Code from './code';
import CodeWithBuildInShapes from './code-with-build-in-shapes';
export type Story = StoryObj<typeof Code>;
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

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
