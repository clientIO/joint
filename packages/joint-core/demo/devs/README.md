The **Devs** demo introduces a ready-to-use shape with predefined input & output port groups and simplified API.

### joint.shapes.devs.Model

The Model shape implements simple API on top of the JointJS built-in ports. It splits ports into two semantic groups (**in** and **out**) and adds convenient methods for adding and removing ports.

| Attribute | Description |
| --- | --- |
| inPorts | an array of all input ports |
| outPorts | an array of all output ports |

##### shapes.devs.Model.addInPort

    element.addInPort(port, [opt])

Add a single port into the \`inPorts\` array, where \`port\` is a name of the port.

##### shapes.devs.Model.addOutPort

    element.addOutPort(port, [opt])

Add a single port into the \`outPorts\` array, where \`port\` is a name of the port.

##### shapes.devs.Model.changeInGroup

    element.changeInGroup(properties, [opt])

Change the settings for the input ports, where \`properties\` is an object with a [group configuration](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Element.ports.interface). It extends the previous settings with the new configuration by default. Pass `{ rewrite: true }` via `opt` to invalidate the previous settings.

##### shapes.devs.Model.changeOutGroup

    element.changeOutGroup(properties, [opt])

Change the settings for the output ports, where \`properties\` is an object with a [group configuration](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Element.ports.interface). It extends the previous settings with the new configuration by default. Pass `{ rewrite: true }` via `opt` to invalidate the previous settings.

##### shapes.devs.Model.removeInPort

    element.removeInPort(port, [opt])

Remove a port from an element from the \`inPorts\` array, where \`port\` is a name of the port.

##### shapes.devs.Model.removeOutPort

    element.removeOutPort(port, [opt])

Remove a port from an element from the \`outPorts\` array, where \`port\` is a name of the port.

### joint.shapes.devs.Link

The `devs.Link` extends the `joint.shapes.standard.Link` and changes the link appearance.

#### Example usage

    const shape = new joint.shapes.devs.Model({
        position: {
            x: 100,
            y: 100
        },
        inPorts: ['in1', 'in2'],
        outPorts: ['out1', 'out2']
    });

    shape.addTo(graph);

    // adding/removing ports dynamically
    shape.addInPort('in3');
    shape.removeOutPort('out1').addOutPort('out3');

    const link = new joint.shapes.devs.Link({
        source: {
            id: shape.id,
            port: 'out3'
        },
        target: {
            x: 200,
            y: 300
        }
    });
    link.addTo(graph);

    // moving the input ports from `left` to `top`
    shape.changeInGroup({ position: 'top' });
    // moving the output ports 'right' to 'bottom'
    shape.changeOutGroup({ position: 'bottom' });


#### Hierarchical diagrams

There are two more shapes designed for hierarchical diagrams as part of the demo - `devs.Atomic` and `devs.Coupled`. They inherit from the `devs.Model` and differ only in the color and size. The purpose of these shapes is to enable you to implement a custom logic in your application based on their type. For instance a `devs.Coupled` can embed `devs.Atomic`'s but not the other way round as shown in the demo below.

When working with hierarchical diagrams there is a few methods, that might come in handy.

[`coupled.embed(atomic)`](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Element.prototype.embed) that can put the \`atomic\` shape into the \`coupled\`.

[`coupled.fitToChildren()`](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Element.prototype.fitToChildren) that resizes the \`coupled\` shape such that all embedded elements are visually contained within it.

[`link.reparent()`](https://resources.jointjs.com/docs/jointjs/v3.7/joint.html#dia.Link.prototype.reparent) that finds the best parent for the \`link\` based on the source and target element.
