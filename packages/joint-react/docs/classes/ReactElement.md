[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / ReactElement

# Class: ReactElement\<Attributes\>

Defined in: [joint-react/src/models/react-element.tsx:10](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L10)

A custom JointJS element that can render React components.

## Extends

- `Element`\<`dia.Element.Attributes` & `Attributes`\>

## Type Parameters

### Attributes

`Attributes` = `dia.Element.Attributes`

## Constructors

### new ReactElement()

> **new ReactElement**\<`Attributes`\>(`attributes`?, `opt`?): `ReactElement`\<`Attributes`\>

Defined in: [joint-core/types/joint.d.ts:443](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L443)

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

Defined in: [joint-core/types/joint.d.ts:644](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L644)

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

Defined in: [joint-core/types/joint.d.ts:646](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L646)

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

Defined in: [joint-core/types/joint.d.ts:504](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L504)

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

Defined in: [joint-core/types/joint.d.ts:633](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L633)

#### Returns

`number`

#### Inherited from

`dia.Element.angle`

***

### attr()

#### Call Signature

> **attr**(`key`?): `any`

Defined in: [joint-core/types/joint.d.ts:482](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L482)

##### Parameters

###### key?

`Path`

##### Returns

`any`

##### Inherited from

`dia.Element.attr`

#### Call Signature

> **attr**(`object`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:483](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L483)

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

Defined in: [joint-core/types/joint.d.ts:484](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L484)

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

Defined in: [joint-core/types/joint.d.ts:3205](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3205)

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

Defined in: [joint-core/types/joint.d.ts:3206](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3206)

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

Defined in: [joint-core/types/joint.d.ts:502](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L502)

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

Defined in: [joint-core/types/joint.d.ts:3291](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3291)

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

Defined in: [joint-core/types/joint.d.ts:3292](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3292)

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

Defined in: [joint-core/types/joint.d.ts:486](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L486)

##### Returns

`this`

##### Inherited from

`dia.Element.clone`

#### Call Signature

> **clone**(`opt`): `this`

Defined in: [joint-core/types/joint.d.ts:487](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L487)

##### Parameters

###### opt

`EmbeddableOptions`\<`false`\>

##### Returns

`this`

##### Inherited from

`dia.Element.clone`

#### Call Signature

> **clone**(`opt`): `Cell`\<`Attributes`, `ModelSetOptions`\>[]

Defined in: [joint-core/types/joint.d.ts:488](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L488)

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

Defined in: [joint-react/src/models/react-element.tsx:17](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L17)

Sets the default attributes for the ReactElement.

#### Returns

`Attributes` & `Attributes`

The default attributes.

#### Overrides

`dia.Element.defaults`

***

### embed()

> **embed**(`cell`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:498](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L498)

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

Defined in: [joint-core/types/joint.d.ts:3294](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3294)

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

Defined in: [joint-core/types/joint.d.ts:506](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L506)

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

Defined in: [joint-core/types/joint.d.ts:637](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L637)

#### Parameters

##### opt?

###### deep?

`boolean`

###### expandOnly?

`boolean`

###### padding?

`Padding`

###### shrinkOnly?

`boolean`

#### Returns

`this`

#### Inherited from

`dia.Element.fitEmbeds`

***

### fitParent()

> **fitParent**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:640](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L640)

#### Parameters

##### opt?

###### deep?

`boolean`

###### expandOnly?

`boolean`

###### padding?

`Padding`

###### shrinkOnly?

`boolean`

###### terminator?

`ID` \| `Cell`\<`Attributes`, `ModelSetOptions`\>

#### Returns

`this`

#### Inherited from

`dia.Element.fitParent`

***

### fitToChildren()

