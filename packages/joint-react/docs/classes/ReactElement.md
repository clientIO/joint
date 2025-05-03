[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / ReactElement

# Class: ReactElement\<Attributes\>

Defined in: [joint-react/src/models/react-element.tsx:11](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L11)

A custom JointJS element that can render React components.

## Extends

- `Element`\<`dia.Element.Attributes` & `Attributes`\>

## Type Parameters

### Attributes

`Attributes` = `dia.Element.Attributes`

## Constructors

### new ReactElement()

> **new ReactElement**\<`Attributes`\>(`attributes`?, `opt`?): `ReactElement`\<`Attributes`\>

Defined in: [joint-core/types/joint.d.ts:444](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L444)

#### Parameters

##### attributes?

`_DeepPartial`\<`_DeepRequired`\<`Attributes` & `Attributes`\>\>

##### opt?

`ConstructorOptions`

#### Returns

`ReactElement`\<`Attributes`\>

#### Inherited from

`dia.Element< dia.Element.Attributes & Attributes >.constructor`

## Methods

### addPort()

> **addPort**(`port`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:664](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L664)

#### Parameters

##### port

`Port`

##### opt?

`ModelSetOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.addPort`

***

### addPorts()

> **addPorts**(`ports`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:666](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L666)

#### Parameters

##### ports

`Port`[]

##### opt?

`ModelSetOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.addPorts`

***

### addTo()

> **addTo**(`graph`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:505](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L505)

#### Parameters

##### graph

`Graph`

##### opt?

`Options`

#### Returns

`this`

#### Inherited from

`dia.Element.addTo`

***

### angle()

> **angle**(): `number`

Defined in: [joint-core/types/joint.d.ts:653](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L653)

#### Returns

`number`

#### Inherited from

`dia.Element.angle`

***

### attr()

#### Call Signature

> **attr**(`key`?): `any`

Defined in: [joint-core/types/joint.d.ts:483](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L483)

##### Parameters

###### key?

`Path`

##### Returns

`any`

##### Inherited from

`dia.Element.attr`

#### Call Signature

> **attr**(`object`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:484](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L484)

##### Parameters

###### object

`Selectors`

###### opt?

`Options`

##### Returns

`this`

##### Inherited from

`dia.Element.attr`

#### Call Signature

> **attr**(`key`, `value`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:485](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L485)

##### Parameters

###### key

`Path`

###### value

`any`

###### opt?

`Options`

##### Returns

`this`

##### Inherited from

`dia.Element.attr`

***

### bind()

#### Call Signature

> **bind**(`eventName`, `callback`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3243](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3243)

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

`dia.Element.bind`

#### Call Signature

> **bind**(`eventMap`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3244](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3244)

##### Parameters

###### eventMap

`EventMap`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Element.bind`

***

### canEmbed()

> **canEmbed**(`cell`): `boolean`

Defined in: [joint-core/types/joint.d.ts:503](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L503)

#### Parameters

##### cell

`Cell`\<`Attributes`, `ModelSetOptions`\> | `Cell`\<`Attributes`, `ModelSetOptions`\>[]

#### Returns

`boolean`

#### Inherited from

`dia.Element.canEmbed`

***

### changedAttributes()

> **changedAttributes**(`attributes`?): `false` \| [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

Defined in: [joint-core/types/joint.d.ts:3329](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3329)

Return an object containing all the attributes that have changed, or
false if there are no changed attributes. Useful for determining what
parts of a view need to be updated and/or what attributes need to be
persisted to the server. Unset attributes will be set to undefined.
You can also pass an attributes object to diff against the model,
determining if there *would be* a change.

#### Parameters

##### attributes?

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

#### Returns

`false` \| [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

#### Inherited from

`dia.Element.changedAttributes`

***

### clear()

> **clear**(`options`?): `this`

Defined in: [joint-core/types/joint.d.ts:3330](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3330)

#### Parameters

##### options?

`Silenceable`

#### Returns

`this`

#### Inherited from

`dia.Element.clear`

***

### clone()

#### Call Signature

> **clone**(): `this`

Defined in: [joint-core/types/joint.d.ts:487](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L487)

##### Returns

`this`

##### Inherited from

`dia.Element.clone`

#### Call Signature

> **clone**(`opt`): `this`

Defined in: [joint-core/types/joint.d.ts:488](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L488)

##### Parameters

###### opt

`EmbeddableOptions`\<`false`\>

##### Returns

`this`

##### Inherited from

`dia.Element.clone`

#### Call Signature

> **clone**(`opt`): `Cell`\<`Attributes`, `ModelSetOptions`\>[]

Defined in: [joint-core/types/joint.d.ts:489](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L489)

##### Parameters

###### opt

`EmbeddableOptions`\<`true`\>

##### Returns

`Cell`\<`Attributes`, `ModelSetOptions`\>[]

##### Inherited from

`dia.Element.clone`

***

### defaults()

> **defaults**(): `Attributes` & `Attributes`

Defined in: [joint-react/src/models/react-element.tsx:18](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L18)

Sets the default attributes for the ReactElement.

#### Returns

`Attributes` & `Attributes`

The default attributes.

#### Overrides

`dia.Element.defaults`

***

### embed()

> **embed**(`cell`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:499](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L499)

#### Parameters

##### cell

`Cell`\<`Attributes`, `ModelSetOptions`\> | `Cell`\<`Attributes`, `ModelSetOptions`\>[]

##### opt?

`EmbedOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.embed`

***

### escape()

> **escape**(`attribute`): `string`

Defined in: [joint-core/types/joint.d.ts:3332](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3332)

#### Parameters

##### attribute

`_StringKey`\<`Attributes` & `Attributes`\>

#### Returns

`string`

#### Inherited from

`dia.Element.escape`

***

### findView()

> **findView**(`paper`): `CellView`

Defined in: [joint-core/types/joint.d.ts:507](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L507)

#### Parameters

##### paper

`Paper`

#### Returns

`CellView`

#### Inherited from

`dia.Element.findView`

***

### fitEmbeds()

> **fitEmbeds**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:657](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L657)

#### Parameters

##### opt?

`FitToChildrenOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.fitEmbeds`

***

### fitParent()

> **fitParent**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:660](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L660)

#### Parameters

##### opt?

`FitParentOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.fitParent`

***

### fitToChildren()

> **fitToChildren**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:658](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L658)

#### Parameters

##### opt?

`FitToChildrenOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.fitToChildren`

***

### get()

> **get**\<`A`\>(`attributeName`): `undefined` \| `Attributes` & `Attributes`\[`A`\]

Defined in: [joint-core/types/joint.d.ts:3308](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3308)

For strongly-typed access to attributes, use the `get` method only privately in public getter properties.

#### Type Parameters

##### A

`A` *extends* `string`

#### Parameters

##### attributeName

`A`

#### Returns

`undefined` \| `Attributes` & `Attributes`\[`A`\]

#### Example

```ts
get name(): string {
   return super.get("name");
}
```

#### Inherited from

`dia.Element.get`

***

### getAbsolutePointFromRelative()

#### Call Signature

> **getAbsolutePointFromRelative**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:533](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L533)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Element.getAbsolutePointFromRelative`

#### Call Signature

> **getAbsolutePointFromRelative**(`relativePoint`): `Point`

Defined in: [joint-core/types/joint.d.ts:534](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L534)

##### Parameters

###### relativePoint

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Element.getAbsolutePointFromRelative`

***

### getAncestors()

> **getAncestors**(): `Cell`\<`Attributes`, `ModelSetOptions`\>[]

Defined in: [joint-core/types/joint.d.ts:469](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L469)

#### Returns

`Cell`\<`Attributes`, `ModelSetOptions`\>[]

#### Inherited from

`dia.Element.getAncestors`

***

### getBBox()

> **getBBox**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:662](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L662)

#### Parameters

##### opt?

`BBoxOptions`

#### Returns

`Rect`

#### Inherited from

`dia.Element.getBBox`

***

### getChangeFlag()

> **getChangeFlag**(`attributes`): `number`

Defined in: [joint-core/types/joint.d.ts:536](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L536)

#### Parameters

##### attributes

#### Returns

`number`

#### Inherited from

`dia.Element.getChangeFlag`

***

### getEmbeddedCells()

> **getEmbeddedCells**(`opt`?): `Cell`\<`Attributes`, `ModelSetOptions`\>[]

Defined in: [joint-core/types/joint.d.ts:471](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L471)

#### Parameters

##### opt?

`GetEmbeddedCellsOptions`

#### Returns

`Cell`\<`Attributes`, `ModelSetOptions`\>[]

#### Inherited from

`dia.Element.getEmbeddedCells`

***

### getGroupPorts()

> **getGroupPorts**(`groupName`): `Port`[]

Defined in: [joint-core/types/joint.d.ts:681](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L681)

#### Parameters

##### groupName

`string`

#### Returns

`Port`[]

#### Inherited from

`dia.Element.getGroupPorts`

***

### getParentCell()

> **getParentCell**(): `null` \| `Cell`\<`Attributes`, `ModelSetOptions`\>

Defined in: [joint-core/types/joint.d.ts:467](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L467)

#### Returns

`null` \| `Cell`\<`Attributes`, `ModelSetOptions`\>

#### Inherited from

`dia.Element.getParentCell`

***

### getPointFromConnectedLink()

> **getPointFromConnectedLink**(`link`, `endType`): `Point`

Defined in: [joint-core/types/joint.d.ts:525](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L525)

#### Parameters

##### link

`Link`

##### endType

`LinkEnd`

#### Returns

`Point`

#### Inherited from

`dia.Element.getPointFromConnectedLink`

***

### getPointRotatedAroundCenter()

#### Call Signature

> **getPointRotatedAroundCenter**(`angle`, `x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:527](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L527)

