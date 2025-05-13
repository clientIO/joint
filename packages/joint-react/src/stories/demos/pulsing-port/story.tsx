import type { Meta, StoryObj } from '@storybook/react/*';
import Code from './code';
//@ts-expect-error storybook parser
import RawCode from './code?raw';
//@ts-expect-error storybook parser
import CodeCss from './index.css?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/Pulsing Port',
  component: Code,

  parameters: {
    docs: {
      description: {
        story: 'Demo of User Flow with tailwind',
      },
      source: {
        code: `${RawCode} \n <style>\n${CodeCss}</style>`,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
