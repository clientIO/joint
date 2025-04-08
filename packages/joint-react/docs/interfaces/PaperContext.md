[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperContext

# Interface: PaperContext

Defined in: [joint-react/src/context/paper-context.tsx:6](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/paper-context.tsx#L6)

## Extends

- `Paper`

## Methods

### $()

> **$**(`selector`): `unknown`

Defined in: [joint-core/types/joint.d.ts:3487](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3487)

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

Defined in: [joint-core/types/joint.d.ts:1786](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1786)

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

Defined in: [joint-core/types/joint.d.ts:3241](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3241)

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

Defined in: [joint-core/types/joint.d.ts:3242](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3242)

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

Defined in: [joint-core/types/joint.d.ts:1817](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1817)

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

Defined in: [joint-core/types/joint.d.ts:1615](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1615)

#### Returns

[`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

#### Inherited from

`dia.Paper.clientMatrix`

***

### clientOffset()

> **clientOffset**(): `Point`

Defined in: [joint-core/types/joint.d.ts:1617](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1617)

#### Returns

`Point`

#### Inherited from

`dia.Paper.clientOffset`

***

### clientToLocalPoint()

#### Call Signature

> **clientToLocalPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1621](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1621)

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

Defined in: [joint-core/types/joint.d.ts:1622](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1622)

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

Defined in: [joint-core/types/joint.d.ts:1624](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1624)

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

Defined in: [joint-core/types/joint.d.ts:1625](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1625)

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

Defined in: [joint-core/types/joint.d.ts:3565](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3565)

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

Defined in: [joint-core/types/joint.d.ts:1660](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1660)

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

Defined in: [joint-core/types/joint.d.ts:1662](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1662)

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

Defined in: [joint-core/types/joint.d.ts:1664](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1664)

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

Defined in: [joint-core/types/joint.d.ts:1666](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1666)

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

Defined in: [joint-core/types/joint.d.ts:3491](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3491)

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

Defined in: [joint-core/types/joint.d.ts:3547](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3547)

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

Defined in: [joint-core/types/joint.d.ts:3551](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3551)

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

Defined in: [joint-core/types/joint.d.ts:3490](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3490)

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

Defined in: [joint-core/types/joint.d.ts:1770](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1770)

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

Defined in: [joint-core/types/joint.d.ts:1734](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1734)

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

Defined in: [joint-core/types/joint.d.ts:1810](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1810)

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

Defined in: [joint-core/types/joint.d.ts:3555](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3555)

##### Parameters

###### evt

`Event`

##### Returns

`viewEventData`

##### Inherited from

`dia.Paper.eventData`

#### Call Signature

> **eventData**(`evt`, `data`): `this`

Defined in: [joint-core/types/joint.d.ts:3556](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3556)

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

Defined in: [joint-core/types/joint.d.ts:3471](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3471)

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

Defined in: [joint-core/types/joint.d.ts:3563](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3563)

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

Defined in: [joint-core/types/joint.d.ts:1704](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1704)

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

Defined in: [joint-core/types/joint.d.ts:1725](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1725)

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

Defined in: [joint-core/types/joint.d.ts:1690](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1690)

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

Defined in: [joint-core/types/joint.d.ts:1711](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1711)

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

Defined in: [joint-core/types/joint.d.ts:1697](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1697)

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

Defined in: [joint-core/types/joint.d.ts:1718](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1718)

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

Defined in: [joint-core/types/joint.d.ts:1681](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1681)

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

Defined in: [joint-core/types/joint.d.ts:1683](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1683)

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

Defined in: [joint-core/types/joint.d.ts:1976](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1976)

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

Defined in: [joint-core/types/joint.d.ts:1981](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1981)

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

Defined in: [joint-core/types/joint.d.ts:1727](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1727)

##### Parameters

###### opt?

`FitToContentOptions`

##### Returns

`Rect`

##### Inherited from

`dia.Paper.fitToContent`

#### Call Signature

> **fitToContent**(`gridWidth`?, `gridHeight`?, `padding`?, `opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1728](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1728)

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

Defined in: [joint-core/types/joint.d.ts:1800](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1800)

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

Defined in: [joint-core/types/joint.d.ts:1672](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1672)

#### Returns

`Rect`

#### Inherited from

`dia.Paper.getArea`

***

### getComputedSize()

> **getComputedSize**(): `Size`

Defined in: [joint-core/types/joint.d.ts:1670](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1670)

#### Returns

`Size`

#### Inherited from

`dia.Paper.getComputedSize`

***

### getContentArea()

> **getContentArea**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1677](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1677)

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

Defined in: [joint-core/types/joint.d.ts:1679](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1679)

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

Defined in: [joint-core/types/joint.d.ts:1736](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1736)

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

Defined in: [joint-core/types/joint.d.ts:3545](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3545)

#### Returns

`string`

#### Inherited from

`dia.Paper.getEventNamespace`

***

### getFitToContentArea()

> **getFitToContentArea**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:1730](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1730)

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

