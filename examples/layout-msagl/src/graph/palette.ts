const nord = {
    polarNight0: '#2E3440',
    polarNight1: '#3B4252',
    polarNight2: '#434C5E',
    polarNight3: '#4C566A',
    frost1: '#8FBCBB',
    frost2: '#88C0D0',
    frost3: '#81A1C1',
    frost4: '#5E81AC',
    aurora1: '#BF616A',
    aurora2: '#D08770',
    aurora3: '#EBCB8B',
    aurora4: '#A3BE8C',
    aurora5: '#B48EAD',
    snow1: '#ECEFF4',
    snow2: '#E5E9F0',
    snow3: '#D8DEE9'
};

export const paletteLibrary = {
    canopy: [
        nord.frost4,
        nord.frost3,
        nord.frost2,
        nord.aurora4,
        nord.aurora3,
        nord.aurora2,
        nord.aurora1,
        nord.aurora5
    ],
    data: [
        nord.frost4,
        nord.frost3,
        nord.frost2,
        nord.frost1,
        nord.snow3,
        nord.aurora5,
        nord.aurora2
    ],
    network: [
        nord.frost1,
        nord.aurora4,
        nord.aurora3,
        nord.aurora5,
        nord.aurora1,
        nord.snow3
    ],
    loop: [
        nord.aurora1,
        nord.aurora2,
        nord.aurora3,
        nord.aurora4,
        nord.aurora5,
        nord.frost2
    ],
    matrix: [
        nord.frost4,
        nord.frost3,
        nord.aurora1,
        nord.aurora2,
        nord.aurora5,
        nord.aurora3
    ],
    feedback: [
        nord.frost2,
        nord.frost1,
        nord.aurora1,
        nord.aurora5,
        nord.aurora4,
        nord.aurora3
    ],
    nested: [
        nord.frost4,
        nord.aurora4,
        nord.aurora3,
        nord.aurora2,
        nord.aurora5,
        nord.aurora1,
        nord.snow2
    ]
};

export const defaultFallbackColor = '#5E81AC';
