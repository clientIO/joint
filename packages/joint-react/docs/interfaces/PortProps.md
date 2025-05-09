[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PortProps

# Interface: PortProps

Defined in: [joint-react/src/components/port/port-item.tsx:16](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L16)

## Properties

### children?

> `readonly` `optional` **children**: `ReactNode`

Defined in: [joint-react/src/components/port/port-item.tsx:37](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L37)

***

### dx?

> `readonly` `optional` **dx**: `string` \| `number`

Defined in: [joint-react/src/components/port/port-item.tsx:49](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L49)

The x offset of the port. It can be a number or a string.

***

### dy?

> `readonly` `optional` **dy**: `string` \| `number`

Defined in: [joint-react/src/components/port/port-item.tsx:53](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L53)

The y offset of the port. It can be a number or a string.

***

### groupId?

> `readonly` `optional` **groupId**: `string`

Defined in: [joint-react/src/components/port/port-item.tsx:29](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L29)

The group id of the port. It must be unique within the cell.

***

### id

> `readonly` **id**: `string`

Defined in: [joint-react/src/components/port/port-item.tsx:25](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L25)

The id of the port. It must be unique within the cell.

***

### magnet?

> `readonly` `optional` **magnet**: `string`

Defined in: [joint-react/src/components/port/port-item.tsx:21](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L21)

Magnet - define if the port is passive or not. It can be set to any value inside the paper.

#### Default

```ts
true
```

***

### x?

> `readonly` `optional` **x**: `string` \| `number`

Defined in: [joint-react/src/components/port/port-item.tsx:41](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L41)

The y position of the port. It can be a number or a string.

***

### y?

> `readonly` `optional` **y**: `string` \| `number`

Defined in: [joint-react/src/components/port/port-item.tsx:45](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L45)

The y position of the port. It can be a number or a string.

***

### z?

> `readonly` `optional` **z**: `number` \| `"auto"`

Defined in: [joint-react/src/components/port/port-item.tsx:33](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/components/port/port-item.tsx#L33)

The z-index of the port. It must be unique within the cell.
