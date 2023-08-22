import * as joint from './vendor/joint';

// extend joint.shapes namespace
declare module './vendor/joint' {
    namespace shapes {
        namespace app {
            class CustomRect extends joint.shapes.standard.Rectangle {

                test(): void;

                static staticTest(): void;
            }

            class Link extends joint.dia.Link {
            }

            class CustomRectView extends joint.dia.ElementView {
            }
        }
    }
}

const Link = joint.shapes.standard.Link.define('app.Link', {
    attrs: {
        line: {
            stroke: '#222138',
            strokeDasharray: '0',
            strokeWidth: 1,
            fill: 'none'
        }
    }
});

const CustomRect = joint.shapes.standard.Rectangle.define('app.CustomRect', {
    attrs: {
        body: {
            fill: 'red'
        }
    }
}, {
    test: function () {
        console.log('test');
    }
}, {
    staticTest: function () {
        console.log('staticTest');
    }
});

class CustomRectView extends joint.dia.ElementView {

    initialize() {
        super.initialize.apply(this, arguments);
        console.log('CustomRectView called !!!');
    }
}

(<any>Object).assign(joint.shapes, {
    app: {
        Link,
        CustomRect,
        CustomRectView
    }
});

