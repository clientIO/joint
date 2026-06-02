/**
 * Server entry for the React SSR example.
 *
 * `@joint/react/server` is imported FIRST — before anything that pulls in
 * `@joint/core` (i.e. before `./page` → `./diagram`) — so the headless DOM shim
 * (`@joint/svg-shim`) is installed and the server paper renderer is registered
 * before joint-core is evaluated. Each `render()` then `renderToString`s the
 * page and `<Paper>` emits the full diagram SVG inline.
 */
import '@joint/react/server';

import { renderToString } from 'react-dom/server';
import { Page } from './page';

/** Render the full page to an HTML string for the SSR document shell. */
export function render(): string {
  return renderToString(<Page />);
}
