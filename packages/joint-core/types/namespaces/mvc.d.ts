import type * as dia from './dia';
import type { Vectorizer } from '../vectorizer';
import type { DOMElement, NativeEvent } from '../common';

export type Dom = unknown;
// The following types represent the DOM elements that can be passed to the
// $() function.
export type $Element<T extends DOMElement = DOMElement> = string | T | T[] | Dom;
export type $HTMLElement = $Element<HTMLElement>;
export type $SVGElement = $Element<SVGElement>;

export interface $AnimationOptions {
    duration?: number;
    delay?: number;
    easing?: string;
    complete?: (this: DOMElement) => void;
}

export interface Event {
    // Event
    bubbles: boolean | undefined;
    cancelable: boolean | undefined;
    eventPhase: number | undefined;
    // UIEvent
    detail: number | undefined;
    view: Window | undefined;
    // MouseEvent
    button: number | undefined;
    buttons: number | undefined;
    clientX: number | undefined;
    clientY: number | undefined;
    offsetX: number | undefined;
    offsetY: number | undefined;
    pageX: number | undefined;
    pageY: number | undefined;
    screenX: number | undefined;
    screenY: number | undefined;
    /** @deprecated */
    toElement: DOMElement | undefined;
    // PointerEvent
    pointerId: number | undefined;
    pointerType: string | undefined;
    // KeyboardEvent
    /** @deprecated */
    char: string | undefined;
    /** @deprecated */
    charCode: number | undefined;
    key: string | undefined;
    /** @deprecated */
    keyCode: number | undefined;
    // TouchEvent
    changedTouches: TouchList | undefined;
    targetTouches: TouchList | undefined;
    touches: TouchList | undefined;
    // MouseEvent, KeyboardEvent
    which: number | undefined;
    // MouseEvent, KeyboardEvent, TouchEvent
    altKey: boolean | undefined;
    ctrlKey: boolean | undefined;
    metaKey: boolean | undefined;
    shiftKey: boolean | undefined;
    timeStamp: number;
    type: string;
    isDefaultPrevented(): boolean;
    isImmediatePropagationStopped(): boolean;
    isPropagationStopped(): boolean;
    preventDefault(): void;
    stopImmediatePropagation(): void;
    stopPropagation(): void;
}

export interface TriggeredEvent<
    TDelegateTarget = any,
    TData = any,
    TCurrentTarget = any,
    TTarget = any
> extends Event {
    currentTarget: TCurrentTarget;
    delegateTarget: TDelegateTarget;
    target: TTarget;
    data: TData;
    namespace?: string | undefined;
    originalEvent?: NativeEvent | undefined;
    result?: any;
}

export type List<T> = ArrayLike<T>;
export type ListIterator<T, TResult> = (value: T, index: number, collection: List<T>) => TResult;
export type MemoIterator<T, TResult> = (prev: TResult, curr: T, indexOrKey: any, list: T[]) => TResult;

export type _Result<T> = T | (() => T);
export type _StringKey<T> = keyof T & string;

export interface AddOptions extends Silenceable {
    at?: number | undefined;
    merge?: boolean | undefined;
    sort?: boolean | undefined;
}

export interface CollectionSetOptions extends Parseable, Silenceable {
    add?: boolean | undefined;
    remove?: boolean | undefined;
    merge?: boolean | undefined;
    at?: number | undefined;
    sort?: boolean | undefined;
}

export interface Silenceable {
    silent?: boolean | undefined;
}

export interface Validable {
    validate?: boolean | undefined;
}

export interface Parseable {
    parse?: boolean | undefined;
}

export interface ModelConstructorOptions<TModel extends Model = Model> extends ModelSetOptions, Parseable {
    collection?: Collection<TModel> | undefined;
    eventPrefix?: string | undefined;
}

export type CombinedModelConstructorOptions<E, M extends Model<any, any, E> = Model> = ModelConstructorOptions<M> & E;

export interface ModelSetOptions extends Silenceable, Validable {}

export type ObjectHash = Record<string, any>;

/**
 * DOM events (used in the events property of a View)
 */
