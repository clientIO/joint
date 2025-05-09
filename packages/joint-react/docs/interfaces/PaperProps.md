[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProps

# Interface: PaperProps\<ElementItem\>

Defined in: [joint-react/src/components/paper/paper.tsx:39](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L39)

The props for the Paper component. Extend the `dia.Paper.Options` interface.
For more information, see the JointJS documentation.

## See

https://docs.jointjs.com/api/dia/Paper

## Extends

- `ReactPaperOptions`.`PaperEvents`

## Type Parameters

### ElementItem

`ElementItem` *extends* [`GraphElementWithAttributes`](GraphElementWithAttributes.md) = [`GraphElementWithAttributes`](GraphElementWithAttributes.md)

## Properties

### afterRender?

> `optional` **afterRender**: `AfterRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1473](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1473)

#### Inherited from

`ReactPaperOptions.afterRender`

***

### allowLink?

> `optional` **allowLink**: `null` \| (`linkView`, `paper`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1430](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1430)

#### Inherited from

`ReactPaperOptions.allowLink`

***

### anchorNamespace?

> `optional` **anchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1453](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1453)

#### Inherited from

`ReactPaperOptions.anchorNamespace`

***

### async?

> `optional` **async**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1465](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1465)

#### Inherited from

`ReactPaperOptions.async`

***

### attributes?

> `optional` **attributes**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>

Defined in: [joint-core/types/joint.d.ts:3459](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3459)

#### Inherited from

`ReactPaperOptions.attributes`

***

### autoFreeze?

> `optional` **autoFreeze**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1468](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1468)

#### Inherited from

`ReactPaperOptions.autoFreeze`

***

### background?

> `optional` **background**: `BackgroundOptions`

Defined in: [joint-core/types/joint.d.ts:1414](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1414)

#### Inherited from

`ReactPaperOptions.background`

***

### beforeRender?

> `optional` **beforeRender**: `BeforeRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1472](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1472)

#### Inherited from

`ReactPaperOptions.beforeRender`

***

### cellViewNamespace?

> `optional` **cellViewNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1449](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1449)

#### Inherited from

`ReactPaperOptions.cellViewNamespace`

***

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/paper/paper.tsx:112](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L112)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [joint-react/src/components/paper/paper.tsx:90](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L90)

Class name of the paper element.

#### Overrides

`ReactPaperOptions.className`

***

### clickThreshold?

> `readonly` `optional` **clickThreshold**: `number`

Defined in: [joint-react/src/components/paper/paper.tsx:129](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L129)

The threshold for click events in pixels.
If the mouse moves more than this distance, it will be considered a drag event.

#### Default

```ts
10
```

#### Overrides

`ReactPaperOptions.clickThreshold`

***

### collection?

> `optional` **collection**: `Collection`\<`any`\>

Defined in: [joint-core/types/joint.d.ts:3456](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3456)

#### Inherited from

`ReactPaperOptions.collection`

***

### connectionPointNamespace?

> `optional` **connectionPointNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1455](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1455)

#### Inherited from

`ReactPaperOptions.connectionPointNamespace`

***

### connectionStrategy?

> `optional` **connectionStrategy**: `ConnectionStrategy`

Defined in: [joint-core/types/joint.d.ts:1463](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1463)

#### Inherited from

`ReactPaperOptions.connectionStrategy`

***

### connectorNamespace?

> `optional` **connectorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1451](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1451)

#### Inherited from

`ReactPaperOptions.connectorNamespace`

***

### defaultAnchor?

> `optional` **defaultAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1459](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1459)

#### Inherited from

`ReactPaperOptions.defaultAnchor`

***

### defaultConnectionPoint?

> `optional` **defaultConnectionPoint**: `ConnectionPointJSON` \| `ConnectionPoint` \| (...`args`) => `ConnectionPoint`

Defined in: [joint-core/types/joint.d.ts:1461](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1461)

#### Inherited from

`ReactPaperOptions.defaultConnectionPoint`

***

### defaultConnector?

> `optional` **defaultConnector**: `Connector` \| `ConnectorJSON`

