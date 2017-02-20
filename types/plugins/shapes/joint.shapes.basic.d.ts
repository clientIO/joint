declare namespace joint {
  namespace shapes {
    namespace basic {
      class Generic extends dia.Element {
        constructor(attributes?: GenericAttributes<dia.SVGAttributes>, options?: Object)
      }
      interface RectAttrs extends dia.TextAttrs {
        rect?: ShapeAttrs;
      }
      class Rect extends Generic {
        constructor(attributes?: GenericAttributes<RectAttrs>, options?: Object)
      }
      class Text extends Generic {
        constructor(attributes?: GenericAttributes<dia.TextAttrs>, options?: Object)
      }
      interface CircleAttrs extends dia.TextAttrs {
        circle?: ShapeAttrs;
      }
      class Circle extends Generic {
        constructor(attributes?: GenericAttributes<CircleAttrs>, options?: Object)
      }
      interface EllipseAttrs extends dia.TextAttrs {
        ellipse?: ShapeAttrs;
      }
      class Ellipse extends Generic {
        constructor(attributes?: GenericAttributes<EllipseAttrs>, options?: Object)
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