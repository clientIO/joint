### Ports

You can easily add ports to any shape, either pass ports definitions as an `option` in constructor or you
    are able to get/add/remove ports afterwards, using API defined on `joint.dia.Element`. One way or another
    you need to specify ports correctly, available settings is described in [Port configuration ](#portinterface) section.

##### Port API on `joint.dia.Element`

* [`hasPorts`](#dia.Element.prototype.hasPorts)
* [`addPort`](#dia.Element.prototype.addPort) / [`addPorts`](#dia.Element.prototype.addPorts)
* [`removePort`]((#dia.Element.prototype.removePort)
* [`getPort`](#dia.Element.prototype.getPort) / [`getPorts`](#dia.Element.prototype.getPorts)


##### <a name="portinterface"></a> Port configuration

```javascript
    // Single port definition
    var port = {
        id: 'abc',
        group: 'a',
        args: {},
        label: {
            position: {
                name: 'top',
                args: {}
            },
            markup: '<text class="label-text"/>'
        },
        attrs: {},
        markup: '<rect/>'
    }

    // a.) add port in constructor.
    var rect = new joint.shapes.basic.Rect({
        // ...
        ports: {
            groups: {},
            items: [ port ]
        }
    });

    // b.) or add port using API
    rect.addPort(port);

```

<table>
<tr>
    <td><b>id</b></td>
    <td><i>string</i></td>
    <td> port id - automatically generated if is not provided, otherwise must be unique in context of shape - two ports with same port id is not allowed
    </td>
</tr>

<tr>
    <td><b>group</b></td>
    <td><i>string</i></td>
    <td> group name, more info in [groups](#groupssection) section</td>
</tr>
<tr>
    <td><b>args</b></td>
    <td><i>Object</i></td>
    <td> arguments for port layout function, properties depends on type of layout.</td>
</tr>
<tr>
    <td><b>attrs</b></td>
    <td><i>Object</i></td>
    <td> jointjs style attribute definition. Same as `attr` on [`Element`](#dia.Element.prototype.attr)</td>
</tr>
<tr>
    <td><b>markup</b></td>
    <td><i>string</i></td>
    <td>
        Custom port markup. Multiple roots are not allowed. `<g><rect class="outer"/><rect class="inner"/></g>`
    </td>
</tr>
<tr>
    <td><b>label</b></td>
    <td><i>Object</i></td>
    <td>
        Port layout configuration. Position of label or custom markup could be set here.
    </td>
</tr>

<tr>
    <td><b>&nbsp;label.position</b></td>
    <td><i>string | Object</i></td>
    <td>
        port label position configuration. Could be `string` to set port layout type directly with default
        settings or `Object` where is possible to set layout type and options.
    </td>
</tr>
<tr>
    <td><b>&nbsp;&nbsp;label.position.name</b></td>
    <td><i>string</i></td>
    <td>
        stands for the layout type, match the layout implementation in `joint.layout.PortLabel` namespace:
        `name:'left'` is implemented as `joint.layout.PortLabel.left`
    </td>
</tr>
<tr>
    <td><b>&nbsp;&nbsp;label.position.args</b></td>
    <td><i>Object</i></td>
    <td>
        `args` - additional arguments for the layout function. Depends on the layout type. Info about possible
        arguments could be found in section [`layout.PortLabel`](#layout.PortLabel)
    </td>
</tr>
<tr>
    <td><b>&nbsp;label.markup</b></td>
    <td><i>string</i></td>
    <td>
        Custom port label markup. Multiple roots are not allowed. `<g><text class="header"/><text/></g>`
    </td>
</tr>
<tr>
    <td><b>z</b></td>
    <td valign="top"><i>nubmer</i></td>
    <td> alternative to HTML `z-index`.

    <iframe src="about:blank" data-src="../../demo/ports/port-z-index.html"></iframe>

    </td>
</tr>


</table>

All properties described above are optional and everything has own default, so the `element.addPorts([{}, {}])` is valid usage: it adds 2 ports with default settings.



#### Port groups configuration <a name="groupssection"></a>

`group` attribute comes to play when you're not ok with default port alignment, it's also handy if you need to define multiple ports with similar properties. `group` define defaults for ports belonging to the group, but there is no restriction if you need to overwrite it on particular port. Option which could not be overwritten is port layout type. 'group' sets the layout type and 'args' are the only way how to port could affect layout.

```javascript

   // Define ports and port groups in element constructor.
   var groupA;
   var rect = new joint.shapes.basic.Rect({
        // ...
        ports: {
            groups: {
                'groupA': groupA,
                //'groupB': ...,
                //'groupX': ...,
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
            markup: '<rect>'
        };

```


<table>


<tr>
    <td><b>position</b></td>
    <td style="min-width:100px"><i>string | Object</i></td>
    <td> 
        port position configuration. Could be `string` to set port layout type directly with default
        settings or `Object` where is possible to set layout type and options.
    </td></td>
</tr>
<tr>
    <td><ul><li><b>position.name</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        stands for the layout type, match the layout implementation in `joint.layout.Port` namespace:
        `name:'left'` is implemented as `joint.layout.Port.left`
     </td>
</tr>
<tr>
    <td><ul><li><b>position.args</b></li></ul></td>
    <td><i>Object</i></td>
    <td> arguments for port layout function, properties depends on type of layout. Information about possible
        arguments could be found in section [`layout.Port`](#layout.Port)</td>
</tr>
<tr>
    <td><b>attrs</b></td>
    <td><i>Object</i></td>
    <td> jointjs style attribute definition. Same as `attr` on [`Element`](#dia.Element.prototype.attr)</td>
</tr>
<tr>
    <td><b>markup</b></td>
    <td><i>string</i></td>
    <td>
        Custom port markup. Multiple roots are not allowed. `<g><rect class="outer"/><rect class="inner"/></g>`
    </td>
</tr>
<tr>
    <td><b>label</b></td>
    <td><i>Object</i></td>
    <td>
        Port layout configuration. Position of label or custom markup could be set here.
    </td>
</tr>

<tr>
    <td><ul><li><b>label.position</b></li></ul></td>
    <td><i>string | Object</i></td>
    <td>
        port label position configuration. Could be `string` to set port layout type directly with default
        settings or `Object` where is possible to set layout type and options.
    </td>
</tr>
<tr>
    <td><ul style="list-style-type:none"><li><b>label.position.name</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        stands for the layout type, match the layout implementation in `joint.layout.PortLabel` namespace:
        `name:'left'` is implemented as `joint.layout.PortLabel.left`
    </td>
</tr>
<tr>
    <td><ul style="list-style-type:none"><li><b>label.position.args</b></li></ul></td>
    <td><i>Object</i></td>
    <td>
        `args` - additional arguments for the layout function. Depends on the layout type. Information about possible
        arguments could be found in section [`layout.PortLabel`](#layout.PortLabel)
    </td>
</tr>
<tr>
    <td><ul><li><b>label.markup</b></li></ul></td>
    <td><i>string</i></td>
    <td>
        Custom port label markup. Multiple roots are not allowed. `<g><text class="header"/><text/></g>`
    </td>
</tr>
</table>

##### Custom markup

Both port and port label can have custom markup.

```javascript

    var rect = new joint.shapes.basic.Rect({
        // ...
    });

    rect.addPort({ markup: '<rect/>' })
    rect.addPort({ markup: '<rect fill="red"/>', label: { markup: '<text/>' }})

```

or, it can be set an default port markup/port label markup for whole shape:

```javascript

    var rect = new joint.shapes.basic.Rect({
        portMarkup: '<rect width="20" height="20" fill="black"/>',
        portLabelMarkup: '<text fill="yellow"/>',
        // ...
    });

```
