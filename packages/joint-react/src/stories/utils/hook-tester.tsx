/* eslint-disable @typescript-eslint/no-explicit-any */

import type { JSX } from 'react';
import type { StoryObj } from '@storybook/react/*';
import '../examples/index.css';
import { HTMLNode, ShowJson } from 'storybook-config/decorators/with-simple-data';

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
  return (
    <HTMLNode className="node">
      <ShowJson showCopy={false} data={JSON.stringify(result)} />
    </HTMLNode>
  );
}

export function HookTesterRaw<T extends AnyFunction>({
  useHook,
  hookArgs,
  render,
}: Readonly<HookTesterProps<T>>) {
  const result = useHook(...hookArgs);
  if (render) {
    return render(result);
  }
  return <ShowJson showCopy={false} data={JSON.stringify(result)} />;
}

export type TesterHookStory<T extends AnyFunction> = StoryObj<typeof HookTester> & {
  args: HookTesterProps<T>;
};
