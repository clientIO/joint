# @joint/core

## 4.3.2

### Patch Changes

- routers.rightAngle - refactor to consolidate duplicate code into helpers (0a2991b6)
- dia.Paper - the `guard` option can now veto blank pointerdowns; its `view` argument is `undefined` when the event did not hit a cell view (68a47586)
- routers.rightAngle - refactor the path-finding algorithm into a separate utility (54d98005)

## 4.3.1

### Patch Changes

- routers.rightAngle - fix to allow zero-value margins and un-clamp `minPathMargin`

## 4.3.0

### Minor Changes

- dia.Paper - add `originX` and `originY` options to `getFitToContentArea()`
- dia.Paper - add typed `EventMap` for IDE autocomplete and type-checking on `on()` calls
- dia.Paper - `resolveViewClass` factory now receives the resolved namespace view class as a second argument
- dia.Paper - add `getCellView()` method for strict view lookup
- dia.Paper - add `setDragging()` and `isDragging()` methods for drag-state access
- dia.Paper - auto-emit `resize` event when the host container is resized via CSS
- dia.Paper - `elementView` / `linkView` factory options now receive the namespace view class as a second argument
- dia.GridLayerView - read built-in grid patterns from the paper constructor's static field
- dia.CellView - `getNodeBoundingRect()` and new `computeNodeBoundingRect()` support HTML elements
- dia.Graph - add `getCellNamespace()`, `setCellNamespace()`, `getTypeConstructor()`, `getTypeDefaults()`; deprecate `CellCollection.cellNamespace` setter
- dia.Graph - add typed `EventMap` for IDE autocomplete and type-checking on `on()` calls
- dia.Graph - add `port` and `magnet` options to `getConnectedLinks()`
- dia.Cell - support predicate function for `ignoreEmptyAttributes` option of `toJSON()`
- dia.Cell - add `Cell.JSON` and `Cell.JSONInit` types; deprecate `GenericAttributes`
- anchors.midSide - add `'top-bottom'`, `'bottom-top'`, `'left-right'`, `'right-left'` direction modes
- highlighters - add HTML element support to the mask highlighter
- routers.rightAngle - add `minPathMargin`, `sourceMargin`, and `targetMargin` options
- mvc.View - add `classNamePrefix` instance property to override the `joint-` CSS class prefix
- config - add `storeEmbeds` option to suppress the `embeds` attribute

### Patch Changes

- dia.Paper - fix stale cell views when cells become hidden during a batch update
- routers.rightAngle - fix anchor point excluded from clearance bounding-box union
- Vectorizer - fix `getRelativeTransformation()` when the screen CTM is non-invertible

## 4.2.5

### Patch Changes

- util - fix to guard `merge()`, `omit()`, `pick()`, `assign()` against potential prototype pollution attacks

## 4.2.4

### Patch Changes

- dia.Paper - fix to handle element removal during pointer events
- dia.Graph - fix to pass options to `batch:start` and `batch:stop` events consistently
- mvc.Model - fix to trigger the `changeId` event only if the previous ID is different from the current ID
- Vectorizer - fix `getTransformToElement()` when the target node is inside a nested SVG document

## 4.2.3

### Patch Changes

- dia.Paper - fix to wake up idle `async` paper with `initializeUnmounted: true` when a new cell is added to graph
- dia.Paper - fix to prevent an error when a view is synchronously dumped during an asynchronous visibility check
- dia.Element - fix `getPortBBox()` to return a valid bbox when port has no size defined

## 4.2.2

### Patch Changes

- dia.Graph - fix types

## 4.2.1

### Patch Changes

- fix types to allow port optional transformations and make all SVG attributes nullable

## 4.2.0

### Minor Changes

