
Port layouts are functions whose consume array of ports and result is array of port positions. Positions are relative to shape bounding box. For Example port position `{ x:1, y:2 }` means the port origin is on position `[1, 2]` from shape's origin.

Port layout can be defined only on `group` level. You can pass some additional arguments into layout function, defined in optional argument `args`. Also `args` is the only way how to adjust port layout from the port definition perspective.

```javascript
var rect = joint.shapes.basic.Rect({
    // ...
    ports: {
        groups: {
            'a': {
                position: {
                    name: 'layoutType',
                    args: {},
                }
            }
        },
        items: [
            // initialize 'rect' with port in group 'a'
            {
                group: 'a',
                args: {} // overrides `args` from the group level definition. `layoutType` cannot be overidden from here.
            },
            // ... other ports
        ]
    }
});

// ....
// add another port to group 'a'.
rect.addPort({ group:'a' })

```

### Pre-defined layouts:

#### left | right | top | bottom

Best for `rect`

```javascript
{
    name: 'left|top|bottom|right',
    args: {
        x: 10,          // override layout result x
        y: 10,          // override layout result y
        angle: 30,      // port rotation angle
        dx: 1,          // default 0 - added to layout result x
        dy: 1           // default 0 - added to layout result y
    }
}

```

#### absolute

```javascript
{
    name: 'absolute',
    args: {
        x: 10 | '10%'
        y: 10 | '10%',
        angle: 45       // port rotation angle
    }
}

```

#### function

Custom layout function, should return array of port positions.

```javascript
/**
 * @param {Array<Object>} ports
 * @param {g.Rect} elBBox shape's bounding box
 * @param {Object} opt Group options
 * @returns {Array<g.Point>}
*/
function(ports, elBBox, opt) {

    return _.map(ports, function(port, index) {

        var step = -Math.PI / 8;
        var y = Math.sin(index * step) * 50;
        return g.point({ x: index * 12, y: y + elBBox.height });
    });
}

```

#### ellipse | ellipseSpread

Best for `circle`, `ellipse`

```javascript
{
    name: 'ellipse|ellipseSpread',
    args: {
        dx: 1,               // default 0 - added to layout result x
        dy: 1,               // default 0 - added to layout result y
        dr: 1,               // default 0 - added to to port delta rotation
        startAngle: 10,      // default 0
        step: 10             // default 360 / portsCount,
        compensateRotation: false
    }
}
```


### Port layouts demo

<iframe src="about:blank" data-src="../../demo/ports/port-layouts.html"></iframe>

