import type { Meta, StoryObj } from '@storybook/react/*';
import Code from './code';
//@ts-expect-error storybook parser
import RawCode from './code?raw';
//@ts-expect-error storybook parser
import CodeCss from './index.css?raw';
export type Story = StoryObj<typeof Code>;

export default {
  title: 'Demos/Introduction demo',
  component: Code,

  parameters: {
    docs: {
      description: {
        story: 'Demo of jointjs with react using custom nodes',
      },
      source: {
        code: `${RawCode} \n <style>\n${CodeCss}</style>`,
      },
    },
  },
} satisfies Meta<typeof Code>;

export const Default: Story = {};