- dia.Paper - introduce layers API
- dia.Paper - rework `autoFreeze` option
- dia.Paper - add `measureNode()` callback option
- dia.Paper - add `findClosestMagnetToPoint()` method
- dia.Paper - add `viewManagement` option for advanced view lifecycle management
- dia.Paper - add `cellVisibility()` callback option
- dia.Paper - add `disposeHiddenCellViews()` method
- dia.Paper - add `prioritizeCellViewMount()` and `prioritizeCellViewUnmount()` methods
- dia.Paper - add `updateCellVisibility()` and `updateCellsVisibility()` methods
- dia.Paper - add `isCellVisible()` method
- dia.LinkView - allow link-to-link snap
- dia.CellView - make `getNodeBBox()` method work for nodes outside the render tree
- dia.CellView - optimize measurements of nodes referenced by `ref` attribute
- dia.Graph - add `syncCells()` method
- dia.Graph - add `removeCell()` method
- dia.Element - add `filter` option to `fitToChildren()` and `fitParent()` methods
- dia.Element - add `minRect` option to `fitToChildren()` and `fitParent()` methods
- dia.Element - support port position `args` inside `position` property
- dia.Element - add `getPortBBox()` and `getPortCenter()` methods
- dia.Element - support custom `portLayoutNamespace` and `portLabelLayoutNamespace`
- dia.Element - support passing custom port label layout functions to `label.position`
- dia.Element - optimize cloning in `getPort()` method
- dia.Element - optimize `hasPort()` and `hasPorts()` methods
- dia.Cell - add `getCenter()` method
- dia.Cell - add cell attributes merge strategy
- dia.Cell - support array paths in `transition()` and `stopTransition()` methods
- dia.Cell - expose `getAttributeDefinition()` method
- dia.attributes - add `useNoBreakSpace` which reinstates `V.sanitizeText()` functionality
- dia.HighlighterView - `z` option now supports highlighter positioning within SVG
- dia.HighlighterView - add static `has()` method to check if CellView has a highlighter attached
- anchors - add `useModelGeometry` option to all anchors
- anchors - add support for `calc()` expressions in `dx`, `dy` options
- anchors.midSide - add `mode` and `preferenceThreshold` options
- connectionPoints - add `useModelGeometry` option to `bbox` and `rectangle`
- mvc.View - allow providing custom `cid` in constructor
- mvc.Collection - use a Map to store references
- Vectorizer - add `safe` option to `getTransformToElement()` method
- Vectorizer - add static `getCommonAncestor()` method
- Vectorizer - add `useNoBreakSpace` option to `text()` method
- Vectorizer - deprecate static `sanitizeText()` method
- Geometry - add `moveAroundPoint()` method to `Rect`

### Patch Changes

- dia.Paper - fix to only trigger `'render:idle'` event after all updates are completed
- dia.Paper - fix generic view detachment when `viewport()` callback returns `false`
- dia.Paper - fix to trigger `'render:*'` events when paper model is reset with no cells
- dia.Paper - fix rendering of first batch of updates in `async` mode to be asynchronous
- dia.LinkView - fix to prevent link snap to a magnet when only the host cell is close enough
- dia.LinkView - fix missing arrowheads in WKWebView
- dia.Element - fix to parse numeric strings in port position args
- dia.Cell - fix to always create deep copy of arrays in constructor
- dia.attributes - fix `textWrap` attribute when Paper is not in render tree
- dia.HighlighterView - fix to prevent highlighting nodes outside cell view
- dia.HighlighterView - fix to prevent removing not-yet-mounted HighlighterViews on unmount
- elementTools - fix tools position when attached directly to ElementView
- linkTools.Vertices - fix to call blur when `redundancyRemoval: false`
- Vectorizer - fix to preserve camelCase in `attributeName`, `repeatCount` attribute names
- Vectorizer - fix to handle implicit line coordinates in `convertToPathData()` method
- fix to keep `'use strict'` for minified files

## 4.1.3

### Patch Changes

- mvc.Dom - use `getComputedStyle` for static position check

## 4.1.2

### Patch Changes

- mvc.Listener - fix to support running in Web Workers

## 4.1.1

### Patch Changes

- dia.ElementView - fix return types (DOM `Element` vs. `dia.Element`)
- dia.ToolsView - make sure tools are rendered before the first update

## 4.1.0

### Minor Changes

- dia.Paper - add methods to find cell/element/link views in paper
- dia.ElementView - add `getTargetParentView()` method
- dia.LinkView - update tools when labels change
- dia.CellView - expose special presentation attributes API
- dia.CellView - add `isIntersecting()` method
- dia.Graph - accept `toJSON()` options
- dia.Graph - add `transferCellEmbeds()` and `transferCellConnectedLinks()` methods
- dia.Graph - add methods to find cells/elements/links in graph
- dia.Element - add `getPortGroupNames()` method
- dia.Cell - add `ignoreDefaults` and `ignoreEmptyAttributes` options to `toJSON()`
- dia.Cell - add `reparent` option to `embed()`
- elementTools.Control - add pointer event to `setPosition()` and `resetPosition()` signature
- linkTools - add `Control` link tool
- linkTools - add `RotateLabel` link tool
- linkTools.Vertices - add `vertexAdding.interactiveLinkNode` option
- linkTools.Button - allow `distance` to be defined via callback
- dia.HighlighterView - add static `getAll()` method
- dia.ToolView - add `visibility` option callback
- util - add `objectDifference()` method
- util - expose `calc()` expression API
- util - expose `cloneCells()` method
- Geometry - add `strict` option to `containsPoint()` of `Rect`