Defined in: [joint-core/types/joint.d.ts:1458](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1458)

#### Inherited from

`ReactPaperOptions.defaultConnector`

***

### defaultLink?

> `optional` **defaultLink**: `Link`\<`Attributes`, `ModelSetOptions`\> \| (`cellView`, `magnet`) => `Link`

Defined in: [joint-core/types/joint.d.ts:1456](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1456)

#### Inherited from

`ReactPaperOptions.defaultLink`

***

### defaultLinkAnchor?

> `optional` **defaultLinkAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1460](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1460)

#### Inherited from

`ReactPaperOptions.defaultLinkAnchor`

***

### defaultRouter?

> `optional` **defaultRouter**: `Router` \| `RouterJSON`

Defined in: [joint-core/types/joint.d.ts:1457](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1457)

#### Inherited from

`ReactPaperOptions.defaultRouter`

***

### drawGrid?

> `optional` **drawGrid**: `boolean` \| `GridOptions` \| `GridOptions`[]

Defined in: [joint-core/types/joint.d.ts:1412](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1412)

#### Inherited from

`ReactPaperOptions.drawGrid`

***

### drawGridSize?

> `optional` **drawGridSize**: `null` \| `number`

Defined in: [joint-core/types/joint.d.ts:1413](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1413)

#### Inherited from

`ReactPaperOptions.drawGridSize`

***

### el?

> `optional` **el**: `unknown`

Defined in: [joint-core/types/joint.d.ts:3457](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3457)

#### Inherited from

`ReactPaperOptions.el`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `ElementItem`

Defined in: [joint-react/src/components/paper/paper.tsx:98](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L98)

A function that selects the elements to be rendered.
It defaults to the `GraphElement` elements because `dia.Element` is not a valid React element (it do not change reference after update).

#### Parameters

##### item

[`GraphElementWithAttributes`](GraphElementWithAttributes.md)

#### Returns

`ElementItem`

#### Default

(item: dia.Cell) => `BaseElement`

#### See

GraphElementWithAttributes<Data>

***

### elementView?

> `optional` **elementView**: *typeof* `ElementView` \| (`element`) => *typeof* `ElementView`

Defined in: [joint-core/types/joint.d.ts:1440](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1440)

#### Inherited from

`ReactPaperOptions.elementView`

***

### embeddingMode?

> `optional` **embeddingMode**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1443](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1443)

#### Inherited from

`ReactPaperOptions.embeddingMode`

***

### events?

> `optional` **events**: `_Result`\<`EventsHash`\>

Defined in: [joint-core/types/joint.d.ts:3462](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3462)

#### Inherited from

`ReactPaperOptions.events`

***

### findParentBy?

> `optional` **findParentBy**: `FindParentByType` \| `FindParentByCallback`

Defined in: [joint-core/types/joint.d.ts:1445](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1445)

#### Inherited from

`ReactPaperOptions.findParentBy`

***

### frontParentOnly?

> `optional` **frontParentOnly**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1444](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1444)

#### Inherited from

`ReactPaperOptions.frontParentOnly`

***

### gridSize?

> `optional` **gridSize**: `number`

Defined in: [joint-core/types/joint.d.ts:1417](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1417)

#### Inherited from

`ReactPaperOptions.gridSize`

***

### guard()?

> `optional` **guard**: (`evt`, `view`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1432](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1432)

#### Parameters

##### evt

`Event`

##### view

`CellView`

#### Returns

`boolean`

#### Inherited from

`ReactPaperOptions.guard`

***

### height?

> `optional` **height**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1411](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1411)

#### Inherited from

`ReactPaperOptions.height`

***

### highlighterNamespace?

> `optional` **highlighterNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1452](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1452)

#### Inherited from

`ReactPaperOptions.highlighterNamespace`

***

### highlighting?

