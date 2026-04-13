import { anchors } from '../joint';

// Interfaces
export type ElementAnchorArguments = anchors.ElementAnchorArguments;
export type RotateAnchorArguments = anchors.RotateAnchorArguments;
export type BBoxAnchorArguments = anchors.BBoxAnchorArguments;
export type PaddingAnchorArguments = anchors.PaddingAnchorArguments;
export type MidSideAnchorArguments = anchors.MidSideAnchorArguments;
export type ModelCenterAnchorArguments = anchors.ModelCenterAnchorArguments;
export type AnchorArgumentsMap = anchors.AnchorArgumentsMap;
export type GenericAnchor<K extends anchors.AnchorType> = anchors.GenericAnchor<K>;
export type GenericAnchorJSON<K extends anchors.AnchorType> = anchors.GenericAnchorJSON<K>;

// Types
export type AnchorType = anchors.AnchorType;
export type GenericAnchorArguments<K extends anchors.AnchorType> = anchors.GenericAnchorArguments<K>;
export type AnchorArguments = anchors.AnchorArguments;
export type Anchor = anchors.Anchor;
export type AnchorJSON = anchors.AnchorJSON;

// Variables
export import center = anchors.center;
export import top = anchors.top;
export import bottom = anchors.bottom;
export import left = anchors.left;
export import right = anchors.right;
export import topLeft = anchors.topLeft;
export import topRight = anchors.topRight;
export import bottomLeft = anchors.bottomLeft;
export import bottomRight = anchors.bottomRight;
export import perpendicular = anchors.perpendicular;
export import midSide = anchors.midSide;
