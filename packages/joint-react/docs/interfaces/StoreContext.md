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

Defined in: [joint-react/src/data/create-store.ts:79](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L79)

Remove all listeners and cleanup the graph.

#### Returns

`void`

#### Inherited from

`Store.destroy`

***

### forceUpdate()

> `readonly` **forceUpdate**: () => `void`

Defined in: [joint-react/src/data/create-store.ts:83](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L83)

Force update the graph.

#### Returns

`void`

#### Inherited from

`Store.forceUpdate`

***

### getElement()

> `readonly` **getElement**: (`id`) => [`GraphElementBase`](GraphElementBase.md)

Defined in: [joint-react/src/data/create-store.ts:67](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L67)

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

Defined in: [joint-react/src/data/create-store.ts:63](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L63)

Get elements

#### Returns

[`CellMap`](../classes/CellMap.md)\<[`GraphElementBase`](GraphElementBase.md)\<`string`\>\>

#### Inherited from

`Store.getElements`

***

### getLink()

> `readonly` **getLink**: (`id`) => [`GraphLinkBase`](GraphLinkBase.md)

Defined in: [joint-react/src/data/create-store.ts:75](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L75)

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

Defined in: [joint-react/src/data/create-store.ts:71](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L71)

Get links

#### Returns

[`CellMap`](../classes/CellMap.md)\<[`GraphLinkBase`](GraphLinkBase.md)\<`string`\>\>

#### Inherited from

`Store.getLinks`

***

### getPortElement()

> `readonly` **getPortElement**: (`portId`) => `undefined` \| [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

Defined in: [joint-react/src/data/create-store.ts:88](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L88)

Get port element

#### Parameters

##### portId

`string`

#### Returns

`undefined` \| [`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

#### Inherited from

`Store.getPortElement`

***

### graph

> `readonly` **graph**: `Graph`

Defined in: [joint-react/src/data/create-store.ts:55](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L55)

The JointJS graph instance.

#### Inherited from

`Store.graph`

***

### isLoaded

> `readonly` **isLoaded**: `boolean`

Defined in: [joint-react/src/context/graph-store-context.tsx:4](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/context/graph-store-context.tsx#L4)

***

### onRenderPort()

> `readonly` **onRenderPort**: (`portId`, `portElement`) => `void`

Defined in: [joint-react/src/data/create-store.ts:92](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L92)

Set port element

#### Parameters

##### portId

`string`

##### portElement

[`SVGElement`](https://developer.mozilla.org/docs/Web/API/SVGElement)

#### Returns

`void`

#### Inherited from

`Store.onRenderPort`

***

### subscribe()

> `readonly` **subscribe**: (`onStoreChange`) => () => `void`

Defined in: [joint-react/src/data/create-store.ts:59](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L59)

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

Defined in: [joint-react/src/data/create-store.ts:96](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/data/create-store.ts#L96)

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
