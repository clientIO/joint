
Port label layout functions are for calculating port label position, relative to port position. For example port label position at { x:1, y:2 } means the port label origin is at position [1, 2] from port's origin.

### Pre-defined port label layputs

#### On Sides

Best for rectangle shapes.

```javascript
label: {
    position: {
        name : 'left|right|bottom|top',
        args: {
            x: number,
            y: number,
            angle: 0,
            attrs: {
                 // standard attrs
            }
        }
    }
}
```

#### Inside/Outside of the shape

```javascript

label: {
    position: {
        name :'inside|outside|insideOriented|outsideOriented',
        args: {
            offset: 0,

            x: number,
            y: number,
            angle: 0,
            attrs: {
                // standard attrs
            }
    }
}
```

#### Radial

Best for circles or ellipses

```javascript
'Radial' : {
    label: {
        position: {
            name :'radial|radialOriented',
            args: {
                offset: 0
            }
        }
    }
},
```

#### Manual placement

```javascript
// values in args are used directly, undefined values are supplied with defaults.
'Manual': {
    label: {
        position: {
            name: 'manual',
            args: {
                x: 0,
                y: 0,
                angle: 0
            }
        }
    }
}

```


### Port label layout demo

<iframe src="about:blank" data-src="../../demo/ports/port-label-layouts.html"></iframe>

### Custom port label layout

Label layout functions are implemented in `joint.layout.PortLabel` namespace. You can define your on layouting function.




