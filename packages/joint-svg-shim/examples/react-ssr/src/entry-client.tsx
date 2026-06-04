/**
 * Client entry. Hydrates the server-rendered page so the JointJS paper becomes
 * the live, interactive instance. With JavaScript disabled this file never runs
 * — and the diagram is still visible (and styled, via the stylesheet `<link>` in
 * `index.html`), because the server shipped it as SVG.
 */
import { StrictMode } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { Page } from './page';

const root = document.querySelector('#root');
if (root) {
  hydrateRoot(
    root,
    <StrictMode>
      <Page />
    </StrictMode>
  );
}
