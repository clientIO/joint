import type { dia } from '@joint/core';

interface ItemBase {
  readonly id: dia.Cell.ID;
}

export class ExtendedMap<V extends ItemBase> extends Map<dia.Cell.ID, V> {
  constructor(items?: V[]) {
    super();
    if (!items) {
      return;
    }
    for (const item of items) {
      this.set(item.id, item);
    }
  }

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
