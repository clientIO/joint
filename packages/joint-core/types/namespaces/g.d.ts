import { g } from '../geometry';

// Enums
export import types = g.types;

// Types
export type Shape = g.Shape;
export type PointInit = g.PointInit;
export type CardinalDirection = g.CardinalDirection;
export type RectangleSide = g.RectangleSide;
export type PathSegmentUnit = g.PathSegmentUnit;
export type PathObjectUnit = g.PathObjectUnit;
export type SegmentType = g.SegmentType;

// Interfaces
export type PlainPoint = g.PlainPoint;
export type PlainRect = g.PlainRect;
export type Scale = g.Scale;
export type PrecisionOpt = g.PrecisionOpt;
export type StrictOpt = g.StrictOpt;
export type SubdivisionsOpt = g.SubdivisionsOpt;
export type SegmentSubdivisionsOpt = g.SegmentSubdivisionsOpt;
export type PathT = g.PathT;
export type Segment = g.Segment;
export type SegmentTypes = g.SegmentTypes;
export type SkeletonPoints = g.SkeletonPoints;

// Functions
export import normalizeAngle = g.normalizeAngle;
export import snapToGrid = g.snapToGrid;
export import toDeg = g.toDeg;
export import toRad = g.toRad;
export import random = g.random;

// Classes
export import Curve = g.Curve;
export import Ellipse = g.Ellipse;
export import Line = g.Line;
export import Path = g.Path;
export import Point = g.Point;
export import PolygonalChain = g.PolygonalChain;
export import Polyline = g.Polyline;
export import Polygon = g.Polygon;
export import Rect = g.Rect;

// Namespaces
export import bezier = g.bezier;
export import scale = g.scale;
export import intersection = g.intersection;
