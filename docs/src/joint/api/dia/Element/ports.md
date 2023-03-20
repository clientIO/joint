### Ports

Many diagramming applications deal with elements with ports. Ports are usually displayed as circles inside diagram elements and are used not only as "sticky" points for connected links, but they also further structure the linking information. It is common that certain elements have lists of input and output ports. A link might not then point to the element as a whole, but to a certain port instead.

It's easy to add ports to arbitrary shapes in JointJS. This can be done either by passing a ports definition as an `option` in the constructor, or using the ports API to get/add/remove single or multiple ports. For more information on how to define ports please see the [Port configuration](#dia.Element.ports.interface) section.


##### Port API on `joint.dia.Element`

* [`hasPort`](#dia.Element.prototype.hasPort) / [`hasPorts`](#dia.Element.prototype.hasPorts)
* [`addPort`](#dia.Element.prototype.addPort) / [`addPorts`](#dia.Element.prototype.addPorts)
* [`removePort`](#dia.Element.prototype.removePort) /
[`removePorts`](#dia.Element.prototype.removePorts)
* [`getPort`](#dia.Element.prototype.getPort) / [`getPorts`](#dia.Element.prototype.getPorts)
* [`portProp`](#dia.Element.prototype.portProp)
* [`getPortsPositions`](#dia.Element.prototype.getPortsPositions)

##### <a name="dia.Element.ports.interface"></a> Port configuration

```javascript
// Single port definition
const port = {
    // id: 'abc', // Generated if `id` value is not present
    group: 'a',
    args: {}, // Extra arguments for the port layout function, see `layout.Port` section
    label: {
        position: {
            name: 'left',
            args: { y: 6 } // Extra arguments for the label layout function, see `layout.PortLabel` section
        },
        markup: [{
            tagName: 'text',
            selector: 'label'
        }]
    },
    attrs: {
        body: { magnet: true, width: 16, height: 16, x: -8, y: -4, stroke: 'red', fill: 'gray'},
        label: { text: 'port', fill: 'blue' }
    },
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }]
};

// a.) Add ports in constructor.
const rect = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 90, height: 90 },
    ports: {
        groups: {
            'a': {}
        },
        items: [
            { group: 'a' },
            port
        ]
    }
});

// b.) Or add a single port using API
rect.addPort(port);

rect.getGroupPorts('a');
/*
   [
       { * Default port settings * },
       { * Follows port definition * },
       { * Follows port definition * }
    ]
*/
```

<table>
<tr>
    <td><b>id</b></td>
    <td><i>string</i></td>
    <td>
        It is automatically generated if no <code>id</code> is provided. IDs must be unique in the context of a single shape - two ports with the same port id are therefore not allowed (<code>Element: found id duplicities in ports.</code> error is thrown).
    </td>
</tr>

<tr>
    <td><b>group</b></td>
    <td><i>string</i></td>
    <td>
        Group name, more info in the <a href="#dia.Element.ports.groupssection">groups</a> section.
    </td>
</tr>
<tr>
    <td><b>args</b></td>
    <td><i>object</i></td>
    <td>
        Arguments for the port layout function. Available properties depend on the type of layout. More information can be found in <a href="#layout.Port"><code>layout.Port</code></a>.
    </td>
</tr>
<tr>
    <td><b>attrs</b></td>
    <td><i>object</i></td>
    <td>
        JointJS style attribute definition. The same notation as the <code>attrs</code> property on <a href="#dia.Element.intro.presentation"><code>Element</code></a>.
    </td>
</tr>
<tr>
    <td><b>markup</b></td>
    <td><i>MarkupJSON&nbsp;|&nbsp;string</i></td>
    <td>
        <p>A custom port markup.</p>
        <p>The default port markup is <code>&lt;circle class="joint-port-body" r="10" fill="#FFFFFF" stroke="#000000"/&gt;</code>.</p>
        <p>The root of the port markup is referenced by the <code>portRoot</code> selector.</p>
        <p>If the markup contains more than one node, an extra group is created to wrap the nodes. This group becomes the new <code>portRoot</code>.</p>
<pre><code>// An example of port markup
markup: [{
    tagName: 'rect',
    selector: 'bodyInner',
    className: 'outer',
    attributes: {
        'width': 15,
        'height': 15,
        'fill': 'red'
    }
}, {
    tagName: 'rect',
    selector: 'bodyOuter',
    className: 'inner',
    attributes: {
        'width': 15,
        'height': 15,
        'fill': 'blue',
        'x': 10
    }
}]
</code></pre>
    </td>
</tr>
<tr>
    <td><b>label</b></td>
    <td><i>object</i></td>
    <td>
        Port label layout configuration. E.g. label position, label markup. More information about port label layouts can be found in <a href="#layout.PortLabel"><code>layout.PortLabel</code></a>.
    </td>
</tr>

<tr>
    <td><ul><li><b>label.position</b></li></ul></td>
    <td><i>string&nbsp;|&nbsp;object</i></td>
    <td>
        <p>Port label position configuration. It can be a <code>string</code> for setting the port layout type directly with default settings, or an <code>object</code> where it's possible to set the layout type and options.</p>
        <pre><code>{ position: 'left'}

// or ...

{
    position: {
        name: 'left',
        args: {
            dx: 10
        }
    }
}</code></pre>
    </td>
</tr>
<tr>
    <td><ul style="margin-left: 20px;list-style: circle"><li><b>label.position.name</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        It states the layout type. It matches the layout method name defined in the <code>joint.layout.PortLabel</code> namespace: <code>name: 'left'</code> is implemented as <code>joint.layout.PortLabel.left</code>.
    </td>
</tr>
<tr>
    <td><ul style="margin-left: 20px;list-style: circle"><li><b>label.position.args</b></li></ul></td>
    <td><i>object</i></td>
    <td>
        Additional arguments for the layout method. Available properties depend on the layout type. More information can be found in the <a href="#layout.PortLabel"><code>layout.PortLabel</code></a> section.
    </td>
</tr>
<tr>
    <td><ul><li><b>label.markup</b></li></ul></td>
    <td><i>MarkupJSON&nbsp;|&nbsp;string</i></td>
    <td>
        <p>A custom port label markup.</p>
        <p>The default port label markup is <code>&lt;text class="joint-port-label" fill="#000000"/&gt;</code>.</p>
        <p>The root of the label markup is referenced by the <code>labelRoot</code> selector.</p>
        <p>If the markup contains more than one node, an extra group is created to wrap the nodes. This group becomes the new <code>labelRoot</code>.</p>
        <p>All <code>&lt;text/&gt;</code> nodes of the port are referenced by the <code>labelText</code> selector, unless the markup contains <code>labelText</code> explicitly.</p>
        <p>Use an empty array <code>[]</code> to prevent the label from being rendered.</p>
    </td>
</tr>
<tr>
    <td><b>z</b></td>
    <td><i>number&nbsp;|&nbsp;string</i></td>
    <td>
        <p>
            An alternative to HTML <code>z-index</code>. <code>z</code> sets the position of a port in the list of DOM elements
            within an <code>ElementView</code>.
        </p>
        <iframe src="about:blank" data-src="./demo/dia/Element/portZIndex.html" style="height: 224px; width: 803px;"></iframe>
        <p>
            Shapes most likely consist of 1 or more DOM elements, <code>&lt;rect/&gt;</code>, <code>&lt;rect/&gt;&lt;text/&gt;&lt;circle/&gt;</code> etc.
            Ports are placed into the main group element <code>elementView.el</code>, so it will act as the port container.
            Ports with <code>z: 'auto'</code> are located right after the last element in the main group. Ports with <code>z</code>
            defined as a number are placed before a DOM element at the position (index within the children of the container, where only
            the original markup elements, and ports with <code>z: 'auto'</code> are taken into account) equal to <code>z</code>.
        </p>
        <p>For instance, the first shape from the demo above with the following markup...</p>
<pre><code>markup: [{
    tagName: 'rect',
    selector: 'bodyMain',
    className: 'bodyMain'
}, {
    tagName: 'rect',
    selector: 'bodyInner',
    className: 'bodyInner'
}, {
    tagName: 'text',
    selector: 'label',
    className: 'label'
}]
</pre></code>
        <p>...will be rendered like this:</p>
<pre><code>&lt;g model-id="..."&gt;
    &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: 0 --&gt;
    &lt;rect class="bodyMain"&gt;&lt;/rect&gt;
    &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: 1 --&gt;
    &lt;rect class="bodyInner"&gt;&lt;/rect&gt;
    &lt;text class="label"&gt;&lt;/text&gt;
    &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: 3 --&gt;
    &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: auto --&gt;
&lt;/g&gt;
</code></pre>
        <p>
            Ports will be placed in the <code>rotatable</code> group if it's defined in the shape's markup.
            Ports with <code>z: 'auto'</code> are located right after the last element in the <code>rotatable</code> group.
            In the demo above, the second shape is defined with a <code>rotatable</code> group and the following markup:
        </p>
<pre><code>markup: [{
    tagName: 'g',
    selector: 'rotatable',
    className: 'rotatable',
    children: [{
        tagName: 'g',
        selector: 'scalable',
        className: 'scalable',
        children: [{
            tagName: 'rect',
            selector: 'bodyMain',
            className: 'bodyMain'
        }]
    }, {
        tagName: 'rect',
        selector: 'bodyInner',
        className: 'bodyInner'
    }, {
        tagName: 'text',
        selector: 'label',
        className: 'label'
    }]
}]
</pre></code>
        <p>
            It will be rendered like this:
        </p>
<pre><code>&lt;g model-id="..."&gt;
    &lt;g class="rotatable"&gt;
        &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: 0 --&gt;
        &lt;g class="scalable"&gt;&lt;rect class="bodyMain"&gt;&lt;/rect&gt;&lt;/g&gt;
        &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: 1 --&gt;
        &lt;rect class="bodyInner"&gt;&lt;/rect&gt;
        &lt;text class="label"&gt;&lt;/text&gt;
        &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: 3 --&gt;
        &lt;g class="joint-port"&gt;&lt;/g&gt;         &lt;!-- z: auto --&gt;
    &lt;/g&gt;
&lt;/g&gt;
</code></pre>
    </td>
</tr>
</table>

All properties described above are optional, and everything has its own default. E.g. `element.addPorts([{}, {}])` will add 2 ports with default settings.

#### Port groups configuration <a name="dia.Element.ports.groupssection"></a>

While single port definitions are useful, what if we want more control over our ports? This is where a port group can come into play. A group allows us to define multiple ports with similar properties, and influence the default port alignment. Any individual port can override a property in a port group definition except the type of layout(E.g. `position: 'left'`). The group definition defines the layout, and the individual port `args` are the only way a port can affect it.

```javascript
// Port definition for input ports group
const portsIn = {
    position: {
        name: 'left', // Layout name
        args: {}, // Arguments for port layout function, properties depend on type of layout
    },
    label: {
        position: {
            name: 'left',
            args: { y: 6 }
        },
        markup: [{
            tagName: 'text',
            selector: 'label',
        }]
    },
    attrs: {
        body: { magnet: 'passive', width: 15, height: 15, stroke: 'red', x: -8, y: -8 },
        label: { text: 'in1', fill: 'black' }
    },
    markup: [{
        tagName: 'rect',
        selector: 'body'
    }]
};

// Define port groups in element constructor
const rect = new joint.shapes.basic.Rect({
    // ...
    ports: {
        groups: {
            'group1': portsIn,
            // 'group2': ...,
            // 'group3': ...,
        },
        items: [
             // Initialize 'rect' with port in group 'group1'
            {
                group: 'group1',
                args: { y: 40 } // Overrides `args` from the group level definition for first port
            }
        ]
    }
});

// Add another port using Port API
rect.addPort(
    { group: 'group1', attrs: { label: { text: 'in2' }}}
);
```

<table>
<tr>
    <td><b>position</b></td>
    <td><i>string | object</i></td>
    <td>
        Port position configuration. It can be a <code>string</code> to set the port layout type directly with default
        settings, or an <code>object</code> where it's possible to set the layout type and options.
    </td>
</tr>
<tr>
    <td><ul><li><b>position.name</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        It states the layout type. Match the layout method name defined in the <code>joint.layout.Port</code> namespace: <code>name: 'left'</code> is implemented as <code>joint.layout.Port.left</code>.
    </td>
</tr>
<tr>
    <td><ul><li><b>position.args</b></li></ul></td>
    <td><i>object</i></td>
    <td>
        Arguments for the port layout function. Available properties depend on the type of layout. More information can be found in <a href="#layout.Port"><code>layout.Port</code></a>.
    </td>
</tr>
<tr>
    <td><b>attrs</b></td>
    <td><i>object</i></td>
    <td>
        JointJS style attribute definition. The same notation as the <code>attrs</code> property on <a href="#dia.Element.intro.presentation"><code>Element</code></a>.
    </td>
</tr>
<tr>
    <td><b>markup</b></td>
    <td><i>MarkupJSON&nbsp;|&nbsp;string</i></td>
    <td>
        <p>Custom port markup. Multiple roots are not allowed. Valid notation would be:</p>
        <pre><code>markup: [{
    tagName: 'g',
    children: [{
        tagName: 'rect',
        selector: 'bodyInner',
        className: 'outer',
        attributes: {
            'width': 15,
            'height': 15,
            'fill': 'red'
        }
    }, {
        tagName: 'rect',
        selector: 'bodyOuter',
        className: 'inner',
        attributes: {
            'width': 15,
            'height': 15,
            'fill': 'blue',
            'x': 10
        }
    }]
}]
</code></pre>
        <p>The default port looks like the following: <code>&lt;circle class="joint-port-body" r="10" fill="#FFFFFF" stroke="#000000"/&gt;</code>.</p>
    </td>
</tr>
<tr>
    <td><b>label</b></td>
    <td><i>object</i></td>
    <td>
        Port label layout configuration. E.g. label position, label markup. More information about port label layouts can be found in the <a href="#layout.PortLabel"><code>layout.PortLabel</code></a> section.
    </td>
</tr>

<tr>
    <td><ul><li><b>label.position</b></li></ul></td>
    <td><i>string&nbsp;|&nbsp;object</i></td>
    <td>
        <p>Port label position configuration. It can be a <code>string</code> for setting the port layout type directly with default settings, or an <code>object</code> where it's possible to set the layout type and options.</p>
        <pre><code>{ position: 'left'}

// or ...

{
    position: {
        name: 'left',
        args: {
            dx: 10
        }
    }
}</code></pre>
    </td>
</tr>

<tr>
    <td><ul style="margin-left: 20px;list-style: circle"><li><b>label.position.name</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        It states the layout type. It matches the layout method name defined in the <code>joint.layout.PortLabel</code> namespace: <code>name: 'left'</code> is implemented as <code>joint.layout.PortLabel.left</code>.
    </td>
</tr>
<tr>
    <td><ul style="margin-left: 20px;list-style: circle"><li><b>label.position.args</b></li></ul></td>
    <td><i>object</i></td>
    <td>
        Additional arguments for the layout method. Available properties depend on the layout type. More information can be found in the <a href="#layout.PortLabel"><code>layout.PortLabel</code></a> section.
    </td>
</tr>
<tr>
    <td><ul><li><b>label.markup</b></li></ul></td>
    <td><i>MarkupJSON&nbsp;|&nbsp;string</i></td>
    <td>
        Custom port label markup. Multiple roots are not allowed. The default port label looks like the following: <code>&lt;text class="joint-port-label" fill="#000000"/&gt;</code>.
    </td>
</tr>
</table>

##### Custom markup

Both port and port label can have custom markup...

```javascript
var rect = new joint.shapes.basic.Rect({
    // ...
});

rect.addPort({
    markup: [{
        tagName: 'rect', selector: 'body', attributes: { 'width': 20, 'height': 20, 'fill': 'blue' }
    }]
});

rect.addPort({
    markup: [{
        tagName: 'rect', selector: 'body', attributes: { 'width': 16, 'height': 16, 'fill': 'red' }
    }],
    label: {
        markup: [{ tagName: 'text', selector: 'label', attributes: { 'fill': '#000000' }}]
    },
    attrs: { label: { text: 'port' }}
});
```

...or, it can be set as an default port markup/port label markup on an element model:

```javascript
var rect = new joint.shapes.basic.Rect({
    portMarkup: [{
        tagName: 'rect',
        selector: 'body',
        attributes: {
            'width': 20,
            'height': 20,
            'fill': 'blue',
            'stroke': 'black',
            'stroke-width': 5 // Use native SVG kebab-case for attributes in markup
        }
    }],
    portLabelMarkup: [{
        tagName: 'text',
        selector: 'label',
        attributes: {
            'fill': 'yellow'
        }
    }]
    // ...
});
```
