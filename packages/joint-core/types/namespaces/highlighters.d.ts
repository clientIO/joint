import { highlighters } from '../joint';

// Interfaces
export type AddClassHighlighterArguments = highlighters.AddClassHighlighterArguments;
export type OpacityHighlighterArguments = highlighters.OpacityHighlighterArguments;
export type StrokeHighlighterArguments = highlighters.StrokeHighlighterArguments;
export type MaskHighlighterArguments = highlighters.MaskHighlighterArguments;
export type HighlighterArgumentsMap = highlighters.HighlighterArgumentsMap;
export type GenericHighlighterJSON<K extends highlighters.HighlighterType> = highlighters.GenericHighlighterJSON<K>;
export type GenericHighlighter<K extends highlighters.HighlighterType> = highlighters.GenericHighlighter<K>;

// Types
export type HighlighterType = highlighters.HighlighterType;
export type GenericHighlighterArguments<K extends highlighters.HighlighterType> = highlighters.GenericHighlighterArguments<K>;
export type HighlighterJSON = highlighters.HighlighterJSON;
export type HighlighterArguments = highlighters.HighlighterArguments;
export type Highlighter = highlighters.Highlighter;

// Classes (+ merged namespaces)
export import mask = highlighters.mask;
export import stroke = highlighters.stroke;
export import addClass = highlighters.addClass;
export import opacity = highlighters.opacity;
export import list = highlighters.list;
