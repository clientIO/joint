import type { RefObject } from 'react';
import type { dia } from '@joint/core';

/**
 * Identifies a Paper instance — a registered id, a React ref, or the Paper
 * itself. Paper-targeting hooks never throw; an unresolved target simply means
 * "use the current Paper context or the default paper".
 * @group Types
 */
export type PaperTarget = string | RefObject<dia.Paper | null> | dia.Paper;