> `optional` **highlighting**: `boolean` \| [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `boolean` \| `HighlighterJSON`\>

Defined in: [joint-core/types/joint.d.ts:1418](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1418)

#### Inherited from

`ReactPaperOptions.highlighting`

***

### id?

> `optional` **id**: `string`

Defined in: [joint-core/types/joint.d.ts:3458](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3458)

#### Inherited from

`ReactPaperOptions.id`

***

### interactive?

> `optional` **interactive**: `boolean` \| (`cellView`, `event`) => `boolean` \| `InteractivityOptions` \| `InteractivityOptions`

Defined in: [joint-core/types/joint.d.ts:1419](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1419)

#### Inherited from

`ReactPaperOptions.interactive`

***

### labelsLayer?

> `optional` **labelsLayer**: `string` \| `boolean`

Defined in: [joint-core/types/joint.d.ts:1415](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1415)

#### Inherited from

`ReactPaperOptions.labelsLayer`

***

### linkAnchorNamespace?

> `optional` **linkAnchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1454](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1454)

#### Inherited from

`ReactPaperOptions.linkAnchorNamespace`

***

### linkPinning?

> `optional` **linkPinning**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1429](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1429)

#### Inherited from

`ReactPaperOptions.linkPinning`

***

### linkView?

> `optional` **linkView**: *typeof* `LinkView` \| (`link`) => *typeof* `LinkView`

Defined in: [joint-core/types/joint.d.ts:1441](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1441)

#### Inherited from

`ReactPaperOptions.linkView`

***

### magnetThreshold?

> `optional` **magnetThreshold**: `string` \| `number`

Defined in: [joint-core/types/joint.d.ts:1438](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1438)

#### Inherited from

`ReactPaperOptions.magnetThreshold`

***

### markAvailable?

> `optional` **markAvailable**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1423](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1423)

#### Inherited from

`ReactPaperOptions.markAvailable`

***

### model?

> `optional` **model**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:3454](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3454)

#### Inherited from

`ReactPaperOptions.model`

***

### moveThreshold?

> `optional` **moveThreshold**: `number`

Defined in: [joint-core/types/joint.d.ts:1437](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1437)

#### Inherited from

`ReactPaperOptions.moveThreshold`

***

### multiLinks?

> `optional` **multiLinks**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1428](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1428)

#### Inherited from

`ReactPaperOptions.multiLinks`

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [joint-react/src/components/paper/paper.tsx:107](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L107)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onBlankContextMenu()?

> `optional` **onBlankContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:285](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L285)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankContextMenu`

***

### onBlankMouseEnter()?

> `optional` **onBlankMouseEnter**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:387](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L387)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankMouseEnter`

***

### onBlankMouseLeave()?

> `optional` **onBlankMouseLeave**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:397](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L397)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankMouseLeave`

***

### onBlankMouseOut()?

> `optional` **onBlankMouseOut**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:377](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L377)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankMouseOut`

***

### onBlankMouseOver()?

> `optional` **onBlankMouseOver**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:367](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L367)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankMouseOver`

***

### onBlankMouseWheel()?

> `optional` **onBlankMouseWheel**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:424](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L424)

#### Parameters

##### args

###### delta

`number`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankMouseWheel`

***

### onBlankPointerClick()?

> `optional` **onBlankPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:227](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L227)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankPointerClick`

***

### onBlankPointerDblClick()?

> `optional` **onBlankPointerDblClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:256](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L256)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankPointerDblClick`

***

### onBlankPointerDown()?

> `optional` **onBlankPointerDown**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:309](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L309)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankPointerDown`

***

### onBlankPointerMove()?

> `optional` **onBlankPointerMove**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:333](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L333)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankPointerMove`

***

### onBlankPointerUp()?

> `optional` **onBlankPointerUp**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:357](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L357)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onBlankPointerUp`

***

### onCellContextMenu()?

> `optional` **onCellContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:264](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L264)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellContextMenu`

***

### onCellHighlight()?

> `optional` **onCellHighlight**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:469](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L469)

#### Parameters

##### args

###### cellView

`CellView`

###### node

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### options

