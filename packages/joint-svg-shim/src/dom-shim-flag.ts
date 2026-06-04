/**
 * Global flag the DOM shim sets on `globalThis` once installed. It lets a server
 * render be detected even when a headless `document` exists — so
 * `typeof document === 'undefined'` alone is not enough. Shared by the shim
 * (which sets it) and any server-detection check (which reads it), so they agree
 * on the key.
 */
export const DOM_SHIM_FLAG = '__JOINTJS_SVG_SHIM__';
