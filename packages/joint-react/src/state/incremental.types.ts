import type { CellData } from '../types/cell-data';

interface IncrementalChangeBase<Item> {
  readonly type: 'change' | 'add';
  readonly data: Item;
}

interface IncrementalChangeRemove<Item> {
  readonly type: 'remove';
  readonly data?: Item;
}

interface IncrementalChangeReset<Item> {
  readonly type: 'reset';
  readonly data: Item[];
}

export type IncrementalChange<Item> = IncrementalChangeBase<Item> | IncrementalChangeRemove<Item> | IncrementalChangeReset<Item>;

export type OnIncrementalChangeHandler<Item> = (change: IncrementalChange<Item>) => void;

export interface IncrementalStateChange<T> {
  readonly added?: Record<string, T>;
  readonly changed?: Record<string, T>;
  readonly removed?: Record<string, T>;
  readonly reset?: Record<string, T>;
}
export interface IncrementalStateChanges<ElementData extends object = CellData, LinkData extends object = CellData> {
  readonly elements: IncrementalStateChange<ElementData>;
  readonly links: IncrementalStateChange<LinkData>;
}
