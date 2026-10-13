import { util } from '@joint/core';

import type { dia, g } from '@joint/core';
import type {
    ElkNode,
    ElkPort,
    ElkLabel,
    ElkExtendedEdge,
    NativeElkNode,
    ElkLayoutOptions,
    StrictElkLayoutOptions,
    StrictElkNodeLayoutOptions
} from './types/index.mjs';
// Not from the barrel: these are how the option spellings are derived, not public API.
import type {
    SidesValuedElkOptionKeys,
    PointValuedElkOptionKeys
} from './types/toNativeElkOptions.mjs';

const DEFAULT_LAYOUT_OPTIONS: ElkLayoutOptions = {
    'elk.algorithm': 'layered',
    // Lay out embedded elements (containers) as part of the same pass as their
    // parent, so that edges crossing a container's boundary are routed and
    // accounted for correctly, instead of only being considered afterwards.
    'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
    // Keep the order of ports on a node consistent with the order of their
    // `ports.items` array, instead of reordering them to reduce edge crossings.
    'elk.layered.considerModelOrder.portModelOrder': 'true',
    // Return every edge's route points and labels graph-absolute, whichever container
    // the edge belongs to - `importGraphLayout` applies them as they are. Overriding this
    // means handling the coordinates yourself (e.g. in `setLinkAttributes`).
    'elk.json.edgeCoords': 'ROOT'
};

/**
 * `elkLayoutOptions` with this package's defaults filled in - what `exportGraphLayout()`
 * and `layout()` both lay out with.
 *
 * `elk.json.edgeCoords` in particular is not a preference: `importGraphLayout()` reads an
 * edge's points as the root's coordinates, so a graph exported without it routes links
 * into the wrong place.
 */
export function withDefaultElkLayoutOptions(elkLayoutOptions?: ElkLayoutOptions): ElkLayoutOptions {
    return util.defaults({}, elkLayoutOptions, DEFAULT_LAYOUT_OPTIONS) as ElkLayoutOptions;
}

// ELK's own default, on every side of a node whose `elk.padding` is not set.
// - A side a padding *does* name leaves the others at `0`, not at this - ELK's own parser
//   reads `[top=40]` as `40` at the top and nothing anywhere else.
const DEFAULT_PADDING = 12;

// The options ELK types as an `ElkPadding`/`ElkMargin`, which therefore take `dia.Sides`.
// - Derived from the option types, so the two cannot drift: adding a `dia.Sides` option
//   there and leaving it out here would not compile.
const SIDES_OPTIONS: ReadonlySet<string> = new Set<
    SidesValuedElkOptionKeys<StrictElkLayoutOptions> | SidesValuedElkOptionKeys<StrictElkNodeLayoutOptions>
>([
    'elk.padding',
    'elk.margins',
    'elk.spacing.portsSurrounding',
    'elk.nodeLabels.padding'
]);

// The options ELK types as a `KVector`, which therefore take a point.
const POINT_OPTIONS: ReadonlySet<string> = new Set<
    PointValuedElkOptionKeys<StrictElkLayoutOptions> | PointValuedElkOptionKeys<StrictElkNodeLayoutOptions>
>([
    'elk.position',
    'elk.nodeSize.minimum',
    'elk.port.anchor'
]);

// ELK takes an option's full id as well as its short form, e.g. `org.eclipse.elk.padding`.
const ELK_ID_PREFIX = 'org.eclipse.';

const SIDES = ['top', 'right', 'bottom', 'left', 'vertical', 'horizontal'] as const;

// Every side, unlike `dia.PaddingJSON`, which leaves each of them optional.
interface ElkPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

function getOptionId(key: string): string {
    return key.startsWith(ELK_ID_PREFIX) ? key.slice(ELK_ID_PREFIX.length) : key;
}

