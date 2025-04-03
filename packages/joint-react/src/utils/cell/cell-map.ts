import type { dia } from '@joint/core';

export interface CellBase {
  readonly id?: dia.Cell.ID;
}

/**
 * CellMap is a custom Map implementation that extends the native Map class.
 * It provides additional utility methods for working with working with nodes & edges.
 * @group Utils
 */

export class CellMap<V extends CellBase> extends Map<dia.Cell.ID, V> {
  map<Item = V>(selector: (item: V) => Item): Item[] {
    return [...this.values()].map(selector);
  }

  filter(predicate: (item: V) => boolean): V[] {
    return [...this.values()].filter(predicate);
  }

  toJSON(): string {
    return JSON.stringify([...this.entries()]);
  }
}
