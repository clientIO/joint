
Port label layout functions calculate port label positions relatively to port positions.

### Pre-defined port label layouts

#### On Sides

Simple label layout suitable for rectangular shapes. It places the label on arbitrary side of a port.


<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either `left`, `right`, `bottom`, `top`.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object | string</i></td>
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
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port label rotation angle.</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>number</td>
                    <td>JointJS style attribute applied on label's DOM element and it's children. The same notation as the `attrs` property on [`Element`](#joint.dia.Element.presentation).</td>
                </tr>
            </table>
        </td>
    </tr>
</table>

```javascript
label: {
    position: {
        name : 'right',
        args: {
            x: 0,
            y: 0,
            angle: 0,
            attrs: {}
        }
    }
}
```

#### Inside/Outside

Places the label inside or outside of a rectangular shape. Where 'oriented' versions rotate the text towards the element center.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either `inside`, `outside`, `insideOriented`, `outsideOriented`.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object | string</i></td>
        <td>
            <table>
                <tr>
                    <td><b>offset</b></td>
                    <td>number</td>
                    <td>Offset in direction from the shape's center.</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>number</td>
                    <td>JointJS style attribute applied on label's DOM element and it's children. The same notation as the `attrs` property on [`Element`](#joint.dia.Element.presentation).</td>
                </tr>
            </table>
        </td>
    </tr>
</table>


```javascript

label: {
    position: {
        name :'outsideOriented',
        args: {
            offset: 10,
            attrs: {}
    }
}
```

#### Radial


Places the label outside of a circular shape. Where the 'oriented' version rotates the text towards the element center.


<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either `radial`, `radialOriented`.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object | string</i></td>
        <td>
            <table>
                <tr>
                    <td><b>offset</b></td>
                    <td>number</td>
                    <td>Offset in direction from the shape's center.</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>number</td>
                    <td>JointJS style attribute applied on label's DOM element and it's children. The same notation as the `attrs` property on [`Element`](#joint.dia.Element.presentation).</td>
                </tr>
            </table>
        </td>
    </tr>
</table>


```javascript
label: {
    position: {
        name :'radialOriented',
        args: {
            offset: 0,
            attrs: {}
        }
    }
}
```

#### Manual placement

It allows to set a label position directly.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            `manual`
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object | string</i></td>
        <td>
            <table>
                <tr>
                    <td><b>x</b></td>
                    <td>number</td>
                    <td>Sets the label's `x` coordinate.</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Sets the label's `y` coordinate.</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port label rotation angle.</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>number</td>
                    <td>JointJS style attribute applied on label's DOM element and it's children. The same notation as the `attrs` property on [`Element`](#joint.dia.Element.presentation).</td>
                </tr>
            </table>
        </td>
    </tr>
</table>


```javascript
label: {
    position: {
        name: 'manual',
        args: {
            x: 10,
            y: 20,
            angle: 45,
            attrs: {}
        }
    }
}

```

### Port label layout demo

<iframe src="about:blank" data-src="./demo/layout/PortLabel/portLabel.html" style="height: 442px; width: 803px;"></iframe>