##### Parameters

###### angle

`number`

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Element.getPointRotatedAroundCenter`

#### Call Signature

> **getPointRotatedAroundCenter**(`angle`, `point`): `Point`

Defined in: [joint-core/types/joint.d.ts:528](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L528)

##### Parameters

###### angle

`number`

###### point

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Element.getPointRotatedAroundCenter`

***

### getPort()

> **getPort**(`id`): `Port`

Defined in: [joint-core/types/joint.d.ts:683](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L683)

#### Parameters

##### id

`string`

#### Returns

`Port`

#### Inherited from

`dia.Element.getPort`

***

### getPortGroupNames()

> **getPortGroupNames**(): `string`[]

Defined in: [joint-core/types/joint.d.ts:691](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L691)

#### Returns

`string`[]

#### Inherited from

`dia.Element.getPortGroupNames`

***

### getPortIndex()

> **getPortIndex**(`port`): `number`

Defined in: [joint-core/types/joint.d.ts:689](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L689)

#### Parameters

##### port

`string` | `Port`

#### Returns

`number`

#### Inherited from

`dia.Element.getPortIndex`

***

### getPorts()

> **getPorts**(): `Port`[]

Defined in: [joint-core/types/joint.d.ts:679](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L679)

#### Returns

`Port`[]

