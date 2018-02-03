
Port layouts are functions that accept an array of port's `args` and return an array of port positions. Positions are relative to the element model bounding box. For example if we have an element at position `{ x:10, y:20 }` with a relative port position `{ x:1, y:2 }`, the absolute port position will be `{ x:11, y:22 }`.

Port layout can be defined only at the `group` level. Optionally you can pass some additional arguments into the layout function via `args`. The `args` is the only way to adjust port layout from the port definition perspective.

```javascript
var rect = new joint.shapes.basic.Rect({
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
rect.addPort({ group:'a' });

```

### Pre-defined layouts:

#### On sides

A simple layout suitable for rectangular shapes. It evenly spreads ports along a single side.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either `left`, `right`, `top`, `bottom`.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object</i></td>
        <td>
            <table>
                <tr>
                    <td><b>x</b></td>
                    <td>number</td>
                    <td>Overrides the `x` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Overrides the `y` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>dx</b></td>
                    <td>number</td>
                    <td>Added to the `x` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>dy</b></td>
                    <td>number</td>
                    <td>Added to the `y` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port rotation angle.</td>
                </tr>
            </table>
        </td>
    </tr>
</table>


```javascript
{
    name: 'left',
    args: {
        x: 10,
        y: 10,
        angle: 30,
        dx: 1,
        dy: 1
    }
}

```

#### Line

A layout which evenly spreads ports along a line defined by a `start` and en `end` point.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            `line`
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object</i></td>
        <td>
            <table>
                <tr>
                    <td><b>start</b></td>
                    <td>{ x:number, y:number }</td>
                    <td>The line starting point</td>
                </tr>
                <tr>
                    <td><b>end</b></td>
                    <td>{ x:number, y:number }</td>
                    <td>The line end point</td>
                </tr>
            </table>
        </td>
    </tr>
</table>


```javascript
{
    name: 'line',
    args: {
        start: { x: 10, y: 10 },
        end: { x: 20, y: 50 }
    }
}

```

#### Absolute

It lay a port out at the given position (defined as a `x`, `y` coordinates or percentage of the element dimensions).

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            `absolute`
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object</i></td>
        <td>
            <table>
                <tr>
                    <td><b>x</b></td>
                    <td>number | string</td>
                    <td>Sets the port's `x` coordinate. Can be defined as a percentage string ('50%') or as a number</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number | string</td>
                    <td>Sets the port's `y` coordinate. Can be defined as a percentage string ('50%') or as a number</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port rotation angle.</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

```javascript
{
    name: 'absolute',
    args: {
        x: '10%',
        y: 10,
        angle: 45
    }
}

```

#### Radial

Suitable for circular shapes. The `ellipseSpreads` evenly spreads ports along an ellipse. The `ellipse` spreads ports from the point at `startAngle` leaving gaps between ports equal to `step`.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either `ellipse`, `ellipseSpread`.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object</i></td>
        <td>
            <table>
                <tr>
                    <td><b>x</b></td>
                    <td>number</td>
                    <td>Overrides the `x` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Overrides the `y` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>dx</b></td>
                    <td>number</td>
                    <td>Added to the `x` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>dy</b></td>
                    <td>number</td>
                    <td>Added to the `y` value calculated by the layout function</td>
                </tr>
                <tr>
                    <td><b>dr</b></td>
                    <td>number</td>
                    <td>Added to the port delta rotation</td>
                </tr>
                <tr>
                    <td><b>startAngle</b></td>
                    <td>number</td>
                    <td>Default value is `0`.</td>
                </tr>
                <tr>
                    <td><b>step</b></td>
                    <td>number</td>
                    <td>
                        Default `360 / portsCount` for the `ellipseSpread`, `20` for the `ellipse`
                    </td>
                </tr>
                <tr>
                    <td><b>compensateRotation</b></td>
                    <td>boolean</td>
                    <td>set `compensateRotation:true` when you need to have ports in the same angle as an ellipse tangent at the port position.</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

```javascript
{
    name: 'ellipseSpread',
    args: {
        dx: 1,
        dy: 1,
        dr: 1,
        startAngle: 10,
        step: 10,
        compensateRotation: false
    }
}
```


<iframe src="about:blank" data-src="demo/layout/Port/portRotationComp.html" style="height: 534px; width: 803px;"></iframe>

### Custom layout

An alternative for built-in layouts is providing a function directly, where the function returns an array of port positions.

```javascript
/**
* @param {Array<object>} portsArgs
* @param {g.Rect} elBBox shape's bounding box
* @param {object} opt Group options
* @returns {Array<g.Point>}
*/
function(portsArgs, elBBox, opt) {

    // ports on sinusoid
    return _.map(portsArgs, function(portArgs, index) {

        var step = -Math.PI / 8;
        var y = Math.sin(index * step) * 50;
        return g.point({ x: index * 12, y: y + elBBox.height });
    });
}
```

### Port layouts demo

<iframe src="about:blank" data-src="demo/layout/Port/port.html" style="height: 442px; width: 803px;"></iframe>
