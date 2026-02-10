export const sizes = {
    /** Width of a person symbol (rect, ellipse, diamond) */
    symbolWidth: 50,
    /** Height of a person symbol */
    symbolHeight: 50,
    /** Inset of the deceased X from the symbol edges */
    deceasedCrossInset: 4,
    /** Padding between adopted brackets and the symbol */
    adoptedBracketPadding: 6,
    /** Horizontal gap between partners in a couple */
    coupleGap: 20,
    /** Horizontal spacing between nodes (dagre nodeSep) */
    symbolGap: 20,
    /** Vertical spacing between generations (dagre rankSep) */
    levelGap: 70,
    /** Padding around the diagram when fitting to content */
    paperPadding: 50,
    /** How far the name label text wrap extends beyond the symbol on each side */
    nameWrapOverlap: 5,
    /** Margin for shifted name labels in orthogonal mode */
    nameMargin: 6,
    /** Maximum number of lines for a name label before ellipsis */
    nameMaxLineCount: 2,
};

export const linkStyleOverrides = {
    fan: {},
    orthogonal: {
        coupleGap: 30,
        levelGap: 100,
        nameMaxLineCount: 4,
    },
} as const satisfies Record<string, Partial<typeof sizes>>;

export const defaultZIndex = {
    person: 1,
    parentChildLink: 2,
    mateLink: 3,
    identicalLink: 3,
    focusedOffset: 10,
};

export const colors = {
    dark: '#0F1108',
    white: '#fff',
    maleFill: '#a8d4f0',
    maleStroke: '#4a90c4',
    femaleFill: '#f0a8c8',
    femaleStroke: '#c44a80',
    unknownFill: '#d0d0d0',
    unknownStroke: '#808080',
    identicalStroke: '#c44a80',
    mateStroke: '#c44a80',
    paperBackground: '#f3f7f0',
    highlightStroke: '#e2e8dd',
};
