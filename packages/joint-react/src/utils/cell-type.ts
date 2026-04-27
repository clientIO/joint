import type { dia } from '@joint/core';
import { ELEMENT_MODEL_TYPE } from '../models/element-model';
import { LINK_MODEL_TYPE } from '../models/link-model';

/**
 * Check whether a type string denotes an element via the graph's type
 * registry. Falls back to the literal `ELEMENT_MODEL_TYPE` for the default.
 * @param type - cell type name
 * @param graph - active graph
 * @returns true when the constructor for `type` extends `dia.Element`
 */
export function isElementType(type: string, graph: dia.Graph): boolean {
  if (type === ELEMENT_MODEL_TYPE) return true;
  const ctor = graph.getTypeConstructor?.(type);
  return ctor?.prototype?.isElement?.() ?? false;
}

/**
 * Check whether a type string denotes a link via the graph's type registry.
 * Falls back to the literal `LINK_MODEL_TYPE` for the default.
 * @param type - cell type name
 * @param graph - active graph
 * @returns true when the constructor for `type` extends `dia.Link`
 */
export function isLinkType(type: string, graph: dia.Graph): boolean {
  if (type === LINK_MODEL_TYPE) return true;
  const ctor = graph.getTypeConstructor?.(type);
  return ctor?.prototype?.isLink?.() ?? false;
}
