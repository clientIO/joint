import { dia, attributes } from '../joint';

// Types
export type Event = dia.Event;
export type ObjectHash = dia.ObjectHash;
export type Point = dia.Point;
export type BBox = dia.BBox;
export type Size = dia.Size;
export type PaddingJSON = dia.PaddingJSON;
export type Padding = dia.Padding;
export type SidesJSON = dia.SidesJSON;
export type LegacyPositionName = dia.LegacyPositionName;
export type PositionName = dia.PositionName;
export type Sides = dia.Sides;
export type OrthogonalDirection = dia.OrthogonalDirection;
export type DiagonalDirection = dia.DiagonalDirection;
export type Direction = dia.Direction;
export type LinkEnd = dia.LinkEnd;
export type MarkupNodeJSON = dia.MarkupNodeJSON;
export type MarkupJSON = dia.MarkupJSON;
export type Path = dia.Path;
export type SVGMarkerJSON = dia.SVGMarkerJSON;
export type SVGFilterJSON = dia.SVGFilterJSON;

// Interfaces
export type ModelSetOptions = dia.ModelSetOptions;
export type CollectionAddOptions = dia.CollectionAddOptions;
export type SVGPatternJSON = dia.SVGPatternJSON;
export type SVGGradientJSON = dia.SVGGradientJSON;
export type SVGComplexMarkerJSON = dia.SVGComplexMarkerJSON;
export type SVGSimpleMarkerJSON = dia.SVGSimpleMarkerJSON;

// Classes (+ merged namespaces)
export import CellCollection = dia.CellCollection;
export import GraphLayerCollection = dia.GraphLayerCollection;
export import GraphLayersController = dia.GraphLayersController;
export import GraphTopologyIndex = dia.GraphTopologyIndex;
export import GraphHierarchyIndex = dia.GraphHierarchyIndex;
export import Graph = dia.Graph;
export import Cell = dia.Cell;
export import Element = dia.Element;
export import Link = dia.Link;
export import CellViewGeneric = dia.CellViewGeneric;
export import CellView = dia.CellView;
export import ElementView = dia.ElementView;
export import LinkView = dia.LinkView;
export import Paper = dia.Paper;
export import LayerView = dia.LayerView;
export import GraphLayer = dia.GraphLayer;
export import GraphLayerView = dia.GraphLayerView;
export import GridLayerView = dia.GridLayerView;
export import ToolsView = dia.ToolsView;
export import ToolView = dia.ToolView;
export import HighlighterView = dia.HighlighterView;

// Re-export top-level attributes namespace (exported at runtime from @joint/core/dia)
export { attributes };
