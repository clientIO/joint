[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperContext

# Interface: PaperContext

Defined in: [joint-react/src/context/paper-context.tsx:7](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/paper-context.tsx#L7)

## Extends

- `Paper`

## Methods

### $()

> **$**(`selector`): `unknown`

Defined in: [joint-core/types/joint.d.ts:3504](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3504)

#### Parameters

##### selector

`string`

#### Returns

`unknown`

#### Inherited from

`dia.Paper.$`

***

### addLayer()

> **addLayer**(`layerName`, `layerView`, `options`?): `void`

Defined in: [joint-core/types/joint.d.ts:1801](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1801)

#### Parameters

##### layerName

`string`

##### layerView

`PaperLayer`

##### options?

###### insertBefore?

`string`

#### Returns

`void`

#### Inherited from

`dia.Paper.addLayer`

***

### bind()

#### Call Signature

> **bind**(`eventName`, `callback`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3258](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3258)

##### Parameters

###### eventName

`string`

###### callback

`EventHandler`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.bind`

#### Call Signature

> **bind**(`eventMap`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3259](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3259)

##### Parameters

###### eventMap

`EventMap`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.bind`

***

### checkViewport()

> **checkViewport**(`opt`?): `object`

Defined in: [joint-core/types/joint.d.ts:1832](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1832)

#### Parameters

##### opt?

###### mountBatchSize?

`number`

###### unmountBatchSize?

`number`

###### viewport?

`ViewportCallback`

#### Returns

`object`

##### mounted

> **mounted**: `number`

##### unmounted

> **unmounted**: `number`

#### Inherited from

`dia.Paper.checkViewport`

***

### clientMatrix()

> **clientMatrix**(): [`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

Defined in: [joint-core/types/joint.d.ts:1630](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1630)

#### Returns

[`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

#### Inherited from

`dia.Paper.clientMatrix`

***

### clientOffset()

> **clientOffset**(): `Point`

Defined in: [joint-core/types/joint.d.ts:1632](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1632)

#### Returns

`Point`

#### Inherited from

`dia.Paper.clientOffset`

***

### clientToLocalPoint()

#### Call Signature

> **clientToLocalPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1636](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1636)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.clientToLocalPoint`

#### Call Signature

> **clientToLocalPoint**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1637](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1637)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.clientToLocalPoint`

***

### clientToLocalRect()

#### Call Signature

> **clientToLocalRect**(`x`, `y`, `width`, `height`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1639](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1639)

##### Parameters

###### x

`number`

###### y

`number`

###### width

`number`

###### height

`number`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.clientToLocalRect`

#### Call Signature

> **clientToLocalRect**(`rect`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1640](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1640)

##### Parameters

###### rect

`PlainRect`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.clientToLocalRect`

***

### confirmUpdate()

> **confirmUpdate**(`flag`, `opt`): `number`

Defined in: [joint-core/types/joint.d.ts:3582](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3582)

#### Parameters

##### flag

`number`

##### opt

#### Returns

`number`

#### Inherited from

`dia.Paper.confirmUpdate`

***

### defineFilter()

> **defineFilter**(`filter`): `string`

Defined in: [joint-core/types/joint.d.ts:1675](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1675)

#### Parameters

##### filter

`SVGFilterJSON`

#### Returns

`string`

#### Inherited from

`dia.Paper.defineFilter`

***

### defineGradient()

> **defineGradient**(`gradient`): `string`

Defined in: [joint-core/types/joint.d.ts:1677](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1677)

#### Parameters

##### gradient

`SVGGradientJSON`

#### Returns

`string`

#### Inherited from

`dia.Paper.defineGradient`

***

### defineMarker()

> **defineMarker**(`marker`): `string`

Defined in: [joint-core/types/joint.d.ts:1679](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1679)

#### Parameters

##### marker

`SVGMarkerJSON`

#### Returns

`string`

#### Inherited from

`dia.Paper.defineMarker`

***

### definePattern()

> **definePattern**(`pattern`): `string`

Defined in: [joint-core/types/joint.d.ts:1681](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1681)

#### Parameters

##### pattern

[`Omit`](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys)\<`SVGPatternJSON`, `"type"`\>

#### Returns

`string`

#### Inherited from

`dia.Paper.definePattern`

***

### delegate()

> **delegate**(`eventName`, `selector`, `listener`): `this`

Defined in: [joint-core/types/joint.d.ts:3508](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3508)

#### Parameters

##### eventName

`string`

##### selector

`string`

##### listener

`ViewBaseEventListener`

#### Returns

`this`

#### Inherited from

`dia.Paper.delegate`

***

### delegateDocumentEvents()

> **delegateDocumentEvents**(`events`?, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:3564](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3564)

#### Parameters

##### events?

`EventsHash`

##### data?

`viewEventData`

#### Returns

`this`

#### Inherited from

`dia.Paper.delegateDocumentEvents`

***

### delegateElementEvents()

> **delegateElementEvents**(`element`, `events`?, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:3568](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3568)

#### Parameters

##### element

[`Element`](https://developer.mozilla.org/docs/Web/API/Element)

##### events?

`EventsHash`

##### data?

`viewEventData`

#### Returns

`this`

#### Inherited from

`dia.Paper.delegateElementEvents`

***

### delegateEvents()

> **delegateEvents**(`events`?): `this`

Defined in: [joint-core/types/joint.d.ts:3507](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3507)

#### Parameters

##### events?

`_Result`\<`EventsHash`\>

#### Returns

`this`

#### Inherited from

`dia.Paper.delegateEvents`

***

### dispatchToolsEvent()

> **dispatchToolsEvent**(`eventName`, ...`args`): `void`

Defined in: [joint-core/types/joint.d.ts:1785](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1785)

#### Parameters

##### eventName

`string`

##### args

...`any`[]

#### Returns

`void`

#### Inherited from

`dia.Paper.dispatchToolsEvent`

***

### drawBackground()

> **drawBackground**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:1749](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1749)

#### Parameters

##### opt?

`BackgroundOptions`

#### Returns

`this`

#### Inherited from

`dia.Paper.drawBackground`

***

### dumpViews()

> **dumpViews**(`opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:1825](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1825)

#### Parameters

##### opt?

###### batchSize?

`number`

###### mountBatchSize?

`number`

###### unmountBatchSize?

`number`

###### viewport?

`ViewportCallback`

#### Returns

`void`

#### Inherited from

`dia.Paper.dumpViews`

***

### eventData()

#### Call Signature

> **eventData**(`evt`): `viewEventData`

Defined in: [joint-core/types/joint.d.ts:3572](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3572)

##### Parameters

###### evt

`Event`

##### Returns

`viewEventData`

##### Inherited from

`dia.Paper.eventData`

#### Call Signature

> **eventData**(`evt`, `data`): `this`

Defined in: [joint-core/types/joint.d.ts:3573](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3573)

##### Parameters

###### evt

`Event`

###### data

`viewEventData`

##### Returns

`this`

##### Inherited from

`dia.Paper.eventData`

***

### events()

> **events**(): `EventsHash`

Defined in: [joint-core/types/joint.d.ts:3488](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3488)

Events hash or a method returning the events hash that maps events/selectors to methods on your View.
For assigning events as object hash, do it like this: this.events = <any>{ "event:selector": callback, ... };
That works only if you set it in the constructor or the initialize method.

#### Returns

`EventsHash`

#### Inherited from

`dia.Paper.events`

***

### findAttribute()

> **findAttribute**(`attributeName`, `node`): `null` \| `string`

Defined in: [joint-core/types/joint.d.ts:3580](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3580)

#### Parameters

##### attributeName

`string`

##### node

[`Element`](https://developer.mozilla.org/docs/Web/API/Element)

#### Returns

`null` \| `string`

#### Inherited from

`dia.Paper.findAttribute`

***

### findCellViewsAtPoint()

> **findCellViewsAtPoint**(`point`, `opt`?): `CellView`[]

Defined in: [joint-core/types/joint.d.ts:1719](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1719)

Finds all the cell views at the specified point

#### Parameters

##### point

`PlainPoint`

a point in local paper coordinates

##### opt?

`FindAtPointOptions`

options for the search

#### Returns

`CellView`[]

#### Inherited from

`dia.Paper.findCellViewsAtPoint`

***

### findCellViewsInArea()

> **findCellViewsInArea**(`area`, `opt`?): `CellView`[]

Defined in: [joint-core/types/joint.d.ts:1740](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1740)

Finds all the cell views in the specified area

#### Parameters

##### area

`PlainRect`

a rectangle in local paper coordinates

##### opt?

`FindInAreaOptions`

options for the search

#### Returns

`CellView`[]

#### Inherited from

`dia.Paper.findCellViewsInArea`

***

### findElementViewsAtPoint()

> **findElementViewsAtPoint**(`point`, `opt`?): `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

Defined in: [joint-core/types/joint.d.ts:1705](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1705)

Finds all the element views at the specified point

#### Parameters

##### point

`PlainPoint`

a point in local paper coordinates

##### opt?

`FindAtPointOptions`

options for the search

#### Returns

`ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

#### Inherited from

`dia.Paper.findElementViewsAtPoint`

***

### findElementViewsInArea()

> **findElementViewsInArea**(`area`, `opt`?): `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

Defined in: [joint-core/types/joint.d.ts:1726](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1726)

Finds all the element views in the specified area

#### Parameters

##### area

`PlainRect`

a rectangle in local paper coordinates

##### opt?

`FindInAreaOptions`

options for the search

#### Returns

`ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

#### Inherited from

`dia.Paper.findElementViewsInArea`

***

### findLinkViewsAtPoint()

> **findLinkViewsAtPoint**(`point`, `opt`?): `LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>[]

Defined in: [joint-core/types/joint.d.ts:1712](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1712)

Finds all the link views at the specified point

#### Parameters

##### point

`PlainPoint`

a point in local paper coordinates

##### opt?

`FindAtPointOptions`

options for the search

#### Returns

`LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>[]

#### Inherited from

`dia.Paper.findLinkViewsAtPoint`

***

### findLinkViewsInArea()

> **findLinkViewsInArea**(`area`, `opt`?): `LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>[]

Defined in: [joint-core/types/joint.d.ts:1733](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1733)

Finds all the link views in the specified area

#### Parameters

##### area

`PlainRect`

a rectangle in local paper coordinates

##### opt?

`FindInAreaOptions`

options for the search

#### Returns

`LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>[]

#### Inherited from

`dia.Paper.findLinkViewsInArea`

***

### findView()

> **findView**\<`T`\>(`element`): `T`

Defined in: [joint-core/types/joint.d.ts:1696](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1696)

#### Type Parameters

##### T

`T` *extends* `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\> \| `LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>

#### Parameters

##### element

`unknown`

#### Returns

`T`

#### Inherited from

`dia.Paper.findView`

***

### findViewByModel()

> **findViewByModel**\<`T`\>(`model`): `T`

Defined in: [joint-core/types/joint.d.ts:1698](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1698)

#### Type Parameters

##### T

`T` *extends* `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\> \| `LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>

#### Parameters

##### model

`ID` | `Cell`\<`Attributes`, `ModelSetOptions`\>

#### Returns

`T`

#### Inherited from

`dia.Paper.findViewByModel`

***

### ~~findViewsFromPoint()~~

> **findViewsFromPoint**(`point`): `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

Defined in: [joint-core/types/joint.d.ts:1991](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1991)

#### Parameters

##### point

`string` | `PlainPoint`

#### Returns

`ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

#### Deprecated

use `findElementViewsAtPoint()

#### Inherited from

`dia.Paper.findViewsFromPoint`

***

### ~~findViewsInArea()~~

> **findViewsInArea**(`rect`, `opt`?): `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

Defined in: [joint-core/types/joint.d.ts:1996](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1996)

#### Parameters

##### rect

`PlainRect`

##### opt?

###### strict?

`boolean`

#### Returns

`ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>[]

#### Deprecated

use `findElementViewsInArea()

#### Inherited from

`dia.Paper.findViewsInArea`

***

### fitToContent()

#### Call Signature

> **fitToContent**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1742](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1742)

##### Parameters

###### opt?

`FitToContentOptions`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.fitToContent`

#### Call Signature

> **fitToContent**(`gridWidth`?, `gridHeight`?, `padding`?, `opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1743](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1743)

##### Parameters

###### gridWidth?

`number`

###### gridHeight?

`number`

###### padding?

`number`

###### opt?

`any`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.fitToContent`

***

### freeze()

> **freeze**(`opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:1815](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1815)

#### Parameters

##### opt?

`FreezeOptions`

#### Returns

`void`

#### Inherited from

`dia.Paper.freeze`

***

### getArea()

> **getArea**(): `Rect`

Defined in: [joint-core/types/joint.d.ts:1687](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1687)

#### Returns

`Rect`

#### Inherited from

`dia.Paper.getArea`

***

### getComputedSize()

> **getComputedSize**(): `Size`

Defined in: [joint-core/types/joint.d.ts:1685](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1685)

#### Returns

`Size`

#### Inherited from

`dia.Paper.getComputedSize`

***

### getContentArea()

> **getContentArea**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1692](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1692)

#### Parameters

##### opt?

###### useModelGeometry

`boolean`

#### Returns

`Rect`

#### Inherited from

`dia.Paper.getContentArea`

***

### getContentBBox()

> **getContentBBox**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1694](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1694)

#### Parameters

##### opt?

###### useModelGeometry

`boolean`

#### Returns

`Rect`

#### Inherited from

`dia.Paper.getContentBBox`

***

### getDefaultLink()

> **getDefaultLink**(`cellView`, `magnet`): `Link`

Defined in: [joint-core/types/joint.d.ts:1751](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1751)

#### Parameters

##### cellView

`CellView`

##### magnet

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

#### Returns

`Link`

#### Inherited from

`dia.Paper.getDefaultLink`

***

### getEventNamespace()

> **getEventNamespace**(): `string`

Defined in: [joint-core/types/joint.d.ts:3562](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3562)

#### Returns

`string`

#### Inherited from

`dia.Paper.getEventNamespace`

***

### getFitToContentArea()

> **getFitToContentArea**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1745](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1745)

#### Parameters

##### opt?

`FitToContentOptions`

#### Returns

`Rect`

#### Inherited from

`dia.Paper.getFitToContentArea`

***

### getLayerNames()

> **getLayerNames**(): `string`[]

Defined in: [joint-core/types/joint.d.ts:1809](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1809)

#### Returns

`string`[]

#### Inherited from

`dia.Paper.getLayerNames`

***

### getLayerNode()

> **getLayerNode**(`layerName`): [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1789](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1789)

#### Parameters

##### layerName

`string`

#### Returns

[`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

#### Inherited from

`dia.Paper.getLayerNode`

***

### getLayers()

> **getLayers**(): `PaperLayer`[]

Defined in: [joint-core/types/joint.d.ts:1811](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1811)

#### Returns

`PaperLayer`[]

#### Inherited from

`dia.Paper.getLayers`

***

### getLayerView()

> **getLayerView**(`layerName`): `PaperLayer`

Defined in: [joint-core/types/joint.d.ts:1791](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1791)

#### Parameters

##### layerName

`string`

#### Returns

`PaperLayer`

#### Inherited from

`dia.Paper.getLayerView`

***

### getModelById()

> **getModelById**(`id`): `Cell`

Defined in: [joint-core/types/joint.d.ts:1753](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1753)

#### Parameters

##### id

`ID` | `Cell`\<`Attributes`, `ModelSetOptions`\>

#### Returns

`Cell`

#### Inherited from

`dia.Paper.getModelById`

***

### getPointerArgs()

> **getPointerArgs**(`evt`): \[`Event`, `number`, `number`\]

Defined in: [joint-core/types/joint.d.ts:1769](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1769)

#### Parameters

##### evt

`Event`

#### Returns

\[`Event`, `number`, `number`\]

#### Inherited from

`dia.Paper.getPointerArgs`

***

### getRestrictedArea()

#### Call Signature

> **getRestrictedArea**(): `null` \| `Rect`

Defined in: [joint-core/types/joint.d.ts:1689](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1689)

##### Returns

`null` \| `Rect`

##### Inherited from

`dia.Paper.getRestrictedArea`

#### Call Signature

> **getRestrictedArea**(`elementView`, `x`, `y`): `null` \| `Rect` \| `PointConstraintCallback`

Defined in: [joint-core/types/joint.d.ts:1690](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1690)

##### Parameters

###### elementView

`ElementView`

###### x

`number`

###### y

`number`

##### Returns

`null` \| `Rect` \| `PointConstraintCallback`

##### Inherited from

`dia.Paper.getRestrictedArea`

***

### hasLayer()

> **hasLayer**(`layer`): `boolean`

Defined in: [joint-core/types/joint.d.ts:1807](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1807)

#### Parameters

##### layer

`string` | `PaperLayer`

#### Returns

`boolean`

#### Inherited from

`dia.Paper.hasLayer`

***

### hasLayerView()

> **hasLayerView**(`layerName`): `boolean`

Defined in: [joint-core/types/joint.d.ts:1793](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1793)

#### Parameters

##### layerName

`string`

#### Returns

`boolean`

#### Inherited from

`dia.Paper.hasLayerView`

***

### hasScheduledUpdates()

> **hasScheduledUpdates**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:1850](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1850)

#### Returns

`boolean`

#### Inherited from

`dia.Paper.hasScheduledUpdates`

***

### hideTools()

> **hideTools**(): `this`

Defined in: [joint-core/types/joint.d.ts:1781](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1781)

#### Returns

`this`

#### Inherited from

`dia.Paper.hideTools`

***

### initialize()

> **initialize**(`options`?): `void`

Defined in: [joint-core/types/joint.d.ts:3481](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3481)

#### Parameters

##### options?

`ViewBaseOptions`\<`Graph`\<`Attributes`, `ModelSetOptions`\>, [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)\>

#### Returns

`void`

#### Inherited from

`dia.Paper.initialize`

***

### isDefined()

> **isDefined**(`defId`): `boolean`

Defined in: [joint-core/types/joint.d.ts:1683](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1683)

#### Parameters

##### defId

`string`

#### Returns

`boolean`

#### Inherited from

`dia.Paper.isDefined`

***

### isFrozen()

> **isFrozen**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:1819](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1819)

#### Returns

`boolean`

#### Inherited from

`dia.Paper.isFrozen`

***

### isMounted()

> **isMounted**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:3586](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3586)

#### Returns

`boolean`

#### Inherited from

`dia.Paper.isMounted`

***

### isPropagationStopped()

> **isPropagationStopped**(`evt`): `boolean`

Defined in: [joint-core/types/joint.d.ts:3576](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3576)

#### Parameters

##### evt

`Event`

#### Returns

`boolean`

#### Inherited from

`dia.Paper.isPropagationStopped`

***

### listenTo()

#### Call Signature

> **listenTo**(`object`, `events`, `callback`): `this`

Defined in: [joint-core/types/joint.d.ts:3264](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3264)

##### Parameters

###### object

`any`

###### events

`string`

###### callback

`EventHandler`

##### Returns

`this`

##### Inherited from

`dia.Paper.listenTo`

#### Call Signature

> **listenTo**(`object`, `eventMap`): `this`

Defined in: [joint-core/types/joint.d.ts:3265](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3265)

##### Parameters

###### object

`any`

###### eventMap

`EventMap`

##### Returns

`this`

##### Inherited from

`dia.Paper.listenTo`

***

### listenToOnce()

#### Call Signature

> **listenToOnce**(`object`, `events`, `callback`): `this`

Defined in: [joint-core/types/joint.d.ts:3266](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3266)

##### Parameters

###### object

`any`

###### events

`string`

###### callback

`EventHandler`

##### Returns

`this`

##### Inherited from

`dia.Paper.listenToOnce`

#### Call Signature

> **listenToOnce**(`object`, `eventMap`): `this`

Defined in: [joint-core/types/joint.d.ts:3267](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3267)

##### Parameters

###### object

`any`

###### eventMap

`EventMap`

##### Returns

`this`

##### Inherited from

`dia.Paper.listenToOnce`

***

### localToClientPoint()

#### Call Signature

> **localToClientPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1642](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1642)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.localToClientPoint`

#### Call Signature

> **localToClientPoint**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1643](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1643)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.localToClientPoint`

***

### localToClientRect()

#### Call Signature

> **localToClientRect**(`x`, `y`, `width`, `height`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1645](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1645)

##### Parameters

###### x

`number`

###### y

`number`

###### width

`number`

###### height

`number`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.localToClientRect`

#### Call Signature

> **localToClientRect**(`rect`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1646](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1646)

##### Parameters

###### rect

`PlainRect`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.localToClientRect`

***

### localToPagePoint()

#### Call Signature

> **localToPagePoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1648](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1648)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.localToPagePoint`

#### Call Signature

> **localToPagePoint**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1649](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1649)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.localToPagePoint`

