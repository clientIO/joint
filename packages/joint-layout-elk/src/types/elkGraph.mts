// elkjs's own graph types, under this package's name for them: "native" is ELK's own
// spelling, where every layout option value is a string. They are also what this package's
// own graph types below are built from, with only `layoutOptions` - and the element
// arrays - narrowed.
// - Their `layoutOptions` stays elkjs's own `{ [key: string]: string }`, rather than this
//   package's `NativeElkLayoutOptions`, which says the same thing far more precisely.
//   Narrowing it would be the end of them: an optional property forces `| undefined` into
//   the index signature, and elkjs's type does not take that - so `toNativeElkNode()`
//   would no longer return something `elk.layout()` accepts as it is, which is the one
//   thing it exists to do.
import type {
    ElkNode as NativeElkNode,
    ElkPort as NativeElkPort,
    ElkExtendedEdge as NativeElkExtendedEdge,
    ElkLabel as NativeElkLabel
} from 'elkjs';

import type { ElkNodeLayoutOptions } from './elkNodeOptions.mjs';
import type { ElkPortLayoutOptions } from './elkPortOptions.mjs';
import type { ElkEdgeLayoutOptions } from './elkEdgeOptions.mjs';
import type { ElkLabelLayoutOptions } from './elkLabelOptions.mjs';

// ELK graph element shapes, narrowing `layoutOptions` (and, on `ElkNode`, the element
// arrays it nests) from elkjs's own loosely-typed versions to the option types above.
export interface ElkLabel extends Omit<NativeElkLabel, 'layoutOptions'> {
    layoutOptions?: ElkLabelLayoutOptions;
}

export interface ElkPort extends Omit<NativeElkPort, 'layoutOptions' | 'labels'> {
    layoutOptions?: ElkPortLayoutOptions;
    labels?: ElkLabel[];
}

export interface ElkExtendedEdge extends Omit<NativeElkExtendedEdge, 'layoutOptions' | 'labels'> {
    layoutOptions?: ElkEdgeLayoutOptions;
    labels?: ElkLabel[];
}

export interface ElkNode extends Omit<NativeElkNode, 'layoutOptions' | 'children' | 'ports' | 'edges' | 'labels'> {
    layoutOptions?: ElkNodeLayoutOptions;
    children?: ElkNode[];
    ports?: ElkPort[];
    edges?: ElkExtendedEdge[];
    labels?: ElkLabel[];
}

// What `toNativeElkNode()` returns and what `elk.layout()` takes, with no assertion at
// the call site. The other three stay internal - elkjs exports them under their own names
// for anyone who needs to spell one out.
export type { NativeElkNode };