#### Inherited from

`dia.Element.getPorts`

***

### getPortsPositions()

> **getPortsPositions**(`groupName`): `object`

Defined in: [joint-core/types/joint.d.ts:685](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L685)

#### Parameters

##### groupName

`string`

#### Returns

`object`

#### Inherited from

`dia.Element.getPortsPositions`

***

### getPortsRects()

> **getPortsRects**(`groupName`): `object`

Defined in: [joint-core/types/joint.d.ts:687](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L687)

#### Parameters

##### groupName

`string`

#### Returns

`object`

#### Inherited from

`dia.Element.getPortsRects`

***

### getRelativePointFromAbsolute()

#### Call Signature

> **getRelativePointFromAbsolute**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:530](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L530)

##### Parameters

###### x

`number`

###### y

`number`

##### Returns

`Point`

##### Inherited from

`dia.Element.getRelativePointFromAbsolute`

#### Call Signature

> **getRelativePointFromAbsolute**(`absolutePoint`): `Point`

Defined in: [joint-core/types/joint.d.ts:531](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L531)

##### Parameters

###### absolutePoint

`PlainPoint`

##### Returns

`Point`

##### Inherited from

`dia.Element.getRelativePointFromAbsolute`

***

### getTransitions()

> **getTransitions**(): `string`[]

