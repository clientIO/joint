import { connectionPoints } from '../joint';

// Types
export type ConnectionPointAlignment = connectionPoints.ConnectionPointAlignment;
export type ConnectionPointType = connectionPoints.ConnectionPointType;
export type GenericConnectionPointArguments<K extends connectionPoints.ConnectionPointType> = connectionPoints.GenericConnectionPointArguments<K>;
export type ConnectionPointArguments = connectionPoints.ConnectionPointArguments;
export type ConnectionPoint = connectionPoints.ConnectionPoint;
export type ConnectionPointJSON = connectionPoints.ConnectionPointJSON;

// Interfaces
export type DefaultConnectionPointArguments = connectionPoints.DefaultConnectionPointArguments;
export type AlignConnectionPointArguments = connectionPoints.AlignConnectionPointArguments;
export type StrokeConnectionPointArguments = connectionPoints.StrokeConnectionPointArguments;
export type BoundaryConnectionPointArguments = connectionPoints.BoundaryConnectionPointArguments;
export type ConnectionPointArgumentsMap = connectionPoints.ConnectionPointArgumentsMap;
export type GenericConnectionPoint<K extends connectionPoints.ConnectionPointType> = connectionPoints.GenericConnectionPoint<K>;
export type GenericConnectionPointJSON<K extends connectionPoints.ConnectionPointType> = connectionPoints.GenericConnectionPointJSON<K>;

// Variables
export import anchor = connectionPoints.anchor;
export import bbox = connectionPoints.bbox;
export import rectangle = connectionPoints.rectangle;
export import boundary = connectionPoints.boundary;
