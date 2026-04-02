import type { Meta, StoryObj } from '@storybook/react-vite';
import '../index.css';
import Code from './code';
import { makeRootDocumentation } from '../../utils/make-story';

import CodeRaw from './code?raw';

export type Story = StoryObj<typeof Code>;

export default {
    title: 'Examples/Default Element',
    component: Code,
    tags: ['example'],
    parameters: makeRootDocumentation({
        code: CodeRaw,
        description:
            'Zero-config element rendering using the built-in `DefaultHTMLHost` component. ' +
            'Elements auto-size to fit their label. Pass `width`/`height` in element data to set an explicit size. ' +
            'Styled via `--jr-element-*` CSS variables from `theme.css`.',
    }),
} satisfies Meta<typeof Code>;

export const Default: Story = {};
