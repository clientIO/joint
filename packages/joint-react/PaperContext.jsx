import React, { createContext, useState } from 'react';

export const PaperContext = createContext(null);

export function PaperProvider({ children }) {
    const [paper, setPaper] = useState(null);
    return (<PaperContext.Provider value={[paper, setPaper]}>{children}</PaperContext.Provider>);
}