`EventHighlightOptions`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellHighlight`

***

### onCellHighlightInvalid()?

> `optional` **onCellHighlightInvalid**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:481](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L481)

#### Parameters

##### args

###### cellView

`CellView`

###### highlighter

`HighlighterView`

###### highlighterId

`string`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellHighlightInvalid`

***

### onCellMouseEnter()?

> `optional` **onCellMouseEnter**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:380](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L380)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellMouseEnter`

***

### onCellMouseLeave()?

> `optional` **onCellMouseLeave**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:390](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L390)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellMouseLeave`

***

### onCellMouseOut()?

> `optional` **onCellMouseOut**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:370](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L370)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellMouseOut`

***

### onCellMouseOver()?

> `optional` **onCellMouseOver**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:360](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L360)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellMouseOver`

***

### onCellMouseWheel()?

> `optional` **onCellMouseWheel**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:400](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L400)

#### Parameters

##### args

###### cellView

`CellView`

###### delta

`number`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellMouseWheel`

***

### onCellPointerClick()?

> `optional` **onCellPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:206](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L206)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellPointerClick`

***

### onCellPointerDblClick()?

> `optional` **onCellPointerDblClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:235](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L235)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellPointerDblClick`

***

### onCellPointerDown()?

> `optional` **onCellPointerDown**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:288](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L288)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellPointerDown`

***

### onCellPointerMove()?

> `optional` **onCellPointerMove**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:312](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L312)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellPointerMove`

***

### onCellPointerUp()?

> `optional` **onCellPointerUp**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:336](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L336)

#### Parameters

##### args

###### cellView

`CellView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellPointerUp`

***

### onCellUnhighlight()?

> `optional` **onCellUnhighlight**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:475](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L475)

#### Parameters

##### args

###### cellView

`CellView`

###### node

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### options

`EventHighlightOptions`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCellUnhighlight`

***

### onCustomEvent()?

> `optional` **onCustomEvent**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:532](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L532)

#### Parameters

##### args

###### args

`any`[]

###### eventName

`string`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onCustomEvent`

***

### onElementContextMenu()?

> `optional` **onElementContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:271](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L271)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementContextMenu`

***

### onElementMagnetContextMenu()?

> `optional` **onElementMagnetContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:459](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L459)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### magnetNode

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMagnetContextMenu`

***

### onElementMagnetPointerClick()?

> `optional` **onElementMagnetPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:443](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L443)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### magnetNode

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMagnetPointerClick`

***

### onElementMagnetPointerDblClick()?

> `optional` **onElementMagnetPointerDblClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:451](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L451)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### magnetNode

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMagnetPointerDblClick`

***

### onElementMouseEnter()?

> `optional` **onElementMouseEnter**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:381](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L381)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMouseEnter`

***

### onElementMouseLeave()?

> `optional` **onElementMouseLeave**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:391](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L391)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMouseLeave`

***

### onElementMouseOut()?

> `optional` **onElementMouseOut**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:371](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L371)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMouseOut`

***

### onElementMouseOver()?

> `optional` **onElementMouseOver**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:361](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L361)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMouseOver`

***

### onElementMouseWheel()?

> `optional` **onElementMouseWheel**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:408](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L408)

#### Parameters

##### args

###### delta

`number`

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementMouseWheel`

***

### onElementPointerClick()?

> `optional` **onElementPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:213](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L213)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementPointerClick`

***

### onElementPointerDblClick()?

> `optional` **onElementPointerDblClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:242](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L242)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementPointerDblClick`

***

### onElementPointerDown()?

> `optional` **onElementPointerDown**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:295](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L295)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementPointerDown`

***

### onElementPointerMove()?

> `optional` **onElementPointerMove**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:319](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L319)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementPointerMove`

***

### onElementPointerUp()?

> `optional` **onElementPointerUp**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:343](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L343)

#### Parameters

##### args

###### elementView

`ElementView`

###### event