export interface EventsHash {
    [selector: string]: string | { (eventObject: TriggeredEvent): void };
}

/**
 * JavaScript events (used in the methods of the Events interface)
 */
export interface EventHandler {
    (...args: any[]): void;
}
export interface EventMap {
    [event: string]: EventHandler;
}

export const Events: Events;
export interface Events extends EventsMixin {}

/**
 * Helper shorthands for classes that implement the Events interface.
 * Define your class like this:
 *
 *
 * class YourClass implements Events {
 *     on: Events_On<YourClass>;
 *     off: Events_Off<YourClass>;
 *     trigger: Events_Trigger<YourClass>;
 *     bind: Events_On<YourClass>;
 *     unbind: Events_Off<YourClass>;
 *
 *     once: Events_On<YourClass>;
 *     listenTo: Events_Listen<YourClass>;
 *     listenToOnce: Events_Listen<YourClass>;
 *     stopListening: Events_Stop<YourClass>;
 *
 *     // ... (other methods)
 * }
 *
 * Object.assign(YourClass.prototype, Events);  // can also use _.extend
 *
 * If you are just writing a class type declaration that doesn't already
 * extend some other base class, you can use the EventsMixin instead;
 * see below.
 */
export interface Events_On<BaseT> {
    <T extends BaseT>(this: T, eventName: string, callback: EventHandler, context?: any): T;
    <T extends BaseT>(this: T, eventMap: EventMap, context?: any): T;
}
export interface Events_Off<BaseT> {
    <T extends BaseT>(this: T, eventName?: string | null, callback?: EventHandler | null, context?: any): T;
}
export interface Events_Trigger<BaseT> {
    <T extends BaseT>(this: T, eventName: string, ...args: any[]): T;
}
export interface Events_Listen<BaseT> {
    <T extends BaseT>(this: T, object: any, events: string, callback: EventHandler): T;
    <T extends BaseT>(this: T, object: any, eventMap: EventMap): T;
}
export interface Events_Stop<BaseT> {
    <T extends BaseT>(this: T, object?: any, events?: string, callback?: EventHandler): T;
}

/**
 * Helper to avoid code repetition in type declarations.
 * Events cannot be extended, hence a separate abstract
 * class with a different name. Both classes and interfaces can
 * extend from this helper class to reuse the signatures.
 *
 * For class type declarations that already extend another base
 * class, and for actual class definitions, please see the
 * Events_* interfaces above.
 */
export abstract class EventsMixin implements Events {
    on(eventName: string, callback: EventHandler, context?: any): this;
    on(eventMap: EventMap, context?: any): this;
    off(eventName?: string | null, callback?: EventHandler | null, context?: any): this;
    trigger(eventName: string, ...args: any[]): this;
    bind(eventName: string, callback: EventHandler, context?: any): this;
    bind(eventMap: EventMap, context?: any): this;
    unbind(eventName?: string, callback?: EventHandler, context?: any): this;

    once(events: string, callback: EventHandler, context?: any): this;
    once(eventMap: EventMap, context?: any): this;
    listenTo(object: any, events: string, callback: EventHandler): this;
    listenTo(object: any, eventMap: EventMap): this;
    listenToOnce(object: any, events: string, callback: EventHandler): this;
    listenToOnce(object: any, eventMap: EventMap): this;
    stopListening(object?: any, events?: string, callback?: EventHandler): this;
}

export class ModelBase extends EventsMixin {
    toJSON(options?: any): any;
}

/**
 * E - Extensions to the model constructor options. You can accept additional constructor options
 * by listing them in the E parameter.
 */
export class Model<T extends ObjectHash = any, S = ModelSetOptions, E = any> extends ModelBase implements Events {
    /**
     * Do not use, prefer TypeScript's extend functionality.
     */
    static extend(properties: any, classProperties?: any): any;

    attributes: Partial<T>;
    changed: Partial<T>;
    cidPrefix: string;
    cid: string;
    collection: Collection<this>;

    private _changing: boolean;
    private _previousAttributes: Partial<T>;
    private _pending: boolean;