***

### localToPageRect()

#### Call Signature

> **localToPageRect**(`x`, `y`, `width`, `height`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1651](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1651)

##### Parameters

###### x

`number`

###### y

`number`

###### width

`number`

###### height

`number`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.localToPageRect`

#### Call Signature

> **localToPageRect**(`rect`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1652](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1652)

##### Parameters

###### rect

`PlainRect`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.localToPageRect`

***

### localToPaperPoint()

#### Call Signature

> **localToPaperPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1654](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1654)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.localToPaperPoint`

#### Call Signature

> **localToPaperPoint**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1655](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1655)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.localToPaperPoint`

***

### localToPaperRect()

#### Call Signature

> **localToPaperRect**(`x`, `y`, `width`, `height`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1657](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1657)

##### Parameters

###### x

`number`

###### y

`number`

###### width

`number`

###### height

`number`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.localToPaperRect`

#### Call Signature

> **localToPaperRect**(`rect`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1658](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1658)

##### Parameters

###### rect

`PlainRect`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.localToPaperRect`

***

### matrix()

#### Call Signature

> **matrix**(): [`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

Defined in: [joint-core/types/joint.d.ts:1627](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1627)

##### Returns

[`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

##### Inherited from

`dia.Paper.matrix`

#### Call Signature

> **matrix**(`ctm`, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1628](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1628)

##### Parameters

###### ctm

[`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix) | `Matrix`

###### data?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.matrix`

***

### moveLayer()

> **moveLayer**(`layer`, `insertBefore`): `void`

Defined in: [joint-core/types/joint.d.ts:1805](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1805)

#### Parameters

##### layer

`string` | `PaperLayer`

##### insertBefore

`null` | `string` | `PaperLayer`

#### Returns

`void`

#### Inherited from

`dia.Paper.moveLayer`

***

### off()

> **off**(`eventName`?, `callback`?, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3256](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3256)

#### Parameters

##### eventName?

`null` | `string`

##### callback?

`null` | `EventHandler`

##### context?

`any`

#### Returns

`this`

#### Inherited from

`dia.Paper.off`

***

### on()

#### Call Signature

> **on**\<`T`\>(`eventName`, `callback`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:1854](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1854)

##### Type Parameters

###### T

`T` *extends* keyof `EventMap` = keyof `EventMap`

##### Parameters

###### eventName

`T`

###### callback

`EventMap`\[`T`\]

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.on`

#### Call Signature

> **on**\<`T`\>(`events`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:1856](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1856)

##### Type Parameters

###### T

`T` *extends* keyof `EventMap` = keyof `EventMap`

##### Parameters

###### events

`{ [eventName in keyof EventMap]: EventMap[eventName] }`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.on`

***

### once()

#### Call Signature

> **once**(`events`, `callback`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3262](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3262)

##### Parameters

###### events

`string`

###### callback

`EventHandler`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.once`

#### Call Signature

> **once**(`eventMap`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3263](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3263)

##### Parameters

###### eventMap

`EventMap`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.once`

***

### pageOffset()

> **pageOffset**(): `Point`

Defined in: [joint-core/types/joint.d.ts:1634](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1634)

#### Returns

`Point`

#### Inherited from

`dia.Paper.pageOffset`

***

### pageToLocalPoint()

#### Call Signature

> **pageToLocalPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1660](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1660)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.pageToLocalPoint`

#### Call Signature

> **pageToLocalPoint**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1661](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1661)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.pageToLocalPoint`

***

### pageToLocalRect()

#### Call Signature

> **pageToLocalRect**(`x`, `y`, `width`, `height`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1663](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1663)

##### Parameters

###### x

`number`

###### y

`number`

###### width

`number`

###### height

`number`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.pageToLocalRect`

#### Call Signature

> **pageToLocalRect**(`rect`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1664](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1664)

##### Parameters

###### rect

`PlainRect`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.pageToLocalRect`

***

### paperToLocalPoint()

#### Call Signature

> **paperToLocalPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1666](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1666)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.paperToLocalPoint`

#### Call Signature

> **paperToLocalPoint**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1667](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1667)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.paperToLocalPoint`

