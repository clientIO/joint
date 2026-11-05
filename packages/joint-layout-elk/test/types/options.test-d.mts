import type { dia, g } from '@joint/core';
import type { Expect, Equals } from './assert.mjs';
import type {
    ElkLayoutOptions,
    StrictElkLayoutOptions,
    NativeElkLayoutOptions,
    ElkNodeLayoutOptions,
    StrictElkNodeLayoutOptions,
    NativeElkNodeLayoutOptions,
    ElkEdgeLayoutOptions,
    NativeElkEdgeLayoutOptions,
    ElkPortLayoutOptions,
    NativeElkPortLayoutOptions,
    ElkLabelLayoutOptions,
    NativeElkLabelLayoutOptions,
    StrictElkLabelLayoutOptions,
    Direction,
    NodeLabelPlacement
} from '../../src/types/index.mjs';

// The projection, one assertion per value shape. These are the tripwires: the branch order
// in `ToNativeElkOptions` is load-bearing and gets these wrong silently if it is disturbed.
export type _number = Expect<Equals<NativeElkLayoutOptions['elk.spacing.nodeNode'], `${number}` | undefined>>;
export type _boolean = Expect<Equals<NativeElkLayoutOptions['elk.animate'], 'true' | 'false' | undefined>>;
export type _sides = Expect<Equals<NativeElkLayoutOptions['elk.padding'], string | undefined>>;
export type _point = Expect<Equals<NativeElkLayoutOptions['elk.position'], string | undefined>>;
export type _enum = Expect<Equals<NativeElkLayoutOptions['elk.direction'], Direction | undefined>>;
export type _string = Expect<Equals<NativeElkLayoutOptions['elk.bendPoints'], string | undefined>>;
export type _set = Expect<Equals<NativeElkLayoutOptions['elk.nodeLabels.placement'], string | undefined>>;

// `dia.Sides` is `number | SidesJSON`, so `number extends dia.Sides` holds: testing sides
// before number would degrade every number option to a plain `string`.
export type _strictNumber = Expect<Equals<StrictElkLayoutOptions['elk.spacing.nodeNode'], number | undefined>>;
export type _strictSides = Expect<Equals<StrictElkLayoutOptions['elk.padding'], dia.Sides | undefined>>;
export type _strictPoint = Expect<Equals<StrictElkLayoutOptions['elk.position'], g.PlainPoint | undefined>>;
export type _strictSet = Expect<
    Equals<StrictElkLayoutOptions['elk.nodeLabels.placement'], readonly NodeLabelPlacement[] | undefined>
>;

// The index signatures. Without the terminal `string` branch the native variant's catch-all
// stays the strict union and the type is not native at all - no other assertion catches it.
export type _nativeIndex = Expect<Equals<NativeElkLayoutOptions[string], string | undefined>>;
export type _strictIndex = Expect<
    Equals<StrictElkLayoutOptions[string], string | number | boolean | dia.Sides | g.PlainPoint | readonly string[] | undefined>
>;
export type _index = Expect<
    Equals<ElkLayoutOptions[string], string | number | boolean | dia.Sides | g.PlainPoint | readonly string[] | undefined>
>;

// The four smaller option types get the same treatment.
export type _nodeNumber = Expect<Equals<NativeElkNodeLayoutOptions['elk.priority'], `${number}` | undefined>>;
export type _nodeSides = Expect<Equals<StrictElkNodeLayoutOptions['elk.padding'], dia.Sides | undefined>>;
export type _edgeNumber = Expect<Equals<NativeElkEdgeLayoutOptions['elk.priority'], `${number}` | undefined>>;
export type _portBoolean = Expect<Equals<NativeElkPortLayoutOptions['elk.noLayout'], 'true' | 'false' | undefined>>;
export type _labelBoolean = Expect<Equals<NativeElkLabelLayoutOptions['elk.noLayout'], 'true' | 'false' | undefined>>;

// One object can mix the two spellings, per key - which is why `ElkLayoutOptions` is a
// mapped type rather than `Strict | Native`.
export const mixed: ElkLayoutOptions = {
    'elk.spacing.nodeNode': 6,
    'elk.padding': '[top=12,left=12,bottom=12,right=12]',
    'elk.animate': true,
    'elk.direction': 'DOWN',
    'elk.position': { x: 1, y: 2 }
};

// @ts-expect-error an object mixing the spellings matches neither arm of a union of the
// whole types - which is what the per-key mapped type above buys.
export const topLevelUnion: StrictElkLayoutOptions | NativeElkLayoutOptions = {
    'elk.spacing.nodeNode': 6,
    'elk.animate': 'true'
};

// The strict spelling holds you to the JointJS form...
// @ts-expect-error the strict spelling takes `6`, not `'6'`.
export const strictNumber: StrictElkLayoutOptions = { 'elk.spacing.nodeNode': '6' };
// @ts-expect-error the strict spelling takes `true`, not `'true'`.
export const strictBoolean: StrictElkLayoutOptions = { 'elk.animate': 'true' };
// @ts-expect-error the strict spelling takes `dia.Sides`, not the serialized form.
export const strictSides: StrictElkLayoutOptions = { 'elk.padding': '[top=12]' };

