import type { dia } from '@joint/core';
import { createContext } from 'react';

/**
 * ToolsView context provides a tools view instance to its children.
 * @see https://docs.jointjs.com/api/dia/ToolView
 * @group context
 */
export const ToolsViewContext = createContext<dia.ToolsView | undefined>(undefined);