Defined in: [joint-core/types/joint.d.ts:495](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L495)

#### Returns

`string`[]

#### Inherited from

`dia.Element.getTransitions`

***

### has()

> **has**(`attribute`): `boolean`

Defined in: [joint-core/types/joint.d.ts:3333](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3333)

#### Parameters

##### attribute

`_StringKey`\<`Attributes` & `Attributes`\>

#### Returns

`boolean`

#### Inherited from

`dia.Element.has`

***

### hasChanged()

> **hasChanged**(`attribute`?): `boolean`

Defined in: [joint-core/types/joint.d.ts:3334](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3334)

#### Parameters

##### attribute?

`_StringKey`\<`Attributes` & `Attributes`\>

#### Returns

`boolean`

#### Inherited from

`dia.Element.hasChanged`

***

### hasPort()

> **hasPort**(`id`): `boolean`

Defined in: [joint-core/types/joint.d.ts:677](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L677)

#### Parameters

##### id

`string`

#### Returns

`boolean`

#### Inherited from

`dia.Element.hasPort`

***

### hasPorts()

> **hasPorts**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:675](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L675)

#### Returns

`boolean`

#### Inherited from

`dia.Element.hasPorts`

***

### initialize()

> **initialize**(`attributes`?, `options`?): `void`

Defined in: [joint-core/types/joint.d.ts:3298](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3298)

#### Parameters

##### attributes?

`Attributes` & `Attributes`

##### options?

`any`

#### Returns

`void`

#### Inherited from

`dia.Element.initialize`

***

### insertPort()

> **insertPort**(`before`, `port`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:668](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L668)

#### Parameters

##### before

`string` | `number` | `Port`

##### port

`Port`

##### opt?

`ModelSetOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.insertPort`

***

### isElement()

> **isElement**(): `this is Element<Attributes, ModelSetOptions>`

Defined in: [joint-core/types/joint.d.ts:511](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L511)

#### Returns

`this is Element<Attributes, ModelSetOptions>`

#### Inherited from

`dia.Element.isElement`

***

### isEmbedded()

> **isEmbedded**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:475](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L475)

#### Returns

`boolean`

#### Inherited from

`dia.Element.isEmbedded`

***

### isEmbeddedIn()

> **isEmbeddedIn**(`cell`, `opt`?): `boolean`

Defined in: [joint-core/types/joint.d.ts:473](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L473)

#### Parameters

##### cell

`Cell`

##### opt?

`EmbeddableOptions`\<`boolean`\>

#### Returns

`boolean`

#### Inherited from

`dia.Element.isEmbeddedIn`

***

### isLink()

> **isLink**(): `this is Link<Attributes, ModelSetOptions>`

Defined in: [joint-core/types/joint.d.ts:509](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L509)

#### Returns

`this is Link<Attributes, ModelSetOptions>`

#### Inherited from

`dia.Element.isLink`

***

### isValid()

> **isValid**(`options`?): `boolean`

Defined in: [joint-core/types/joint.d.ts:3335](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3335)

#### Parameters

##### options?

`any`

#### Returns

`boolean`

#### Inherited from

`dia.Element.isValid`

***

### listenTo()

#### Call Signature

> **listenTo**(`object`, `events`, `callback`): `this`

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

`dia.Element.listenTo`

#### Call Signature

> **listenTo**(`object`, `eventMap`): `this`

Defined in: [joint-core/types/joint.d.ts:3250](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3250)

##### Parameters

###### object

`any`

###### eventMap

