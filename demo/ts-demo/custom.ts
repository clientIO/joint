import * as joint from 'joint';

// extend joint.shapes namespace
declare module 'joint' {
    namespace shapes {
        namespace app {
            class CustomRect extends joint.shapes.standard.Rectangle {

                test(): void;

                static staticTest(): void;
            }

            class Link extends joint.dia.Link {
            }
        }
    }
}

joint.shapes.standard.Link.define('app.Link', {
    attrs: {
        line: {
            stroke: '#222138',
            strokeDasharray: '0',
            strokeWidth: 1,
            fill: 'none'
        }
    }
});

joint.shapes.standard.Rectangle.define('app.CustomRect', {
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

// demonstrate creating a custom dummy view for the app.CustomRect
namespace CustomViews {

    export class CustomRectView extends joint.dia.ElementView {

        initialize() {
            super.initialize.apply(this, arguments);
            console.log('CustomRectView called !!!');
        }
    }
}

(<any>Object).assign(joint.shapes.app, CustomViews)

