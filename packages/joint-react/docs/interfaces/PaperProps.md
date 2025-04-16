[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProps

# Interface: PaperProps\<ElementItem\>

Defined in: [joint-react/src/components/paper/paper.tsx:28](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L28)

The props for the Paper component. Extend the `dia.Paper.Options` interface.
For more information, see the JointJS documentation.

## See

https://docs.jointjs.com/api/dia/Paper

## Extends

- `Options`.`PaperEvents`

## Type Parameters

### ElementItem

`ElementItem` *extends* [`GraphElementBase`](GraphElementBase.md) = [`GraphElementBase`](GraphElementBase.md)

## Indexable

\[`key`: `string`\]: `any`

## Properties

### afterRender?

> `optional` **afterRender**: `AfterRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1456](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1456)

#### Inherited from

`dia.Paper.Options.afterRender`

***

### allowLink?

> `optional` **allowLink**: `null` \| (`linkView`, `paper`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1413](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1413)

#### Inherited from

`dia.Paper.Options.allowLink`

***

### anchorNamespace?

> `optional` **anchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1436](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1436)

#### Inherited from

`dia.Paper.Options.anchorNamespace`

***

### async?

> `optional` **async**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1448](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1448)

#### Inherited from

`dia.Paper.Options.async`

***

### attributes?

> `optional` **attributes**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>

Defined in: [joint-core/types/joint.d.ts:3442](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3442)

#### Inherited from

`dia.Paper.Options.attributes`

***

### autoFreeze?

> `optional` **autoFreeze**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1451](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1451)

#### Inherited from

`dia.Paper.Options.autoFreeze`

***

### background?

> `optional` **background**: `BackgroundOptions`

Defined in: [joint-core/types/joint.d.ts:1397](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1397)

#### Inherited from

`dia.Paper.Options.background`

***

### beforeRender?

> `optional` **beforeRender**: `BeforeRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1455](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1455)

#### Inherited from

`dia.Paper.Options.beforeRender`

***

### cellViewNamespace?

> `optional` **cellViewNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1432](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1432)

#### Inherited from

`dia.Paper.Options.cellViewNamespace`

***

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/paper/paper.tsx:94](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L94)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [joint-react/src/components/paper/paper.tsx:72](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L72)

Class name of the paper element.

#### Overrides

`dia.Paper.Options.className`

***

### clickThreshold?

> `readonly` `optional` **clickThreshold**: `number`

Defined in: [joint-react/src/components/paper/paper.tsx:111](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L111)

The threshold for click events in pixels.
If the mouse moves more than this distance, it will be considered a drag event.

#### Default

```ts
10
```

#### Overrides

`dia.Paper.Options.clickThreshold`

***

### collection?

> `optional` **collection**: `Collection`\<`any`\>

Defined in: [joint-core/types/joint.d.ts:3439](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3439)

#### Inherited from

`dia.Paper.Options.collection`

***

### connectionPointNamespace?

> `optional` **connectionPointNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1438](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1438)

#### Inherited from

`dia.Paper.Options.connectionPointNamespace`

***

### connectionStrategy?

> `optional` **connectionStrategy**: `ConnectionStrategy`

Defined in: [joint-core/types/joint.d.ts:1446](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1446)

#### Inherited from

`dia.Paper.Options.connectionStrategy`

***

### connectorNamespace?

> `optional` **connectorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1434](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1434)

#### Inherited from

`dia.Paper.Options.connectorNamespace`

***

### defaultAnchor?

> `optional` **defaultAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1442](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1442)

#### Inherited from

`dia.Paper.Options.defaultAnchor`

***

### defaultConnectionPoint?

> `optional` **defaultConnectionPoint**: `ConnectionPointJSON` \| `ConnectionPoint` \| (...`args`) => `ConnectionPoint`

Defined in: [joint-core/types/joint.d.ts:1444](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1444)

#### Inherited from

`dia.Paper.Options.defaultConnectionPoint`

***

### defaultConnector?

> `optional` **defaultConnector**: `Connector` \| `ConnectorJSON`

