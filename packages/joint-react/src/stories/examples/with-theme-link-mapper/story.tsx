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
                    'Demonstrates `useElementDefaults` and `useLinkDefaults` hooks to ' +
                    'apply default styling to element ports and link appearance instead of ' +
                    'setting properties on each cell individually.',
            },
            source: {
                code: RawCode,
            },
        },
    },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
