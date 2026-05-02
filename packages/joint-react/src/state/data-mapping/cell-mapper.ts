import type { dia } from '@joint/core';
import type { DiaElementRecord, DiaLinkRecord } from '../../types/cell.types';
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
  Element extends DiaElementRecord = DiaElementRecord,
  Link extends DiaLinkRecord = DiaLinkRecord,
>(cell: Element | Link, graph: dia.Graph): dia.Cell.JSONInit {
  // `ElementAttributes` / `LinkAttributes` only declare `id`; the discriminator
  // `type` lives on `WithType` (which `ElementRecord` / `LinkRecord` extend).
  // Read it through a narrow cast so the index signature
  // (`[key: string]: unknown`) doesn't widen `cell.type` to `unknown`.
  const cellType = cell.type;
  if (isElementType(cellType, graph)) {
    const attributes = mapElementToAttributes(cell);
    if (cell.id !== undefined) attributes.id = cell.id;
    return attributes;
  }
  if (isLinkType(cellType, graph)) {
    const attributes = mapLinkToAttributes(cell);
    if (cell.id !== undefined) attributes.id = cell.id;
    return attributes;
  }
  // fallback for unrecognized types: pass through verbatim (id may be omitted —
  // JointJS will assign one).
  return { ...cell } as dia.Cell.JSONInit;
}