`EventMap`

##### Returns

`this`

##### Inherited from

`dia.Element.listenTo`

***

### listenToOnce()

#### Call Signature

> **listenToOnce**(`object`, `events`, `callback`): `this`

Defined in: [joint-core/types/joint.d.ts:3251](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3251)

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

`dia.Element.listenToOnce`

#### Call Signature

> **listenToOnce**(`object`, `eventMap`): `this`

Defined in: [joint-core/types/joint.d.ts:3252](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3252)

##### Parameters

###### object

`any`

###### eventMap

`EventMap`

##### Returns

`this`

##### Inherited from

`dia.Element.listenToOnce`

***

### off()

> **off**(`eventName`?, `callback`?, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3241](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3241)

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

`dia.Element.off`

***

### on()

#### Call Signature

> **on**(`eventName`, `callback`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3239](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3239)

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

`dia.Element.on`

#### Call Signature

> **on**(`eventMap`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3240](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3240)

##### Parameters

###### eventMap

`EventMap`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Element.on`

***

### once()

#### Call Signature

> **once**(`events`, `callback`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3247](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3247)

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

`dia.Element.once`

#### Call Signature

> **once**(`eventMap`, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3248](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3248)

##### Parameters

###### eventMap

`EventMap`

###### context?

`any`

##### Returns

`this`

##### Inherited from

`dia.Element.once`

***

### parent()

> **parent**(): `string`

Defined in: [joint-core/types/joint.d.ts:465](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L465)

#### Returns

`string`

#### Inherited from

`dia.Element.parent`

***

### portProp()

#### Call Signature

> **portProp**(`portId`, `path`): `any`

Defined in: [joint-core/types/joint.d.ts:693](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L693)

##### Parameters

###### portId

`string`

###### path

`Path`

##### Returns

`any`

##### Inherited from

`dia.Element.portProp`

#### Call Signature

> **portProp**(`portId`, `path`, `value`?, `opt`?): `Element`

Defined in: [joint-core/types/joint.d.ts:695](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L695)

##### Parameters

###### portId

`string`

###### path

`Path`

###### value?

`any`

###### opt?

`ModelSetOptions`

##### Returns

`Element`

##### Inherited from

`dia.Element.portProp`

***

### position()

#### Call Signature

> **position**(`opt`?): `Point`

Defined in: [joint-core/types/joint.d.ts:642](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L642)

##### Parameters

###### opt?

`PositionOptions`

##### Returns

`Point`

##### Inherited from

`dia.Element.position`

#### Call Signature

> **position**(`x`, `y`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:643](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L643)

##### Parameters

###### x

`number`

###### y

`number`

###### opt?

`PositionOptions`

##### Returns

`this`

##### Inherited from

`dia.Element.position`

***

### preinitialize()

> **preinitialize**(`attributes`?, `options`?): `void`

Defined in: [joint-core/types/joint.d.ts:3295](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3295)

For use with models as ES classes. If you define a preinitialize
method, it will be invoked when the Model is first created, before
any instantiation logic is run for the Model.

#### Parameters

##### attributes?

`Attributes` & `Attributes`

##### options?

`any`

#### Returns

`void`

#### Inherited from

`dia.Element.preinitialize`

***

### previous()

> **previous**\<`A`\>(`attribute`): `undefined` \| `null` \| `Attributes` & `Attributes`\[`A`\]

Defined in: [joint-core/types/joint.d.ts:3336](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3336)

#### Type Parameters

##### A

`A` *extends* `string`

#### Parameters

##### attribute

`A`

#### Returns

`undefined` \| `null` \| `Attributes` & `Attributes`\[`A`\]

#### Inherited from

`dia.Element.previous`

***

### previousAttributes()

> **previousAttributes**(): [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

Defined in: [joint-core/types/joint.d.ts:3337](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3337)

#### Returns

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

#### Inherited from

`dia.Element.previousAttributes`

***

### prop()

#### Call Signature

> **prop**(`key`): `any`

Defined in: [joint-core/types/joint.d.ts:477](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L477)

##### Parameters

###### key

`Path`

##### Returns

`any`

##### Inherited from

`dia.Element.prop`

#### Call Signature

> **prop**(`object`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:478](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L478)

##### Parameters

###### object

`_DeepPartial`\<`_DeepRequired`\<`Attributes` & `Attributes`\>\>

###### opt?

`Options`

##### Returns

`this`

##### Inherited from

`dia.Element.prop`

#### Call Signature

> **prop**(`key`, `value`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:479](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L479)

##### Parameters

###### key

`Path`

###### value

`any`

###### opt?

`Options`

##### Returns

`this`

##### Inherited from

`dia.Element.prop`

***

### remove()

> **remove**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:459](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L459)

#### Parameters

##### opt?

`DisconnectableOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.remove`

***

### removeAttr()

> **removeAttr**(`path`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:491](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L491)

#### Parameters

##### path

`Path`

##### opt?

`Options`

#### Returns

`this`

#### Inherited from

`dia.Element.removeAttr`

***

### removePort()

> **removePort**(`port`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:670](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L670)

#### Parameters

##### port

`string` | `Port`

##### opt?

`ModelSetOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.removePort`

***

### removePorts()

#### Call Signature

> **removePorts**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:672](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L672)

##### Parameters

###### opt?

`ModelSetOptions`

##### Returns

`this`

##### Inherited from

`dia.Element.removePorts`

#### Call Signature

> **removePorts**(`ports`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:673](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L673)

##### Parameters

###### ports

(`string` \| `Port`)[]

###### opt?

`ModelSetOptions`

##### Returns

`this`

##### Inherited from

`dia.Element.removePorts`

***

### removeProp()

> **removeProp**(`path`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:481](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L481)

#### Parameters

##### path

`Path`

##### opt?

`Options`

#### Returns

`this`

#### Inherited from

`dia.Element.removeProp`

***

### resize()

> **resize**(`width`, `height`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:649](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L649)

#### Parameters

##### width

`number`

##### height

`number`

##### opt?

`ResizeOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.resize`

***

### rotate()

> **rotate**(`deg`, `absolute`?, `origin`?, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:651](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L651)

#### Parameters

##### deg

`number`

##### absolute?

`boolean`

##### origin?

`PlainPoint`

##### opt?

#### Returns

`this`

#### Inherited from

`dia.Element.rotate`

***

### scale()

> **scale**(`scaleX`, `scaleY`, `origin`?, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:655](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L655)

#### Parameters

##### scaleX

`number`

##### scaleY

`number`

##### origin?

`PlainPoint`

##### opt?

#### Returns

`this`

#### Inherited from

`dia.Element.scale`

***

### set()

#### Call Signature

> **set**\<`A`\>(`attributeName`, `value`?, `options`?): `this`

Defined in: [joint-core/types/joint.d.ts:3317](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3317)

For strongly-typed assignment of attributes, use the `set` method only privately in public setter properties.

##### Type Parameters

###### A

`A` *extends* `string`

##### Parameters

###### attributeName

`A`

###### value?

`Attributes` & `Attributes`\[`A`\]

###### options?

`ModelSetOptions`

##### Returns

`this`

##### Example

```ts
set name(value: string) {
   super.set("name", value);
}
```

##### Inherited from

`dia.Element.set`

#### Call Signature

> **set**(`attributeName`, `options`?): `this`

Defined in: [joint-core/types/joint.d.ts:3318](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3318)

For strongly-typed assignment of attributes, use the `set` method only privately in public setter properties.

##### Parameters

###### attributeName

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

###### options?

`ModelSetOptions`

##### Returns

`this`

##### Example

```ts
set name(value: string) {
   super.set("name", value);
}
```

##### Inherited from

`dia.Element.set`

#### Call Signature

> **set**\<`A`\>(`attributeName`, `value`?, `options`?): `this`

Defined in: [joint-core/types/joint.d.ts:3319](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3319)

For strongly-typed assignment of attributes, use the `set` method only privately in public setter properties.

##### Type Parameters

###### A

`A` *extends* `string`

##### Parameters

###### attributeName

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\> | `A`

###### value?

`ModelSetOptions` | `Attributes` & `Attributes`\[`A`\]

###### options?

`ModelSetOptions`

##### Returns

`this`

##### Example

```ts
set name(value: string) {
   super.set("name", value);
}
```

##### Inherited from

`dia.Element.set`

***

### size()

#### Call Signature

> **size**(): `Size`

Defined in: [joint-core/types/joint.d.ts:645](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L645)

##### Returns

`Size`

##### Inherited from

`dia.Element.size`

#### Call Signature

> **size**(`size`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:646](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L646)

##### Parameters

###### size

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Size`\>

