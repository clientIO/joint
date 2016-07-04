### Ports

You can easily add ports to any shape, either pass ports definitions as an `option` in constructor or you
    are able to get/add/remove ports afterwards, using API defined on `joint.dia.Element`. One way or another
    you need to specify ports correctly, available settings is described in [Port interface ](#portinterface) section.

##### Port API on `joint.dia.Element`

* [`hasPorts`](#dia.Element.prototype.hasPorts)
* [`addPort`](#dia.Element.prototype.addPort) / [`addPorts`](#dia.Element.prototype.addPorts)
* [`removePort`]((#dia.Element.prototype.removePort)
* [`getPort`](#dia.Element.prototype.getPort) / [`getPorts`](#dia.Element.prototype.getPorts)

##### <a name="portinterface"></a> Ports Interface

All properties described below are optional, everything has own default, so the `element.addPorts([{}, {}])` is completely valid usage.

```javascript

    // Single port definition
    var port = {
        id: 'string', // port id - automatically generated if is not provided, otherwise must be unique in context of shape
        group: 'string', // group name
        args: {}, // arguments for port layout function, properties depends on type of layout
        label: {
            // position: 'string' - also valid
            position: {
                name: 'string', // label layout name. Layouts are defined in `joint.layout.PortLabel` namespace,
                args: {}, // arguments for port layout function, properties depends on type of layout
            },
            markup: '<text class="label-text"/>' // custom port label markup
        },
        attrs: {}, // jointjs style attribute definition
        markup: '<rect>' // custom port markup
    }

    element.addPort(port);

```
`group` attribute comes to play when you're not ok with default port alignment, it's also handy if you need to define multiple ports with similar properties. `group` define defaults for ports belonging to the group, but there is no restriction if you need to overwrite it on particular port. Option which could not be overwritten is port layout type. 'group' sets the layout type and 'args' are the only way how to port could affect layout.
```javascript

    var groupA = {
        // position: 'string' - also valid
        position: {
            name: 'string', // layout name. Layouts are defined in `joint.layout.Port` namespace,
            args: {}, // arguments for port layout function, properties depends on type of layout
        },
        label: {
            // position: 'string' - also valid
            position: {
                name: 'string', // label layout name. Layouts are defined in `joint.layout.PortLabel` namespace,
                args: {} // arguments for port label layout function, vary depending on the type of layout
            },
            markup: '<text class="label-text"/>' // custom port label markup
        },
        attrs: {}, // jointjs style attribute definition
        markup: '<rect>' // custom port markup
    };

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

```

##### Custom markup
You can set custom markup for the port as well for port label by defining it separately for every single port

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

##### Port position

Port position and port label position are calculated using layout functions. You can use pre-defined ones or you can write your own as well. For more information about layouts, visit [layout.Port](#layout.Port) and [joint.layout.PortLabel](#joint.layout.PortLabel).