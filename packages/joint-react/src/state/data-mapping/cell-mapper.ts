import type { dia } from '@joint/core';
import type { CellRecord } from '../../types/cell.types';
import type { ElementRecord, LinkRecord } from '../../types/data-types';
import { isElementType, isLinkType } from '../../utils/cell-type';
import { mapElementToAttributes } from './element-mapper';
import { mapLinkToAttributes } from './link-mapper';

/**
 * Route a unified cell record to its JointJS attributes, preserving any
 * custom `type` that isn't the library default.
 *
 * Known element / link types — including any `dia.Element` or `dia.Link`
 * subclass registered in the graph's `cellNamespace` — go through the typed
 * mappers (`mapElementToAttributes` / `mapLinkToAttributes`) so that
 * declarative fields like `portMap`, `style`, and `labelMap` are expanded
 * correctly. Types the graph cannot classify pass through verbatim — the
 * user-chosen `type` and attributes are authoritative.
 *
 * Classification is done via `graph.getTypeConstructor(type).prototype.isElement()`
 * / `.isLink()`, so naive `cell.type === ELEMENT_MODEL_TYPE` checks that miss
 * custom subtypes no longer leak into the mapper pipeline.
 * @template ElementData - user data shape on elements
 * @template LinkData - user data shape on links
 * @param cell - cell record to map
 * @param graph - active graph, used to classify custom cell types
 * @returns JointJS cell attributes with `id` guaranteed
 */
export function mapCellToAttributes<
  ElementData extends object = Record<string, unknown>,
  LinkData extends object = Record<string, unknown>,
>(cell: CellRecord<ElementData, LinkData>, graph: dia.Graph): dia.Cell.JSON {
  if (isElementType(cell.type, graph)) {
    const attributes = mapElementToAttributes(cell as ElementRecord<ElementData>) as dia.Cell.JSON;
    attributes.id = cell.id;
    return attributes;
  }
  if (isLinkType(cell.type, graph)) {
    const attributes = mapLinkToAttributes(cell as LinkRecord<LinkData>) as dia.Cell.JSON;
    attributes.id = cell.id;
    return attributes;
  }
  // fallback for unrecognized types: pass through verbatim (but ensure `id` is present)
  return { ...cell, id: cell.id };
}