***

### paperToLocalRect()

#### Call Signature

> **paperToLocalRect**(`x`, `y`, `width`, `height`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1669](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1669)

##### Parameters

###### x

`number`

###### y

`number`

###### width

`number`

###### height

`number`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.paperToLocalRect`

#### Call Signature

> **paperToLocalRect**(`x`): `Rect`

Defined in: [joint-core/types/joint.d.ts:1670](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1670)

##### Parameters

###### x

`PlainRect`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.paperToLocalRect`

***

### preinitialize()

> **preinitialize**(`options`?): `void`

Defined in: [joint-core/types/joint.d.ts:3478](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3478)

For use with views as ES classes. If you define a preinitialize
method, it will be invoked when the view is first created, before any
instantiation logic is run.

#### Parameters

##### options?

`ViewBaseOptions`\<`Graph`\<`Attributes`, `ModelSetOptions`\>, [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)\>

#### Returns

`void`

#### Inherited from

`dia.Paper.preinitialize`

***

### remove()

> **remove**(): `this`

Defined in: [joint-core/types/joint.d.ts:3506](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3506)

#### Returns

`this`

#### Inherited from

`dia.Paper.remove`

***

### removeLayer()

> **removeLayer**(`layer`): `void`

Defined in: [joint-core/types/joint.d.ts:1803](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1803)

