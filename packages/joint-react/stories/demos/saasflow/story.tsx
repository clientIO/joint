import type { Meta, StoryObj } from '@storybook/react-vite';
import { getAPILink } from '../../utils/get-api-documentation-link';
import Code from './code';
import codeRaw from './code?raw';

const meta = {
  title: 'Demos/SaaSflow',
  component: Code,
  tags: ['demo'],
  parameters: {
    showcase: {
      description:
        'Renders a SaaS project-management flow of HTML nodes with connectable ports and orthogonal links, toggling the whole diagram between dark and light themes.',
      apiUrl: getAPILink('HTMLHost'),
      canvasHeight: 700,
      plainCanvas: true,
      code: codeRaw,
    },
  },
} satisfies Meta<typeof Code>;

export default meta;

export type Story = StoryObj<typeof Code>;

export const Default: Story = {};
