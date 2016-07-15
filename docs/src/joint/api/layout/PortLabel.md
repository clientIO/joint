
Port label layout functions calculate port label positions relatively to port positions.

### Pre-defined port label layouts

#### On Sides

Simple label layout suitable for rectangular shapes. It places the label on arbitrary side of a port.

```javascript
label: {
    position: {
        name : 'left|right|bottom|top',
        args: {
            x: number,
            y: number,
            angle: 0,
            attrs: {}
        }
    }
}
```

#### Inside/Outside

Places the label inside or outside of a rectangular shape. Where 'oriented' versions rotate the text towards the element center.

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


Places the label outside of a circular shape. Where the 'oriented' version rotates the text towards the element center.

```javascript
label: {
    position: {
        name :'radial|radialOriented',
        args: {
            offset: 0
        }
    }
}
```

#### Manual placement

It allows to set a label position directly.

```javascript
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

```

### Port label layout demo

<iframe src="about:blank" data-src="./demo/layout/PortLabel/portLabel.html"></iframe>