Defined in: [joint-core/types/joint.d.ts:1794](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1794)

#### Returns

`string`[]

#### Inherited from

`dia.Paper.getLayerNames`

***

### getLayerNode()

> **getLayerNode**(`layerName`): [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1774](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1774)

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

Defined in: [joint-core/types/joint.d.ts:1796](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1796)

#### Returns

`PaperLayer`[]

#### Inherited from

`dia.Paper.getLayers`

***

### getLayerView()

> **getLayerView**(`layerName`): `PaperLayer`

Defined in: [joint-core/types/joint.d.ts:1776](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1776)

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

Defined in: [joint-core/types/joint.d.ts:1738](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1738)

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

Defined in: [joint-core/types/joint.d.ts:1754](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1754)

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

Defined in: [joint-core/types/joint.d.ts:1674](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1674)

##### Returns

`null` \| `Rect`

##### Inherited from

`dia.Paper.getRestrictedArea`

#### Call Signature

> **getRestrictedArea**(`elementView`, `x`, `y`): `null` \| `Rect` \| `PointConstraintCallback`

Defined in: [joint-core/types/joint.d.ts:1675](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1675)

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

Defined in: [joint-core/types/joint.d.ts:1792](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1792)

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

Defined in: [joint-core/types/joint.d.ts:1778](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1778)

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

Defined in: [joint-core/types/joint.d.ts:1835](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1835)

#### Returns

`boolean`

#### Inherited from

`dia.Paper.hasScheduledUpdates`

***

### hideTools()

> **hideTools**(): `this`

Defined in: [joint-core/types/joint.d.ts:1766](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1766)

#### Returns

`this`

#### Inherited from

`dia.Paper.hideTools`

***

### initialize()

> **initialize**(`options`?): `void`

Defined in: [joint-core/types/joint.d.ts:3464](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3464)

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

Defined in: [joint-core/types/joint.d.ts:1668](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1668)

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

Defined in: [joint-core/types/joint.d.ts:1804](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1804)

#### Returns

`boolean`

#### Inherited from

`dia.Paper.isFrozen`

***

### isMounted()

> **isMounted**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:3569](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3569)

#### Returns

`boolean`

#### Inherited from

`dia.Paper.isMounted`

***

### isPropagationStopped()

> **isPropagationStopped**(`evt`): `boolean`

Defined in: [joint-core/types/joint.d.ts:3559](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3559)

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

Defined in: [joint-core/types/joint.d.ts:3247](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3247)

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

Defined in: [joint-core/types/joint.d.ts:3248](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3248)

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

Defined in: [joint-core/types/joint.d.ts:3249](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3249)

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

Defined in: [joint-core/types/joint.d.ts:3250](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3250)

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

Defined in: [joint-core/types/joint.d.ts:1627](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1627)

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

Defined in: [joint-core/types/joint.d.ts:1628](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1628)

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

Defined in: [joint-core/types/joint.d.ts:1630](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1630)

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

Defined in: [joint-core/types/joint.d.ts:1631](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1631)

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

Defined in: [joint-core/types/joint.d.ts:1633](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1633)

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

Defined in: [joint-core/types/joint.d.ts:1634](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1634)

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

Defined in: [joint-core/types/joint.d.ts:1636](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1636)

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

Defined in: [joint-core/types/joint.d.ts:1637](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1637)

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

Defined in: [joint-core/types/joint.d.ts:1639](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1639)

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

Defined in: [joint-core/types/joint.d.ts:1640](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1640)

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

Defined in: [joint-core/types/joint.d.ts:1642](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1642)

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

