[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / jsx

# Function: jsx()

> **jsx**(`element`): `MarkupJSON`

Defined in: [joint-react/src/utils/joint-jsx/jsx-to-markup.ts:123](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/utils/joint-jsx/jsx-to-markup.ts#L123)

Convert JSX element to JointJS markup.

## Parameters

### element

`Element`

JSX element.

## Returns

`MarkupJSON`

JointJS markup.

This generate just static markup from JSX, it doesn't support dynamic components and hooks.

## Example

```tsx
function CustomComponent(props: Readonly<PropsWithChildren>) {
  return <div>{props.children}</div>;
}
const markup = jsxToMarkup(
  <CustomComponent>
    <span>Hello</span>
  </CustomComponent>
);
```
