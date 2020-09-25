### Ports

Many diagramming applications deal with elements with ports. Ports are usually displayed as circles inside diagram elements and are used not only as "sticky" points for connected links but they also further structure the linking information. It is common that certain elements have lists of input and output ports. A link might then point not to the element as a whole but to a certain port instead.

It's easy to add ports to arbitrary shapes in JointJS. This can be done either by passing a ports definition as an `option` in the constructor or using the ports API to get/add/remove single or multiple ports. For more information on how to define ports please see [Port configuration](#dia.Element.ports.interface) section.


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
var port = {
    // id: 'abc', // generated if `id` value is not present
    group: 'a',
    args: {}, // extra arguments for the port layout function, see `layout.Port` section
    label: {
        position: {
            name: 'right',
            args: { y: 6 } // extra arguments for the label layout function, see `layout.PortLabel` section
        },
        markup: '<text class="label-text" fill="blue"/>'
    },
    attrs: { text: { text: 'port1' } },
    markup: '<rect width="16" height="16" x="-8" strokegit ="red" fill="gray"/>'
};

// a.) add a port in constructor.
var rect = new joint.shapes.standard.Rectangle({
    position: { x: 50, y: 50 },
    size: { width: 90, height: 90 },
    ports: {
        groups: {
            'a': {}
        },
        items: [port]
    }
});

// b.) or add a single port using API
rect.addPort(port);
```

<table>
<tr>
    <td><b>id</b></td>
    <td><i>string</i></td>
    <td>
        It is automatically generated if no <code>id</code> provided. IDs must be unique in the context of a single shape - two ports with the same port id are therefore not allowed (<code>Element: found id duplicities in ports.</code> error is thrown).
    </td>
</tr>

<tr>
    <td><b>group</b></td>
    <td><i>string</i></td>
    <td>
        Group name, more info in <a href="#dia.Element.ports.groupssection">groups</a> section.
    </td>
</tr>
<tr>
    <td><b>args</b></td>
    <td><i>object</i></td>
    <td>
        Arguments for the port layout function. Available properties depends on the type of layout. More information could be found in <a href="#layout.Port"><code>layout.Port</code></a>.
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
    <td><i>string</i></td>
    <td>
        <p>Custom port markup. Multiple roots are not allowed. Valid notation would be:</p>
<pre><code>&lt;g&gt;
    &lt;rect class="outer" width="15" height="15" fill="red"/&gt;
    &lt;rect class="inner" width="15" height="15" fill="blue" x="10"/&gt;
&lt;/g&gt;</code></pre>
        <p>It defaults to <code>&lt;circle class="joint-port-body" r="10" fill="#FFFFFF" stroke="#000000"/&gt;</code>.</p>
    </td>
</tr>
<tr>
    <td><b>label</b></td>
    <td><i>object</i></td>
    <td>
        Port label layout configuration. E.g. label position, label markup. More information about port label layouts could be found in <a href="#layout.PortLabel"><code>layout.PortLabel</code></a>.
    </td>
</tr>

<tr>
    <td><ul><li><b>label.position</b></li></ul></td>
    <td><i>string&nbsp;|&nbsp;object</i></td>
    <td>
        <p>Port label position configuration. It could be a <code>string</code> for setting the port layout type directly with default settings or an <code>object</code> where it's possible to set the layout type and options.</p>
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
        Stands for the layout type, match the layout method name defined in <code>joint.layout.PortLabel</code> namespace: <code>name:'left'</code> is implemented as <code>joint.layout.PortLabel.left</code>.
    </td>
</tr>
<tr>
    <td><ul style="margin-left: 20px;list-style: circle"><li><b>label.position.args</b></li></ul></td>
    <td><i>object</i></td>
    <td>
        Additional arguments for the layout method. Available properties depends on the layout type. More information could be found in <a href="#layout.PortLabel"><code>layout.PortLabel</code></a> section.
    </td>
</tr>
<tr>
    <td><ul><li><b>label.markup</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        Custom port label markup. Multiple roots are not allowed. It defaults to <code>&lt;text class="joint-port-label" fill="#000000"/&gt;</code>.
    </td>
</tr>
<tr>
    <td><b>z</b></td>
    <td><i>number&nbsp;|&nbsp;string</i></td>
    <td>
        <p>Alternative to HTML <code>z-index</code>. <code>z</code> sets the position of a port in the list of DOM elements within an <code>ElementView</code>.</p>
        <iframe src="about:blank" data-src="./demo/dia/Element/portZIndex.html" style="height: 224px; width: 803px;"></iframe>
        <p>Shapes most likely consist of 1 or more DOM elements, <code>&lt;rect/&gt;</code>, <code>&lt;rect/&gt;&lt;text/&gt;&lt;circle/&gt;</code> etc. Ports are placed into the element <code>rotatable</code> group (if there is no <code>rotatable</code> group in the shape's markup, then the main group element <code>elementView.el</code> is used for the port container). Ports with <code>z:'auto'</code> are located right after the last element in the <code>rotatable</code> group. Ports with <code>z</code> defined as a number are placed before a DOM element at the position (index within the children of the container, where only the original markup elements and ports with <code>z:'auto'</code> are taken into account) equals to <code>z</code>.</p>
        <p>For instance an element with the following markup...</p>
        <pre><code>&lt;g class="rotatable"&gt;
    &lt;g class="scalable"&gt;&lt;rect/&gt;&lt;/g&gt;
    &lt;text/&gt;
&lt;/g&gt;</code></pre>
        <p>...will be rendered like this:</p>
        <pre><code>&lt;g model-id="element1"&gt;
    &lt;g class="rotatable"&gt;
        &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 0 --&gt;
        &lt;g class="scalable"&gt;&lt;rect/&gt;&lt;/g&gt;
        &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 1 --&gt;
        &lt;text/&gt;
        &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 2 --&gt;
    &lt;/g&gt;
&lt;/g&gt;</code></pre>
        <p>Another example with simplified markup <code>&lt;circle/&gt;&lt;text/&gt;</code> can look as follows:</p>
        <pre><code>&lt;g model-id="element2"&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 0 --&gt;
    &lt;circle/&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 1 --&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- another z: 1 --&gt;
    &lt;text/&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 2 --&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 'auto' --&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 3 --&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 'auto' --&gt;
    &lt;g class="port"&gt;&lt;/g&gt;         &lt;!-- z: 10 --&gt;
&lt;/g&gt;</code></pre>
    </td>
</tr>
</table>

All properties described above are optional and everything has own default. E.g. `element.addPorts([{}, {}])` will add 2 ports with default settings.

#### Port groups configuration <a name="dia.Element.ports.groupssection"></a>

`group` attribute comes to play when you're not happy with the default port alignment. It's also handy when you need to define multiple ports with similar properties. `group` defines defaults for ports belonging to the group. Any `group` property can be overwritten by a port in this group except the type of layout - `position`. `group` defines the layout and port `args` are the only way how a port can affect it.

```javascript
// Define ports and port groups in element constructor.
var groupA;
var rect = new joint.shapes.basic.Rect({
    // ...
    ports: {
        groups: {
            'group1': groupA,
            // 'group2': ...,
            // 'group3': ...,
        },
        items: []
    }
});