###### opt?

`ResizeOptions`

##### Returns

`this`

##### Inherited from

`dia.Element.size`

#### Call Signature

> **size**(`width`, `height`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:647](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L647)

##### Parameters

###### width

`number`

###### height

`number`

###### opt?

`ResizeOptions`

##### Returns

`this`

##### Inherited from

`dia.Element.size`

***

### startBatch()

> **startBatch**(`name`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:513](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L513)

#### Parameters

##### name

`string`

##### opt?

`Options`

#### Returns

`this`

#### Inherited from

`dia.Element.startBatch`

***

### stopBatch()

> **stopBatch**(`name`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:515](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L515)

#### Parameters

##### name

`string`

##### opt?

`Options`

#### Returns

`this`

#### Inherited from

`dia.Element.stopBatch`

***

### stopListening()

> **stopListening**(`object`?, `events`?, `callback`?): `this`

Defined in: [joint-core/types/joint.d.ts:3253](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3253)

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

`dia.Element.stopListening`

***

### stopTransitions()

> **stopTransitions**(`path`?, `delim`?): `this`

Defined in: [joint-core/types/joint.d.ts:497](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L497)

#### Parameters

##### path?

`string`

##### delim?

`string`

#### Returns

`this`

#### Inherited from

`dia.Element.stopTransitions`

