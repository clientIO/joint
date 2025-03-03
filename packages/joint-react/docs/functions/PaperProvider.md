[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / PaperProvider

# Function: PaperProvider()

> **PaperProvider**(`__namedParameters`): `Element`

Defined in: [packages/joint-react/src/components/paper-provider.tsx:33](https://github.com/samuelgja/joint/blob/ba33b9b8c40870ffb787d62832f1ac6786fe7e98/packages/joint-react/src/components/paper-provider.tsx#L33)

Paper provider creates a paper instance and provides it to its children.
It extends the paper options from the createPaper function.
For more information about paper, see the JointJS documentation.

## Parameters

### \_\_namedParameters

[`PaperProviderProps`](../interfaces/PaperProviderProps.md)

## Returns

`Element`

## See

https://docs.jointjs.com/api/dia/Paper

## Example

Using provider:
```tsx
import { PaperProvider } from '@joint/react'

function App() {
return (
<PaperProvider>
   <MyApp />
</PaperProvider>
)
```
