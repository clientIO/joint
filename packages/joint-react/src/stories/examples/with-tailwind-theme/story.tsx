import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
    title: 'Examples/Tailwind Theme',
    component: Code,
    tags: ['example'],
    parameters: {
        docs: {
            description: {
                story:
                    'Demonstrates CSS theming with Tailwind v4 CSS variables. ' +
                    'The `tailwind-theme.css` maps `--jr-*` to Tailwind variables ' +
                    'like `--color-slate-500`. Light/dark toggle switches the palette.',
            },
            source: {
                code: RawCode,
            },
        },
    },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
