import type { RefObject } from 'react';
import type { dia } from '@joint/core';

/**
 * Identifies which paper a paper-targeting hook should resolve: a registered
 * paper id, a React ref to a paper, or a `dia.Paper` instance directly. These
 * hooks never throw — an unresolved target falls back to the current Paper
 * context or the default paper.
 * @see {@link useOnPaperEvents}
 * @see {@link useOnElementsMeasured}
 * @group Types
 */
export type PaperTarget = string | RefObject<dia.Paper | null> | dia.Paper;