Defined in: [joint-core/types/joint.d.ts:1643](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1643)

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

Defined in: [joint-core/types/joint.d.ts:1612](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1612)

##### Returns

[`DOMMatrix`](https://developer.mozilla.org/docs/Web/API/DOMMatrix)

##### Inherited from

`dia.Paper.matrix`

#### Call Signature

> **matrix**(`ctm`, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1613](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1613)

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

Defined in: [joint-core/types/joint.d.ts:1790](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1790)

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

Defined in: [joint-core/types/joint.d.ts:3239](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3239)

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

Defined in: [joint-core/types/joint.d.ts:1839](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1839)

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

Defined in: [joint-core/types/joint.d.ts:1841](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1841)

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

Defined in: [joint-core/types/joint.d.ts:3245](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3245)

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

Defined in: [joint-core/types/joint.d.ts:3246](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3246)

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

Defined in: [joint-core/types/joint.d.ts:1619](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1619)

#### Returns

`Point`

#### Inherited from

`dia.Paper.pageOffset`

***

### pageToLocalPoint()

#### Call Signature

> **pageToLocalPoint**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1645](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1645)

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

Defined in: [joint-core/types/joint.d.ts:1646](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1646)

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

Defined in: [joint-core/types/joint.d.ts:1648](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1648)

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

Defined in: [joint-core/types/joint.d.ts:1649](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1649)

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

Defined in: [joint-core/types/joint.d.ts:1651](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1651)

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

Defined in: [joint-core/types/joint.d.ts:1652](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1652)

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

Defined in: [joint-core/types/joint.d.ts:1654](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1654)

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

Defined in: [joint-core/types/joint.d.ts:1655](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1655)

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

Defined in: [joint-core/types/joint.d.ts:3461](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3461)

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

Defined in: [joint-core/types/joint.d.ts:3489](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3489)

#### Returns

`this`

#### Inherited from

`dia.Paper.remove`

***

### removeLayer()

> **removeLayer**(`layer`): `void`

Defined in: [joint-core/types/joint.d.ts:1788](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1788)

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

Defined in: [joint-core/types/joint.d.ts:1764](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1764)

#### Returns

`this`

#### Inherited from

`dia.Paper.removeTools`

***

### render()

> **render**(): `this`

Defined in: [joint-core/types/joint.d.ts:3488](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3488)

#### Returns

`this`

#### Inherited from

`dia.Paper.render`

***

### renderChildren()

> **renderChildren**(`children`?): `this`

Defined in: [joint-core/types/joint.d.ts:3561](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3561)

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

Defined in: [joint-core/types/joint.d.ts:1780](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1780)

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

Defined in: [joint-core/types/joint.d.ts:1806](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1806)

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

Defined in: [joint-core/types/joint.d.ts:1808](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1808)

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

Defined in: [joint-core/types/joint.d.ts:1744](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1744)

##### Returns

`Scale`

##### Inherited from

`dia.Paper.scale`

#### Call Signature

> **scale**(`sx`, `sy`?, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1745](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1745)

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

Defined in: [joint-core/types/joint.d.ts:1986](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1986)

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

Defined in: [joint-core/types/joint.d.ts:1747](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1747)

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

Defined in: [joint-core/types/joint.d.ts:1740](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1740)

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

Defined in: [joint-core/types/joint.d.ts:3476](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3476)

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

Defined in: [joint-core/types/joint.d.ts:1758](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1758)

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

Defined in: [joint-core/types/joint.d.ts:1760](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1760)

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

Defined in: [joint-core/types/joint.d.ts:1742](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1742)

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

Defined in: [joint-core/types/joint.d.ts:3543](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3543)

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

Defined in: [joint-core/types/joint.d.ts:1768](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1768)

#### Returns

`this`

#### Inherited from

`dia.Paper.showTools`

***

### snapToGrid()

#### Call Signature

> **snapToGrid**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:1657](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1657)

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

Defined in: [joint-core/types/joint.d.ts:1658](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1658)

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

Defined in: [joint-core/types/joint.d.ts:3251](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3251)

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

Defined in: [joint-core/types/joint.d.ts:3558](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3558)

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

Defined in: [joint-core/types/joint.d.ts:1732](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1732)

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

