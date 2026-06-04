/**
 * Client-safe registry for the server-side paper renderer.
 *
 * `<Paper>` calls the registered renderer during server rendering to build its
 * diagram markup inline — so `renderToString(<GraphProvider><Paper/></GraphProvider>)`
 * "just works". The renderer itself (which pulls `@joint/core` + `react-dom/server`)
 * lives in `@joint/react/server` and is injected by importing
 * `@joint/react/server`. Keeping it behind this registry means the
 * browser bundle never imports the server renderer.
 *
 * All type imports here are erased at compile time, so this module stays free of
 * runtime `@joint/core` / server dependencies.
 */
import type { ReactNode } from 'react';
import type { dia } from '@joint/core';
import type { GraphStore } from '../store/graph-store';
import type { RenderElement, RenderLink } from '../components/paper/paper.types';
import type { PortalSelector } from '../models/react-paper.types';

/**
 * A graph store with its element/link types erased. The server renderer is generic
 * over any consumer's cell data, so the `any` type arguments are an intentional
 * boundary the renderer treats opaquely.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyGraphStore = GraphStore<any, any>;

/** An element or link renderer with its data type erased — see {@link AnyGraphStore}. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRenderer = RenderElement<any> | RenderLink<any>;

/** Input for the registered server paper renderer. */
export interface ServerPaperRenderOptions {
  /** The graph to render (from the `GraphProvider` store). */
  readonly graph: dia.Graph;
  /** The graph store, used to supply cell contexts to the renderers. */
  readonly graphStore: AnyGraphStore;
  /** Element renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderElement?: RenderElement<any>;
  /** Link renderer. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  readonly renderLink?: RenderLink<any>;
  /** Portal target override. */
  readonly portalSelector?: PortalSelector;
  /** Paper id. */
  readonly paperId: string;
  /** Host width, when known (else derived from content). */
  readonly width?: number;
  /** Host height, when known (else derived from content). */
  readonly height?: number;
  /** Extra `dia.Paper.Options` (grid, background, …). */
  readonly paperOptions?: Partial<dia.Paper.Options>;
}

/** Output of the registered server paper renderer. */
export interface ServerPaperRenderResult {
  /**
   * The diagram as a React node tree. Rendered by the outer `renderToString`, so
   * `renderElement` content renders natively (no nested `renderToStaticMarkup`).
   */
  readonly tree: ReactNode;
  /** Host width used. */
  readonly width: number;
  /** Host height used. */
  readonly height: number;
}

/** Builds a paper's host markup synchronously on the server. */
export type ServerPaperRenderer = (options: ServerPaperRenderOptions) => ServerPaperRenderResult;

let registeredRenderer: ServerPaperRenderer | undefined;

/**
 * Registers the server paper renderer. Called once by `@joint/react/server` at
 * import time.
 * @param renderer - the renderer implementation.
 */
export function registerServerPaperRenderer(renderer: ServerPaperRenderer): void {
  registeredRenderer = renderer;
}

/**
 * The registered server paper renderer, or `undefined` when none is registered
 * (i.e. the server entry was not preloaded — `<Paper>` then renders nothing on
 * the server and mounts on the client as usual).
 * @returns the registered renderer, if any.
 */
export function getServerPaperRenderer(): ServerPaperRenderer | undefined {
  return registeredRenderer;
}
