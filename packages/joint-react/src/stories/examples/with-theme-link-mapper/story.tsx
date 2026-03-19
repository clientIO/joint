import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';

import RawCode from './code?raw';
export type Story = StoryObj<typeof Code>;

export default {
    title: 'Examples/Theme Link Mapper',
    component: Code,
    tags: ['example'],
    parameters: {
        docs: {
            description: {
                story:
                    'Demonstrates the `useThemeLinkMapper` hook to customize link appearance ' +
                    '(color, width, markers, label styling) via a theme object instead of ' +
                    'setting properties on each link individually.',
            },
            source: {
                code: RawCode,
            },
        },
    },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
