import { util, type dia } from '@joint/core';
import type { FunctionComponent, JSX } from 'react';
import { isValidElement } from 'react';

function hasChildren(props: Record<string, unknown>) {
  return 'children' in props;
}
function isString(value: unknown): value is string {
  return util.isString(value);
}

function isNumber(value: unknown): value is number {
  return util.isNumber(value);
}
function isBoolean(value: unknown): value is boolean {
  return util.isBoolean(value);
}

function isNull(value: unknown): value is null {
  return value === null;
}

function isReactComponentFunction(value: unknown): value is FunctionComponent {
  return value instanceof Function;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return util.isObject(value);
}
function isWithChildren(value: unknown): value is { children: JSX.Element[] } {
  return isRecord(value) && hasChildren(value);
}
function extractJointAttributes(
  props: unknown
): [Record<string, unknown>, Record<string, unknown>] {
  // extract all attributes starting with 'joint-'
  const newProps: Record<string, unknown> = {};
  const jointProps: Record<string, unknown> = {};
  if (!isRecord(props)) {
    return [newProps, jointProps];
  }
  for (const key in props) {
    if (key.startsWith('joint-')) {
      const keyWithoutPrefix = key.slice(6);
      jointProps[keyWithoutPrefix] = props[key];
    } else {
      newProps[key] = props[key];
    }
  }
  return [newProps, jointProps];
}

function jsxToMarkupWithArray(element: JSX.Element, markups: dia.MarkupJSON = []) {
  if (!isValidElement(element)) {
    return markups;
  }

  const { props, type } = element;

  if (!isRecord(props)) {
    return markups;
  }

  if (isReactComponentFunction(type)) {
    const result = type(props);
    if (isValidElement(result)) {
      return jsxToMarkupWithArray(result, markups);
    }
    return markups;
  }

  if (typeof type === 'function') {
    return markups;
  }

  if (!isWithChildren(props)) {
    const [newProps, jointProps] = extractJointAttributes(props);
    markups.push({ tagName: type, children: [], attributes: newProps, ...jointProps });
    return markups;
  }

  const { children, ...attributes } = props;
  if (isString(children)) {
    const [newProps, jointProps] = extractJointAttributes(attributes);
    markups.push({
      tagName: type,
      children: [children],
      attributes: newProps,
      ...jointProps,
    });
    return markups;
  }

  const arrayChildren = Array.isArray(children) ? children : [children];
  const childrenMarkup: dia.MarkupJSON = arrayChildren.flatMap((child) => {
    if (isValidElement(child)) {
      return jsxToMarkupWithArray(child, []);
    }
    if (isString(child) || isNumber(child) || isBoolean(child) || isNull(child)) {
      return String(child);
    }
    throw new Error(`Unsupported child type: ${typeof child}`);
  });
  if (!isString(type)) {
    return childrenMarkup;
  }
  const [newProps, jointProps] = extractJointAttributes(attributes);
  markups.push({ tagName: type, children: childrenMarkup, attributes: newProps, ...jointProps });
  return markups;
}

/**
 * Convert JSX element to JointJS markup.
 * @param element JSX element.
 * @returns JointJS markup.
 *
 * This generate just static markup from JSX, it doesn't support dynamic components and hooks.
 *
 * @example
 * ```tsx
 * function CustomComponent(props: Readonly<PropsWithChildren>) {
 *   return <div>{props.children}</div>;
 * }
 * const markup = jsxToMarkup(
 *   <CustomComponent>
 *     <span>Hello</span>
 *   </CustomComponent>
 * );
 * ```
 */
export function jsx(element: JSX.Element): dia.MarkupJSON {
  return jsxToMarkupWithArray(element, []);
}
