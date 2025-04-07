[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProps

# Interface: PaperProps\<ElementItem\>

Defined in: [joint-react/src/components/paper/paper.tsx:25](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L25)

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

Defined in: [joint-core/types/joint.d.ts:1432](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1432)

#### Inherited from

`dia.Paper.Options.afterRender`

***

### allowLink?

> `optional` **allowLink**: `null` \| (`linkView`, `paper`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1389](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1389)

#### Inherited from

`dia.Paper.Options.allowLink`

***

### anchorNamespace?

> `optional` **anchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1412](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1412)

#### Inherited from

`dia.Paper.Options.anchorNamespace`

***

### async?

> `optional` **async**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1424](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1424)

#### Inherited from

`dia.Paper.Options.async`

***

### attributes?

> `optional` **attributes**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>

Defined in: [joint-core/types/joint.d.ts:3406](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3406)

#### Inherited from

`dia.Paper.Options.attributes`

***

### autoFreeze?

> `optional` **autoFreeze**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1427](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1427)

#### Inherited from

`dia.Paper.Options.autoFreeze`

***

### background?

> `optional` **background**: `BackgroundOptions`

Defined in: [joint-core/types/joint.d.ts:1373](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1373)

#### Inherited from

`dia.Paper.Options.background`

***

### beforeRender?

