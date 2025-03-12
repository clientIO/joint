import type { dia } from '@joint/core';
import { createContext } from 'react';

export const ToolsViewContext = createContext<dia.ToolsView | undefined>(undefined);