`Event`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onElementPointerUp`

***

### onElementsSizeChange()?

> `readonly` `optional` **onElementsSizeChange**: (`options`) => `void`

Defined in: [joint-react/src/components/paper/paper.tsx:81](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L81)

Event called when the paper is resized.
It is useful for like onLoad event to do some layout or other operations with `graph` or `paper`.

#### Parameters

##### options

[`OnLoadOptions`](OnLoadOptions.md)

#### Returns

`void`

***

### onElementsSizeReady()?

> `readonly` `optional` **onElementsSizeReady**: (`options`) => `void`

Defined in: [joint-react/src/components/paper/paper.tsx:75](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L75)

Event called when all elements are properly measured (has all elements width and height greater than 1 - default).
In react, we cannot detect jointjs paper render:done event properly, so we use this special event to check if all elements are measured.
It is useful for like onLoad event to do some layout or other operations with `graph` or `paper`.

#### Parameters

##### options

[`OnLoadOptions`](OnLoadOptions.md)

#### Returns

`void`

***

### onLinkConnect()?

> `optional` **onLinkConnect**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:489](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L489)

#### Parameters

##### args

###### arrowhead

`LinkEnd`

###### event

`Event`

###### linkView

`LinkView`

###### newCellView

`CellView`

###### newCellViewMagnet

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkConnect`

***

### onLinkContextMenu()?

> `optional` **onLinkContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:278](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L278)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkContextMenu`

***

### onLinkDisconnect()?

> `optional` **onLinkDisconnect**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:497](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L497)

#### Parameters

##### args

###### arrowhead

`LinkEnd`

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### previousCellView

`CellView`

###### previousCellViewMagnet

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkDisconnect`

***

### onLinkMouseEnter()?

> `optional` **onLinkMouseEnter**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:386](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L386)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkMouseEnter`

***

### onLinkMouseLeave()?

> `optional` **onLinkMouseLeave**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:396](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L396)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkMouseLeave`

***

### onLinkMouseOut()?

> `optional` **onLinkMouseOut**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:376](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L376)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkMouseOut`

***

### onLinkMouseOver()?

> `optional` **onLinkMouseOver**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:366](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L366)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkMouseOver`

***

### onLinkMouseWheel()?

> `optional` **onLinkMouseWheel**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:416](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L416)

#### Parameters

##### args

###### delta

`number`

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkMouseWheel`

***

### onLinkPointerClick()?

> `optional` **onLinkPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:220](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L220)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkPointerClick`

***

### onLinkPointerDblClick()?

> `optional` **onLinkPointerDblClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:249](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L249)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkPointerDblClick`

***

### onLinkPointerDown()?

> `optional` **onLinkPointerDown**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:302](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L302)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkPointerDown`

***

### onLinkPointerMove()?

> `optional` **onLinkPointerMove**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:326](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L326)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkPointerMove`

***

### onLinkPointerUp()?

> `optional` **onLinkPointerUp**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:350](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L350)

#### Parameters

##### args

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkPointerUp`

***

### onLinkSnapConnect()?

> `optional` **onLinkSnapConnect**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:505](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L505)

#### Parameters

##### args

###### arrowhead

`LinkEnd`

###### event

`Event`

###### linkView

`LinkView`

###### newCellView

`CellView`

###### newCellViewMagnet

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkSnapConnect`

***

### onLinkSnapDisconnect()?

> `optional` **onLinkSnapDisconnect**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:513](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L513)

#### Parameters

##### args

###### arrowhead

`LinkEnd`

###### event

`Event`

###### linkView

`LinkView`

###### paper

`Paper`

###### previousCellView

`CellView`

###### previousCellViewMagnet

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

#### Returns

`void`

#### Inherited from

`PaperEvents.onLinkSnapDisconnect`

***

### onPan()?

> `optional` **onPan**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:433](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L433)

#### Parameters

##### args

###### deltaX

`number`

###### deltaY

`number`

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPan`

***

### onPaperMouseEnter()?

> `optional` **onPaperMouseEnter**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:202](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L202)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPaperMouseEnter`

***

### onPaperMouseLeave()?

> `optional` **onPaperMouseLeave**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:203](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L203)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPaperMouseLeave`

***

### onPinch()?