/**
 * Whether `value` is a `dia.Sides` to convert - a number, or an object naming a side.
 *
 * Anything else object-shaped (an array, a `g.Rect`, a `Date`, `{}`) is not:
 * `util.normalizeSides()` would quietly make `0` of every side of it and ELK would lay the
 * graph out as if that had been asked for, where leaving it alone has ELK reject it.
 */
function isSides(value: unknown): value is dia.Sides {
    if (typeof value === 'number') return true;
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const sides = value as Record<string, unknown>;
    // `isFinite()` rather than `Number.isFinite()` - the coercion `util.normalizeSides()`
    // itself does, so `{ top: '40' }` is sides to both of them.
    return SIDES.some((side) => isFinite(sides[side] as number));
}

/** Whether `value` is a point to convert - `g.Point` included, which is one structurally. */
function isPoint(value: unknown): value is g.PlainPoint {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const { x, y } = value as Record<string, unknown>;
    return isFinite(x as number) && isFinite(y as number);
}

/** `dia.Sides` as ELK's own padding/margin string, with every side spelled out. */
function toElkPadding(sides: dia.Sides): string {
    const { top, left, bottom, right } = normalizeSides(sides);
    return `[top=${top},left=${left},bottom=${bottom},right=${right}]`;
}

function normalizeSides(sides: dia.Sides): ElkPadding {
    const { top = 0, right = 0, bottom = 0, left = 0 } = util.normalizeSides(sides);
    return { top, right, bottom, left };
}

/**
 * One layout option value as ELK takes it - a string.
 *
 * A number or a boolean is spelled out (`6` -> `'6'`, `true` -> `'true'`); a `dia.Sides`
 * given for an option ELK types as an `ElkPadding`/`ElkMargin` becomes ELK's own
 * `[top=,left=,bottom=,right=]`; a point given for one it types as a `KVector` becomes
 * `x,y`. Everything else - a string already, `undefined`, and any value this package does
 * not recognize - goes to ELK as it is, so that ELK reports it rather than this package
 * guessing at what it was meant to be.
 */
function toElkOption(key: string, value: unknown): unknown {
    // Before the sides below: `isFinite(true)` holds, so `normalizeSides(true)` would make
    // `1` of every side of a boolean.
    if (typeof value === 'boolean') return `${value}`;
    const id = getOptionId(key);
    // Before the number below: `20` on a padding is every side, not the number `20` - which
    // ELK would read as no padding at all and silently lay out with its own default.
    if (SIDES_OPTIONS.has(id) && isSides(value)) return toElkPadding(value);
    if (POINT_OPTIONS.has(id) && isPoint(value)) return `${value.x},${value.y}`;
    if (typeof value === 'number') return `${value}`;
    return value;
}

interface WithLayoutOptions {
    layoutOptions?: { [key: string]: unknown };
}

// A copy of `element` whose `layoutOptions` hold what ELK takes.
// - Copied rather than written to: the options may be an object an export callback took
//   straight from a cell's own data, or a shared - even frozen - constant, and neither is
//   this package's to rewrite.
// - Copied even when there is nothing to convert: ELK writes its own coordinates into
//   every node and port of the graph it is given, so one shared with the caller would be
//   written through.
function toNativeOptions<T extends object>(element: T): T {
    const { layoutOptions } = element as WithLayoutOptions;
    if (!layoutOptions) return { ...element };
    const nativeOptions: { [key: string]: unknown } = {};
    Object.keys(layoutOptions).forEach((key) => {
        nativeOptions[key] = toElkOption(key, layoutOptions[key]);
    });
    return { ...element, layoutOptions: nativeOptions };
}

function toNativeLabel(label: ElkLabel): ElkLabel {
    return toNativeOptions(label);
}

function toNativePort(port: ElkPort): ElkPort {
    const nativePort = toNativeOptions(port);
    if (!nativePort.labels) return nativePort;
    return { ...nativePort, labels: nativePort.labels.map(toNativeLabel) };
}