Defined in: [joint-core/types/joint.d.ts:1441](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1441)

#### Inherited from

`dia.Paper.Options.defaultConnector`

***

### defaultLink?

> `optional` **defaultLink**: `Link`\<`Attributes`, `ModelSetOptions`\> \| (`cellView`, `magnet`) => `Link`

Defined in: [joint-core/types/joint.d.ts:1439](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1439)

#### Inherited from

`dia.Paper.Options.defaultLink`

***

### defaultLinkAnchor?

> `optional` **defaultLinkAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1443](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1443)

#### Inherited from

`dia.Paper.Options.defaultLinkAnchor`

***

### defaultRouter?

> `optional` **defaultRouter**: `Router` \| `RouterJSON`

Defined in: [joint-core/types/joint.d.ts:1440](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1440)

#### Inherited from

`dia.Paper.Options.defaultRouter`

***

### drawGrid?

> `optional` **drawGrid**: `boolean` \| `GridOptions` \| `GridOptions`[]

Defined in: [joint-core/types/joint.d.ts:1395](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1395)

#### Inherited from

`dia.Paper.Options.drawGrid`

***

### drawGridSize?

> `optional` **drawGridSize**: `null` \| `number`

Defined in: [joint-core/types/joint.d.ts:1396](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1396)

#### Inherited from

`dia.Paper.Options.drawGridSize`

***

### el?

> `optional` **el**: `unknown`

Defined in: [joint-core/types/joint.d.ts:3440](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3440)

#### Inherited from

`dia.Paper.Options.el`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `ElementItem`

Defined in: [joint-react/src/components/paper/paper.tsx:80](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L80)

A function that selects the elements to be rendered.
It defaults to the `GraphElement` elements because `dia.Element` is not a valid React element (it do not change reference after update).

#### Parameters

##### item

[`GraphElement`](GraphElement.md)

#### Returns

`ElementItem`

#### Default

(item: dia.Cell) => `BaseElement`

#### See

GraphElement<Data>

***

### elementView?

> `optional` **elementView**: *typeof* `ElementView` \| (`element`) => *typeof* `ElementView`

Defined in: [joint-core/types/joint.d.ts:1423](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1423)

#### Inherited from

`dia.Paper.Options.elementView`

***

### embeddingMode?

> `optional` **embeddingMode**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1426](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1426)

#### Inherited from

`dia.Paper.Options.embeddingMode`

***

### events?

> `optional` **events**: `_Result`\<`EventsHash`\>

Defined in: [joint-core/types/joint.d.ts:3445](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3445)

#### Inherited from

`dia.Paper.Options.events`

***

### findParentBy?

> `optional` **findParentBy**: `FindParentByType` \| `FindParentByCallback`

Defined in: [joint-core/types/joint.d.ts:1428](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1428)

#### Inherited from

`dia.Paper.Options.findParentBy`

***

### frontParentOnly?

> `optional` **frontParentOnly**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1427](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1427)

#### Inherited from

`dia.Paper.Options.frontParentOnly`

***

### frozen?

> `optional` **frozen**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1450](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1450)

#### Inherited from

`dia.Paper.Options.frozen`

***

### gridSize?

> `optional` **gridSize**: `number`

Defined in: [joint-core/types/joint.d.ts:1400](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1400)

#### Inherited from

`dia.Paper.Options.gridSize`

***

### guard()?

> `optional` **guard**: (`evt`, `view`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1415](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1415)

#### Parameters

##### evt

`Event`

##### view

`CellView`

#### Returns

`boolean`

#### Inherited from

`dia.Paper.Options.guard`

***

### height?

> `optional` **height**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1394](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1394)

#### Inherited from

`dia.Paper.Options.height`

***

### highlighterNamespace?

> `optional` **highlighterNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1435](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1435)

#### Inherited from

`dia.Paper.Options.highlighterNamespace`

***

### highlighting?