### Patch Changes

- dia.ElementView - fix to prevent exception when position or size is not defined
- dia.LinkView - fix to invalidate the root node cache when labels change
- dia.Graph - fix to remove graph reference from cells after `resetCells()`
- linkTools - fix pending batch for `TargetArrowhead` and `SourceArrowhead`
- routers.RightAngle - fix various routing issues
- dia.ToolsView - fix to prevent tool `update()` from being called before previous `render()` due to visibility
- mvc.View - fix to allow setting `style` via options

## 4.0.4

### Patch Changes

- update HTML demo in alignment with v4
- dia.LinkView - fix missing arrowheads in Safari
- dia.attributes - fix to take the inline font attributes into account in `textWrap`

## 4.0.3

### Patch Changes

- dia.Paper - fix to ensure grid pattern IDs are unique
- dia.ElementView - fix to support port IDs of number type
- linkTools.SourceArrowhead - fix to trigger `pointerdown` event when the user starts dragging an arrowhead
- linkTools.TargetArrowhead - fix to trigger `pointerdown` event when the user starts dragging an arrowhead

## 4.0.2

### Patch Changes

- dia.Paper - fix to prevent leaks of pending animation frame requests on `resetViews()`
- routers.rightAngle - fix to improve generated route
- dia.attributes - fix `text-wrap` to take external CSS into account
- Vectorizer - fix `normalizePathData()` to support zero-length arcto curves

## 4.0.1

### Patch Changes

- fix content of `dist` folder

## 4.0.0

### Major Changes

- rename package from `jointjs` to `@joint/core`
- remove `jQuery`, `backbone`, and `lodash` dependencies
- drop `CSS` (`JointJS` no longer distributed with CSS)
- dia.Paper - change the default cell sorting to `APPROX` type
- dia.Paper - remove deprecated `perpendicularLinks` option
- dia.Paper - remove deprecated `linkConnectionPoint` option
- dia.Paper - change the value of the `defaultConnectionPoint` option to `boundary`
- dia.Paper - add SVG `grid` layer
- dia.Paper - drop `drawGrid()` and `clearGrid()` methods
- dia.Paper - new `transform` event added
- dia.Paper - allow passing custom data along with transformation events
- dia.Paper - allow passing custom data along with resize events
- dia.Paper - `origin` option removed
- dia.Paper - `setOrigin` method removed
- dia.Paper - `scale()` no longer accepts scaling origin
- dia.Paper - add `scaleUniformAtPoint()` method
- dia.Paper - fix `paper:pinch` dispatched event type
- dia.LinkView - remove support for legacy
- dia.CellView - early evaluation of `calc` attributes
- dia.CellView - disable `useCSSSelectors` by default
- dia.Graph - throw exception when cell constructor not found
- dia.Link - become an abstract class (same as `dia.Element`)
- dia.Link - replace legacy attributes in the default label definition
- dia.Link - remove the deprecated `smooth` attribute
- dia.Link - remove the deprecated `manhattan` attribute
- dia.Cell - add `mergeArrays` options to constructor
- dia.Cell - remove the `parent(id)` setter
- shapes.standard - use `calc` expressions instead of legacy attributes (drop use of `refWidth`, `refHeight`, `refX`, `refY`, etc.)
- shapes.basic - remove in favor of `shapes.standard`
- shapes.devs - remove from package, define as custom shapes in demos
- shapes.pn - remove from package, define as custom shapes in demos
- shapes.uml - remove from package, define as custom shapes in demos
- shapes.logic - remove from package, define as custom shapes in demos
- shapes.org - remove from package, define as custom shapes in demos
- shapes.chess - remove from package, define as custom shapes in demos
- shapes.fsa - remove from package, define as custom shapes in demos
- highlighters.opacity - add `alphaValue` option
- highlighters.stroke - add `nonScalingStroke` option
- elementTools.Remove - change type to `remove`
- linkTools.Remove - change type to `remove`
- attributes.filter - change the coordinate system of the filters from `objectBoundingBox` to `userSpaceOnUse`
- util - remove deprecated `shapePerimeterConnectionPoint`
- Vectorizer - enable camel case attribute support by default
- Vectorizer - make the `attributeNames` property public

### Patch Changes

- linkTools.Vertices - fix to trigger `link:mouseleave` event when the user stops dragging a vertex