    /**
     * Default attributes for the model. It can be an object hash or a method returning an object hash.
     * For assigning an object hash, do it like this: this.defaults = <any>{ attribute: value, ... };
     * That works only if you set it in the constructor or the initialize method.
     */
    defaults(): Partial<T>;
    id: string | number;
    idAttribute: string;
    validationError: any;

    /**
     * For use with models as ES classes. If you define a preinitialize
     * method, it will be invoked when the Model is first created, before
     * any instantiation logic is run for the Model.
     */
    preinitialize(attributes?: T, options?: CombinedModelConstructorOptions<E, this>): void;

    constructor(attributes?: T, options?: CombinedModelConstructorOptions<E>);
    initialize(attributes?: T, options?: CombinedModelConstructorOptions<E, this>): void;


    /**
     * For strongly-typed access to attributes, use the `get` method only privately in public getter properties.
     * @example
     * get name(): string {
     *    return super.get("name");
     * }
     */
    get<A extends _StringKey<T>>(attributeName: A): T[A] | undefined;

    /**
     * For strongly-typed assignment of attributes, use the `set` method only privately in public setter properties.
     * @example
     * set name(value: string) {
     *    super.set("name", value);
     * }
     */
    set<A extends _StringKey<T>>(attributeName: A, value?: T[A], options?: S): this;
    set(attributeName: Partial<T>, options?: S): this;
    set<A extends _StringKey<T>>(attributeName: A | Partial<T>, value?: T[A] | S, options?: S): this;

    /**
     * Return an object containing all the attributes that have changed, or
     * false if there are no changed attributes. Useful for determining what
     * parts of a view need to be updated and/or what attributes need to be
     * persisted to the server. Unset attributes will be set to undefined.
     * You can also pass an attributes object to diff against the model,
     * determining if there *would be* a change.
     */
    changedAttributes(attributes?: Partial<T>): Partial<T> | false;
    clear(options?: Silenceable): this;
    clone(): Model;
    escape(attribute: _StringKey<T>): string;
    has(attribute: _StringKey<T>): boolean;
    hasChanged(attribute?: _StringKey<T>): boolean;
    isValid(options?: any): boolean;
    previous<A extends _StringKey<T>>(attribute: A): T[A] | null | undefined;
    previousAttributes(): Partial<T>;
    unset(attribute: _StringKey<T>, options?: Silenceable): this;
    validate(attributes: Partial<T>, options?: any): any;
    private _validate(attributes: Partial<T>, options: any): boolean;

}

export class Collection<TModel extends Model = Model> extends ModelBase implements Events {
    /**
     * Do not use, prefer TypeScript's extend functionality.
     */
    static extend(properties: any, classProperties?: any): any;

    model: new (...args: any[]) => TModel;
    models: TModel[];
    length: number;

    /**
     * For use with collections as ES classes. If you define a preinitialize
     * method, it will be invoked when the Collection is first created and
     * before any instantiation logic is run for the Collection.
     */
    preinitialize(models?: TModel[] | Array<Record<string, any>>, options?: any): void;

    constructor(models?: TModel[] | Array<Record<string, any>>, options?: any);
    initialize(models?: TModel[] | Array<Record<string, any>>, options?: any): void;


    /**
     * Specify a model attribute name (string) or function that will be used to sort the collection.
     */
    comparator:
        | string
        | { bivarianceHack(element: TModel): number | string }['bivarianceHack']
        | { bivarianceHack(compare: TModel, to?: TModel): number }['bivarianceHack'];

    add(model: {} | TModel, options?: AddOptions): TModel;
    add(models: Array<{} | TModel>, options?: AddOptions): TModel[];
    at(index: number): TModel;
    /**
     * Get a model from a collection, specified by an id, a cid, or by passing in a model.
     */
    get(id: number | string | Model): TModel;
    has(key: number | string | Model): boolean;
    clone(): this;
    push(model: TModel, options?: AddOptions): TModel;
    pop(options?: Silenceable): TModel;
    remove(model: {} | TModel, options?: Silenceable): TModel;
    remove(models: Array<{} | TModel>, options?: Silenceable): TModel[];
    reset(models?: Array<{} | TModel>, options?: Silenceable): TModel[];

