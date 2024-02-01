# JointJS Decorators

ECMAScript / TypeScript decorator for defining *[JointJS](https://www.jointjs.com/)* shapes.

This library fully depends on [JointJS](https://github.com/clientio/joint) (*>=3.5*), so please read its README before using this library.

## Setup

Enable the [experimentalDecorators](https://www.typescriptlang.org/docs/handbook/decorators.html) compiler option in your `tsconfig.json`.

Then install JointJS Decorators from NPM:
```bash
npm i -S @joint/decorators
```

## License

[Mozilla Public License 2.0](https://www.mozilla.org/en-US/MPL/2.0/)

## Usage

There are a few class decorators:

- [`@Model`](#Model)
- [`@View`](#View)

And several class member decorators:

- [`@Function`](#Function)
- [`@On`](#On)
- [`@SVGAttribute`](#SVGAttribute)

---

## <a id="Model"></a> @Model(options: ModelOptions)

The decorator allows you to:
- paste an existing SVG and use it as the model's markup
- keep your SVG attributes in sync with your model's attributes
- transform data using functions
- introduce a new SVG attribute or change the behavior of an existing one

```ts
import { dia } from '@joint/core';
import { Model } from '@joint/decorators';

@Model({
```
```handlebars
    template: `
        <g>
            <rect
                width="calc(w)"
                height="calc(h)"
                :fill="{{color}}"
                stroke="black"
            />
            <text
                x="calc(0.5*w)"
                y="calc(0.5*h)"
                text-anchor="middle"
                text-vertical-anchor="middle"
                font-size="14"
                font-family="sans-serif"
                fill="black"
            >{{firstName}} {{lastName}}</text>
        </g>
    `,
```
```ts
    attributes: {
        color: 'red',
        firstName: 'John',
        lastName: 'Doe'
    }
})
class MyElement extends dia.Element {

}
```

### ModelOptions

| Option | Description | Optional
|---|---|---|
| [template](#Model.template) | the SVG string markup of the model | No |
| [attributes](#Model.attributes) | the default attributes of the model | Yes |
| [namespace](#Model.namespace) | the namespace for the model class to be added to | Yes |

### <a id="Model.template"></a> **template**

The decorator uses an SVG-based template syntax that allows you to declaratively bind the rendered DOM to the underlying model's data.
All templates are syntactically valid SVG that can be parsed by spec-compliant browsers and SVG parsers.

> While using the SVG XML string in the markup attribute is not recommended (every cell view needs to parse the string and it might affect the performance), the parsing of the decorator's template runs only once per class (translating it into [JSON markup](https://resources.jointjs.com/docs/jointjs/v3.5/joint.html#dia.Cell.markup) and defining event listeners needed for reactivity).

#### <a id="Model.template.text-interpolation"></a> Text Interpolation

The most basic form of data binding is text interpolation using the "Mustache" syntax (double curly braces):

```handlebars
<text font-size="14">{{ label }}</text>
```

The mustache tag will be replaced with the value of the `label` property from the corresponding model's instance. It will also be updated whenever the `label` property changes.

#### <a id="Model.template.attributes"></a> Attributes Binding

To bind to an SVG attribute to a model's attribute, add a colon symbol (`:`) before the attribute's name.

```handlebars
<rect :fill="color" />
```

The colon symbol, `:`, instructs the decorator to keep the SVG attribute in sync with the model's attribute.
The model's `color` value can be set this way.

```ts
model.set('color', 'red');
```

If the bound value is `null`, then the SVG attribute will be removed from the rendered element.

```ts
model.set('color', null);
```

It's possible to use mustaches inside binding expressions
    to combine multiple model's attributes into a single result.

```handlebars
<rect :fill="rgb({{red}},{{green}},{{blue}})" />
```

#### <a id="Model.template.functions"></a> Calling Functions

The value of an attribute can be modified with [functions](#Function) before set/display.

```handlebars
<rect :stroke="color" :fill="lighten(color)"/>
<text>{{ capitalize(label) }}</text>
```
> Functions called inside binding expressions will be called every time the cell view updates, so they should not have any side effects, such as changing data or triggering asynchronous operations.

It is possible to call a component-exposed method inside a binding expression only if the method is decorated with the [Function](#Function) decorator.

The function can accept any number of additional arguments. Every such argument shall be parsable with the [JSON.parse](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) function.

```ts
@Model({
    template: `
        <text y="10">{{ maxLength(label1, 20) }}</text>
        <text y="30">{{ maxLength(label2, 10) }}</text>
    `
})
class MyElement extends dia.Element {

    @Function()
    maxLength(value: string, max: number) {
        return value.substr(0, max);
    }
}
```

Multiple dependencies can be defined using an array.

```handlebars
<path :d="data([param1, param2])"/>
```

> The function is run every time one or more attributes in the dependency array are changed.

```ts
@Model({
    attributes: {
        param1: 20,
        param2: 30
    },
    template: `
        <path :d="data([param1, param2])" stroke="white" fill="transparent" />
    `
})
class Arrow extends dia.Element {
    @Function()
    data(param1: number, param2: number): string {
        return `
                M ${param1} 0
                L calc(w) calc(0.5*h)
                L ${param1}  calc(h)
                V calc(h/2 + ${param2 / 2})
                H 0
                v -${param2}
                H ${param1}
                Z
        `;
    }
}
```

#### <a id="Model.template.selectors"></a> Selectors

If you want to modify any of the template attributes programmatically, you must add the `@selector` attribute to the SVG element.

```handlebars
<rect @selector="body" stroke="black" fill="red">
```

```ts
model.attr(['body', 'fill'], 'blue');
```

The `<g>` wrapper in the template is added automatically and always has a `@selector` equal to `root`. In case you want to add SVG attributes to the root group, wrap the template with one of them.

```handlebars
<g @selector="root" data-tooltip="My Tooltip">
    <rect @selector="body" stroke="black" fill="red">
</g>
```

To create selectors pointing to multiple SVG elements at once, use `@group-selector`.

```handlebars
<rect @group-selector="rectangles" fill="red">
<rect @group-selector="rectangles" fill="blue">
<rect @group-selector="rectangles" fill="green">
```

```ts
// Change the stroke of all rectangles
model.attr(['rectangles', 'stroke'], 'black');
```

#### <a id="Model.template.caveats"></a> Caveats

Some JointJS attributes expect their value to be an object ([fill](https://resources.jointjs.com/docs/jointjs/v3.5/joint.html#dia.attributes.textWrap) & [stroke](https://resources.jointjs.com/docs/jointjs/v3.5/joint.html#dia.attributes.stroke) gradient, [filters](https://resources.jointjs.com/docs/jointjs/v3.5/joint.html#dia.attributes.filter), [markers](https://resources.jointjs.com/docs/jointjs/v3.5/joint.html#dia.attributes.sourceMarker) and [textWrap](https://resources.jointjs.com/docs/jointjs/v3.5/joint.html#dia.attributes.textWrap)).

The solution is to define the property inside the [attributes](#Model.attributes) (mixing the template attributes with explicit model attributes).

```ts
const selector = 'label';

@Model({
    attributes: {
        title: 'My Title',
        attrs: {
            [selector]: {
                textWrap: {
                    maxLineCount: 1,
                    ellipsis: true
                }
            }
        }
    },
    template: `
        <text @selector="${selector}">{{title}}</text>
    `
})
class MyElement extends dia.Element {

}
```

### <a id="Model.attributes"></a> **attributes**

The default attributes of the model. When creating an instance of the model, any unspecified attributes will be set to their default value.

```ts
import { dia, shapes } from '@joint/core';
import { Model } from '@joint/decorators';

@Model({
    attributes: {
        color: 'red'
    }
})
class MyElement extends dia.Element {

}
```

is equivalent to

```ts
import { dia, shapes } from '@joint/core';

class MyElement extends dia.Element {

    defaults() {
        const attributes = {
            color: 'red'
        };
        return {
            ...super.defaults,
            ...attributes,
            type: 'MyElement'
        }
    }
}
```

###  <a id="Model.namespace"></a>  **namespace**

Syntactic sugar for adding a model to the namespace.

```ts
import { dia, shapes } from '@joint/core';
import { Model } from '@joint/decorators';

@Model({
    namespace: shapes
})
class MyElement extends dia.Element {

}
```

is equivalent to

```ts
import { dia, shapes } from '@joint/core';

class MyElement extends dia.Element {

}

Object.assign(shapes, {
    'MyElement': MyElement
});
```

---

## <a id="View"></a> @View(options: ViewOptions)

### ViewOptions

| Option | Description | Optional |
|---|---|---|
| namespace | the namespace for the view class to be added to | Yes
| models | an array of model classes this view is to be used with | Yes

Define a new cell view, which is automatically used by 2 different models.

```ts
import { dia, shapes } from '@joint/core';
import { View } from '@joint/decorators';

@View({
    namespace: shapes
    models: [MyElement, MyOtherElement]
})
class MyElementView extends dia.ElementView {

}
```

is equivalent to

```ts
import { dia, shapes } from '@joint/core';

class MyElementView extends dia.ElementView {

}

Object.assign(shapes, {
    'MyElementView': MyElementView,
    'MyOtherElementView': MyElementView
});
```
---
## <a id="Function"></a> @Function(name?: string)

Define functions to transform data (e.g strings, amounts, dates) to be used within the [template](#Model.template).

```ts
@Model({
    template: `
        <text>{{ capitalize(name) }}</text>
    `,
    attributes: {
        name: 'john',
    }
})
class MyElement extends dia.Element {

    @Function()
    capitalize(value: string) {
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
}
```

---

## <a id="SVGAttribute"></a> @SVGAttribute(attributeName: string)

Introduce new SVG attributes or redefine existing ones.

```ts
import { dia, g, attributes } from '@joint/core';
import { Model, SVGAttribute } from '@joint/decorators';

@Model({
    attributes: {
        width: 140,
        height: 100
    },
    template: `
        <rect
            line-style="dashed"
            stroke-width="2"
        />
    `,
})
class MyElement extends dia.Element {

    /* `stroke-dasharray` that adjusts based on the current node's `stroke-width` */
    @SVGAttribute('line-style')
    setStrokeDasharray(
        this: dia.CellView,
        value: string,
        rect: g.Rect,
        node: SVGElement,
        nodeAttrs: attributes.SVGAttributes
    ) {
        const { strokeWidth = 1 } = nodeAttrs;
        let pattern;
        switch (value) {
            case 'dashed': {
                pattern = `${4 * strokeWidth},${2 * strokeWidth}`;
                break;
            }
            case 'dotted': {
                pattern = `${strokeWidth},${strokeWidth}`;
                break;
            }
            case 'solid': {
                pattern = 'none';
                break;
            }
            default: {
                throw new Error('Invalid line-style value.');
            }
        }
        node.setAttribute('stroke-dasharray', pattern);
    }
}
```
### SVGAttribute function signature

| Argument | Description | Example |
|---|---|---|
| value | the right-hand side of the template's attribute | `"dashed"` |
| rect | a rectangle describing the coordinate system the node is rendered in (if no `ref` attribute is in use, the value is the model's bounding box relative to the model's position, otherwise it is the relative bounding box of the node referenced by the `ref` attribute) | `new g.Rect(0, 0, 140, 100)` |
| node | a rendered DOM [SVGElement](https://developer.mozilla.org/en-US/docs/Web/API/SVGElement) | `<rect/> as SVGElement` |
| nodeAttrs | an object with all defined attributes of the node | `{ lineStyle: "dashed", strokeWidth: "2" }` |

---
## <a id="On"></a> @On(eventName: string)

 Decorate an event handler in the context of the method it refers to.

```ts
class MyElementView extends dia.ElementView {

    @On('click')
    onClick() {
        console.log('click!', this.model.id);
    }
}
```

---

Copyright © 2013-2024 client IO
