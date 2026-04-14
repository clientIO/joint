import type * as dia from './dia';
import type * as g from './g';

export interface NormalConnectorArguments {
    raw?: boolean;
}

export interface RoundedConnectorArguments {
    raw?: boolean;
    radius?: number;
}

export interface SmoothConnectorArguments {
    raw?: boolean;
}

export interface JumpOverConnectorArguments {
    raw?: boolean;
    size?: number;
    jump?: 'arc' | 'gap' | 'cubic';
    radius?: number;
}

export interface StraightConnectorArguments {
    raw?: boolean;
    cornerType?: 'point' | 'cubic' | 'line' | 'gap';
    cornerRadius?: number;
    cornerPreserveAspectRatio?: boolean;
    precision?: number;
}

export enum CurveDirections {
    AUTO = 'auto',
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
    CLOSEST_POINT = 'closest-point',
    OUTWARDS = 'outwards'
}

export enum CurveTangentDirections {
    UP = 'up',
    DOWN = 'down',
    LEFT = 'left',
    RIGHT = 'right',
    AUTO = 'auto',
    CLOSEST_POINT = 'closest-point',
    OUTWARDS = 'outwards'
}

export interface CurveConnectorArguments {
    raw?: boolean;
    direction?: CurveDirections;
    sourceDirection?: CurveTangentDirections | dia.Point | number;
    targetDirection?: CurveTangentDirections | dia.Point | number;
    sourceTangent?: dia.Point;
    targetTangent?: dia.Point;
    distanceCoefficient?: number;
    angleTangentCoefficient?: number;
    tension?: number;
    precision?: number;
}

export interface ConnectorArgumentsMap {
    'normal': NormalConnectorArguments;
    'rounded': RoundedConnectorArguments;
    'smooth': SmoothConnectorArguments;
    'jumpover': JumpOverConnectorArguments;
    'straight': StraightConnectorArguments;
    'curve': CurveConnectorArguments;
    [key: string]: { [key: string]: any };
}

export type ConnectorType = keyof ConnectorArgumentsMap;

export type GenericConnectorArguments<K extends ConnectorType> = ConnectorArgumentsMap[K];

export interface GenericConnector<K extends ConnectorType> {
    (
        sourcePoint: dia.Point,
        targetPoint: dia.Point,
        routePoints: dia.Point[],
        args?: GenericConnectorArguments<K>,
        linkView?: dia.LinkView
    ): string | g.Path;
}

export interface GenericConnectorJSON<K extends ConnectorType> {
    name: K;
    args?: GenericConnectorArguments<K>;
}

export interface CurveConnector extends GenericConnector<'curve'> {
    Directions: typeof CurveDirections;
    TangentDirections: typeof CurveTangentDirections;
}

export type ConnectorArguments = GenericConnectorArguments<ConnectorType>;

export type Connector = GenericConnector<ConnectorType>;

export type ConnectorJSON = GenericConnectorJSON<ConnectorType>;

export var normal: GenericConnector<'normal'>;
export var rounded: GenericConnector<'rounded'>;
export var smooth: GenericConnector<'smooth'>;
export var jumpover: GenericConnector<'jumpover'>;
export var straight: GenericConnector<'straight'>;
export var curve: CurveConnector;