> `optional` **highlighting**: `boolean` \| [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `boolean` \| `HighlighterJSON`\>

Defined in: [joint-core/types/joint.d.ts:1401](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1401)

#### Inherited from

`dia.Paper.Options.highlighting`

***

### id?

> `optional` **id**: `string`

Defined in: [joint-core/types/joint.d.ts:3441](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3441)

#### Inherited from

`dia.Paper.Options.id`

***

### interactive?

> `optional` **interactive**: `boolean` \| (`cellView`, `event`) => `boolean` \| `InteractivityOptions` \| `InteractivityOptions`

Defined in: [joint-core/types/joint.d.ts:1402](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1402)

#### Inherited from

`dia.Paper.Options.interactive`

***

### labelsLayer?

> `optional` **labelsLayer**: `string` \| `boolean`

Defined in: [joint-core/types/joint.d.ts:1398](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1398)

#### Inherited from

`dia.Paper.Options.labelsLayer`

***

### linkAnchorNamespace?

> `optional` **linkAnchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1437](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1437)

#### Inherited from

`dia.Paper.Options.linkAnchorNamespace`

***

### linkPinning?

> `optional` **linkPinning**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1412](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1412)

#### Inherited from

`dia.Paper.Options.linkPinning`

***

### linkView?

> `optional` **linkView**: *typeof* `LinkView` \| (`link`) => *typeof* `LinkView`

Defined in: [joint-core/types/joint.d.ts:1424](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1424)

#### Inherited from

`dia.Paper.Options.linkView`

***

### magnetThreshold?

> `optional` **magnetThreshold**: `string` \| `number`

Defined in: [joint-core/types/joint.d.ts:1421](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1421)

#### Inherited from

`dia.Paper.Options.magnetThreshold`

***

### markAvailable?

> `optional` **markAvailable**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1406](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1406)

#### Inherited from

`dia.Paper.Options.markAvailable`

***

### model?

> `optional` **model**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:3437](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3437)

#### Inherited from

`dia.Paper.Options.model`

***

### moveThreshold?

> `optional` **moveThreshold**: `number`

Defined in: [joint-core/types/joint.d.ts:1420](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1420)

#### Inherited from

`dia.Paper.Options.moveThreshold`

***

### multiLinks?

> `optional` **multiLinks**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1411](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1411)

#### Inherited from

`dia.Paper.Options.multiLinks`

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [joint-react/src/components/paper/paper.tsx:89](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L89)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onBlankContextMenu()?

> `optional` **onBlankContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:277](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L277)

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

Defined in: [joint-react/src/types/event.types.ts:310](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L310)

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

Defined in: [joint-react/src/types/event.types.ts:318](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L318)

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

Defined in: [joint-react/src/types/event.types.ts:335](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L335)

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

Defined in: [joint-react/src/types/event.types.ts:327](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L327)

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

### onBlankPointerClick()?

> `optional` **onBlankPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:219](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L219)

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

Defined in: [joint-react/src/types/event.types.ts:248](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L248)

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

### onCellContextMenu()?

> `optional` **onCellContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:256](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L256)

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

Defined in: [joint-react/src/types/event.types.ts:384](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L384)

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

Defined in: [joint-react/src/types/event.types.ts:396](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L396)

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

Defined in: [joint-react/src/types/event.types.ts:303](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L303)

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

Defined in: [joint-react/src/types/event.types.ts:311](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L311)

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

Defined in: [joint-react/src/types/event.types.ts:328](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L328)

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

Defined in: [joint-react/src/types/event.types.ts:320](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L320)

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

### onCellPointerClick()?

> `optional` **onCellPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:198](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L198)

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

Defined in: [joint-react/src/types/event.types.ts:227](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L227)

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

### onCellUnhighlight()?

> `optional` **onCellUnhighlight**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:390](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L390)

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

### onCustom()?

> `optional` **onCustom**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:447](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L447)

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

`PaperEvents.onCustom`

***

### onElementContextMenu()?

> `optional` **onElementContextMenu**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:263](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L263)

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

Defined in: [joint-react/src/types/event.types.ts:374](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L374)

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

Defined in: [joint-react/src/types/event.types.ts:358](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L358)

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

Defined in: [joint-react/src/types/event.types.ts:366](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L366)

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

Defined in: [joint-react/src/types/event.types.ts:304](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L304)

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

