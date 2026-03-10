import type { FlatElementData } from '../types/element-types';
import type { FlatLinkData } from '../types/link-types';

interface IncrementalChangeBase<Item> {
  readonly type: 'change' | 'add';
  readonly data: Item;
}

interface IncrementalChangeRemove {
  readonly type: 'remove';
}

interface IncrementalChangeReset<Item> {
  readonly type: 'reset';
  readonly data: Item[];
}

export type IncrementalChange<Item> =
  | IncrementalChangeBase<Item>
  | IncrementalChangeReset<Item>
  | IncrementalChangeRemove;

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
