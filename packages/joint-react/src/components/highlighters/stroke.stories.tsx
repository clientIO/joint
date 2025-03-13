import type { Meta, StoryObj } from '@storybook/react/*';
import { SimpleRenderItemDecorator } from '../../../.storybook/decorators/with-simple-data';
import { Stroke } from './stroke';

export type Story = StoryObj<typeof Stroke>;
const meta: Meta<typeof Stroke> = {
  title: 'Components/Highlighter/Stroke',
  component: Stroke,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

export const Default: Story = {
  args: {
    padding: 10,
    rx: 5,
    ry: 5,
    useFirstSubpath: true,
    strokeWidth: 3,
    stroke: '#FF0000',
    children: <rect width={100} height={50} fill="cyan" />,
  },
};
