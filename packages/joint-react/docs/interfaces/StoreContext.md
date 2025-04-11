[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / StoreContext

# Interface: StoreContext

Defined in: [joint-react/src/context/graph-store-context.tsx:3](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/graph-store-context.tsx#L3)

## Extends

- `Store`

## Properties

### destroy()

> `readonly` **destroy**: () => `void`

Defined in: [joint-react/src/data/create-store.ts:81](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L81)

Remove all listeners and cleanup the graph.

#### Returns

`void`

#### Inherited from

`Store.destroy`

***

### forceUpdate()

> `readonly` **forceUpdate**: () => `void`

Defined in: [joint-react/src/data/create-store.ts:85](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L85)

Force update the graph.

#### Returns

`void`

#### Inherited from

`Store.forceUpdate`

***

### getElement()

> `readonly` **getElement**: (`id`) => [`GraphElementBase`](GraphElementBase.md)

Defined in: [joint-react/src/data/create-store.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L69)

Get element by id

#### Parameters

##### id

`ID`

#### Returns

[`GraphElementBase`](GraphElementBase.md)

#### Inherited from

`Store.getElement`

***

### getElements()

> `readonly` **getElements**: () => [`CellMap`](../classes/CellMap.md)\<[`GraphElementBase`](GraphElementBase.md)\<`string`\>\>

Defined in: [joint-react/src/data/create-store.ts:65](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L65)

Get elements

#### Returns

[`CellMap`](../classes/CellMap.md)\<[`GraphElementBase`](GraphElementBase.md)\<`string`\>\>

#### Inherited from

`Store.getElements`

***

### getLink()

> `readonly` **getLink**: (`id`) => [`GraphLinkBase`](GraphLinkBase.md)

Defined in: [joint-react/src/data/create-store.ts:77](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L77)

Get link by id

#### Parameters

##### id

`ID`

#### Returns

[`GraphLinkBase`](GraphLinkBase.md)

#### Inherited from

`Store.getLink`

***

### getLinks()

> `readonly` **getLinks**: () => [`CellMap`](../classes/CellMap.md)\<[`GraphLinkBase`](GraphLinkBase.md)\<`string`\>\>

Defined in: [joint-react/src/data/create-store.ts:73](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L73)

Get links

#### Returns

[`CellMap`](../classes/CellMap.md)\<[`GraphLinkBase`](GraphLinkBase.md)\<`string`\>\>

#### Inherited from

`Store.getLinks`

***

### getPortElement()

> `readonly` **getPortElement**: (`cellId`, `portId`) => `undefined` \| [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

Defined in: [joint-react/src/data/create-store.ts:90](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L90)

Get port element

#### Parameters

##### cellId

`ID`

##### portId

`string`

#### Returns

`undefined` \| [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

#### Inherited from

`Store.getPortElement`

***

### graph

> `readonly` **graph**: `Graph`

Defined in: [joint-react/src/data/create-store.ts:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L57)

The JointJS graph instance.

#### Inherited from

`Store.graph`

***

### isLoaded

> `readonly` **isLoaded**: `boolean`

Defined in: [joint-react/src/context/graph-store-context.tsx:4](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/graph-store-context.tsx#L4)

***

### onRenderPorts

> `readonly` **onRenderPorts**: `OnPaperRenderPorts`

Defined in: [joint-react/src/data/create-store.ts:94](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L94)

Set port element

#### Inherited from

`Store.onRenderPorts`

***

### subscribe()

> `readonly` **subscribe**: (`onStoreChange`) => () => `void`

Defined in: [joint-react/src/data/create-store.ts:61](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L61)

Subscribes to the store changes.

#### Parameters

##### onStoreChange

() => `void`

#### Returns

`Function`

##### Returns

`void`

#### Inherited from

`Store.subscribe`

***

### subscribeToPorts()

> `readonly` **subscribeToPorts**: (`onPortChange`) => () => `void`

Defined in: [joint-react/src/data/create-store.ts:98](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L98)

Subscribes to port element changes.

#### Parameters

##### onPortChange

() => `void`

#### Returns

`Function`

##### Returns

`void`

#### Inherited from

`Store.subscribeToPorts`
