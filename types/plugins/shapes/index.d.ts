declare namespace joint {
    namespace shapes {
        interface GenericAttributes<T> extends dia.CellAttributes {
            position?: dia.Point;
            size?: dia.Size;
            angle?: number;
            attrs?: T;
        }

        interface ShapeAttrs extends dia.CSSSelector {
            fill?: string;
            stroke?: string;
            r?: string | number;
            rx?: string | number;
            ry?: string | number;
            cx?: string | number;
            cy?: string | number;
            height?: string | number;
            width?: string | number;
        }
    }
}
