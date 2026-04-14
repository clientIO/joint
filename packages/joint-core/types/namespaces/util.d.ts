import type * as dia from './dia';
import type * as g from './g';
import type * as attributes from './attributes';
import type * as mvc from './mvc';
import type { DOMElement } from '../common';

export function cloneCells(cells: dia.Cell[]): { [id: string]: dia.Cell };

export function isCalcExpression(value: any): boolean;

export function evalCalcFormula(formula: string, rect: g.PlainRect): number;

export function evalCalcExpression(expression: string, rect: g.PlainRect): string;

export function hashCode(str: string): string;

export function getByPath(object: { [key: string]: any }, path: string | string[], delim?: string): any;

export function setByPath(object: { [key: string]: any }, path: string | string[], value: any, delim?: string): any;

export function unsetByPath(object: { [key: string]: any }, path: string | string[], delim?: string): any;

export function flattenObject(object: { [key: string]: any }, delim?: string, stop?: (node: any) => boolean): any;

export function uuid(): string;

export function svg(strings: TemplateStringsArray, ...expressions: any): dia.MarkupJSON;

export function guid(obj?: { [key: string]: any }): string;

export function toKebabCase(str: string): string;

export function normalizeEvent(evt: dia.Event): dia.Event;

export function nextFrame(callback: () => void, context?: { [key: string]: any }, ...args: any[]): number;

export function cancelFrame(requestId: number): void;

export function isPercentage(val: any): boolean;

export function parseCssNumeric(val: any, restrictUnits: string | string[]): { value: number, unit?: string } | null;

export type BreakTextOptions = {
    svgDocument?: SVGElement;
    separator?: string | any;
    eol?: string;
    ellipsis?: boolean | string;
    hyphen?: string | RegExp;
    maxLineCount?: number;
    preserveSpaces?: boolean;
}

export type BreakTextFunction = (
    text: string,
    size: { width: number, height?: number },
    attrs?: attributes.NativeSVGAttributes,
    opt?: BreakTextOptions
) => string;

export var breakText: BreakTextFunction;

export function sanitizeHTML(html: string): string;

export function downloadBlob(blob: Blob, fileName: string): void;

export function downloadDataUri(dataUri: string, fileName: string): void;

export function dataUriToBlob(dataUri: string): Blob;

export function imageToDataUri(url: string, callback: (err: Error | null, dataUri: string) => void): void;

export function getElementBBox(el: DOMElement): dia.BBox;

export function sortElements(
    elements: mvc.$Element,
    comparator: (a: DOMElement, b: DOMElement) => number
): DOMElement[];

export function setAttributesBySelector(el: DOMElement, attrs: { [selector: string]: { [attribute: string]: any }}): void;

export function normalizeSides(sides: dia.Sides): dia.PaddingJSON;

export function template(html: string): (data: any) => string;

export function toggleFullScreen(el?: DOMElement): void;

export function objectDifference(object: object, base: object, opt?: { maxDepth?: number }): object;

export interface DOMJSONDocument {
    fragment: DocumentFragment;
    selectors: { [key: string]: DOMElement };
    groupSelectors: { [key: string]: DOMElement[] };
}

export function parseDOMJSON(json: dia.MarkupJSON): DOMJSONDocument;

export namespace timing {

    type TimingFunction = (time: number) => number;

    export var linear: TimingFunction;
    export var quad: TimingFunction;
    export var cubic: TimingFunction;
    export var inout: TimingFunction;
    export var exponential: TimingFunction;
    export var bounce: TimingFunction;

    export function reverse(f: TimingFunction): TimingFunction;

    export function reflect(f: TimingFunction): TimingFunction;

    export function clamp(f: TimingFunction, min?: number, max?: number): TimingFunction;

    export function back(s?: number): TimingFunction;

    export function elastic(x?: number): TimingFunction;
}

export namespace interpolate {

    type InterpolateFunction<T> = (start: T, end: T) => ((time: number) => T);

    export var number: InterpolateFunction<number>;
    export var object: InterpolateFunction<{ [key: string]: any }>;
    export var hexColor: InterpolateFunction<string>;
    export var unit: InterpolateFunction<string>;
}

export namespace filter {

    interface FilterArgumentsMap {
        'outline': {
            color?: string;
            opacity?: number;
            margin?: number;
            width?: number;
        };
        'highlight': {
            color?: string;
            blur?: number;
            opacity?: number;
            width?: number;
        };
        'blur': {
            x?: number;
            y?: number;
        };
        'dropShadow': {
            dx?: number;
            dy?: number;
            opacity?: number;
            color?: string;
            blur?: number;
        };
        'grayscale': {
            amount?: number;
        };
        'sepia': {
            amount?: number;
        };
        'saturate': {
            amount?: number;
        };
        'hueRotate': {
            angle?: number;
        };
        'invert': {
            amount?: number;
        };
        'brightness': {
            amount?: number;
        };
        'contrast': {
            amount?: number;
        };
    }

    type FilterFunction<K extends keyof FilterArgumentsMap> = (args: FilterArgumentsMap[K]) => string;
    interface FilterJSON<K extends keyof FilterArgumentsMap> {
        name: K;
        id?: string;
        args?: FilterArgumentsMap[K];
        attrs?: attributes.NativeSVGAttributes;
    }

