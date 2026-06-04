/**
 * Side-effect entry (`@joint/svg-shim/install`) that installs the headless DOM
 * shim on import.
 *
 * Import this *first* — before anything that pulls in `@joint/core` — so the shim
 * is in place before the Vectorizer captures its DOM globals at module-eval time.
 * ES modules evaluate dependencies in source order, so a bare
 * `import '@joint/svg-shim/install';` at the top of an SSR entry is enough.
 */
import { installDomShim } from './install-dom-shim';

installDomShim();