// ...and the native one to ELK's own.
// @ts-expect-error the native spelling takes `'6'`, not `6`.
export const nativeNumber: NativeElkLayoutOptions = { 'elk.spacing.nodeNode': 6 };
// @ts-expect-error the native spelling takes `'true'`, not `true`.
export const nativeBoolean: NativeElkLayoutOptions = { 'elk.animate': true };
// @ts-expect-error the native spelling takes the serialized form, not `dia.Sides`.
export const nativeSides: NativeElkLayoutOptions = { 'elk.padding': { left: 10 }};

declare const widened: string;
declare const fromBackend: Record<string, string>;

// Options arriving as data stay assignable, whole.
export const saved: ElkLayoutOptions = fromBackend;
export const spread: ElkLayoutOptions = { ...fromBackend };
export const widenedUntyped: ElkLayoutOptions = { 'elk.bendPoints': widened };

// Pinned so it is documented rather than rediscovered: a widened `string` does not fit a
// precisely typed option. Assert the spelling, or assign the whole record as above. This
// is how it already behaved - the widening neither caused it nor fixed it.
// @ts-expect-error a widened `string` is not a `${number}`.
export const widenedTyped: ElkLayoutOptions = { 'elk.spacing.nodeNode': widened };

// An ELK option this package has not modelled falls through the catch-all, in any spelling.
export const unknownKeys: ElkLayoutOptions = {
    'elk.some.future.option': widened,
    'elk.another.future.option': 6,
    'elk.third.future.option': true
};

// Widening must not cost the enum-valued options their precision.
// @ts-expect-error 'SIDEWAYS' is not an ELK direction.
export const badEnum: ElkLayoutOptions = { 'elk.direction': 'SIDEWAYS' };
// @ts-expect-error a number must not reach an enum-valued option.
export const numberForEnum: ElkLayoutOptions = { 'elk.direction': 3 };
// `ElkAlgorithm` is open (`(string & {})`), so a custom algorithm still goes through.
export const customAlgorithm: ElkLayoutOptions = { 'elk.algorithm': 'my-custom-algorithm' };

// Nor the sides their shape.
export const sides: ElkLayoutOptions = { 'elk.padding': { left: 10, vertical: 40 }};
// @ts-expect-error `lef` is not a side.
export const misspelledSide: ElkLayoutOptions = { 'elk.padding': { lef: 10 }};

// The per-element option types take both spellings too.
export const nodeOptions: ElkNodeLayoutOptions = { 'elk.padding': { top: 40 }, 'elk.priority': 3 };
export const edgeOptions: ElkEdgeLayoutOptions = { 'elk.priority': 3, 'elk.noLayout': true };
export const portOptions: ElkPortLayoutOptions = { 'elk.port.anchor': { x: 1, y: 2 }, 'elk.noLayout': 'false' };
export const labelOptions: ElkLabelLayoutOptions = { 'elk.edgeLabels.inline': true };

// The options ELK takes a set of enum values for take an array of them, typed against the
// enum - or ELK's own string of them, which nothing checks.
export const setOptions: ElkLayoutOptions = {
    'elk.nodeLabels.placement': ['INSIDE', 'V_TOP', 'H_LEFT'],
    'elk.contentAlignment': ['V_CENTER', 'H_CENTER'],
    'elk.nodeSize.constraints': [],
    'elk.nodeSize.options': ['DEFAULT_MINIMUM_SIZE', 'COMPUTE_PADDING'],
    'elk.portLabels.placement': 'OUTSIDE NEXT_TO_PORT_IF_POSSIBLE'
};
const placement = ['OUTSIDE', 'V_BOTTOM'] as const;
export const readonlySet: StrictElkNodeLayoutOptions = { 'elk.nodeLabels.placement': placement };
export const labelSet: StrictElkLabelLayoutOptions = { 'elk.nodeLabels.placement': ['INSIDE'] };
// @ts-expect-error 'FIXED' is not a node label placement - ELK would ignore the whole set.
export const badSetValue: ElkLayoutOptions = { 'elk.nodeLabels.placement': ['INSIDE', 'FIXED'] };
// @ts-expect-error the values of one option's enum are not another's.
export const otherEnumSetValue: ElkLayoutOptions = { 'elk.nodeSize.constraints': ['INSIDE'] };
// @ts-expect-error the strict spelling takes an array, not ELK's own string.
export const strictSetString: StrictElkLayoutOptions = { 'elk.nodeLabels.placement': 'INSIDE V_TOP' };
// @ts-expect-error the native spelling takes ELK's own string, not an array.
export const nativeSetArray: NativeElkLayoutOptions = { 'elk.nodeLabels.placement': ['INSIDE'] };
