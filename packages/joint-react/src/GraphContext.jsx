import React, { useState, createContext, useContext } from 'react';

export const GraphContext = createContext(null);

export function GraphProvider({ children, graph }) {
    const [graphContext, setGraphContext] = useState(graph);
    return (<GraphContext.Provider value={[graphContext, setGraphContext]}>{children}</GraphContext.Provider>);
}

export function useGraph() {
    const [graph] = useContext(GraphContext);
    return graph;
}
