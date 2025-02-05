import type { ComponentType, ComponentProps } from 'react'
import React from 'react'

// There is an issue with Typescript when Component has generic Props
// see: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/37087
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const typedMemo = React.memo as <T extends ComponentType<any>>(
  function_: T,
  propsAreEqual?: (
    previousProps: Readonly<ComponentProps<T>>,
    nextProps: Readonly<ComponentProps<T>>
  ) => boolean
) => T

export default typedMemo