> `optional` **onPinch**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:434](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L434)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### scale

`number`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPinch`

***

### onRenderDone()?

> `optional` **onRenderDone**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:523](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L523)

#### Parameters

##### args

###### opt

`unknown`

###### paper

`Paper`

###### stats

`UpdateStats`

#### Returns

`void`

#### Inherited from

`PaperEvents.onRenderDone`

***

### onResize()?

> `optional` **onResize**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:528](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L528)

#### Parameters

##### args

###### data

`unknown`

###### height

`number`

###### paper

`Paper`

###### width

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onResize`

***

### onScale()?

> `optional` **onScale**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:527](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L527)

#### Parameters

##### args

###### data

`unknown`

###### paper

`Paper`

###### sx

`number`

###### sy

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onScale`

***

### onTransform()?

> `optional` **onTransform**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:529](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L529)

#### Parameters

##### args

###### data

`unknown`

###### matrix

[`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

###### paper

`Paper`

#### Returns

`void`

#### Inherited from

`PaperEvents.onTransform`

***

### onTranslate()?

> `optional` **onTranslate**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:526](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L526)

#### Parameters

##### args

###### data

`unknown`

###### paper

`Paper`

###### tx

`number`

###### ty

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onTranslate`

***

### onViewPostponed()?

> `optional` **onViewPostponed**: (`view`, `flag`, `paper`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1471](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1471)

#### Parameters

##### view

`View`\<`any`, `any`\>

##### flag

`number`

##### paper

`Paper`

#### Returns

`boolean`

#### Inherited from

`ReactPaperOptions.onViewPostponed`

***

### onViewUpdate()?

> `optional` **onViewUpdate**: (`view`, `flag`, `priority`, `opt`, `paper`) => `void`

Defined in: [joint-core/types/joint.d.ts:1470](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1470)

#### Parameters

##### view

`View`\<`any`, `any`\>

##### flag

`number`

##### priority

`number`

##### opt

##### paper

`Paper`

#### Returns

`void`

#### Inherited from

`ReactPaperOptions.onViewUpdate`

***

### overflow?

> `optional` **overflow**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1474](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1474)

#### Inherited from

`ReactPaperOptions.overflow`

***

### overwriteDefaultPaperElement()?

> `readonly` `optional` **overwriteDefaultPaperElement**: (`paper`) => [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) \| [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

Defined in: [joint-react/src/components/paper/paper.tsx:122](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L122)

On load custom element.
If provided, it must return valid HTML or SVG element and it will be replaced with the default paper element.
So it overwrite default paper rendering.
It is used internally for example to render `PaperScroller` from [joint plus](https://www.jointjs.com/jointjs-plus) package.

#### Parameters

##### paper

`Paper`

The paper instance

#### Returns

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) \| [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

***

### preventContextMenu?

> `optional` **preventContextMenu**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1433](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1433)

#### Inherited from

`ReactPaperOptions.preventContextMenu`

***

### preventDefaultBlankAction?

> `optional` **preventDefaultBlankAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1435](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1435)

#### Inherited from

`ReactPaperOptions.preventDefaultBlankAction`

***

### preventDefaultViewAction?

> `optional` **preventDefaultViewAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1434](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1434)

#### Inherited from

`ReactPaperOptions.preventDefaultViewAction`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`ElementItem`\>

Defined in: [joint-react/src/components/paper/paper.tsx:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L69)

A function that renders the element.

Note: Jointjs works by default with SVG's so by default renderElement is append inside the SVGElement node.
To use HTML elements, you need to use the `HTMLNode` component or `foreignObject` element.

This is called when the data from `elementSelector` changes.

#### Examples

Example with `global component`:
```tsx
type BaseElementWithData = InferElement<typeof initialElements>
function RenderElement({ label }: BaseElementWithData) {
 return <HTMLElement className="node">{label}</HTMLElement>
}
```

Example with `local component`:
```tsx