***

### toBack()

> **toBack**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:463](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L463)

#### Parameters

##### opt?

`ToFrontAndBackOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.toBack`

***

### toFront()

> **toFront**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:461](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L461)

#### Parameters

##### opt?

`ToFrontAndBackOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.toFront`

***

### toJSON()

> **toJSON**(`opt`?): `JSON`\<`any`, `Attributes` & `Attributes`\>

Defined in: [joint-core/types/joint.d.ts:457](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L457)

#### Parameters

##### opt?

`ExportOptions`

#### Returns

`JSON`\<`any`, `Attributes` & `Attributes`\>

#### Inherited from

`dia.Element.toJSON`

***

### transition()

> **transition**(`path`, `value`?, `opt`?, `delim`?): `number`

Defined in: [joint-core/types/joint.d.ts:493](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L493)

#### Parameters

##### path

`string`

##### value?

`any`

##### opt?

`TransitionOptions`

##### delim?

`string`

#### Returns

`number`

#### Inherited from

`dia.Element.transition`

***

### translate()

> **translate**(`tx`, `ty`?, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:640](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L640)

#### Parameters

##### tx

`number`

##### ty?

`number`

##### opt?

`TranslateOptions`

#### Returns

`this`

#### Inherited from

`dia.Element.translate`

***

### trigger()

> **trigger**(`eventName`, ...`args`): `this`

Defined in: [joint-core/types/joint.d.ts:3242](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3242)

#### Parameters

##### eventName

`string`

##### args

...`any`[]

#### Returns

`this`

#### Inherited from

`dia.Element.trigger`

***

### unbind()

> **unbind**(`eventName`?, `callback`?, `context`?): `this`

Defined in: [joint-core/types/joint.d.ts:3245](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3245)

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

`dia.Element.unbind`

***

### unembed()

> **unembed**(`cell`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:501](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L501)

#### Parameters

##### cell

`Cell`\<`Attributes`, `ModelSetOptions`\> | `Cell`\<`Attributes`, `ModelSetOptions`\>[]

