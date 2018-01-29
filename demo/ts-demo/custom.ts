import * as joint from './build/joint';

// extend joint.shapes namespace
declare module './build/joint' {
    namespace shapes {
        namespace app {
            class CustomRect extends joint.shapes.basic.Rect {
                test(): void;

                static staticTest(): void;
            }

            class Link extends joint.dia.Link {
            }
        }
    }
}

joint.shapes.basic.Rect.define('app.Link', {
    attrs: {
        '.connection': {
            stroke: '#222138',
            strokeDasharray: '0',
            strokeWidth: 1,
            fill: 'none'
        }
    }
});

joint.shapes.basic.Rect.define('app.CustomRect', {
    attrs: {
        rect: {
            fill: 'red'
        }
    }
}, {
    test: function () {
        console.log("test");
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