> `optional` **beforeRender**: `BeforeRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1431](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1431)

#### Inherited from

`dia.Paper.Options.beforeRender`

***

### cellViewNamespace?

> `optional` **cellViewNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1408](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1408)

#### Inherited from

`dia.Paper.Options.cellViewNamespace`

***

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/paper/paper.tsx:89](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L89)

Children to render. Paper automatically wrap the children with the PaperContext, if there is no PaperContext in the parent tree.

***

### className?

> `readonly` `optional` **className**: `string`

Defined in: [joint-react/src/components/paper/paper.tsx:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L67)

Class name of the paper element.

#### Overrides

`dia.Paper.Options.className`

***

### clickThreshold?

> `optional` **clickThreshold**: `number`

Defined in: [joint-core/types/joint.d.ts:1395](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1395)

#### Inherited from

`dia.Paper.Options.clickThreshold`

***

### collection?

> `optional` **collection**: `Collection`\<`any`\>

Defined in: [joint-core/types/joint.d.ts:3403](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3403)

#### Inherited from

`dia.Paper.Options.collection`

***

### connectionPointNamespace?

> `optional` **connectionPointNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1414](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1414)

#### Inherited from

`dia.Paper.Options.connectionPointNamespace`

***

### connectionStrategy?

> `optional` **connectionStrategy**: `ConnectionStrategy`

Defined in: [joint-core/types/joint.d.ts:1422](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1422)

#### Inherited from

`dia.Paper.Options.connectionStrategy`

***

### connectorNamespace?

> `optional` **connectorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1410](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1410)

#### Inherited from

`dia.Paper.Options.connectorNamespace`

***

### defaultAnchor?

> `optional` **defaultAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1418](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1418)

#### Inherited from

`dia.Paper.Options.defaultAnchor`

***

### defaultConnectionPoint?

> `optional` **defaultConnectionPoint**: `ConnectionPointJSON` \| `ConnectionPoint` \| (...`args`) => `ConnectionPoint`

Defined in: [joint-core/types/joint.d.ts:1420](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1420)

#### Inherited from

`dia.Paper.Options.defaultConnectionPoint`

***

### defaultConnector?

> `optional` **defaultConnector**: `Connector` \| `ConnectorJSON`

Defined in: [joint-core/types/joint.d.ts:1417](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1417)

#### Inherited from

`dia.Paper.Options.defaultConnector`

***

### defaultLink?

> `optional` **defaultLink**: `Link`\<`Attributes`, `ModelSetOptions`\> \| (`cellView`, `magnet`) => `Link`

Defined in: [joint-core/types/joint.d.ts:1415](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1415)

#### Inherited from

`dia.Paper.Options.defaultLink`

***

### defaultLinkAnchor?

> `optional` **defaultLinkAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1419](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1419)

#### Inherited from

`dia.Paper.Options.defaultLinkAnchor`

***

### defaultRouter?

> `optional` **defaultRouter**: `Router` \| `RouterJSON`

Defined in: [joint-core/types/joint.d.ts:1416](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1416)

#### Inherited from

`dia.Paper.Options.defaultRouter`

***

### drawGrid?

> `optional` **drawGrid**: `boolean` \| `GridOptions` \| `GridOptions`[]

Defined in: [joint-core/types/joint.d.ts:1371](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1371)

#### Inherited from

`dia.Paper.Options.drawGrid`

***

### drawGridSize?

> `optional` **drawGridSize**: `null` \| `number`

Defined in: [joint-core/types/joint.d.ts:1372](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1372)

#### Inherited from

`dia.Paper.Options.drawGridSize`

***

### el?

> `optional` **el**: `unknown`

Defined in: [joint-core/types/joint.d.ts:3404](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3404)

#### Inherited from

`dia.Paper.Options.el`

***

### elementSelector()?

> `readonly` `optional` **elementSelector**: (`item`) => `ElementItem`

Defined in: [joint-react/src/components/paper/paper.tsx:75](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L75)

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

Defined in: [joint-core/types/joint.d.ts:1399](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1399)

#### Inherited from

`dia.Paper.Options.elementView`

***

### embeddingMode?

> `optional` **embeddingMode**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1402](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1402)

#### Inherited from

`dia.Paper.Options.embeddingMode`

***

### events?

> `optional` **events**: `_Result`\<`EventsHash`\>

Defined in: [joint-core/types/joint.d.ts:3409](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3409)

#### Inherited from

`dia.Paper.Options.events`

***

### findParentBy?

> `optional` **findParentBy**: `FindParentByType` \| `FindParentByCallback`

Defined in: [joint-core/types/joint.d.ts:1404](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1404)

#### Inherited from

`dia.Paper.Options.findParentBy`

***

### frontParentOnly?

> `optional` **frontParentOnly**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1403](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1403)

#### Inherited from

`dia.Paper.Options.frontParentOnly`

***

### frozen?

> `optional` **frozen**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1426](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1426)

#### Inherited from

`dia.Paper.Options.frozen`

***

### gridSize?

> `optional` **gridSize**: `number`

Defined in: [joint-core/types/joint.d.ts:1376](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1376)

#### Inherited from

`dia.Paper.Options.gridSize`

***

### guard()?

> `optional` **guard**: (`evt`, `view`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1391](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1391)

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

Defined in: [joint-core/types/joint.d.ts:1370](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1370)

#### Inherited from

`dia.Paper.Options.height`

***

### highlighterNamespace?

> `optional` **highlighterNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1411](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1411)

#### Inherited from

`dia.Paper.Options.highlighterNamespace`

***

### highlighting?

> `optional` **highlighting**: `boolean` \| [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `boolean` \| `HighlighterJSON`\>

Defined in: [joint-core/types/joint.d.ts:1377](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1377)

#### Inherited from

`dia.Paper.Options.highlighting`

***

### id?

> `optional` **id**: `string`

Defined in: [joint-core/types/joint.d.ts:3405](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3405)

#### Inherited from

`dia.Paper.Options.id`

***

### interactive?

> `optional` **interactive**: `boolean` \| (`cellView`, `event`) => `boolean` \| `InteractivityOptions` \| `InteractivityOptions`

Defined in: [joint-core/types/joint.d.ts:1378](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1378)

#### Inherited from

`dia.Paper.Options.interactive`

***

### isTransformToFitContentEnabled?

> `readonly` `optional` **isTransformToFitContentEnabled**: `boolean`

Defined in: [joint-react/src/components/paper/paper.tsx:94](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L94)

Function that is called when the paper is resized.

***

### labelsLayer?

> `optional` **labelsLayer**: `string` \| `boolean`

Defined in: [joint-core/types/joint.d.ts:1374](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1374)

#### Inherited from

`dia.Paper.Options.labelsLayer`

***

### linkAnchorNamespace?

> `optional` **linkAnchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1413](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1413)

#### Inherited from

`dia.Paper.Options.linkAnchorNamespace`

***

### linkPinning?

> `optional` **linkPinning**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1388](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1388)

#### Inherited from

`dia.Paper.Options.linkPinning`

***

### linkView?

> `optional` **linkView**: *typeof* `LinkView` \| (`link`) => *typeof* `LinkView`

Defined in: [joint-core/types/joint.d.ts:1400](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1400)

#### Inherited from

`dia.Paper.Options.linkView`

***

### magnetThreshold?

> `optional` **magnetThreshold**: `string` \| `number`

Defined in: [joint-core/types/joint.d.ts:1397](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1397)

#### Inherited from

`dia.Paper.Options.magnetThreshold`

***

### markAvailable?

> `optional` **markAvailable**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1382](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1382)

#### Inherited from

`dia.Paper.Options.markAvailable`

***

### model?

> `optional` **model**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:3401](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3401)

#### Inherited from

`dia.Paper.Options.model`

***

### moveThreshold?

> `optional` **moveThreshold**: `number`

Defined in: [joint-core/types/joint.d.ts:1396](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1396)

#### Inherited from

`dia.Paper.Options.moveThreshold`

***

### multiLinks?

> `optional` **multiLinks**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1387](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1387)

#### Inherited from

`dia.Paper.Options.multiLinks`

***

### noDataPlaceholder?

> `readonly` `optional` **noDataPlaceholder**: `ReactNode`

Defined in: [joint-react/src/components/paper/paper.tsx:84](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L84)

Placeholder to be rendered when there is no data (no nodes or elements to render).

***

### onBlankContextmenu?

> `optional` **onBlankContextmenu**: `PaperEventHandler`\<`"blank:contextmenu"`\>

#### Inherited from

`PaperEvents.onBlankContextmenu`

***

### onBlankMouseenter?

> `optional` **onBlankMouseenter**: `PaperEventHandler`\<`"blank:mouseenter"`\>

#### Inherited from

`PaperEvents.onBlankMouseenter`

***

### onBlankMouseleave?

> `optional` **onBlankMouseleave**: `PaperEventHandler`\<`"blank:mouseleave"`\>

#### Inherited from

`PaperEvents.onBlankMouseleave`

***

### onBlankMouseout?

> `optional` **onBlankMouseout**: `PaperEventHandler`\<`"blank:mouseout"`\>

#### Inherited from

`PaperEvents.onBlankMouseout`

***

### onBlankMouseover?

> `optional` **onBlankMouseover**: `PaperEventHandler`\<`"blank:mouseover"`\>

#### Inherited from

`PaperEvents.onBlankMouseover`

***

### onBlankMousewheel?

> `optional` **onBlankMousewheel**: `PaperEventHandler`\<`"blank:mousewheel"`\>

#### Inherited from

`PaperEvents.onBlankMousewheel`

***

### onBlankPointerClick?

> `optional` **onBlankPointerClick**: `PaperEventHandler`\<`"blank:pointerclick"`\>

#### Inherited from

`PaperEvents.onBlankPointerClick`

***

### onBlankPointerdblClick?

> `optional` **onBlankPointerdblClick**: `PaperEventHandler`\<`"blank:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onBlankPointerdblClick`

