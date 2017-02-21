declare namespace joint {
    namespace shapes {
        namespace basic {
            class Generic extends dia.Element {
                constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: any)
            }

            interface RectAttrs extends dia.TextAttrs {
                rect?: ShapeAttrs;
            }

            class Rect extends Generic {
                constructor(attributes?: GenericAttributes<RectAttrs>, options?: any)
            }

            class Text extends Generic {
                constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: any)
            }

            interface CircleAttrs extends dia.TextAttrs {
                circle?: ShapeAttrs;
            }

            class Circle extends Generic {
                constructor(attributes?: GenericAttributes<CircleAttrs>, options?: any)
            }

            interface EllipseAttrs extends dia.TextAttrs {
                ellipse?: ShapeAttrs;
            }

            class Ellipse extends Generic {
                constructor(attributes?: GenericAttributes<EllipseAttrs>, options?: any)
            }

            class Image extends Generic {
            }

            class Path extends Generic {
            }

            class Polygon extends Generic {
            }

            class Polyline extends Generic {
            }
        }
    }
}