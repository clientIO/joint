[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElementEffect

# Function: useElementEffect()

> **useElementEffect**(`idOrIds`, `onChange`, `dependencies`): `void`

Defined in: [packages/joint-react/src/hooks/use-element-effect.ts:18](https://github.com/samuelgja/joint/blob/9749094e6efe2db40c6881d5ffe1569d905db73f/packages/joint-react/src/hooks/use-element-effect.ts#L18)

Custom hook to manipulate a JointJS graph element based on React state.
It works similarly to react useEffect, but it is specific to JointJS elements.

## Parameters

### idOrIds

The ID or array of IDs of the JointJS elements to observe.

`undefined` | `ID` | `ID`[]

### onChange

(`element`) => `void` \| () => `void`

Callback function to execute when the element changes.

### dependencies

`unknown`[] = `DEFAULT_DEPENDENCIES`

Array of dependencies for the useEffect hook.

## Returns

`void`
