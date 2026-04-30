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

/** Discriminated union describing a single incremental change to a collection. */
export type IncrementalChange<Item> =
  | IncrementalChangeBase<Item>
  | IncrementalChangeRemove<Item>
  | IncrementalChangeReset<Item>;
