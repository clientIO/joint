import React, { useState, createContext } from 'react';

export const GraphContext = createContext(null);

export function GraphProvider({ children, graph }) {
    const [graphContext, setGraphContext] = useState(graph);
    return (<GraphContext.Provider value={[graphContext, setGraphContext]}>{children}</GraphContext.Provider>);
}
