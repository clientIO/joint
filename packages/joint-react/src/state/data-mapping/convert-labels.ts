interface EventMap {
  // cell collection events
  add: (cell: Cell, collection: mvc.Collection<Cell>, options: Options) => void;
  remove: (cell: Cell, collection: mvc.Collection<Cell>, options: Options) => void;
  reset: (collection: mvc.Collection<Cell>, options: Options) => void;
  sort: (collection: mvc.Collection<Cell>, options: Options) => void;
  update: (collection: mvc.Collection<Cell>, options: Options) => void;
  // cell events
  change: (cell: Cell, options: Options) => void;
  [changeEvent: `change:${string}`]: (cell: Cell, newValue: any, options: Options) => void;
  move: (cell: Cell, options: Options) => void;
  changeId: (cell: Cell, previousId: Cell.ID, options: Options) => void;
  // layer events
  'layer:add': (layer: GraphLayer, collection: GraphLayerCollection, options: Options) => void;
  'layer:remove': (layer: GraphLayer, collection: GraphLayerCollection, options: Options) => void;
  'layer:change': (layer: GraphLayer, options: Options) => void;
  [layerChangeEvent: `layer:change:${string}`]: (
    layer: GraphLayer,
    newValue: any,
    options: Options
  ) => void;
  'layer:default': (layer: GraphLayer, options: Options) => void;
  'layers:sort': (collection: GraphLayerCollection, options: Options) => void;
  // batch
  'batch:start': (data: Options) => void;
  'batch:stop': (data: Options) => void;
  // custom
  [eventName: string]: mvc.EventHandler;
}