groupA = {
    position: {
        name: 'string', // layout name
        args: {}, // arguments for port layout function, properties depends on type of layout
    },
    label: {
        // ....
    },
    attrs: {},
    markup: '<rect width="10" height="10" stroke="red"/>'
};
```

<table>
<tr>
    <td><b>position</b></td>
    <td><i>string | object</i></td>
    <td>
        Port position configuration. Could be <code>string</code> to set port layout type directly with default
        settings or <code>object</code> where is possible to set layout type and options.
    </td>
</tr>
<tr>
    <td><ul><li><b>position.name</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        Stands for the layout type, match the layout method name defined in <code>joint.layout.Port</code> namespace: <code>name:'left'</code> is implemented as <code>joint.layout.Port.left</code>.
    </td>
</tr>
<tr>
    <td><ul><li><b>position.args</b></li></ul></td>
    <td><i>object</i></td>
    <td>
        Arguments for the port layout function. Available properties depends on the type of layout. More information could be found in <a href="#layout.Port"><code>layout.Port</code></a>.
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
    <td><i>string</i></td>
    <td>
        <p>Custom port markup. Multiple roots are not allowed. Valid notation would be:</p>
        <pre><code>&lt;g&gt;
    &lt;rect class="outer" width="15" height="15" fill="red"/&gt;
    &lt;rect class="inner" width="15" height="15" fill="red" x="10"/&gt;
&lt;/g&gt;</code></pre>
        <p>It defaults to <code>&lt;circle class="joint-port-body" r="10" fill="#FFFFFF" stroke="#000000"/&gt;</code>.</p>
    </td>
</tr>
<tr>
    <td><b>label</b></td>
    <td><i>object</i></td>
    <td>
        Port label layout configuration. E.g. label position, label markup. More information about port label layouts could be found in <a href="#layout.PortLabel"><code>layout.PortLabel</code></a> section.
    </td>
</tr>

<tr>
    <td><ul><li><b>label.position</b></li></ul></td>
    <td><i>string&nbsp;|&nbsp;object</i></td>
    <td>
        <p>Port label position configuration. It could be a <code>string</code> for setting the port layout type directly with default settings or an <code>object</code> where it's possible to set the layout type and options.</p>
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
        Stands for the layout type, match the layout method name defined in <code>joint.layout.PortLabel</code> namespace: <code>name:'left'</code> is implemented as <code>joint.layout.PortLabel.left</code>.
    </td>
</tr>
<tr>
    <td><ul style="margin-left: 20px;list-style: circle"><li><b>label.position.args</b></li></ul></td>
    <td><i>object</i></td>
    <td>
        Additional arguments for the layout method. Available properties depends on the layout type. More information could be found in <a href="#layot.PortLabel"><code>layout.PortLabel</code></a> section.
    </td>
</tr>
<tr>
    <td><ul><li><b>label.markup</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        Custom port label markup. Multiple roots are not allowed. It defaults to <code>&lt;text class="joint-port-label" fill="#000000"/&gt;</code>.
    </td>
</tr>
</table>

##### Custom markup

Both port and port label can have custom markup...

```javascript
var rect = new joint.shapes.basic.Rect({
    // ...
});

rect.addPort({ markup: '<rect width="10" height="10" fill="blue"/>' });
rect.addPort({ markup: '<rect width="15" height="15" fill="red"/>', label: { markup: '<text fill="#000000"/>' }});
```

...or, it can be set as an default port markup/port label markup on an element model:

```javascript
var rect = new joint.shapes.basic.Rect({
    portMarkup: '<rect width="20" height="20" fill="black"/>',
    portLabelMarkup: '<text fill="yellow"/>',
    // ...
});
```
