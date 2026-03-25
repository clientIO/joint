import type { FlatElementData, FlatLinkData } from '../types/data-types';

interface IncrementalChangeBase<Item> {
  readonly type: 'change' | 'add';
  readonly data: Item;
}

interface IncrementalChangeRemove<Item> {
  readonly type: 'remove';
  readonly data: Item;
}

export type IncrementalChange<Item> = IncrementalChangeBase<Item> | IncrementalChangeRemove<Item>;

export type OnIncrementalChangeHandler<Item> = (change: IncrementalChange<Item>) => void;

export interface IncrementalStateChange<T> {
  readonly added?: Record<string, T>;
  readonly changed?: Record<string, T>;
  readonly removed?: Record<string, T>;
  readonly reset?: Record<string, T>;
}
export interface IncrementalStateChanges<ElementData = FlatElementData, LinkData = FlatLinkData> {
  elements: IncrementalStateChange<ElementData>;
  links: IncrementalStateChange<LinkData>;
}
