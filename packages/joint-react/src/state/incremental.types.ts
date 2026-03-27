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

export type IncrementalChange<Item> =
  | IncrementalChangeBase<Item>
  | IncrementalChangeRemove<Item>
  | IncrementalChangeReset<Item>;
