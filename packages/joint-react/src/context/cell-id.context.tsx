import type { dia } from '@joint/core';
import { createContext } from 'react';

/**
 * Context get stored cell id inside `renderElement` function.
 * @internal
 * @group context
 */
export const CellIdContext = createContext<dia.Cell.ID | undefined>(undefined);