Defined in: [joint-core/types/joint.d.ts:1749](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1749)

##### Returns

`Translation`

##### Inherited from

`dia.Paper.translate`

#### Call Signature

> **translate**(`tx`, `ty`?, `data`?): `this`

Defined in: [joint-core/types/joint.d.ts:1750](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1750)

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

Defined in: [joint-core/types/joint.d.ts:3240](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3240)

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

Defined in: [joint-core/types/joint.d.ts:3243](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3243)

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

Defined in: [joint-core/types/joint.d.ts:3493](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3493)

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

Defined in: [joint-core/types/joint.d.ts:3549](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3549)

#### Returns

`this`

#### Inherited from

`dia.Paper.undelegateDocumentEvents`

***

### undelegateElementEvents()

> **undelegateElementEvents**(`element`): `this`

Defined in: [joint-core/types/joint.d.ts:3553](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3553)

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

Defined in: [joint-core/types/joint.d.ts:3492](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3492)

#### Returns

`this`

#### Inherited from

`dia.Paper.undelegateEvents`

***

### unfreeze()

> **unfreeze**(`opt`?): `void`

Defined in: [joint-core/types/joint.d.ts:1802](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1802)

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

Defined in: [joint-core/types/joint.d.ts:3567](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3567)

#### Returns

`void`

#### Inherited from

`dia.Paper.unmount`

***

### update()

> **update**(): `this`

Defined in: [joint-core/types/joint.d.ts:1752](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1752)

#### Returns

`this`

#### Inherited from

`dia.Paper.update`

***

### updateViews()

> **updateViews**(`opt`?): `object`

Defined in: [joint-core/types/joint.d.ts:1826](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1826)

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

Defined in: [joint-core/types/joint.d.ts:3485](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3485)

#### Inherited from

`dia.Paper.$el`

***

### attributes

> **attributes**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>

Defined in: [joint-core/types/joint.d.ts:3483](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3483)

#### Inherited from

`dia.Paper.attributes`

***

### cells

> **cells**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1604](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1604)

#### Inherited from

`dia.Paper.cells`

***

### childNodes?

> `optional` **childNodes**: `null` \| \{\}

Defined in: [joint-core/types/joint.d.ts:3539](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3539)

#### Inherited from

`dia.Paper.childNodes`

***

### children?

> `optional` **children**: `MarkupJSON`

Defined in: [joint-core/types/joint.d.ts:3537](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3537)

#### Inherited from

`dia.Paper.children`

***

### cid

> **cid**: `string`

Defined in: [joint-core/types/joint.d.ts:3478](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3478)

#### Inherited from

`dia.Paper.cid`

***

### className?

> `optional` **className**: `string`

Defined in: [joint-core/types/joint.d.ts:3479](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3479)

#### Inherited from

`dia.Paper.className`

***

### collection

> **collection**: `Collection`\<`any`\>

Defined in: [joint-core/types/joint.d.ts:3475](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3475)

#### Inherited from

`dia.Paper.collection`

***

### defaultTheme

> **defaultTheme**: `string`

Defined in: [joint-core/types/joint.d.ts:3531](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3531)

#### Inherited from

`dia.Paper.defaultTheme`

***

### defs

