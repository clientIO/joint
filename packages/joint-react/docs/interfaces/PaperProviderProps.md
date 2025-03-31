[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProviderProps

# Interface: PaperProviderProps

Defined in: [joint-react/src/components/paper-provider/paper-provider.tsx:9](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper-provider/paper-provider.tsx#L9)

## Extends

- `PaperOptions`

## Indexable

\[`key`: `string`\]: `any`

## Properties

### afterRender?

> `optional` **afterRender**: `AfterRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1432](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1432)

#### Inherited from

`PaperOptions.afterRender`

***

### allowLink?

> `optional` **allowLink**: `null` \| (`linkView`, `paper`) => `boolean`

Defined in: [joint-core/types/joint.d.ts:1389](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1389)

#### Inherited from

`PaperOptions.allowLink`

***

### anchorNamespace?

> `optional` **anchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1412](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1412)

#### Inherited from

`PaperOptions.anchorNamespace`

***

### async?

> `optional` **async**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1424](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1424)

#### Inherited from

`PaperOptions.async`

***

### attributes?

> `optional` **attributes**: [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `any`\>

Defined in: [joint-core/types/joint.d.ts:3406](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3406)

#### Inherited from

`PaperOptions.attributes`

***

### autoFreeze?

> `optional` **autoFreeze**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1427](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1427)

#### Inherited from

`PaperOptions.autoFreeze`

***

### background?

> `optional` **background**: `BackgroundOptions`

Defined in: [joint-core/types/joint.d.ts:1373](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1373)

#### Inherited from

`PaperOptions.background`

***

### beforeRender?

> `optional` **beforeRender**: `BeforeRenderCallback`

Defined in: [joint-core/types/joint.d.ts:1431](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1431)

#### Inherited from

`PaperOptions.beforeRender`

***

### cellViewNamespace?

> `optional` **cellViewNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1408](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1408)

#### Inherited from

`PaperOptions.cellViewNamespace`

***

### children

> `readonly` **children**: `ReactNode`

Defined in: [joint-react/src/components/paper-provider/paper-provider.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/paper-provider/paper-provider.tsx#L10)

***

### className?

> `optional` **className**: `string`

Defined in: [joint-core/types/joint.d.ts:3407](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3407)

#### Inherited from

`PaperOptions.className`

***

### clickThreshold?

> `optional` **clickThreshold**: `number`

Defined in: [joint-core/types/joint.d.ts:1395](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1395)

#### Inherited from

`PaperOptions.clickThreshold`

***

### collection?

> `optional` **collection**: `Collection`\<`any`\>

Defined in: [joint-core/types/joint.d.ts:3403](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3403)

#### Inherited from

`PaperOptions.collection`

***

### connectionPointNamespace?

> `optional` **connectionPointNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1414](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1414)

#### Inherited from

`PaperOptions.connectionPointNamespace`

***

### connectionStrategy?

> `optional` **connectionStrategy**: `ConnectionStrategy`

Defined in: [joint-core/types/joint.d.ts:1422](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1422)

#### Inherited from

`PaperOptions.connectionStrategy`

***

### connectorNamespace?

> `optional` **connectorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1410](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1410)

#### Inherited from

`PaperOptions.connectorNamespace`

***

### defaultAnchor?

> `optional` **defaultAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1418](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1418)

#### Inherited from

`PaperOptions.defaultAnchor`

***

### defaultConnectionPoint?

> `optional` **defaultConnectionPoint**: `ConnectionPointJSON` \| `ConnectionPoint` \| (...`args`) => `ConnectionPoint`

Defined in: [joint-core/types/joint.d.ts:1420](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1420)

#### Inherited from

`PaperOptions.defaultConnectionPoint`

***

### defaultConnector?

> `optional` **defaultConnector**: `Connector` \| `ConnectorJSON`

Defined in: [joint-core/types/joint.d.ts:1417](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1417)

#### Inherited from

`PaperOptions.defaultConnector`

***

### defaultLink?

> `optional` **defaultLink**: `Link`\<`Attributes`, `ModelSetOptions`\> \| (`cellView`, `magnet`) => `Link`

Defined in: [joint-core/types/joint.d.ts:1415](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1415)

#### Inherited from

`PaperOptions.defaultLink`

***

### defaultLinkAnchor?

> `optional` **defaultLinkAnchor**: `AnchorJSON` \| `Anchor`

Defined in: [joint-core/types/joint.d.ts:1419](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1419)

#### Inherited from

`PaperOptions.defaultLinkAnchor`

***

### defaultRouter?

> `optional` **defaultRouter**: `Router` \| `RouterJSON`

Defined in: [joint-core/types/joint.d.ts:1416](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1416)

#### Inherited from

`PaperOptions.defaultRouter`

***

### drawGrid?

> `optional` **drawGrid**: `boolean` \| `GridOptions` \| `GridOptions`[]

Defined in: [joint-core/types/joint.d.ts:1371](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1371)

#### Inherited from

`PaperOptions.drawGrid`

***

### drawGridSize?

> `optional` **drawGridSize**: `null` \| `number`

Defined in: [joint-core/types/joint.d.ts:1372](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1372)

#### Inherited from

`PaperOptions.drawGridSize`

***

### el?

> `optional` **el**: `unknown`

Defined in: [joint-core/types/joint.d.ts:3404](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3404)

#### Inherited from

`PaperOptions.el`

***

### elementView?

> `optional` **elementView**: *typeof* `ElementView` \| (`element`) => *typeof* `ElementView`

Defined in: [joint-core/types/joint.d.ts:1399](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1399)

#### Inherited from

`PaperOptions.elementView`

***

### embeddingMode?

> `optional` **embeddingMode**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1402](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1402)

#### Inherited from

`PaperOptions.embeddingMode`

***

### events?

> `optional` **events**: `_Result`\<`EventsHash`\>

Defined in: [joint-core/types/joint.d.ts:3409](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3409)

#### Inherited from

`PaperOptions.events`

***

### findParentBy?

> `optional` **findParentBy**: `FindParentByType` \| `FindParentByCallback`

Defined in: [joint-core/types/joint.d.ts:1404](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1404)

#### Inherited from

`PaperOptions.findParentBy`

***

### frontParentOnly?

> `optional` **frontParentOnly**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1403](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1403)

#### Inherited from

`PaperOptions.frontParentOnly`

***

### frozen?

> `optional` **frozen**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1426](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1426)

#### Inherited from

`PaperOptions.frozen`

***

### gridSize?

> `optional` **gridSize**: `number`

Defined in: [joint-core/types/joint.d.ts:1376](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1376)

#### Inherited from

`PaperOptions.gridSize`

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

`PaperOptions.guard`

***

### height?

> `optional` **height**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1370](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1370)

#### Inherited from

`PaperOptions.height`

***

### highlighterNamespace?

> `optional` **highlighterNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1411](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1411)

#### Inherited from

`PaperOptions.highlighterNamespace`

***

### highlighting?

> `optional` **highlighting**: `boolean` \| [`Record`](https://www.typescriptlang.org/docs/handbook/utility-types.html#recordkeys-type)\<`string`, `boolean` \| `HighlighterJSON`\>

Defined in: [joint-core/types/joint.d.ts:1377](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1377)

#### Inherited from

`PaperOptions.highlighting`

***

### id?

> `optional` **id**: `string`

Defined in: [joint-core/types/joint.d.ts:3405](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3405)

#### Inherited from

`PaperOptions.id`

***

### interactive?

> `optional` **interactive**: `boolean` \| (`cellView`, `event`) => `boolean` \| `InteractivityOptions` \| `InteractivityOptions`

Defined in: [joint-core/types/joint.d.ts:1378](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1378)

#### Inherited from

`PaperOptions.interactive`

***

### labelsLayer?

> `optional` **labelsLayer**: `string` \| `boolean`

Defined in: [joint-core/types/joint.d.ts:1374](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1374)

#### Inherited from

`PaperOptions.labelsLayer`

***

### linkAnchorNamespace?

> `optional` **linkAnchorNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1413](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1413)

#### Inherited from

`PaperOptions.linkAnchorNamespace`

***

### linkPinning?

> `optional` **linkPinning**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1388](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1388)

#### Inherited from

`PaperOptions.linkPinning`

***

### linkView?

> `optional` **linkView**: *typeof* `LinkView` \| (`link`) => *typeof* `LinkView`

Defined in: [joint-core/types/joint.d.ts:1400](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1400)

#### Inherited from

`PaperOptions.linkView`

***

### magnetThreshold?

> `optional` **magnetThreshold**: `string` \| `number`

Defined in: [joint-core/types/joint.d.ts:1397](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1397)

#### Inherited from

`PaperOptions.magnetThreshold`

***

### markAvailable?

> `optional` **markAvailable**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1382](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1382)

#### Inherited from

`PaperOptions.markAvailable`

***

### model?

> `optional` **model**: `Graph`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:3401](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3401)

#### Inherited from

`PaperOptions.model`

***

### moveThreshold?

> `optional` **moveThreshold**: `number`

Defined in: [joint-core/types/joint.d.ts:1396](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1396)

#### Inherited from

`PaperOptions.moveThreshold`

***

### multiLinks?

> `optional` **multiLinks**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1387](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1387)

#### Inherited from

`PaperOptions.multiLinks`

***

### onRenderElement?

> `readonly` `optional` **onRenderElement**: `OnPaperRenderElement`

Defined in: [joint-react/src/utils/create-paper.ts:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create-paper.ts#L16)

A function that is called when the paper is ready.

#### Param

The element that is being rendered

#### Param

The portal element that is being rendered

#### Returns

#### Inherited from

`PaperOptions.onRenderElement`

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

`PaperOptions.onViewPostponed`

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

`PaperOptions.onViewUpdate`

***

### overflow?

> `optional` **overflow**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1433](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1433)

#### Inherited from

`PaperOptions.overflow`

***

### preventContextMenu?

> `optional` **preventContextMenu**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1392](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1392)

#### Inherited from

`PaperOptions.preventContextMenu`

***

### preventDefaultBlankAction?

> `optional` **preventDefaultBlankAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1394](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1394)

#### Inherited from

`PaperOptions.preventDefaultBlankAction`

***

### preventDefaultViewAction?

> `optional` **preventDefaultViewAction**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1393](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1393)

#### Inherited from

`PaperOptions.preventDefaultViewAction`

***

### restrictTranslate?

> `optional` **restrictTranslate**: `boolean` \| `PlainRect` \| `RestrictTranslateCallback`

Defined in: [joint-core/types/joint.d.ts:1386](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1386)

#### Inherited from

`PaperOptions.restrictTranslate`

***

### routerNamespace?

> `optional` **routerNamespace**: `any`

Defined in: [joint-core/types/joint.d.ts:1409](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1409)

#### Inherited from

`PaperOptions.routerNamespace`

***

### scale?

> `readonly` `optional` **scale**: `number`

Defined in: [joint-react/src/utils/create-paper.ts:9](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/create-paper.ts#L9)

#### Inherited from

`PaperOptions.scale`

***

### snapLabels?

> `optional` **snapLabels**: `boolean`

Defined in: [joint-core/types/joint.d.ts:1379](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1379)

#### Inherited from

`PaperOptions.snapLabels`

***

### snapLinks?

> `optional` **snapLinks**: `boolean` \| `SnapLinksOptions`

Defined in: [joint-core/types/joint.d.ts:1380](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1380)

#### Inherited from

`PaperOptions.snapLinks`

***

### snapLinksSelf?

> `optional` **snapLinksSelf**: `boolean` \| \{ `distance`: `number`; \}

Defined in: [joint-core/types/joint.d.ts:1381](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1381)

#### Inherited from

`PaperOptions.snapLinksSelf`

***

### sorting?

> `optional` **sorting**: `sorting`

Defined in: [joint-core/types/joint.d.ts:1425](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1425)

#### Inherited from

`PaperOptions.sorting`

***

### tagName?

> `optional` **tagName**: `string`

Defined in: [joint-core/types/joint.d.ts:3408](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3408)

#### Inherited from

`PaperOptions.tagName`

***

### theme?

> `optional` **theme**: `string`

Defined in: [joint-core/types/joint.d.ts:3467](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3467)

#### Inherited from

`PaperOptions.theme`

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

`PaperOptions.validateConnection`

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

`PaperOptions.validateEmbedding`

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

`PaperOptions.validateMagnet`

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

`PaperOptions.validateUnembedding`

***

### viewport?

> `optional` **viewport**: `null` \| `ViewportCallback`

Defined in: [joint-core/types/joint.d.ts:1428](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1428)

#### Inherited from

`PaperOptions.viewport`

***

### width?

> `optional` **width**: `Dimension`

Defined in: [joint-core/types/joint.d.ts:1369](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L1369)

#### Inherited from

`PaperOptions.width`