    /**
     *
     * The set method performs a "smart" update of the collection with the passed list of models.
     * If a model in the list isn't yet in the collection it will be added; if the model is already in the
     * collection its attributes will be merged; and if the collection contains any models that aren't present
     * in the list, they'll be removed. All of the appropriate "add", "remove", and "change" events are fired as
     * this happens. Returns the touched models in the collection. If you'd like to customize the behavior, you can
     * disable it with options: {add: false}, {remove: false}, or {merge: false}.
     * @param models
     * @param options
     */
    set(models?: Array<{} | TModel>, options?: CollectionSetOptions): TModel[];
    shift(options?: Silenceable): TModel;
    sort(options?: Silenceable): this;
    unshift(model: TModel, options?: AddOptions): TModel;
    modelId(attrs: any): any;

    values(): Iterator<TModel>;
    keys(): Iterator<any>;
    entries(): Iterator<[any, TModel]>;
    [Symbol.iterator](): Iterator<TModel>;

    private _prepareModel(attributes?: any, options?: any): any;
    private _removeReference(model: TModel): void;
    private _onModelEvent(event: string, model: TModel, collection: Collection<TModel>, options: any): void;
    private _isModel(obj: any): obj is Model;

    /**
     * Return a shallow copy of this collection's models, using the same options as native Array#slice.
     */
    slice(min?: number, max?: number): TModel[];

    // array methods

    each(iterator: ListIterator<TModel, void>, context?: any): void;
    find(iterator: ListIterator<TModel, boolean>, context?: any): TModel | undefined;
    findIndex(iterator: ListIterator<TModel, boolean>, context?: any): number;
    filter(iterator: ListIterator<TModel, boolean>, context?: any): TModel[];
    first(): TModel;
    includes(value: TModel): boolean;
    isEmpty(): boolean;
    last(): TModel;
    map<TResult>(iterator: ListIterator<TModel, TResult>, context?: any): TResult[];
    reduce<TResult>(iterator: MemoIterator<TModel, TResult>, memo?: TResult): TResult;
    sortBy(iterator?: ListIterator<TModel, any>, context?: any): TModel[];
    sortBy(iterator: string, context?: any): TModel[];
    toArray(): TModel[];

}

export interface ViewBaseOptions<TModel extends (Model | undefined) = Model, TElement extends DOMElement = HTMLElement> {
    model?: TModel | undefined;
    // TODO: quickfix, this can't be fixed easy. The collection does not need to have the same model as the parent view.
    collection?: Collection<any> | undefined; // was: Collection<TModel>;
    el?: $Element<TElement> | string | undefined;
    id?: string | undefined;
    cid?: string | undefined;
    attributes?: Record<string, any> | undefined;
    className?: string | undefined;
    tagName?: string | undefined;
    events?: _Result<EventsHash> | undefined;
}

export type ViewBaseEventListener = (event: Event) => void;

export class ViewBase<TModel extends (Model | undefined) = Model, TElement extends DOMElement = HTMLElement> extends EventsMixin implements Events {
    /**
     * Do not use, prefer TypeScript's extend functionality.
     */
    static extend(properties: any, classProperties?: any): any;

    /**
     * For use with views as ES classes. If you define a preinitialize
     * method, it will be invoked when the view is first created, before any
     * instantiation logic is run.
     */
    preinitialize(options?: ViewBaseOptions<TModel, TElement>): void;

    constructor(options?: ViewBaseOptions<TModel, TElement>);
    initialize(options?: ViewBaseOptions<TModel, TElement>): void;

    /**
     * Events hash or a method returning the events hash that maps events/selectors to methods on your View.
     * For assigning events as object hash, do it like this: `this.events = <any>{ "event:selector": callback, ... };`
     * That works only if you set it in the constructor or the initialize method.
     */
    events(): EventsHash;

