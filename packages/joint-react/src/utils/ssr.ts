/**
 * Client-safe helpers for detecting a server render. Imports the shim's flag
 * *constant* from the dedicated `@joint/svg-shim/flag` subpath — a single string
 * with zero Node imports — so the browser bundle never pulls the Node-only shim
 * barrel (jsdom, canvas, `node:module`).
 */
import { DOM_SHIM_FLAG } from '@joint/svg-shim/flag';

export { DOM_SHIM_FLAG } from '@joint/svg-shim/flag';

/**
 * Whether the current render is happening on the server (no real browser DOM).
 *
 * True when there is no `document` at all, or when the server DOM shim is
 * installed (a headless `document` exists but React effects still do not run).
 * Evaluated at call time so it reflects the shim being installed after module
 * load.
 * @returns `true` during server-side rendering.
 */
export function isServerEnvironment(): boolean {
  if (typeof document === 'undefined') {
    return true;
  }
  return (globalThis as Record<string, unknown>)[DOM_SHIM_FLAG] === true;
}