> **fitToChildren**(`opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:638](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L638)

#### Parameters

##### opt?

###### deep?

`boolean`

###### expandOnly?

`boolean`

###### padding?

`Padding`

###### shrinkOnly?

`boolean`

#### Returns

`this`

#### Inherited from

`dia.Element.fitToChildren`

***

### get()

> **get**\<`A`\>(`attributeName`): `undefined` \| `Attributes` & `Attributes`\[`A`\]

Defined in: [joint-core/types/joint.d.ts:3270](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3270)

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

Defined in: [joint-core/types/joint.d.ts:532](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L532)

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

Defined in: [joint-core/types/joint.d.ts:533](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L533)

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

Defined in: [joint-core/types/joint.d.ts:468](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L468)

#### Returns

`Cell`\<`Attributes`, `ModelSetOptions`\>[]

#### Inherited from

`dia.Element.getAncestors`

***

### getBBox()

> **getBBox**(`opt`?): `Rect`

Defined in: [joint-core/types/joint.d.ts:642](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L642)

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

Defined in: [joint-core/types/joint.d.ts:535](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L535)

#### Parameters

##### attributes

#### Returns

`number`

#### Inherited from

`dia.Element.getChangeFlag`

***

### getEmbeddedCells()

> **getEmbeddedCells**(`opt`?): `Cell`\<`Attributes`, `ModelSetOptions`\>[]

Defined in: [joint-core/types/joint.d.ts:470](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L470)

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

Defined in: [joint-core/types/joint.d.ts:661](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L661)

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

Defined in: [joint-core/types/joint.d.ts:466](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L466)

#### Returns

`null` \| `Cell`\<`Attributes`, `ModelSetOptions`\>

#### Inherited from

`dia.Element.getParentCell`

***

### getPointFromConnectedLink()

> **getPointFromConnectedLink**(`link`, `endType`): `Point`

Defined in: [joint-core/types/joint.d.ts:524](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L524)

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

Defined in: [joint-core/types/joint.d.ts:526](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L526)

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

Defined in: [joint-core/types/joint.d.ts:527](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L527)

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

Defined in: [joint-core/types/joint.d.ts:663](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L663)

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

Defined in: [joint-core/types/joint.d.ts:669](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L669)

#### Returns

`string`[]

#### Inherited from

`dia.Element.getPortGroupNames`

***

### getPortIndex()

> **getPortIndex**(`port`): `number`

Defined in: [joint-core/types/joint.d.ts:667](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L667)

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

Defined in: [joint-core/types/joint.d.ts:659](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L659)

#### Returns

`Port`[]

#### Inherited from

`dia.Element.getPorts`

***

### getPortsPositions()

> **getPortsPositions**(`groupName`): `object`

Defined in: [joint-core/types/joint.d.ts:665](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L665)

#### Parameters

##### groupName

`string`

#### Returns

`object`

#### Inherited from

`dia.Element.getPortsPositions`

***

### getRelativePointFromAbsolute()

#### Call Signature

> **getRelativePointFromAbsolute**(`x`, `y`): `Point`

Defined in: [joint-core/types/joint.d.ts:529](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L529)

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

Defined in: [joint-core/types/joint.d.ts:530](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L530)

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

Defined in: [joint-core/types/joint.d.ts:494](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L494)

#### Returns

`string`[]

#### Inherited from

`dia.Element.getTransitions`

***

### has()

> **has**(`attribute`): `boolean`

Defined in: [joint-core/types/joint.d.ts:3295](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3295)

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

Defined in: [joint-core/types/joint.d.ts:3296](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3296)

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

Defined in: [joint-core/types/joint.d.ts:657](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L657)

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

Defined in: [joint-core/types/joint.d.ts:655](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L655)

#### Returns

`boolean`

#### Inherited from

`dia.Element.hasPorts`

***

### initialize()

> **initialize**(`attributes`?, `options`?): `void`

Defined in: [joint-core/types/joint.d.ts:3260](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3260)

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

Defined in: [joint-core/types/joint.d.ts:648](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L648)

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

Defined in: [joint-core/types/joint.d.ts:510](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L510)

#### Returns

`this is Element<Attributes, ModelSetOptions>`

#### Inherited from

`dia.Element.isElement`

***

### isEmbedded()

> **isEmbedded**(): `boolean`

Defined in: [joint-core/types/joint.d.ts:474](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L474)

#### Returns

`boolean`

#### Inherited from

`dia.Element.isEmbedded`

***

### isEmbeddedIn()

> **isEmbeddedIn**(`cell`, `opt`?): `boolean`

Defined in: [joint-core/types/joint.d.ts:472](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L472)

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

Defined in: [joint-core/types/joint.d.ts:508](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L508)

#### Returns

`this is Link<Attributes, ModelSetOptions>`

#### Inherited from

`dia.Element.isLink`

***

### isValid()

> **isValid**(`options`?): `boolean`

Defined in: [joint-core/types/joint.d.ts:3297](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3297)

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

Defined in: [joint-core/types/joint.d.ts:3211](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3211)

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

Defined in: [joint-core/types/joint.d.ts:3212](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3212)

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

Defined in: [joint-core/types/joint.d.ts:3213](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3213)

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

Defined in: [joint-core/types/joint.d.ts:3214](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3214)

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

Defined in: [joint-core/types/joint.d.ts:3203](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3203)

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

Defined in: [joint-core/types/joint.d.ts:3201](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3201)

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

Defined in: [joint-core/types/joint.d.ts:3202](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3202)

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

Defined in: [joint-core/types/joint.d.ts:3209](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3209)

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

Defined in: [joint-core/types/joint.d.ts:3210](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3210)

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

Defined in: [joint-core/types/joint.d.ts:464](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L464)

#### Returns

`string`

#### Inherited from

`dia.Element.parent`

***

### portProp()

#### Call Signature

> **portProp**(`portId`, `path`): `any`

Defined in: [joint-core/types/joint.d.ts:671](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L671)

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

Defined in: [joint-core/types/joint.d.ts:673](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L673)

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

Defined in: [joint-core/types/joint.d.ts:622](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L622)

##### Parameters

###### opt?

`PositionOptions`

##### Returns

`Point`

##### Inherited from

`dia.Element.position`

#### Call Signature

> **position**(`x`, `y`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:623](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L623)

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

Defined in: [joint-core/types/joint.d.ts:3257](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3257)

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

Defined in: [joint-core/types/joint.d.ts:3298](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3298)

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

Defined in: [joint-core/types/joint.d.ts:3299](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3299)

#### Returns

[`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

#### Inherited from

`dia.Element.previousAttributes`

***

### prop()

#### Call Signature

> **prop**(`key`): `any`

Defined in: [joint-core/types/joint.d.ts:476](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L476)

##### Parameters

###### key

`Path`

##### Returns

`any`

##### Inherited from

`dia.Element.prop`

#### Call Signature

> **prop**(`object`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:477](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L477)

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

Defined in: [joint-core/types/joint.d.ts:478](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L478)

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

Defined in: [joint-core/types/joint.d.ts:458](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L458)

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

Defined in: [joint-core/types/joint.d.ts:490](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L490)

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

Defined in: [joint-core/types/joint.d.ts:650](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L650)

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

Defined in: [joint-core/types/joint.d.ts:652](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L652)

##### Parameters

###### opt?

`ModelSetOptions`

##### Returns

`this`

##### Inherited from

`dia.Element.removePorts`

#### Call Signature

> **removePorts**(`ports`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:653](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L653)

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

Defined in: [joint-core/types/joint.d.ts:480](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L480)

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

Defined in: [joint-core/types/joint.d.ts:629](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L629)

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

Defined in: [joint-core/types/joint.d.ts:631](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L631)

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

Defined in: [joint-core/types/joint.d.ts:635](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L635)

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

Defined in: [joint-core/types/joint.d.ts:3279](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3279)

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

Defined in: [joint-core/types/joint.d.ts:3280](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3280)

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

Defined in: [joint-core/types/joint.d.ts:3281](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3281)

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

Defined in: [joint-core/types/joint.d.ts:625](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L625)

##### Returns

`Size`

##### Inherited from

`dia.Element.size`

#### Call Signature

> **size**(`size`, `opt`?): `this`

Defined in: [joint-core/types/joint.d.ts:626](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L626)

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

Defined in: [joint-core/types/joint.d.ts:627](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L627)

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

Defined in: [joint-core/types/joint.d.ts:512](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L512)

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

Defined in: [joint-core/types/joint.d.ts:514](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L514)

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

Defined in: [joint-core/types/joint.d.ts:3215](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3215)

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

Defined in: [joint-core/types/joint.d.ts:496](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L496)

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

Defined in: [joint-core/types/joint.d.ts:462](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L462)

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

Defined in: [joint-core/types/joint.d.ts:460](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L460)

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

Defined in: [joint-core/types/joint.d.ts:456](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L456)

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

Defined in: [joint-core/types/joint.d.ts:492](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L492)

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

Defined in: [joint-core/types/joint.d.ts:620](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L620)

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

Defined in: [joint-core/types/joint.d.ts:3204](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3204)

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

Defined in: [joint-core/types/joint.d.ts:3207](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3207)

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

Defined in: [joint-core/types/joint.d.ts:500](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L500)

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

Defined in: [joint-core/types/joint.d.ts:3300](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3300)

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

Defined in: [joint-core/types/joint.d.ts:3301](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3301)

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

Defined in: [joint-core/types/joint.d.ts:518](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L518)

#### Returns

`number`

#### Inherited from

`dia.Element.z`

***

### define()

> `static` **define**(`type`, `defaults`?, `protoProps`?, `staticProps`?): `Constructor`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>

Defined in: [joint-core/types/joint.d.ts:677](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L677)

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

Defined in: [joint-core/types/joint.d.ts:3230](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3230)

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

Defined in: [joint-core/types/joint.d.ts:3232](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3232)

#### Inherited from

`dia.Element.attributes`

***

### changed

> **changed**: [`Partial`](https://www.typescriptlang.org/docs/handbook/utility-types.html#partialtype)\<`Attributes` & `Attributes`\>

Defined in: [joint-core/types/joint.d.ts:3233](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3233)

#### Inherited from

`dia.Element.changed`

***

### cid

> **cid**: `string`

Defined in: [joint-core/types/joint.d.ts:3235](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3235)

#### Inherited from

`dia.Element.cid`

***

### cidPrefix

> **cidPrefix**: `string`

Defined in: [joint-core/types/joint.d.ts:3234](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3234)

#### Inherited from

`dia.Element.cidPrefix`

***

### collection

> **collection**: `Collection`\<`ReactElement`\<`Attributes`\>\>

Defined in: [joint-core/types/joint.d.ts:3236](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3236)

#### Inherited from

`dia.Element.collection`

***

### graph

> **graph**: `Graph`

Defined in: [joint-core/types/joint.d.ts:446](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L446)

#### Inherited from

`dia.Element.graph`

***

### id

> **id**: `ID`

Defined in: [joint-core/types/joint.d.ts:445](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L445)

#### Inherited from

`dia.Element.id`

***

### idAttribute

> **idAttribute**: `string`

Defined in: [joint-core/types/joint.d.ts:3249](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3249)

#### Inherited from

`dia.Element.idAttribute`

***

### markup

> **markup**: `string` \| `MarkupJSON` = `elementMarkup`

Defined in: [joint-react/src/models/react-element.tsx:31](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/models/react-element.tsx#L31)

#### Overrides

`dia.Element.markup`

***

### useCSSSelectors

> **useCSSSelectors**: `boolean`

Defined in: [joint-core/types/joint.d.ts:448](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L448)

#### Inherited from

`dia.Element.useCSSSelectors`

***

### validationError

> **validationError**: `any`

Defined in: [joint-core/types/joint.d.ts:3250](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L3250)

#### Inherited from

`dia.Element.validationError`

***

### attributes

> `static` **attributes**: `object`

Defined in: [joint-core/types/joint.d.ts:679](https://github.com/samuelgja/joint/blob/main/packages/joint-core/types/joint.d.ts#L679)

#### Index Signature

\[`attributeName`: `string`\]: `PresentationAttributeDefinition`\<`ElementView`\<`Element`\<`Attributes`, `ModelSetOptions`\>\>\>

#### Inherited from

`dia.Element.attributes`