Defined in: [joint-react/src/types/event.types.ts:312](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L312)

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

Defined in: [joint-react/src/types/event.types.ts:329](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L329)

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

Defined in: [joint-react/src/types/event.types.ts:321](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L321)

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

### onElementPointerClick()?

> `optional` **onElementPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:205](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L205)

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

Defined in: [joint-react/src/types/event.types.ts:234](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L234)

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

### onElementsMeasured()?

> `readonly` `optional` **onElementsMeasured**: (`options`) => `void`

Defined in: [joint-react/src/components/paper/paper.tsx:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L63)

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

Defined in: [joint-react/src/types/event.types.ts:404](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L404)

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

Defined in: [joint-react/src/types/event.types.ts:270](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L270)

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

Defined in: [joint-react/src/types/event.types.ts:412](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L412)

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

Defined in: [joint-react/src/types/event.types.ts:309](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L309)

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

Defined in: [joint-react/src/types/event.types.ts:317](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L317)

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

Defined in: [joint-react/src/types/event.types.ts:334](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L334)

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

Defined in: [joint-react/src/types/event.types.ts:326](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L326)

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

### onLinkPointerClick()?

> `optional` **onLinkPointerClick**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:212](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L212)

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

Defined in: [joint-react/src/types/event.types.ts:241](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L241)

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

### onLinkSnapConnect()?

> `optional` **onLinkSnapConnect**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:420](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L420)

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

Defined in: [joint-react/src/types/event.types.ts:428](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L428)

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

### onMouseWheel()?

> `optional` **onMouseWheel**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:338](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L338)

#### Parameters

##### args

###### delta

`number`

###### event

`Event`

###### paper

`Paper`

###### view

`CellView`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onMouseWheel`

***

### onPan()?

> `optional` **onPan**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:348](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L348)

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

### onPinch()?

> `optional` **onPinch**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:349](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L349)

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

### onPointerDown()?

> `optional` **onPointerDown**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:280](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L280)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### view

`CellView`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPointerDown`

***

### onPointerMove()?

> `optional` **onPointerMove**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:287](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L287)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### view

`CellView`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPointerMove`

***

### onPointerUp()?

> `optional` **onPointerUp**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:294](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L294)

#### Parameters

##### args

###### event

`Event`

###### paper

`Paper`

###### view

`CellView`

###### x

`number`

###### y

`number`

#### Returns

`void`

#### Inherited from

`PaperEvents.onPointerUp`

***

### onRenderDone()?

> `optional` **onRenderDone**: (`args`) => `void`

Defined in: [joint-react/src/types/event.types.ts:438](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L438)

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

Defined in: [joint-react/src/types/event.types.ts:443](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L443)

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

Defined in: [joint-react/src/types/event.types.ts:442](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L442)

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

Defined in: [joint-react/src/types/event.types.ts:444](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L444)

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

Defined in: [joint-react/src/types/event.types.ts:441](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/types/event.types.ts#L441)

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

Defined in: [joint-core/types/joint.d.ts:1454](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1454)

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

`dia.Paper.Options.onViewPostponed`

***

### onViewUpdate()?

> `optional` **onViewUpdate**: (`view`, `flag`, `priority`, `opt`, `paper`) => `void`

Defined in: [joint-core/types/joint.d.ts:1453](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1453)

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

`dia.Paper.Options.onViewUpdate`

***

### overflow?

> `optional` **overflow**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1457](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1457)

#### Inherited from

`dia.Paper.Options.overflow`

***

### overwriteDefaultPaperElement()?

> `readonly` `optional` **overwriteDefaultPaperElement**: (`paper`) => [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement) \| [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

Defined in: [joint-react/src/components/paper/paper.tsx:104](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L104)

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

Defined in: [joint-core/types/joint.d.ts:1416](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1416)

#### Inherited from

`dia.Paper.Options.preventContextMenu`

***

### preventDefaultBlankAction?

> `optional` **preventDefaultBlankAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1418](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1418)

#### Inherited from

`dia.Paper.Options.preventDefaultBlankAction`

***

### preventDefaultViewAction?

> `optional` **preventDefaultViewAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1417](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1417)

#### Inherited from

`dia.Paper.Options.preventDefaultViewAction`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`ElementItem`\>

Defined in: [joint-react/src/components/paper/paper.tsx:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L57)

A function that renders the element.

Note: Jointjs works by default with SVG's so by default renderElement is append inside the SVGElement node.
To use HTML elements, you need to use the `HtmlNode` component or `foreignObject` element.

This is called when the data from `elementSelector` changes.

#### Examples

Example with `global component`:
```tsx
type BaseElementWithData = InferElement<typeof initialElements>
function RenderElement({ data }: BaseElementWithData) {
 return <HtmlElement className="node">{data.label}</HtmlElement>
}
```

Example with `local component`:
```tsx