#### Parameters

##### layer

`string` | `PaperLayer`

#### Returns

`void`

#### Inherited from

`dia.Paper.removeLayer`

***

### removeTools()

> **removeTools**(): `this`

Defined in: [joint-core/types/joint.d.ts:1779](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1779)

#### Returns

`this`

#### Inherited from

`dia.Paper.removeTools`

***

### render()

> **render**(): `this`

Defined in: [joint-core/types/joint.d.ts:3505](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3505)

#### Returns

`this`

#### Inherited from

`dia.Paper.render`

***

### renderChildren()

> **renderChildren**(`children`?): `this`

Defined in: [joint-core/types/joint.d.ts:3578](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3578)

#### Parameters

##### children?

`MarkupJSON`

#### Returns

`this`

#### Inherited from

`dia.Paper.renderChildren`

***

### renderLayers()

> **renderLayers**(`layers`): `void`

Defined in: [joint-core/types/joint.d.ts:1795](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1795)

#### Parameters

##### layers

`object`[]

#### Returns

`void`

#### Inherited from

`dia.Paper.renderLayers`

***

### requestViewUpdate()

> **requestViewUpdate**(`view`, `flag`, `priority`, `opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:1821](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1821)

#### Parameters

##### view

`View`\<`any`, `any`\>

##### flag

`number`

##### priority

`number`

##### opt?

#### Returns

`void`

#### Inherited from

`dia.Paper.requestViewUpdate`

***

### requireView()

> **requireView**\<`T`\>(`model`, `opt`?): `T`

Defined in: [joint-core/types/joint.d.ts:1823](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1823)

#### Type Parameters

##### T

`T` *extends* `ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\> \| `LinkView`\<`Link`\<`Attributes`, `ModelSetOptions`\>\>

#### Parameters

##### model

`ID` | `Cell`\<`Attributes`, `ModelSetOptions`\>

##### opt?

`Options`

#### Returns

`T`

#### Inherited from

`dia.Paper.requireView`

***

### scale()

#### Call Signature

> **scale**(): `Scale`

Defined in: [joint-core/types/joint.d.ts:1759](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1759)

##### Returns

`Scale`

##### Inherited from

`dia.Paper.scale`

#### Call Signature

> **scale**(`sx`, `sy`?, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1760](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1760)

##### Parameters

###### sx

`number`

###### sy?

`number`

###### data?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.scale`

***

### ~~scaleContentToFit()~~

> **scaleContentToFit**(`opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:2001](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L2001)

#### Parameters

##### opt?

`TransformToFitContentOptions`

#### Returns

`void`

#### Deprecated

use transformToFitContent

#### Inherited from

`dia.Paper.scaleContentToFit`

***

### scaleUniformAtPoint()

> **scaleUniformAtPoint**(`scale`, `point`, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1762](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1762)

#### Parameters

##### scale

`number`

##### point

`PlainPoint`

##### data?

`any`

#### Returns

`this`

#### Inherited from

`dia.Paper.scaleUniformAtPoint`

***

### setDimensions()

> **setDimensions**(`width`, `height`, `data`?): `void`

Defined in: [joint-core/types/joint.d.ts:1755](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1755)

#### Parameters

##### width

`Dimension`

##### height

`Dimension`

##### data?

`any`

#### Returns

`void`

#### Inherited from

`dia.Paper.setDimensions`

***

### setElement()

> **setElement**(`element`): `this`

Defined in: [joint-core/types/joint.d.ts:3493](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3493)

#### Parameters

##### element

`unknown`

#### Returns

`this`

#### Inherited from

`dia.Paper.setElement`

***

### setGrid()

> **setGrid**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:1773](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1773)

#### Parameters

##### opt?

`null` | `string` | `boolean` | `GridOptions` | `GridOptions`[]

#### Returns

`this`

#### Inherited from

`dia.Paper.setGrid`

***

### setGridSize()

> **setGridSize**(`gridSize`): `this`

Defined in: [joint-core/types/joint.d.ts:1775](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1775)

#### Parameters

##### gridSize

`number`

#### Returns

`this`

#### Inherited from

`dia.Paper.setGridSize`

***

### setInteractivity()

> **setInteractivity**(`value`): `void`

Defined in: [joint-core/types/joint.d.ts:1757](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1757)

#### Parameters

##### value

`any`

#### Returns

`void`

#### Inherited from

`dia.Paper.setInteractivity`

***

### setTheme()

> **setTheme**(`theme`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:3560](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3560)

#### Parameters

##### theme

`string`

##### opt?

###### override?

`boolean`

#### Returns

`this`

#### Inherited from

`dia.Paper.setTheme`

***

### showTools()

> **showTools**(): `this`

Defined in: [joint-core/types/joint.d.ts:1783](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1783)

#### Returns

`this`

#### Inherited from

`dia.Paper.showTools`

***

### snapToGrid()

#### Call Signature

> **snapToGrid**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1672](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1672)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Paper.snapToGrid`

#### Call Signature

> **snapToGrid**(`point`): `Point`

Defined in: [joint-core/types/joint.d.ts:1673](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1673)

##### Parameters

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Paper.snapToGrid`

***

### stopListening()

> **stopListening**(`object`?, `events`?, `callback`?): `this`

Defined in: [joint-core/types/joint.d.ts:3268](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3268)

#### Parameters

##### object?

`any`

##### events?

`string`

##### callback?

`EventHandler`

#### Returns

`this`

#### Inherited from

`dia.Paper.stopListening`

***

### stopPropagation()

> **stopPropagation**(`evt`): `this`

Defined in: [joint-core/types/joint.d.ts:3575](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3575)

#### Parameters

##### evt

`Event`

#### Returns

`this`

#### Inherited from

`dia.Paper.stopPropagation`

***

### transformToFitContent()

> **transformToFitContent**(`opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:1747](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1747)

#### Parameters

##### opt?

`TransformToFitContentOptions`

#### Returns

`void`

#### Inherited from

`dia.Paper.transformToFitContent`

***

### translate()

#### Call Signature

> **translate**(): `Translation`

Defined in: [joint-core/types/joint.d.ts:1764](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1764)

##### Returns

`Translation`

##### Inherited from

`dia.Paper.translate`

#### Call Signature

> **translate**(`tx`, `ty`?, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1765](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1765)

##### Parameters

###### tx

`number`

###### ty?

`number`

###### data?

`any`

##### Returns

`this`

##### Inherited from

`dia.Paper.translate`

***

### trigger()

> **trigger**(`eventName`, ...`args`): `this`

Defined in: [joint-core/types/joint.d.ts:3257](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3257)

#### Parameters

##### eventName

`string`

##### args

...`any`[]

#### Returns

`this`

#### Inherited from

`dia.Paper.trigger`

***

### unbind()

> **unbind**(`eventName`?, `callback`?, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3260](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3260)

#### Parameters

##### eventName?

`string`

##### callback?

`EventHandler`

##### context?

`any`

#### Returns

`this`

#### Inherited from

`dia.Paper.unbind`

***

### undelegate()

> **undelegate**(`eventName`, `selector`?, `listener`?): `this`

Defined in: [joint-core/types/joint.d.ts:3510](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3510)

#### Parameters

##### eventName

`string`

##### selector?

`string`

##### listener?

`ViewBaseEventListener`

#### Returns

`this`

#### Inherited from

`dia.Paper.undelegate`

***

### undelegateDocumentEvents()

> **undelegateDocumentEvents**(): `this`

Defined in: [joint-core/types/joint.d.ts:3566](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3566)

#### Returns

`this`

#### Inherited from

`dia.Paper.undelegateDocumentEvents`

***

### undelegateElementEvents()

> **undelegateElementEvents**(`element`): `this`

Defined in: [joint-core/types/joint.d.ts:3570](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3570)

#### Parameters

##### element

[`Element`](https://developer.mozilla.org/docs/Web/API/Element)

#### Returns

`this`

#### Inherited from

`dia.Paper.undelegateElementEvents`

***

### undelegateEvents()

> **undelegateEvents**(): `this`

Defined in: [joint-core/types/joint.d.ts:3509](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3509)

#### Returns

`this`

#### Inherited from

`dia.Paper.undelegateEvents`

***

### unfreeze()

> **unfreeze**(`opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:1817](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1817)

#### Parameters

##### opt?

`UnfreezeOptions`

#### Returns

`void`

#### Inherited from

`dia.Paper.unfreeze`

***

### unmount()

> **unmount**(): `void`

Defined in: [joint-core/types/joint.d.ts:3584](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3584)

#### Returns

`void`

#### Inherited from

`dia.Paper.unmount`

***

### update()

> **update**(): `this`

Defined in: [joint-core/types/joint.d.ts:1767](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1767)

#### Returns

`this`

#### Inherited from

`dia.Paper.update`

***

### updateViews()

> **updateViews**(`opt`?): `object`

Defined in: [joint-core/types/joint.d.ts:1841](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1841)

#### Parameters

##### opt?

###### batchSize?

`number`

###### viewport?

`ViewportCallback`

#### Returns

`object`

##### batches

> **batches**: `number`

##### priority

> **priority**: `number`

##### updated

> **updated**: `number`

#### Inherited from

`dia.Paper.updateViews`

## Properties

### $el

> **$el**: `unknown`

Defined in: [joint-core/types/joint.d.ts:3502](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3502)

#### Inherited from

`dia.Paper.$el`

***

### attributes

> **attributes**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>

Defined in: [joint-core/types/joint.d.ts:3500](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3500)

#### Inherited from

`dia.Paper.attributes`

***

### cells

> **cells**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1619](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1619)

#### Inherited from

`dia.Paper.cells`

***

### childNodes?

> `optional` **childNodes**: `null` \| \{\}

Defined in: [joint-core/types/joint.d.ts:3556](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3556)

#### Inherited from

`dia.Paper.childNodes`

***

### children?

> `optional` **children**: `MarkupJSON`

Defined in: [joint-core/types/joint.d.ts:3554](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3554)

#### Inherited from

`dia.Paper.children`

***

### cid

> **cid**: `string`

Defined in: [joint-core/types/joint.d.ts:3495](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3495)

#### Inherited from

`dia.Paper.cid`

***

### className?

> `optional` **className**: `string`

Defined in: [joint-core/types/joint.d.ts:3496](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3496)

#### Inherited from

`dia.Paper.className`

***

### collection

> **collection**: `Collection`\<`any`\>

Defined in: [joint-core/types/joint.d.ts:3492](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3492)

#### Inherited from

`dia.Paper.collection`

***

### defaultTheme

> **defaultTheme**: `string`

Defined in: [joint-core/types/joint.d.ts:3548](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3548)

#### Inherited from

`dia.Paper.defaultTheme`

***

### defs

> **defs**: [`SVGDefsElement`](https://developer.mozilla.org/docs/Web/API/SVGDefsElement)

Defined in: [joint-core/types/joint.d.ts:1618](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1618)

#### Inherited from

`dia.Paper.defs`

***

### DETACHABLE

> **DETACHABLE**: `boolean`

Defined in: [joint-core/types/joint.d.ts:3533](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3533)

#### Inherited from

`dia.Paper.DETACHABLE`

***

### documentEvents?

> `optional` **documentEvents**: `EventsHash`

Defined in: [joint-core/types/joint.d.ts:3552](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3552)

#### Inherited from

`dia.Paper.documentEvents`

***

### el

> **el**: [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

Defined in: [joint-core/types/joint.d.ts:3499](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3499)

#### Inherited from

`dia.Paper.el`

***

### FLAG\_INIT

> **FLAG\_INIT**: `number`

Defined in: [joint-core/types/joint.d.ts:3536](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3536)

#### Inherited from

`dia.Paper.FLAG_INIT`

***

### FLAG\_INSERT

> **FLAG\_INSERT**: `number`

Defined in: [joint-core/types/joint.d.ts:3534](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3534)

#### Inherited from

`dia.Paper.FLAG_INSERT`

***

### FLAG\_REMOVE

> **FLAG\_REMOVE**: `number`

Defined in: [joint-core/types/joint.d.ts:3535](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3535)

#### Inherited from

`dia.Paper.FLAG_REMOVE`

***

### FORM\_CONTROLS\_TAG\_NAMES

> **FORM\_CONTROLS\_TAG\_NAMES**: `string`[]

Defined in: [joint-core/types/joint.d.ts:1625](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1625)

#### Inherited from

`dia.Paper.FORM_CONTROLS_TAG_NAMES`

***

### GUARDED\_TAG\_NAMES

> **GUARDED\_TAG\_NAMES**: `string`[]

Defined in: [joint-core/types/joint.d.ts:1624](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1624)

#### Inherited from

`dia.Paper.GUARDED_TAG_NAMES`

***

### id?

> `optional` **id**: `string`

Defined in: [joint-core/types/joint.d.ts:3494](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3494)

#### Inherited from

`dia.Paper.id`

***

### layers

> **layers**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1621](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1621)

#### Inherited from

`dia.Paper.layers`

***

### model

> **model**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:3491](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3491)

#### Inherited from

`dia.Paper.model`

***

### options

> **options**: `Options`

Defined in: [joint-core/types/joint.d.ts:1613](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1613)

#### Inherited from

`dia.Paper.options`

***

### portStore

> **portStore**: `PortsStore`

Defined in: [joint-react/src/context/paper-context.tsx:9](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/paper-context.tsx#L9)

***

### renderElement?

> `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<[`GraphElement`](GraphElement.md)\>

Defined in: [joint-react/src/context/paper-context.tsx:8](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/paper-context.tsx#L8)

***

### requireSetThemeOverride

> **requireSetThemeOverride**: `boolean`

Defined in: [joint-core/types/joint.d.ts:3550](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3550)

#### Inherited from

`dia.Paper.requireSetThemeOverride`

***

### style?

> `optional` **style**: `object`

Defined in: [joint-core/types/joint.d.ts:3558](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3558)

#### Index Signature

\[`key`: `string`\]: `any`

#### Inherited from

`dia.Paper.style`

***

### stylesheet

> **stylesheet**: `string`

Defined in: [joint-core/types/joint.d.ts:1615](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1615)

#### Inherited from

`dia.Paper.stylesheet`

***

### svg

> **svg**: [`SVGSVGElement`](https://developer.mozilla.org/docs/Web/API/SVGSVGElement)

Defined in: [joint-core/types/joint.d.ts:1617](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1617)

#### Inherited from

`dia.Paper.svg`

***

### svgElement

> **svgElement**: `boolean`

Defined in: [joint-core/types/joint.d.ts:3540](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3540)

#### Inherited from

`dia.Paper.svgElement`

***

### tagName

> **tagName**: `string`

Defined in: [joint-core/types/joint.d.ts:3497](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3497)

#### Inherited from

`dia.Paper.tagName`

***

### theme

> **theme**: `string`

Defined in: [joint-core/types/joint.d.ts:3544](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3544)

#### Inherited from

`dia.Paper.theme`

***

### themeClassNamePrefix

> **themeClassNamePrefix**: `string`

Defined in: [joint-core/types/joint.d.ts:3546](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3546)

#### Inherited from

`dia.Paper.themeClassNamePrefix`

***

### tools

> **tools**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1620](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1620)

#### Inherited from

`dia.Paper.tools`

***

### UPDATE\_PRIORITY

> **UPDATE\_PRIORITY**: `number`

Defined in: [joint-core/types/joint.d.ts:3532](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3532)

#### Inherited from

`dia.Paper.UPDATE_PRIORITY`

***

### vel

> **vel**: `null`

Defined in: [joint-core/types/joint.d.ts:3538](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3538)

#### Inherited from

`dia.Paper.vel`

***

### viewport

> **viewport**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1622](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1622)

#### Inherited from

`dia.Paper.viewport`
