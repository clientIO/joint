import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
    title: 'Examples/Theme Mappers',
    component: Code,
    tags: ['example'],
    parameters: {
        docs: {
            description: {
                story:
                    'Demonstrates `useThemeElementMapper` and `useThemeLinkMapper` hooks to ' +
                    'customize element ports and link appearance via theme objects instead of ' +
                    'setting properties on each cell individually.',
            },
            source: {
                code: RawCode,
            },
        },
    },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
