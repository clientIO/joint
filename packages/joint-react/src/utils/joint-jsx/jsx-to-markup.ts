import { isValidElement, type JSX } from 'react';
import {
  isBoolean,
  isNull,
  isNumber,
  isReactComponentFunction,
  isRecord,
  isString,
  isWithChildren,
} from '../is';
import type { dia } from '@joint/core';

/**
 * Extract attributes from props.
 * @param props - The props to extract attributes from.
 * @description
 * This function extracts all attributes from props that start with 'joint-'
 * @returns [Record<string, unknown>, Record<string, unknown>]
 */
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
    if (key === 'className' && typeof props[key] === 'string') {
      newProps['class'] = props[key]; // Convert className to class
    } else if (key.startsWith('joint-')) {
      const keyWithoutPrefix = key.slice(6);
      jointProps[keyWithoutPrefix] = props[key];
    } else {
      newProps[key] = props[key];
    }
  }
  return [newProps, jointProps];
}

/**
 * Convert JSX element to JointJS markup.
 * @param element JSX element.
 * @param markups JointJS markup.
 * @returns JointJS markup.
 */
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
 * Convert JSX into JointJS markup (static `dia.MarkupJSON`). Only intrinsic
 * SVG / HTML tags are emitted as nodes; component types are treated as
 * fragments, their children flow through but the wrapper itself is dropped.
 * No hooks, no state, purely static.
 * @param element JSX element.
 * @returns JointJS markup.
 * @example
 * ```tsx
 * const markup = jsx(
 *   <g joint-selector="root">
 *     <rect width={80} height={40} fill="white" stroke="black" />
 *     <text x={10} y={25}>Hello</text>
 *   </g>
 * );
 * ```
 */
export function jsx(element: JSX.Element): dia.MarkupJSON {
  return jsxToMarkupWithArray(element, []);
}
