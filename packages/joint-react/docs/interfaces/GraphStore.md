[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / GraphStore

# Interface: GraphStore

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:45](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L45)

## Properties

### getElement()

> `readonly` **getElement**: (`id`) => [`GraphElementBase`](GraphElementBase.md)

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:61](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L61)

Get element by id

#### Parameters

##### id

`ID`

#### Returns

[`GraphElementBase`](GraphElementBase.md)

***

### getElements()

> `readonly` **getElements**: () => [`GraphElements`](../classes/GraphElements.md)\<[`GraphElementBase`](GraphElementBase.md)\<`string`\>\>

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:57](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L57)

Get elements

#### Returns

[`GraphElements`](../classes/GraphElements.md)\<[`GraphElementBase`](GraphElementBase.md)\<`string`\>\>

***

### getLink()

> `readonly` **getLink**: (`id`) => [`GraphLink`](GraphLink.md)

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:69](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L69)

Get link by id

#### Parameters

##### id

`ID`

#### Returns

[`GraphLink`](GraphLink.md)

***

### getLinks()

> `readonly` **getLinks**: () => [`GraphLinks`](../classes/GraphLinks.md)

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:65](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L65)

Get links

#### Returns

[`GraphLinks`](../classes/GraphLinks.md)

***

### graph

> `readonly` **graph**: `Graph`

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:49](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L49)

The JointJS graph instance.

***

### subscribe()

> `readonly` **subscribe**: (`onStoreChange`) => () => `void`

Defined in: [joint-react/src/hooks/use-create-graph-store.ts:53](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-create-graph-store.ts#L53)

Subscribes to the store changes.

#### Parameters

##### onStoreChange

() => `void`

#### Returns

`Function`

##### Returns

`void`