***

### onBlankPointerdown?

> `optional` **onBlankPointerdown**: `PaperEventHandler`\<`"blank:pointerdown"`\>

#### Inherited from

`PaperEvents.onBlankPointerdown`

***

### onBlankPointermove?

> `optional` **onBlankPointermove**: `PaperEventHandler`\<`"blank:pointermove"`\>

#### Inherited from

`PaperEvents.onBlankPointermove`

***

### onBlankPointerup?

> `optional` **onBlankPointerup**: `PaperEventHandler`\<`"blank:pointerup"`\>

#### Inherited from

`PaperEvents.onBlankPointerup`

***

### onCellContextmenu?

> `optional` **onCellContextmenu**: `PaperEventHandler`\<`"cell:contextmenu"`\>

#### Inherited from

`PaperEvents.onCellContextmenu`

***

### onCellHighlight?

> `optional` **onCellHighlight**: `PaperEventHandler`\<`"cell:highlight"`\>

#### Inherited from

`PaperEvents.onCellHighlight`

***

### onCellHighlightInvalid?

> `optional` **onCellHighlightInvalid**: `PaperEventHandler`\<`"cell:highlight:invalid"`\>

#### Inherited from

`PaperEvents.onCellHighlightInvalid`

***

### onCellMouseenter?

> `optional` **onCellMouseenter**: `PaperEventHandler`\<`"cell:mouseenter"`\>

#### Inherited from

`PaperEvents.onCellMouseenter`

***

### onCellMouseleave?

