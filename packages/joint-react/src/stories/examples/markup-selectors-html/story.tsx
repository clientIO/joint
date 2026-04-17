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
      'Demonstrates HTML-based markup selectors using `HTMLHost` and `useMarkup()`. Each table row is an HTML `<div>` with `magnet="active"` and a `joint-selector` set via `selectorRef()`. Links connect to specific rows by selector name.',
  }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