> **defs**: [`SVGDefsElement`](https://developer.mozilla.org/docs/Web/API/SVGDefsElement)

Defined in: [joint-core/types/joint.d.ts:1603](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1603)

#### Inherited from

`dia.Paper.defs`

***

### DETACHABLE

> **DETACHABLE**: `boolean`

Defined in: [joint-core/types/joint.d.ts:3516](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3516)

#### Inherited from

`dia.Paper.DETACHABLE`

***

### documentEvents?

> `optional` **documentEvents**: `EventsHash`

Defined in: [joint-core/types/joint.d.ts:3535](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3535)

#### Inherited from

`dia.Paper.documentEvents`

***

### el

> **el**: [`HTMLElement`](https://developer.mozilla.org/docs/Web/API/HTMLElement)

Defined in: [joint-core/types/joint.d.ts:3482](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3482)

#### Inherited from

`dia.Paper.el`

***

### FLAG\_INIT

> **FLAG\_INIT**: `number`

Defined in: [joint-core/types/joint.d.ts:3519](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3519)

#### Inherited from

`dia.Paper.FLAG_INIT`

***

### FLAG\_INSERT

> **FLAG\_INSERT**: `number`

Defined in: [joint-core/types/joint.d.ts:3517](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3517)

#### Inherited from

`dia.Paper.FLAG_INSERT`

***

### FLAG\_REMOVE

> **FLAG\_REMOVE**: `number`

Defined in: [joint-core/types/joint.d.ts:3518](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3518)

#### Inherited from

`dia.Paper.FLAG_REMOVE`

***

### FORM\_CONTROLS\_TAG\_NAMES

> **FORM\_CONTROLS\_TAG\_NAMES**: `string`[]

Defined in: [joint-core/types/joint.d.ts:1610](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1610)

#### Inherited from

`dia.Paper.FORM_CONTROLS_TAG_NAMES`

***

### GUARDED\_TAG\_NAMES

> **GUARDED\_TAG\_NAMES**: `string`[]

Defined in: [joint-core/types/joint.d.ts:1609](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1609)

#### Inherited from

`dia.Paper.GUARDED_TAG_NAMES`

***

### id?

> `optional` **id**: `string`

Defined in: [joint-core/types/joint.d.ts:3477](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3477)

#### Inherited from

`dia.Paper.id`

***

### layers

> **layers**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1606](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1606)

#### Inherited from

`dia.Paper.layers`

***

### model

> **model**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:3474](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3474)

#### Inherited from

`dia.Paper.model`

***

### options

> **options**: `Options`

Defined in: [joint-core/types/joint.d.ts:1598](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1598)

#### Inherited from

`dia.Paper.options`

***

### renderElement?

> `optional` **renderElement**: [`RenderElement`](../type-aliases/RenderElement.md)\<[`GraphElementBase`](GraphElementBase.md)\<`string`\>\>

Defined in: [joint-react/src/context/paper-context.tsx:7](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/paper-context.tsx#L7)

***

### requireSetThemeOverride

> **requireSetThemeOverride**: `boolean`

Defined in: [joint-core/types/joint.d.ts:3533](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3533)

#### Inherited from

`dia.Paper.requireSetThemeOverride`

***

### style?

> `optional` **style**: `object`

Defined in: [joint-core/types/joint.d.ts:3541](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3541)

#### Index Signature

\[`key`: `string`\]: `any`

#### Inherited from

`dia.Paper.style`

***

### stylesheet

> **stylesheet**: `string`

Defined in: [joint-core/types/joint.d.ts:1600](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1600)

#### Inherited from

`dia.Paper.stylesheet`

***

### svg

> **svg**: [`SVGSVGElement`](https://developer.mozilla.org/docs/Web/API/SVGSVGElement)

Defined in: [joint-core/types/joint.d.ts:1602](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1602)

#### Inherited from

`dia.Paper.svg`

***

### svgElement

> **svgElement**: `boolean`

Defined in: [joint-core/types/joint.d.ts:3523](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3523)

#### Inherited from

`dia.Paper.svgElement`

***

### tagName

> **tagName**: `string`

Defined in: [joint-core/types/joint.d.ts:3480](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3480)

#### Inherited from

`dia.Paper.tagName`

***

### theme

> **theme**: `string`

Defined in: [joint-core/types/joint.d.ts:3527](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3527)

#### Inherited from

`dia.Paper.theme`

***

### themeClassNamePrefix

> **themeClassNamePrefix**: `string`

Defined in: [joint-core/types/joint.d.ts:3529](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3529)

#### Inherited from

`dia.Paper.themeClassNamePrefix`

***

### tools

> **tools**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1605](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1605)

#### Inherited from

`dia.Paper.tools`

***

### UPDATE\_PRIORITY

> **UPDATE\_PRIORITY**: `number`

Defined in: [joint-core/types/joint.d.ts:3515](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3515)

#### Inherited from

`dia.Paper.UPDATE_PRIORITY`

***

### vel

> **vel**: `null`

Defined in: [joint-core/types/joint.d.ts:3521](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3521)

#### Inherited from

`dia.Paper.vel`

***

### viewport

> **viewport**: [`SVGGElement`](https://developer.mozilla.org/docs/Web/API/SVGGElement)

Defined in: [joint-core/types/joint.d.ts:1607](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1607)

#### Inherited from

`dia.Paper.viewport`