    // A conditional type used here to prevent `TS2532: Object is possibly 'undefined'`
    model: TModel extends Model ? TModel : undefined;
    collection: Collection<any>;
    setElement(element: $Element<TElement>): this;
    id?: string | undefined;
    cid: string;
    className?: string | undefined;
    tagName: string;

    el: TElement;
    attributes: Record<string, any>;
    /** @deprecated use `el` instead */
    $el: Dom;
    /** @deprecated use `el.querySelector()` instead */
    $(selector: string): Dom;
    render(): this;
    remove(): this;
    delegateEvents(events?: _Result<EventsHash>): this;
    delegate(eventName: string, selector: string, listener: ViewBaseEventListener): this;
    undelegateEvents(): this;
    undelegate(eventName: string, selector?: string, listener?: ViewBaseEventListener): this;

    protected _removeElement(): void;
    protected _setElement(el: $Element<TElement>): void;
    protected _createElement(tagName: string): void;
    protected _ensureElement(): void;
    protected _setAttributes(attributes: Record<string, any>): void;
}

export interface ViewOptions<T extends (Model | undefined), E extends DOMElement = HTMLElement> extends ViewBaseOptions<T, E> {
    theme?: string;
    [key: string]: any;
}

export interface viewEventData {
    [key: string]: any;
}

export class View<T extends (Model | undefined), E extends DOMElement = HTMLElement> extends ViewBase<T, E> {

    constructor(opt?: ViewOptions<T, E>);

    UPDATE_PRIORITY: number;
    DETACHABLE: boolean;
    FLAG_INSERT: number;
    FLAG_REMOVE: number;
    FLAG_INIT: number;

    vel: E extends HTMLElement ? null : Vectorizer;

    svgElement: boolean;

    options: ViewOptions<T, E>;

    theme: string;

    themeClassNamePrefix: string;

    defaultTheme: string;

    requireSetThemeOverride: boolean;

    documentEvents?: EventsHash;

    children?: dia.MarkupJSON;

    childNodes?: { [key: string]: DOMElement } | null;

    style?: { [key: string]: any };

    setTheme(theme: string, opt?: { override?: boolean }): this;

    getEventNamespace(): string;

    delegateDocumentEvents(events?: EventsHash, data?: viewEventData): this;

    undelegateDocumentEvents(): this;

    delegateElementEvents(element: DOMElement, events?: EventsHash, data?: viewEventData): this;

    undelegateElementEvents(element: DOMElement): this;

    eventData(evt: dia.Event): viewEventData;
    eventData(evt: dia.Event, data: viewEventData): this;

    stopPropagation(evt: dia.Event): this;
    isPropagationStopped(evt: dia.Event): boolean;

    renderChildren(children?: dia.MarkupJSON): this;

    findAttribute(attributeName: string, node: DOMElement): string | null;

    confirmUpdate(flag: number, opt: { [key: string]: any }): number;

    unmount(): void;

    isMounted(): boolean;

    protected findAttributeNode(attributeName: string, node: DOMElement): DOMElement | null;

    protected init(): void;

    protected onRender(): void;

    protected onSetTheme(oldTheme: string, newTheme: string): void;

    protected onRemove(): void;
}

export type ModifiedCallback<CallbackArgs extends any[], EventCallback extends Callback> = (...args: [...CallbackArgs, ...Parameters<EventCallback>]) => any;

export type EventHashMap<CallbackArgs extends any[], T extends Record<keyof T, Callback>> = {
    [Property in keyof T]?: ModifiedCallback<CallbackArgs, T[Property]>;
};

export type Callback = (...args: any[]) => any;

export class Listener<Args extends any[]> {
    constructor(...callbackArguments: Args);

    callbackArguments: Args;

    listenTo<CB extends Callback>(object: any, evt: string, callback: ModifiedCallback<Args, CB>, context?: any): void;
    listenTo<EventCBMap extends Record<keyof EventCBMap, Callback> = { [eventName: string]: Callback }>(object: any, eventHashMap: EventHashMap<Args, EventCBMap>, context?: any): void;

    stopListening(): void;
}