##### opt?

`Options`

#### Returns

`this`

#### Inherited from

`dia.Element.unembed`

***

### unset()

> **unset**(`attribute`, `options`?): `this`

Defined in: [joint-core/types/joint.d.ts:3338](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3338)

#### Parameters

##### attribute

`_StringKey`\<`Attributes` & `Attributes`\>

##### options?

`Silenceable`

#### Returns

`this`

#### Inherited from

`dia.Element.unset`

***

### validate()

> **validate**(`attributes`, `options`?): `any`

Defined in: [joint-core/types/joint.d.ts:3339](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3339)

#### Parameters

##### attributes

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

##### options?

`any`

#### Returns

`any`

#### Inherited from

`dia.Element.validate`

***

### z()

> **z**(): `number`

Defined in: [joint-core/types/joint.d.ts:519](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L519)

#### Returns

`number`

#### Inherited from

`dia.Element.z`

***

### define()

> `static` **define**(`type`, `defaults`?, `protoProps`?, `staticProps`?): `Constructor`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>

Defined in: [joint-core/types/joint.d.ts:699](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L699)

#### Parameters

##### type

`string`

##### defaults?

`any`

##### protoProps?

`any`

##### staticProps?

`any`

#### Returns

`Constructor`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>

#### Inherited from

`dia.Element.define`

***

### extend()

> `static` **extend**(`properties`, `classProperties`?): `any`

Defined in: [joint-core/types/joint.d.ts:3268](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3268)

Do not use, prefer TypeScript's extend functionality.

#### Parameters

##### properties

`any`

##### classProperties?

`any`

#### Returns

`any`

#### Inherited from

`dia.Element.extend`

## Properties

### attributes

> **attributes**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

Defined in: [joint-core/types/joint.d.ts:3270](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3270)

#### Inherited from

`dia.Element.attributes`

***

### changed

> **changed**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

Defined in: [joint-core/types/joint.d.ts:3271](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3271)

#### Inherited from

`dia.Element.changed`

***

### cid

> **cid**: `string`

Defined in: [joint-core/types/joint.d.ts:3273](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3273)

#### Inherited from

`dia.Element.cid`

***

### cidPrefix

> **cidPrefix**: `string`

Defined in: [joint-core/types/joint.d.ts:3272](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3272)

#### Inherited from

`dia.Element.cidPrefix`

***

### collection

> **collection**: `Collection`\<`ReactElement`\<`Attributes`\>\>

Defined in: [joint-core/types/joint.d.ts:3274](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3274)

#### Inherited from

`dia.Element.collection`

***

### graph

> **graph**: `Graph`

Defined in: [joint-core/types/joint.d.ts:447](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L447)

#### Inherited from

`dia.Element.graph`

***

### id

> **id**: `ID`

Defined in: [joint-core/types/joint.d.ts:446](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L446)

#### Inherited from

`dia.Element.id`

***

### idAttribute

> **idAttribute**: `string`

Defined in: [joint-core/types/joint.d.ts:3287](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3287)

#### Inherited from

`dia.Element.idAttribute`

***

### markup

> **markup**: `string` \| `MarkupJSON` = `elementMarkup`

Defined in: [joint-react/src/models/react-element.tsx:32](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L32)

#### Overrides

`dia.Element.markup`

***

### useCSSSelectors

> **useCSSSelectors**: `boolean`

Defined in: [joint-core/types/joint.d.ts:449](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L449)

#### Inherited from

`dia.Element.useCSSSelectors`

***

### validationError

> **validationError**: `any`

Defined in: [joint-core/types/joint.d.ts:3288](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3288)

#### Inherited from

`dia.Element.validationError`

***

### attributes

> `static` **attributes**: `object`

Defined in: [joint-core/types/joint.d.ts:701](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L701)

#### Index Signature

\[`attributeName`: `string`\]: `PresentationAttributeDefinition`\<`ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>\>

#### Inherited from

`dia.Element.attributes`