function toNativeEdge(edge: ElkExtendedEdge): ElkExtendedEdge {
    const nativeEdge = toNativeOptions(edge);
    if (!nativeEdge.labels) return nativeEdge;
    return { ...nativeEdge, labels: nativeEdge.labels.map(toNativeLabel) };
}

/**
 * An ELK graph with every layout option in the spelling ELK itself takes - a string.
 *
 * Takes the JointJS spellings this package also accepts (`6`, `true`,
 * `{ left: 10, vertical: 40 }`, `{ x: 10, y: 20 }`) and writes them out as ELK's own
 * strings, throughout the graph: the node's own options, its labels', its ports' (and
 * theirs), the edges filed under it (and theirs), and each of its children, as deep as
 * they nest.
 *
 * A new graph - the one passed in is left as it is, including any option object it shares
 * with a cell's own data.
 *
 * `layout()` does this for you, so you only need it when you skip `layout()` and call
 * `elkjs`'s own `elk.layout()` yourself - typically on a graph from `exportGraphLayout()`.
 */
export function toNativeElkNode(node: ElkNode): NativeElkNode {
    const nativeNode: ElkNode = toNativeOptions(node);
    const { labels, ports, edges, children } = nativeNode;
    // Asserted here, where it is this function's whole contract: what comes out is what ELK
    // takes. `toElkOption()` returns `unknown`, since a value this package does not
    // recognize goes to ELK as it is for ELK itself to report.
    return {
        ...nativeNode,
        ...(labels && { labels: labels.map(toNativeLabel) }),
        ...(ports && { ports: ports.map(toNativePort) }),
        ...(edges && { edges: edges.map(toNativeEdge) }),
        ...(children && { children: children.map(toNativeElkNode) })
    } as NativeElkNode;
}

/**
 * The padding ELK laid a node out with, read from `elk.padding` in either spelling - what
 * `layout()` takes back off the root's size for its bounding box.
 *
 * ELK reads a side its padding string does not name as `0` rather than as the option's
 * `12`, so `'[top=40]'` is `40` at the top and nothing anywhere else - exactly what
 * `util.normalizeSides({ top: 40 })` makes of the JointJS spelling. A string ELK cannot
 * read as a padding at all (`'40'`, `''`, `'nonsense'`), and no option at all, leave every
 * side at the `12` default.
 */
export function getElkPadding(options: ElkLayoutOptions): ElkPadding {
    // Either spelling of the key, as `toElkOption()` takes either.
    const value = options['elk.padding'] ?? options[`${ELK_ID_PREFIX}elk.padding`];
    if (typeof value === 'string') {
        const padding = parseElkPadding(value);
        if (padding) return padding;
    } else if (isSides(value)) {
        return normalizeSides(value);
    }
    return { top: DEFAULT_PADDING, right: DEFAULT_PADDING, bottom: DEFAULT_PADDING, left: DEFAULT_PADDING };
}

// `[top=12,left=12,bottom=12,right=12]` - ELK also takes it without the brackets, with
// spaces around the `=`, with a sign or an exponent, and with any side left out.
//
// A side the string does not name is `0`, and so is a side it names in any other case
// (`[TOP=40]`) or does not name at all (`[]`) - ELK reads those as a padding all the same,
// it just finds no side in them. Only a string it cannot read as a padding at all
// (`'40'`, `'nonsense'`, `''`) leaves every side at the option's own default, which is
// what `null` here means.
function parseElkPadding(value: string): ElkPadding | null {
    // What ELK reads as a padding: a `key=value`, or the brackets on their own.
    if (!/=/.test(value) && !/\[/.test(value)) return null;
    const padding = { top: 0, right: 0, bottom: 0, left: 0 };
    // Case-sensitive, as ELK is: it reads no side out of `[TOP=40]`.
    const sides = /(top|left|bottom|right)\s*=\s*([-+]?[\d.]+(?:[eE][-+]?\d+)?)/g;
    let side;
    while ((side = sides.exec(value)) !== null) {
        padding[side[1] as keyof ElkPadding] = Number(side[2]);
    }
    return padding;
}
