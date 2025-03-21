[**@joint/react**](../README.md)

***

[@joint/react](../README.md) / useElementEffect

# Function: useElementEffect()

> **useElementEffect**(`idOrIds`, `onChange`, `dependencies`): `void`

Defined in: [src/hooks/use-element-effect.ts:36](https://github.com/samuelgja/joint/blob/main/packages/joint-react/src/hooks/use-element-effect.ts#L36)

**`Experimental`**

Custom effect hook to trigger change for the elements based on the dependencies list. Similar how react useEffect works.

 This may be removed or changed in the future as we are not sure if this is the best approach.

## Parameters

### idOrIds

The ID or array of IDs of the JointJS elements.

`undefined` | `ID` | `ID`[]

### onChange

(`element`) => `void` \| () => `void`

Callback function to execute when the element changes with `dia.Element` as a callback parameter.

### dependencies

`unknown`[] = `DEFAULT_DEPENDENCIES`

Array of dependencies for the useEffect hook - observe for the changes, same as `useEffect`.

## Returns

`void`

## Example

```tsx
const [isPressed, setIsPressed] = useState(false);
  useElementEffect(
    id,
    (element) => {
      element.attr({
        rect: {
          fill: 'blue',
          stroke: isPressed ? 'red' : 'black',
          strokeWidth: 10,
        },
      });
    },
    [isPressed] // listen to react changes
  );
```