type BaseElementWithData = InferElement<typeof initialElements>
const renderElement: RenderElement<BaseElementWithData> = useCallback(
   (element) => <HtmlElement className="node">{element.data.label}</HtmlElement>,
   []
)
```

***

### restrictTranslate?

> `optional` **restrictTranslate**: `boolean` \| `PlainRect` \| `RestrictTranslateCallback`

Defined in: [joint-core/types/joint.d.ts:1410](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1410)

#### Inherited from

`dia.Paper.Options.restrictTranslate`

***

### routerNamespace?

> `optional` **routerNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1433](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1433)

#### Inherited from

`dia.Paper.Options.routerNamespace`

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [joint-react/src/components/paper/paper.tsx:85](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L85)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### snapLabels?

> `optional` **snapLabels**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1403](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1403)

#### Inherited from

`dia.Paper.Options.snapLabels`

***

### snapLinks?

> `optional` **snapLinks**: `boolean` \| `SnapLinksOptions`

Defined in: [joint-core/types/joint.d.ts:1404](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1404)

#### Inherited from

`dia.Paper.Options.snapLinks`

***

### snapLinksSelf?

> `optional` **snapLinksSelf**: `boolean` \| \{ `distance`: `number`; \}

Defined in: [joint-core/types/joint.d.ts:1405](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1405)

#### Inherited from

`dia.Paper.Options.snapLinksSelf`

***

### sorting?

> `optional` **sorting**: `sorting`

Defined in: [joint-core/types/joint.d.ts:1449](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1449)

#### Inherited from

`dia.Paper.Options.sorting`

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [joint-react/src/components/paper/paper.tsx:68](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L68)

The style of the paper element.

***

### tagName?

> `optional` **tagName**: `string`

Defined in: [joint-core/types/joint.d.ts:3444](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3444)

#### Inherited from

`dia.Paper.Options.tagName`

***

### theme?

> `optional` **theme**: `string`

Defined in: [joint-core/types/joint.d.ts:3503](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3503)

#### Inherited from

`dia.Paper.Options.theme`

***

### validateConnection()?

> `optional` **validateConnection**: (`cellViewS`, `magnetS`, `cellViewT`, `magnetT`, `end`, `linkView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1409](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1409)

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

`dia.Paper.Options.validateConnection`

***

### validateEmbedding()?

> `optional` **validateEmbedding**: (`this`, `childView`, `parentView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1429](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1429)

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

`dia.Paper.Options.validateEmbedding`

***

### validateMagnet()?

> `optional` **validateMagnet**: (`cellView`, `magnet`, `evt`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1408](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1408)

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

`dia.Paper.Options.validateMagnet`

***

### validateUnembedding()?

> `optional` **validateUnembedding**: (`this`, `childView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1430](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1430)

#### Parameters

##### this

`Paper`

##### childView

`ElementView`

#### Returns

`boolean`

#### Inherited from

`dia.Paper.Options.validateUnembedding`

***

### viewport?

> `optional` **viewport**: `null` \| `ViewportCallback`

Defined in: [joint-core/types/joint.d.ts:1452](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1452)

#### Inherited from

`dia.Paper.Options.viewport`

***

### width?

> `optional` **width**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1393](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1393)

#### Inherited from

`dia.Paper.Options.width`