> `optional` **onCellMouseleave**: `PaperEventHandler`\<`"cell:mouseleave"`\>

#### Inherited from

`PaperEvents.onCellMouseleave`

***

### onCellMouseout?

> `optional` **onCellMouseout**: `PaperEventHandler`\<`"cell:mouseout"`\>

#### Inherited from

`PaperEvents.onCellMouseout`

***

### onCellMouseover?

> `optional` **onCellMouseover**: `PaperEventHandler`\<`"cell:mouseover"`\>

#### Inherited from

`PaperEvents.onCellMouseover`

***

### onCellMousewheel?

> `optional` **onCellMousewheel**: `PaperEventHandler`\<`"cell:mousewheel"`\>

#### Inherited from

`PaperEvents.onCellMousewheel`

***

### onCellPointerClick?

> `optional` **onCellPointerClick**: `PaperEventHandler`\<`"cell:pointerclick"`\>

#### Inherited from

`PaperEvents.onCellPointerClick`

***

### onCellPointerdblClick?

> `optional` **onCellPointerdblClick**: `PaperEventHandler`\<`"cell:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onCellPointerdblClick`

***

### onCellPointerdown?

> `optional` **onCellPointerdown**: `PaperEventHandler`\<`"cell:pointerdown"`\>

#### Inherited from

`PaperEvents.onCellPointerdown`

***

### onCellPointermove?

> `optional` **onCellPointermove**: `PaperEventHandler`\<`"cell:pointermove"`\>

#### Inherited from

`PaperEvents.onCellPointermove`

***

### onCellPointerup?

> `optional` **onCellPointerup**: `PaperEventHandler`\<`"cell:pointerup"`\>

#### Inherited from

`PaperEvents.onCellPointerup`

***

### onCellUnhighlight?

> `optional` **onCellUnhighlight**: `PaperEventHandler`\<`"cell:unhighlight"`\>

#### Inherited from

`PaperEvents.onCellUnhighlight`

***

### onCustom?

> `optional` **onCustom**: `PaperEventHandler`\<`"custom"`\>

#### Inherited from

`PaperEvents.onCustom`

***

### onElementContextmenu?

> `optional` **onElementContextmenu**: `PaperEventHandler`\<`"element:contextmenu"`\>

#### Inherited from

`PaperEvents.onElementContextmenu`

***

### onElementMagnetContextmenu?

> `optional` **onElementMagnetContextmenu**: `PaperEventHandler`\<`"element:magnet:contextmenu"`\>

#### Inherited from

`PaperEvents.onElementMagnetContextmenu`

***

### onElementMagnetPointerClick?

> `optional` **onElementMagnetPointerClick**: `PaperEventHandler`\<`"element:magnet:pointerclick"`\>

#### Inherited from

`PaperEvents.onElementMagnetPointerClick`

***

### onElementMagnetPointerdblClick?

> `optional` **onElementMagnetPointerdblClick**: `PaperEventHandler`\<`"element:magnet:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onElementMagnetPointerdblClick`

***

### onElementMouseenter?

> `optional` **onElementMouseenter**: `PaperEventHandler`\<`"element:mouseenter"`\>

#### Inherited from

`PaperEvents.onElementMouseenter`

***

### onElementMouseleave?

> `optional` **onElementMouseleave**: `PaperEventHandler`\<`"element:mouseleave"`\>

#### Inherited from

`PaperEvents.onElementMouseleave`

***

### onElementMouseout?

> `optional` **onElementMouseout**: `PaperEventHandler`\<`"element:mouseout"`\>

#### Inherited from

`PaperEvents.onElementMouseout`

***

### onElementMouseover?

> `optional` **onElementMouseover**: `PaperEventHandler`\<`"element:mouseover"`\>

#### Inherited from

`PaperEvents.onElementMouseover`

***

### onElementMousewheel?

> `optional` **onElementMousewheel**: `PaperEventHandler`\<`"element:mousewheel"`\>

#### Inherited from

`PaperEvents.onElementMousewheel`

***

### onElementPointerClick?

> `optional` **onElementPointerClick**: `PaperEventHandler`\<`"element:pointerclick"`\>

#### Inherited from

`PaperEvents.onElementPointerClick`

***

### onElementPointerdblClick?

> `optional` **onElementPointerdblClick**: `PaperEventHandler`\<`"element:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onElementPointerdblClick`

***

