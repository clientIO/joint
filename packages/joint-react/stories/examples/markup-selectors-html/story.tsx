import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';

import Code from './code';
import CodeRaw from './code?raw';
import { makeRootDocumentation } from '../../utils/make-story';

export type Story = StoryObj<typeof Code>;

export default {
  title: 'Examples/Markup Selectors HTML',
  component: Code,
  tags: ['example'],
  parameters: makeRootDocumentation({
    code: CodeRaw,
    description:
      'Demonstrates HTML-based markup selectors using `HTMLHost` and `useMarkup()`. Each table row is registered as a named selector and an active magnet in one call via `magnetRef()`. Links connect to specific rows by selector name.',
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
