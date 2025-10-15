/* eslint-disable sonarjs/cognitive-complexity */
/* eslint-disable sonarjs/no-unused-vars */
import type { dia } from '@joint/core';
import type { CellOrJsonCell } from '../cell/cell-utilities';
import { isCellInstance } from '../is';
import type { SVGAttributes } from 'react';

export const CONTROLLED_MODE_BATCH_NAME = 'controlled-mode';
export const GRAPH_UPDATE_BATCH_NAME = 'update-graph';

/**
 * Safely set attributes on a link, merging with existing attributes.
 * @param link - The link to set attributes on.
 * @param attributes - The attributes to set.
 * @group utils
 */
function setLinkAttributesSafely(
  link: dia.Link,
  attributes?: SVGAttributes<SVGElement> | undefined
) {
  if (!attributes) return;
  // Deep-merge into existing attrs; do NOT replace the whole 'attrs' object.
  link.attr(attributes as dia.Link.LinkSelectors); // <- this merges at any depth (e.g., { line: { stroke: '#ED2637' } })
}

interface UpdateCellOptions {
  readonly graph: dia.Graph;
  readonly newCell: CellOrJsonCell;
  readonly newCellsMap?: Record<string, CellOrJsonCell>;
  readonly isLink?: boolean;
}
/**
 * Update a single cell in the graph.
 * @param options - The options for updating the cell.
 * @group utils
 */
export function updateCell(options: UpdateCellOptions) {
  const { graph, newCell, newCellsMap = {} } = options;
  const { id } = newCell;
  if (!id) return;

  newCellsMap[id] = newCell;

  const current = graph.getCell(id);
  const newType = isCellInstance(newCell) ? newCell.get('type') : newCell.type;
  const attributesAll = isCellInstance(newCell) ? newCell.attributes : { ...newCell };

  if (current) {
    const isLink = current.isLink();

    if (current.get('type') === newType) {
      if (isLink) {
        // Pull out fields that need special handling
        const {
          source,
          target,
          attrs,
          id: _ignoreId,
          type: _ignoreType,
          ...rest // z, labels, vertices, router, connector, etc.
        } = attributesAll;

        // 1) endpoints
        if (source) (current as dia.Link).source(source);
        if (target) (current as dia.Link).target(target);

        // 2) merge visual attrs (don’t replace)
        if (attrs) setLinkAttributesSafely(current as dia.Link, attrs);

        // 3) apply other properties — but avoid setting `attrs` again
        for (const [k, v] of Object.entries(rest)) {
          // If you worry about something being a deep object, set individually
          // but do NOT include 'attrs' here.
          current.set(k, v);
        }
      } else {
        // Element path: also avoid replacing attrs
        const { attrs, id: _ignoreId, type: _ignoreType, ...rest } = attributesAll;
        if (attrs) current.attr(attrs);
        if (Object.keys(rest).length > 0) current.set(rest);
      }
    } else {
      // Type changed — replace
      current.remove({ disconnectLinks: true });
      graph.addCell(newCell);
    }
  } else {
    graph.addCell(newCell);
  }
}

interface Options {
  readonly graph: dia.Graph;
  readonly cells: CellOrJsonCell[];
  readonly isLink: boolean;
}

/**
 * Update the graph with new cells.
 * @param options - The options for updating the graph.
 */
export function updateGraph(options: Options) {
  const { graph, cells, isLink } = options;
  const originalCells = isLink ? graph.getLinks() : graph.getElements();
  const newCellsMap: Record<string, CellOrJsonCell> = {};

  // Here we do not want to remove the existing elements but only update them if they exist.
  // e.g. Using resetCells() would remove all elements from the graph and add new ones.
  for (const newCell of cells) {
    updateCell({ graph, newCell, newCellsMap, isLink });
  }

  if (originalCells) {
    for (const cell of originalCells) {
      if (!newCellsMap[cell.id]) {
        cell.remove();
      }
    }
  }
}
