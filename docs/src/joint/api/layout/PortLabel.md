Port label layout functions calculate port label positions relatively to port positions.

### Pre-defined port label layouts

#### On Sides

Simple label layout suitable for rectangular shapes. It places the label on arbitrary side of a port. The `args` object is optional.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either <code>'left'</code>, <code>'right'</code>, <code>'top'</code>, or <code>'bottom'</code>.
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
                    <td>Overrides the <code>x</code> value calculated by the layout function.</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Overrides the <code>y</code> value calculated by the layout function.</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port label rotation angle (in degrees in clockwise direction).</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>object</td>
                    <td>JointJS-style attributes applied on label's DOM element and its children. The same notation as the <code>attrs</code> property on <a href="#dia.Element.intro.presentation">Element</a>. Overridden by port group <code>attrs</code>, if provided.</td>
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

Places the label inside or outside of a rectangular shape. Where 'oriented' versions rotate the text towards the element center. The `args` object is optional.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either <code>'inside'</code>, <code>'outside'</code>, <code>'insideOriented'</code>, or <code>'outsideOriented'</code>.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object</i></td>
        <td>
            <table>
                <tr>
                    <td><b>offset</b></td>
                    <td>number</td>
                    <td>Offset in direction from the shape's center. Overridden by <code>x</code> and <code>y</code> values, if provided.</td>
                </tr>
                <tr>
                    <td><b>x</b></td>
                    <td>number</td>
                    <td>Overrides the <code>x</code> value calculated by the layout function.</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Overrides the <code>y</code> value calculated by the layout function.</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port label rotation angle (in degrees in clockwise direction). Overrides the value calculated by the <code>'insideOriented'</code> and <code>'outsideOriented'</code> layout functions.</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>object</td>
                    <td>JointJS-style attributes applied on label's DOM element and its children. The same notation as the <code>attrs</code> property on <a href="#dia.Element.intro.presentation">Element</a>. Overridden by port group <code>attrs</code>, if provided.</td>
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

Places the label outside of a circular shape. Where the 'oriented' version rotates the text towards the element center. The `args` object is optional.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            Can be either <code>'radial'</code>, or <code>'radialOriented'</code>.
        </td>
    </tr>
    <tr>
        <td><b>args</b></td>
        <td><i>object</i></td>
        <td>
            <table>
                <tr>
                    <td><b>offset</b></td>
                    <td>number</td>
                    <td>Offset in direction from the shape's center. Overridden by <code>x</code> and <code>y</code> values, if provided.</td>
                </tr>
                <tr>
                    <td><b>x</b></td>
                    <td>number</td>
                    <td>Overrides the <code>x</code> value calculated by the layout function.</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Overrides the <code>y</code> value calculated by the layout function.</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port label rotation angle (in degrees in clockwise direction). Overrides the value calculated by the <code>'radialOriented'</code> layout function.</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>number</td>
                    <td>JointJS-style attributes applied on label's DOM element and its children. The same notation as the <code>attrs</code> property on <a href="#dia.Element.intro.presentation">Element</a>. Overridden by port group <code>attrs</code>, if provided.</td>
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

It allows setting label position directly.

<table>
    <tr>
        <td><b>name</b></td>
        <td><i>string</i></td>
        <td>
            <code>'manual'</code>
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
                    <td>Sets the label's <code>x</code> coordinate.</td>
                </tr>
                <tr>
                    <td><b>y</b></td>
                    <td>number</td>
                    <td>Sets the label's <code>y</code> coordinate.</td>
                </tr>
                <tr>
                    <td><b>angle</b></td>
                    <td>number</td>
                    <td>The port label rotation angle (in degrees in clockwise direction).</td>
                </tr>
                <tr>
                    <td><b>attrs</b></td>
                    <td>object</td>
                    <td>JointJS-style attributes applied on label's DOM element and its children. The same notation as the <code>attrs</code> property on <a href="#dia.Element.intro.presentation">Element</a>. Overridden by port group <code>attrs</code>, if provided.</td>
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
