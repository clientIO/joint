
Port layouts are functions that accept an array of port's `args` and return an array of port positions. Positions are relative to the element model bounding box. For example if we have an element at position `{ x:10, y:20 }` with a relative port position `{ x:1, y:2 }`, the absolute port position will be `{ x:11, y:22 }`.

Port layout can be defined only at the `group` level. Optionally you can pass some additional arguments into the layout function via `args`. The `args` is the only way how to adjust port layout from the port definition perspective.

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
                args: {} // overrides `args` from the group level definition.
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

A simple layout suitable for rectangular shapes. It evenly spreads ports along a single side.

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

It lay a port out at the given position (defined as a `x`, `y` coordinates or percentage of the element dimensions).

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

#### ellipse | ellipseSpread

Suitable for circular shapes. The `ellipseSpreads` evenly spreads ports along an ellipse. The `ellipse` spreads ports from the point at `startAngle` leaving gaps between ports equal to `step`.

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
set `compensateRotation:true` when you need to have ports in the same angle as an ellipse tangent at the port position.

<iframe src="about:blank" data-src="demo/layout/Port/portRotationComp.html"></iframe>

### Custom layout

An alternative for built-in layouts is providing a function directly, where the function returns an array of port positions.

```javascript
/**
* @param {Array<object>} ports
* @param {g.Rect} elBBox shape's bounding box
* @param {object} opt Group options
* @returns {Array<g.Point>}
*/
function(ports, elBBox, opt) {

    // ports on sinusoid
    return _.map(ports, function(port, index) {

        var step = -Math.PI / 8;
        var y = Math.sin(index * step) * 50;
        return g.point({ x: index * 12, y: y + elBBox.height });
    });
}
```

### Port layouts demo

<iframe src="about:blank" data-src="demo/layout/Port/port.html"></iframe>

