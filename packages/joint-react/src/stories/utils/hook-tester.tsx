/* eslint-disable @typescript-eslint/no-explicit-any */

import type { JSX } from 'react';
import type { StoryObj } from '@storybook/react/*';
import { HTMLNode } from '../../components/html-node/html-node';
type AnyFunction = (...args: any[]) => any;
interface HookTesterProps<T extends AnyFunction> {
  useHook: T;
  hookArgs: Parameters<T>;
  render?: (result: ReturnType<T>) => JSX.Element;
}

export function HookTester<T extends AnyFunction>({
  useHook,
  hookArgs,
  render,
}: Readonly<HookTesterProps<T>>) {
  const result = useHook(...hookArgs);
  if (render) {
    return render(result);
  }
  return <HTMLNode>{JSON.stringify(result)}</HTMLNode>;
}

export type TesterHookStory<T extends AnyFunction> = StoryObj<typeof HookTester> & {
  args: HookTesterProps<T>;
};
