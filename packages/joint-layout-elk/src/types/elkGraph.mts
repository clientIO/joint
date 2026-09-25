import type {
    ElkNode as RawElkNode,
    ElkPort as RawElkPort,
    ElkExtendedEdge as RawElkExtendedEdge,
    ElkLabel as RawElkLabel
} from 'elkjs';

import type { NodeElkLayoutOptions } from './elkNodeOptions.mjs';
import type { PortElkLayoutOptions } from './elkPortOptions.mjs';
import type { EdgeElkLayoutOptions } from './elkEdgeOptions.mjs';
import type { LabelElkLayoutOptions } from './elkLabelOptions.mjs';

// ELK graph element shapes, narrowing `layoutOptions` (and, on `ElkNode`, the element
// arrays it nests) from elkjs's own loosely-typed versions to the option types above.
export interface ElkLabel extends Omit<RawElkLabel, 'layoutOptions'> {
    layoutOptions?: LabelElkLayoutOptions;
}

export interface ElkPort extends Omit<RawElkPort, 'layoutOptions' | 'labels'> {
    layoutOptions?: PortElkLayoutOptions;
    labels?: ElkLabel[];
}

export interface ElkExtendedEdge extends Omit<RawElkExtendedEdge, 'layoutOptions' | 'labels'> {
    layoutOptions?: EdgeElkLayoutOptions;
    labels?: ElkLabel[];
}

export interface ElkNode extends Omit<RawElkNode, 'layoutOptions' | 'children' | 'ports' | 'edges' | 'labels'> {
    layoutOptions?: NodeElkLayoutOptions;
    children?: ElkNode[];
    ports?: ElkPort[];
    edges?: ElkExtendedEdge[];
    labels?: ElkLabel[];
}
