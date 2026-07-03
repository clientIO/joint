import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';
import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
    title: 'Examples/Theme Editor',
    component: Code,
    tags: ['example'],
    parameters: makeRootDocumentation({
        code: CodeRaw,
        description:
            'Live CSS variable editor for the built-in `styles.css` theme system. ' +
            'Switch between light and dark presets — any variable you have manually overridden ' +
            'in the form will be preserved across theme changes. ' +
            'Hover over elements or links to reveal element tools (boundary + remove) ' +
            'and link tools (vertex handles + remove). ' +
            'Styled via `--jj-*` CSS variables from `styles.css`.',
    }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