type BaseElementWithData = InferElement<typeof initialElements>
const renderElement: RenderElement<BaseElementWithData> = useCallback(
   (element) => <HTMLElement className="node">{element.label}</HTMLElement>,
   []
)
```

***

### restrictTranslate?

> `optional` **restrictTranslate**: `boolean` \| `PlainRect` \| `RestrictTranslateCallback`

Defined in: [joint-core/types/joint.d.ts:1427](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1427)

#### Inherited from

`ReactPaperOptions.restrictTranslate`

***

### routerNamespace?

> `optional` **routerNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1450](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1450)

#### Inherited from

`ReactPaperOptions.routerNamespace`

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [joint-react/src/components/paper/paper.tsx:103](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L103)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### snapLabels?

> `optional` **snapLabels**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1420](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1420)

#### Inherited from

`ReactPaperOptions.snapLabels`

***

### snapLinks?

> `optional` **snapLinks**: `boolean` \| `SnapLinksOptions`

Defined in: [joint-core/types/joint.d.ts:1421](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1421)

#### Inherited from

`ReactPaperOptions.snapLinks`

***

### snapLinksSelf?

> `optional` **snapLinksSelf**: `boolean` \| \{ `distance`: `number`; \}

Defined in: [joint-core/types/joint.d.ts:1422](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1422)

#### Inherited from

`ReactPaperOptions.snapLinksSelf`

***

### sorting?

> `optional` **sorting**: `sorting`

Defined in: [joint-core/types/joint.d.ts:1466](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1466)

#### Inherited from

`ReactPaperOptions.sorting`

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [joint-react/src/components/paper/paper.tsx:86](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L86)

The style of the paper element.

***

### tagName?

> `optional` **tagName**: `string`

Defined in: [joint-core/types/joint.d.ts:3461](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3461)

#### Inherited from

`ReactPaperOptions.tagName`

***

### theme?

> `optional` **theme**: `string`

Defined in: [joint-core/types/joint.d.ts:3520](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3520)

#### Inherited from

`ReactPaperOptions.theme`

***

### useHTMLOverlay?

> `readonly` `optional` **useHTMLOverlay**: `boolean`

Defined in: [joint-react/src/components/paper/paper.tsx:136](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L136)

Enabled if renderElements is render to pure HTML elements.
By default, `joint/react` renderElements to SVG elements, so for using HTML elements without this prop, you need to use `foreignObject` element.

#### Default

```ts
false
```

***

### validateConnection()?

> `optional` **validateConnection**: (`cellViewS`, `magnetS`, `cellViewT`, `magnetT`, `end`, `linkView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1426](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1426)

#### Parameters

##### cellViewS

`CellView`

##### magnetS

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

##### cellViewT

`CellView`

##### magnetT

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

##### end

`LinkEnd`

##### linkView

`LinkView`

#### Returns

`boolean`

#### Inherited from

`ReactPaperOptions.validateConnection`

***

### validateEmbedding()?

> `optional` **validateEmbedding**: (`this`, `childView`, `parentView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1446](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1446)

#### Parameters

##### this

`Paper`

##### childView

`ElementView`

##### parentView

`ElementView`

#### Returns

`boolean`

#### Inherited from

`ReactPaperOptions.validateEmbedding`

***

### validateMagnet()?

> `optional` **validateMagnet**: (`cellView`, `magnet`, `evt`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1425](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1425)

#### Parameters

##### cellView

`CellView`

##### magnet

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

##### evt

`Event`

#### Returns

`boolean`

#### Inherited from

`ReactPaperOptions.validateMagnet`

***

### validateUnembedding()?

> `optional` **validateUnembedding**: (`this`, `childView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1447](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1447)

#### Parameters

##### this

`Paper`

##### childView

`ElementView`

#### Returns

`boolean`

#### Inherited from

`ReactPaperOptions.validateUnembedding`

***

### viewport?

> `optional` **viewport**: `null` \| `ViewportCallback`

Defined in: [joint-core/types/joint.d.ts:1469](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1469)

#### Inherited from

`ReactPaperOptions.viewport`

***

### width?

> `optional` **width**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1410](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1410)

#### Inherited from

`ReactPaperOptions.width`
