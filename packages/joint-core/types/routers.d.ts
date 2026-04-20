import type * as dia from './dia';

export interface NormalRouterArguments {

}

export interface ManhattanRouterArguments {
    step?: number;
    padding?: dia.Sides;
    maximumLoops?: number;
    maxAllowedDirectionChange?: number;
    perpendicular?: boolean;
    excludeEnds?: dia.LinkEnd[];
    excludeTypes?: string[];
    startDirections?: dia.OrthogonalDirection[];
    endDirections?: dia.OrthogonalDirection[];
    isPointObstacle?: (point: dia.Point) => boolean;
    fallbackRouter: (vertices: dia.Point[], opts?: ManhattanRouterArguments, linkView?: dia.LinkView) => dia.Point[];
}

export interface OrthogonalRouterArguments {
    elementPadding?: number;
    padding?: dia.Sides;
}

export interface OneSideRouterArguments {
    side?: dia.OrthogonalDirection;
    padding?: dia.Sides;
}

export interface RouterArgumentsMap {
    'normal': NormalRouterArguments;
    'manhattan': ManhattanRouterArguments;
    'metro': ManhattanRouterArguments;
    'orthogonal': OrthogonalRouterArguments;
    /**
     * @deprecated use `rightAngle` instead
     */
    'oneSide': OneSideRouterArguments;
    'rightAngle': RightAngleRouterArguments;
    [key: string]: { [key: string]: any };
}

export type RouterType = keyof RouterArgumentsMap;

export type GenericRouterArguments<K extends RouterType> = RouterArgumentsMap[K];

export interface GenericRouter<K extends RouterType> {
    (
        vertices: dia.Point[],
        args?: GenericRouterArguments<K>,
        linkView?: dia.LinkView
    ): dia.Point[];
}

export interface GenericRouterJSON<K extends RouterType> {
    name: K;
    args?: GenericRouterArguments<K>;
}

export type RouterArguments = GenericRouterArguments<RouterType>;

export type Router = GenericRouter<RouterType>;

export type RouterJSON = GenericRouterJSON<RouterType>;

export var manhattan: GenericRouter<'manhattan'>;
export var metro: GenericRouter<'metro'>;
export var normal: GenericRouter<'normal'>;
export var orthogonal: GenericRouter<'orthogonal'>;
/**
 * @deprecated use `rightAngle` instead
 */
export var oneSide: GenericRouter<'oneSide'>;

/* Right Angle Router */

export enum RightAngleDirections {
    AUTO = 'auto',
    LEFT = 'left',
    RIGHT = 'right',
    TOP = 'top',
    BOTTOM = 'bottom',
    ANCHOR_SIDE = 'anchor-side',
    MAGNET_SIDE = 'magnet-side'
}

export interface RightAngleRouterArguments {
    margin?: number;
    minMargin?: number | null;
    /** @experimental before version 4.0 */
    useVertices?: boolean;
    sourceDirection?: RightAngleDirections;
    targetDirection?: RightAngleDirections;
}

export interface RightAngleRouter extends GenericRouter<'rightAngle'> {
    Directions: typeof RightAngleDirections;
}

export var rightAngle: RightAngleRouter;
