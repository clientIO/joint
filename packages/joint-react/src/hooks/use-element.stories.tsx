import { useElement } from './use-element';
import { SimpleRenderItemDecorator } from '../../.storybook/decorators/with-simple-data';
import type { Meta } from '@storybook/react/*';
import { HookTester, type TesterHookStory } from '../stories/utils/hook-tester';

const meta: Meta<typeof HookTester> = {
  title: 'Hooks/useElement',
  component: HookTester,
  decorators: [SimpleRenderItemDecorator],
};

export default meta;

type Story = TesterHookStory<typeof useElement>;

export const WithId: Story = {
  args: {
    useHook: useElement,
    hookArgs: [(element) => element.id],
  },
};

export const WithCoordinates: Story = {
  args: {
    useHook: useElement,
    hookArgs: [(element) => ({ x: element.x, y: element.y })],
  },
};