### onElementPointerdown?

> `optional` **onElementPointerdown**: `PaperEventHandler`\<`"element:pointerdown"`\>

#### Inherited from

`PaperEvents.onElementPointerdown`

***

### onElementPointermove?

> `optional` **onElementPointermove**: `PaperEventHandler`\<`"element:pointermove"`\>

#### Inherited from

`PaperEvents.onElementPointermove`

***

### onElementPointerup?

> `optional` **onElementPointerup**: `PaperEventHandler`\<`"element:pointerup"`\>

#### Inherited from

`PaperEvents.onElementPointerup`

***

### onLinkConnect?

> `optional` **onLinkConnect**: `PaperEventHandler`\<`"link:connect"`\>

#### Inherited from

`PaperEvents.onLinkConnect`

***

### onLinkContextmenu?

> `optional` **onLinkContextmenu**: `PaperEventHandler`\<`"link:contextmenu"`\>

#### Inherited from

`PaperEvents.onLinkContextmenu`

***

### onLinkDisconnect?

> `optional` **onLinkDisconnect**: `PaperEventHandler`\<`"link:disconnect"`\>

#### Inherited from

`PaperEvents.onLinkDisconnect`

***

### onLinkMouseenter?

> `optional` **onLinkMouseenter**: `PaperEventHandler`\<`"link:mouseenter"`\>

#### Inherited from

`PaperEvents.onLinkMouseenter`

***

### onLinkMouseleave?

> `optional` **onLinkMouseleave**: `PaperEventHandler`\<`"link:mouseleave"`\>

#### Inherited from

`PaperEvents.onLinkMouseleave`

***

### onLinkMouseout?

> `optional` **onLinkMouseout**: `PaperEventHandler`\<`"link:mouseout"`\>

#### Inherited from

`PaperEvents.onLinkMouseout`

***

### onLinkMouseover?

> `optional` **onLinkMouseover**: `PaperEventHandler`\<`"link:mouseover"`\>

#### Inherited from

`PaperEvents.onLinkMouseover`

***

### onLinkMousewheel?

> `optional` **onLinkMousewheel**: `PaperEventHandler`\<`"link:mousewheel"`\>

#### Inherited from

`PaperEvents.onLinkMousewheel`

***

### onLinkPointerClick?

> `optional` **onLinkPointerClick**: `PaperEventHandler`\<`"link:pointerclick"`\>

#### Inherited from

`PaperEvents.onLinkPointerClick`

***

### onLinkPointerdblClick?

> `optional` **onLinkPointerdblClick**: `PaperEventHandler`\<`"link:pointerdblclick"`\>

#### Inherited from

`PaperEvents.onLinkPointerdblClick`

***

### onLinkPointerdown?

> `optional` **onLinkPointerdown**: `PaperEventHandler`\<`"link:pointerdown"`\>

#### Inherited from

`PaperEvents.onLinkPointerdown`

***

### onLinkPointermove?

> `optional` **onLinkPointermove**: `PaperEventHandler`\<`"link:pointermove"`\>

#### Inherited from

`PaperEvents.onLinkPointermove`

***

### onLinkPointerup?

> `optional` **onLinkPointerup**: `PaperEventHandler`\<`"link:pointerup"`\>

#### Inherited from

`PaperEvents.onLinkPointerup`

***

### onLinkSnapConnect?

> `optional` **onLinkSnapConnect**: `PaperEventHandler`\<`"link:snap:connect"`\>

#### Inherited from

`PaperEvents.onLinkSnapConnect`

***

### onLinkSnapDisconnect?

> `optional` **onLinkSnapDisconnect**: `PaperEventHandler`\<`"link:snap:disconnect"`\>

#### Inherited from

`PaperEvents.onLinkSnapDisconnect`

***

### onPaperPan?

> `optional` **onPaperPan**: `PaperEventHandler`\<`"paper:pan"`\>

#### Inherited from

`PaperEvents.onPaperPan`

***

### onPaperPinch?

> `optional` **onPaperPinch**: `PaperEventHandler`\<`"paper:pinch"`\>

#### Inherited from

`PaperEvents.onPaperPinch`

***

### onReady()?

> `readonly` `optional` **onReady**: () => `void`

Defined in: [joint-react/src/components/paper/paper.tsx:58](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L58)

A function that is called when the paper is ready.

