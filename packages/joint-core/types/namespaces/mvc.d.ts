import { mvc } from '../joint';

// Types
export type Dom = mvc.Dom;
export type $Element<T extends Element = Element> = mvc.$Element<T>;
export type $HTMLElement = mvc.$HTMLElement;
export type $SVGElement = mvc.$SVGElement;
export type List<T> = mvc.List<T>;
export type ListIterator<T, TResult> = mvc.ListIterator<T, TResult>;
export type MemoIterator<T, TResult> = mvc.MemoIterator<T, TResult>;
export type _Result<T> = mvc._Result<T>;
export type _StringKey<T> = mvc._StringKey<T>;
export type CombinedModelConstructorOptions<E, M extends mvc.Model<any, any, E> = mvc.Model> = mvc.CombinedModelConstructorOptions<E, M>;
export type ObjectHash = mvc.ObjectHash;
export type ViewBaseEventListener = mvc.ViewBaseEventListener;
export type ModifiedCallback<CallbackArgs extends any[], EventCallback extends mvc.Callback> = mvc.ModifiedCallback<CallbackArgs, EventCallback>;
export type EventHashMap<CallbackArgs extends any[], T extends Record<keyof T, mvc.Callback>> = mvc.EventHashMap<CallbackArgs, T>;
export type Callback = mvc.Callback;

// Interfaces
export type $AnimationOptions = mvc.$AnimationOptions;
export type Event = mvc.Event;
export type TriggeredEvent<TDelegateTarget = any, TData = any, TCurrentTarget = any, TTarget = any> = mvc.TriggeredEvent<TDelegateTarget, TData, TCurrentTarget, TTarget>;
export type AddOptions = mvc.AddOptions;
export type CollectionSetOptions = mvc.CollectionSetOptions;
export type Silenceable = mvc.Silenceable;
export type Validable = mvc.Validable;
export type Parseable = mvc.Parseable;
export type ModelConstructorOptions<TModel extends mvc.Model = mvc.Model> = mvc.ModelConstructorOptions<TModel>;
export type ModelSetOptions = mvc.ModelSetOptions;
export type EventsHash = mvc.EventsHash;
export type EventHandler = mvc.EventHandler;
export type EventMap = mvc.EventMap;
export type Events_On<BaseT> = mvc.Events_On<BaseT>;
export type Events_Off<BaseT> = mvc.Events_Off<BaseT>;
export type Events_Trigger<BaseT> = mvc.Events_Trigger<BaseT>;
export type Events_Listen<BaseT> = mvc.Events_Listen<BaseT>;
export type Events_Stop<BaseT> = mvc.Events_Stop<BaseT>;
export type ViewBaseOptions<TModel extends (mvc.Model | undefined) = mvc.Model, TElement extends Element = HTMLElement> = mvc.ViewBaseOptions<TModel, TElement>;
export type ViewOptions<T extends (mvc.Model | undefined), E extends Element = HTMLElement> = mvc.ViewOptions<T, E>;
export type viewEventData = mvc.viewEventData;

// Constants + merged interfaces
export import Events = mvc.Events;

// Classes
export import EventsMixin = mvc.EventsMixin;
export import ModelBase = mvc.ModelBase;
export import Model = mvc.Model;
export import Collection = mvc.Collection;
export import ViewBase = mvc.ViewBase;
export import View = mvc.View;
export import Listener = mvc.Listener;