    export var outline: FilterFunction<'outline'>;
    export var highlight: FilterFunction<'highlight'>;
    export var blur: FilterFunction<'blur'>;
    export var dropShadow: FilterFunction<'dropShadow'>;
    export var grayscale: FilterFunction<'grayscale'>;
    export var sepia: FilterFunction<'sepia'>;
    export var saturate: FilterFunction<'saturate'>;
    export var hueRotate: FilterFunction<'hueRotate'>;
    export var invert: FilterFunction<'invert'>;
    export var brightness: FilterFunction<'brightness'>;
    export var contrast: FilterFunction<'contrast'>;
}

export namespace format {

    interface NumberLocale {
        currency: [string, string];
        decimal: string;
        thousands: string;
        grouping: number[];
    }

    export function number(specifier: string, value: number, locale?: NumberLocale): string;

    export function string(str: string, value: string): string;

    export function convert(type: string, value: number, precision: number): string;

    export function round(value: number, precision?: number): number;

    export function precision(value: number, precision: number): number;

    export function prefix(value: number, precision: number): { scale: (d: number) => number, symbol: string } | undefined;
}

// LODASH FUNCTIONS:

export type NotVoid = {} | null | undefined; // the `any` type without `void` and `never`

export type Collection = object | any[]; // an object or an array

export type PropertyPath = string | string[];

export type IterateeFunction<T> = (value: T) => NotVoid;

export interface Cancelable {
    cancel(): void;
    flush(): void;
}

export type SourceObjectsOptionalFinalCustomizer = Array<object | CustomizerFunction>; // typescript cannot express "any number of objects optionally followed by CustomizerFunction"
export type CustomizerFunction = (objValue: any, srcValue: any, key: string, object: any, source: any, stack: any) => NotVoid;

/** @deprecated do not use */
export function mixin(destinationObject: object, ...sourceObjects: object[]): object;

/** @deprecated do not use */
export function deepMixin(destinationObject: object, ...sourceObjects: object[]): object;

/** @deprecated do not use */
export function assign(destinationObject: object, ...sourceObjects: object[]): object;

/** @deprecated use joint.util.defaults */
export function supplement(destinationObject: object, ...sourceObjects: object[]): object;

/** @deprecated use joint.util.defaultsDeep */
export function deepSupplement(destinationObject: object, ...sourceObjects: object[]): object;

export function defaults(destinationObject: object, ...sourceObjects: object[]): object;

export function defaultsDeep(destinationObject: object, ...sourceObjects: object[]): object;

export function invoke(collection: Collection, methodPath: PropertyPath, args?: any[]): any[];
export function invoke<ArgsT>(collection: Collection, functionToInvokeForAll: IterateeFunction<ArgsT>, ...args: ArgsT[]): any[];

export function invokeProperty(object: object, propertyPath: PropertyPath, args?: any[]): any;

export function sortedIndex<T>(sortedArray: T[], valueToInsert: T, iteratee?: IterateeFunction<T>): number;

export function uniq<T>(array: Array<T> | null | undefined, iteratee?: IterateeFunction<T>): T[];

export function clone<T>(value: T): T;

export function cloneDeep<T>(value: T): T;

export function isEmpty(value: any): boolean;

export function isEqual(value: any, otherValue: any): boolean;

export function isFunction(value: any): boolean;

export function isPlainObject(value: any): boolean;

export function toArray(value: any): any[];

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function debounce<T extends Function>(func: T, wait?: number, options?: { leading?: boolean, maxWait?: number, trailing?: boolean }): T & Cancelable;

export function groupBy(collection: Collection, iteratee?: IterateeFunction<any>): object;

export function sortBy<T>(collection: object, iteratee?: IterateeFunction<any>[] | IterateeFunction<any>): any[];
export function sortBy<T>(collection: T[], iteratee?: IterateeFunction<T>[] | IterateeFunction<T>): any[];

export function flattenDeep(array: any[]): any[];

export function without<T>(array: T[], ...values: T[]): T[];

export function difference<T>(array: T[], ...excludedValuesArrays: T[][]): T[];

export function intersection<T>(...arrays: T[][]): T[];

export function union<T>(...arrays: T[][]): T[];

export function has(object: object, path: PropertyPath): boolean;

export function result(object: object, propertyPath: PropertyPath, defaultValue?: any): any;

export function omit(object: object, ...propertyPathsToOmit: PropertyPath[]): object;

export function pick(object: object, ...propertyPathsToPick: PropertyPath[]): object;

export function bindAll(object: object, methodNames: string | string[]): object;

export function forIn<T>(object: T, iteratee?: (value: any, key: string, iterable: object) => void | boolean): void;

export function camelCase(string: string): string;

export function uniqueId(prefix?: string | number): string;

export function getRectPoint(rect: dia.BBox, position: dia.PositionName): g.Point;

export function merge(destinationObject: object, ...args: any[]): object;

export type MergeCustomizer = (value: any, srcValue: any, key: string, object: any, source: any, stack: any) => any;

// ADDITIONAL SIMPLE UTIL FUNCTIONS:

export function isBoolean(value: any): boolean;

export function isObject(value: any): boolean;

export function isNumber(value: any): boolean;

export function isString(value: any): boolean;

export function noop(): void;
