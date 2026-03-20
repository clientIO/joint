import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
    title: 'Examples/CSS Theme',
    component: Code,
    tags: ['example'],
    parameters: {
        docs: {
            description: {
                story:
                    'Demonstrates CSS-driven theming with plain `--joint-*` CSS custom properties (no Tailwind). ' +
                    'Links with no explicit `color`/`width` inherit from CSS variables. ' +
                    'Light/dark toggle overrides variables via a `.dark` class.',
            },
            source: {
                code: RawCode,
            },
        },
    },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