#### Returns

`void`

***

### onRenderDone?

> `optional` **onRenderDone**: `PaperEventHandler`\<`"render:done"`\>

#### Inherited from

`PaperEvents.onRenderDone`

***

### onResize?

> `optional` **onResize**: `PaperEventHandler`\<`"resize"`\>

#### Inherited from

`PaperEvents.onResize`

***

### onScale?

> `optional` **onScale**: `PaperEventHandler`\<`"scale"`\>

#### Inherited from

`PaperEvents.onScale`

***

### onTransform?

> `optional` **onTransform**: `PaperEventHandler`\<`"transform"`\>

#### Inherited from

`PaperEvents.onTransform`

***

### onTranslate?

> `optional` **onTranslate**: `PaperEventHandler`\<`"translate"`\>

#### Inherited from

`PaperEvents.onTranslate`

***

### onViewPostponed()?

> `optional` **onViewPostponed**: (`view`, `flag`, `paper`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1430](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1430)

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

Defined in: [joint-core/types/joint.d.ts:1429](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1429)

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

Defined in: [joint-core/types/joint.d.ts:1433](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1433)

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

Defined in: [joint-core/types/joint.d.ts:1392](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1392)

#### Inherited from

`dia.Paper.Options.preventContextMenu`

***

### preventDefaultBlankAction?

> `optional` **preventDefaultBlankAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1394](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1394)

#### Inherited from

`dia.Paper.Options.preventDefaultBlankAction`

***

### preventDefaultViewAction?

> `optional` **preventDefaultViewAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1393](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1393)

#### Inherited from

`dia.Paper.Options.preventDefaultViewAction`

***

### renderElement?

> `readonly` `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<`ElementItem`\>

Defined in: [joint-react/src/components/paper/paper.tsx:54](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L54)

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

Defined in: [joint-core/types/joint.d.ts:1386](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1386)

#### Inherited from

`dia.Paper.Options.restrictTranslate`

***

### routerNamespace?

> `optional` **routerNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1409](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1409)

#### Inherited from

`dia.Paper.Options.routerNamespace`

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [joint-react/src/components/paper/paper.tsx:80](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L80)

The scale of the paper. It's useful to create for example a zoom feature or minimap Paper.

***

### snapLabels?

> `optional` **snapLabels**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1379](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1379)

#### Inherited from

`dia.Paper.Options.snapLabels`

***

### snapLinks?

> `optional` **snapLinks**: `boolean` \| `SnapLinksOptions`

Defined in: [joint-core/types/joint.d.ts:1380](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1380)

#### Inherited from

`dia.Paper.Options.snapLinks`

***

### snapLinksSelf?

> `optional` **snapLinksSelf**: `boolean` \| \{ `distance`: `number`; \}

Defined in: [joint-core/types/joint.d.ts:1381](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1381)

#### Inherited from

`dia.Paper.Options.snapLinksSelf`

***

### sorting?

> `optional` **sorting**: `sorting`

Defined in: [joint-core/types/joint.d.ts:1425](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1425)

#### Inherited from

`dia.Paper.Options.sorting`

***

### style?

> `readonly` `optional` **style**: `CSSProperties`

Defined in: [joint-react/src/components/paper/paper.tsx:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper/paper.tsx#L63)

The style of the paper element.

***

### tagName?

> `optional` **tagName**: `string`

Defined in: [joint-core/types/joint.d.ts:3408](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3408)

#### Inherited from

`dia.Paper.Options.tagName`

***

### theme?

> `optional` **theme**: `string`

Defined in: [joint-core/types/joint.d.ts:3467](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3467)

#### Inherited from

`dia.Paper.Options.theme`

***

### validateConnection()?

> `optional` **validateConnection**: (`cellViewS`, `magnetS`, `cellViewT`, `magnetT`, `end`, `linkView`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1385](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1385)

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

Defined in: [joint-core/types/joint.d.ts:1405](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1405)

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

Defined in: [joint-core/types/joint.d.ts:1384](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1384)

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

Defined in: [joint-core/types/joint.d.ts:1406](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1406)

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

Defined in: [joint-core/types/joint.d.ts:1428](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1428)

#### Inherited from

`dia.Paper.Options.viewport`

***

### width?

> `optional` **width**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1369](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1369)

#### Inherited from

`dia.Paper.Options.width`
