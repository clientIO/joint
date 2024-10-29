const KingWhite = joint.dia.Element.define('chess.KingWhite', {
    size: { width: 42, height: 38 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g transform="translate(-2,-1)" style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#ffffff; stroke:#000000; stroke-linecap:butt; stroke-linejoin:miter;" />
                <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z " style="fill:#ffffff; stroke:#000000;" />
                <path d="M 11.5,30 C 17,27 27,27 32.5,30" style="fill:none; stroke:#000000;" />
                <path d="M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5" style="fill:none; stroke:#000000;" />
                <path d="M 11.5,37 C 17,34 27,34 32.5,37" style="fill:none; stroke:#000000;" />
            </g>
        </g>
    `
});

const KingBlack = joint.dia.Element.define('chess.KingBlack', {
    size: { width: 42, height: 38 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g transform="translate(-2,-1)" style="fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 22.5,11.63 L 22.5,6" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 25.5,14.5 24.5,12 22.5,12 C 20.5,12 19.5,14.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25" style="fill:#000000;fill-opacity:1; stroke-linecap:butt; stroke-linejoin:miter;" />
                <path d="M 11.5,37 C 17,40.5 27,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 19,16 9.5,13 6.5,19.5 C 3.5,25.5 11.5,29.5 11.5,29.5 L 11.5,37 z " style="fill:#000000; stroke:#000000;" />
                <path d="M 20,8 L 25,8" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
                <path d="M 32,29.5 C 32,29.5 40.5,25.5 38.03,19.85 C 34.15,14 25,18 22.5,24.5 L 22.51,26.6 L 22.5,24.5 C 20,18 9.906,14 6.997,19.85 C 4.5,25.5 11.85,28.85 11.85,28.85" style="fill:none; stroke:#ffffff;" />
                <path d="M 11.5,30 C 17,27 27,27 32.5,30 M 11.5,33.5 C 17,30.5 27,30.5 32.5,33.5 M 11.5,37 C 17,34 27,34 32.5,37" style="fill:none; stroke:#ffffff;" />
            </g>
        </g>
    `
});

const QueenWhite = joint.dia.Element.define('chess.QueenWhite', {
    size: { width: 42, height: 38 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g transform="translate(-1,-1)" style="fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(-1,-1)" />
                <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(15.5,-5.5)" />
                <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(32,-1)" />
                <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(7,-4.5)" />
                <path d="M 9 13 A 2 2 0 1 1  5,13 A 2 2 0 1 1  9 13 z" transform="translate(24,-4)" />
                <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38,14 L 31,25 L 31,11 L 25.5,24.5 L 22.5,9.5 L 19.5,24.5 L 14,10.5 L 14,25 L 7,14 L 9,26 z " style="stroke-linecap:butt;" />
                <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z " style="stroke-linecap:butt;" />
                <path d="M 11.5,30 C 15,29 30,29 33.5,30" style="fill:none;" />
                <path d="M 12,33.5 C 18,32.5 27,32.5 33,33.5" style="fill:none;" />
            </g>
        </g>
    `
});

const QueenBlack = joint.dia.Element.define('chess.QueenBlack', {
    size: { width: 42, height: 38 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g transform="translate(-1,-1)" style="fill:#000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <circle cx="6"    cy="12" r="2.75" />
                <circle cx="14"   cy="9"  r="2.75" />
                <circle cx="22.5" cy="8"  r="2.75" />
                <circle cx="31"   cy="9"  r="2.75" />
                <circle cx="39"   cy="12" r="2.75" />
                <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.9 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.9 L 14,25 L 6.5,13.5 L 9,26 z" style="stroke-linecap:butt; stroke:#000000;" />
                <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 10.5,36 10.5,36 C 9,37.5 11,38.5 11,38.5 C 17.5,39.5 27.5,39.5 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 C 27.5,24.5 17.5,24.5 9,26 z" style="stroke-linecap:butt;" />
                <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" style="fill:none; stroke:#000000; stroke-linecap:butt;" />
                <path d="M 11,29 A 35,35 1 0 1 34,29" style="fill:none; stroke:#ffffff;" />
                <path d="M 12.5,31.5 L 32.5,31.5" style="fill:none; stroke:#ffffff;" />
                <path d="M 11.5,34.5 A 35,35 1 0 0 33.5,34.5" style="fill:none; stroke:#ffffff;" />
                <path d="M 10.5,37.5 A 35,35 1 0 0 34.5,37.5" style="fill:none; stroke:#ffffff;" />
            </g>
        </g>
    `
});

const RookWhite = joint.dia.Element.define('chess.RookWhite', {
    size: { width: 32, height: 34 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
                <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
                <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" style="stroke-linecap:butt;" />
                <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
                <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" style="stroke-linecap:butt; stroke-linejoin:miter;" />
                <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
                <path d="M 11,14 L 34,14" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
            </g>
        </g>
    `
});

const RookBlack = joint.dia.Element.define('chess.RookBlack', {
    size: { width: 32, height: 34 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z " style="stroke-linecap:butt;" />
                <path d="M 12.5,32 L 14,29.5 L 31,29.5 L 32.5,32 L 12.5,32 z " style="stroke-linecap:butt;" />
                <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z " style="stroke-linecap:butt;" />
                <path d="M 14,29.5 L 14,16.5 L 31,16.5 L 31,29.5 L 14,29.5 z " style="stroke-linecap:butt;stroke-linejoin:miter;" />
                <path d="M 14,16.5 L 11,14 L 34,14 L 31,16.5 L 14,16.5 z " style="stroke-linecap:butt;" />
                <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 L 11,14 z " style="stroke-linecap:butt;" />
                <path d="M 12,35.5 L 33,35.5 L 33,35.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                <path d="M 13,31.5 L 32,31.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                <path d="M 14,29.5 L 31,29.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                <path d="M 14,16.5 L 31,16.5" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
                <path d="M 11,14 L 34,14" style="fill:none; stroke:#ffffff; stroke-width:1; stroke-linejoin:miter;" />
            </g>
        </g>
    `
});

const BishopWhite = joint.dia.Element.define('chess.BishopWhite', {
    size: { width: 38, height: 38 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <g style="fill:#ffffff; stroke:#000000; stroke-linecap:butt;">
                    <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
                    <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
                    <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
                </g>
                <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#000000; stroke-linejoin:miter;" />
            </g>
        </g>
    `
});

const BishopBlack = joint.dia.Element.define('chess.BishopBlack', {
    size: { width: 38, height: 38 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:none; fill-rule:evenodd; fill-opacity:1; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <g style="fill:#000000; stroke:#000000; stroke-linecap:butt;">
                    <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.06 9,36 9,36 z" />
                    <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
                    <path d="M 25 8 A 2.5 2.5 0 1 1  20,8 A 2.5 2.5 0 1 1  25 8 z" />
                </g>
                <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" style="fill:none; stroke:#ffffff; stroke-linejoin:miter;" />
            </g>
        </g>
    `
});

const KnightWhite = joint.dia.Element.define('chess.KnightWhite', {
    size: { width: 38, height: 37 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#ffffff; stroke:#000000;" />
                <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#ffffff; stroke:#000000;" />
                <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#000000; stroke:#000000;" />
                <path d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#000000; stroke:#000000;" />
            </g>
        </g>
    `
});

const KnightBlack = joint.dia.Element.define('chess.KnightBlack', {
    size: { width: 38, height: 37 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:none; fill-opacity:1; fill-rule:evenodd; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" style="fill:#000000; stroke:#000000;" />
                <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10" style="fill:#000000; stroke:#000000;" />
                <path d="M 9.5 25.5 A 0.5 0.5 0 1 1 8.5,25.5 A 0.5 0.5 0 1 1 9.5 25.5 z" style="fill:#ffffff; stroke:#ffffff;" />
                <path d="M 15 15.5 A 0.5 1.5 0 1 1  14,15.5 A 0.5 1.5 0 1 1  15 15.5 z" transform="matrix(0.866,0.5,-0.5,0.866,9.693,-5.173)" style="fill:#ffffff; stroke:#ffffff;" />
                <path d="M 24.55,10.4 L 24.1,11.85 L 24.6,12 C 27.75,13 30.25,14.49 32.5,18.75 C 34.75,23.01 35.75,29.06 35.25,39 L 35.2,39.5 L 37.45,39.5 L 37.5,39 C 38,28.94 36.62,22.15 34.25,17.66 C 31.88,13.17 28.46,11.02 25.06,10.5 L 24.55,10.4 z " style="fill:#ffffff; stroke:none;" />
            </g>
        </g>
    `
});

const PawnWhite = joint.dia.Element.define('chess.PawnWhite', {
    size: { width: 28, height: 33 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:#ffffff; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z " />
            </g>
        </g>
    `
});

const PawnBlack = joint.dia.Element.define('chess.PawnBlack', {
    size: { width: 28, height: 33 }
}, {
    markup: joint.util.svg/*xml*/`
        <g @selector="scalable">
            <g style="opacity:1; fill:#000000; fill-opacity:1; fill-rule:nonzero; stroke:#000000; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:miter; stroke-miterlimit:4; stroke-dasharray:none; stroke-opacity:1;">
                <path d="M 22,9 C 19.79,9 18,10.79 18,13 C 18,13.89 18.29,14.71 18.78,15.38 C 16.83,16.5 15.5,18.59 15.5,21 C 15.5,23.03 16.44,24.84 17.91,26.03 C 14.91,27.09 10.5,31.58 10.5,39.5 L 33.5,39.5 C 33.5,31.58 29.09,27.09 26.09,26.03 C 27.56,24.84 28.5,23.03 28.5,21 C 28.5,18.59 27.17,16.5 25.22,15.38 C 25.71,14.71 26,13.89 26,13 C 26,10.79 24.21,9 22,9 z " />
            </g>
        </g>
    `
});

const shapes = {
    ...joint.shapes,
    chess: {
        KingWhite,
        KingBlack,
        QueenWhite,
        QueenBlack,
        RookWhite,
        RookBlack,
        BishopWhite,
        BishopBlack,
        KnightWhite,
        KnightBlack,
        PawnWhite,
        PawnBlack,
    }
};

const Board = joint.dia.Paper.extend({

    options: joint.util.assign(joint.dia.Paper.prototype.options, {

        letters: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'],

        cellViewNamespace: shapes,
        namespace: shapes.chess,

        startup: {
            'a1': 'RookWhite',   'a2': 'PawnWhite', 'a7': 'PawnBlack', 'a8': 'RookBlack',
            'b1': 'KnightWhite', 'b2': 'PawnWhite', 'b7': 'PawnBlack', 'b8': 'KnightBlack',
            'c1': 'BishopWhite', 'c2': 'PawnWhite', 'c7': 'PawnBlack', 'c8': 'BishopBlack',
            'd1': 'QueenWhite',  'd2': 'PawnWhite', 'd7': 'PawnBlack', 'd8': 'QueenBlack',
            'e1': 'KingWhite',   'e2': 'PawnWhite', 'e7': 'PawnBlack', 'e8': 'KingBlack',
            'f1': 'BishopWhite', 'f2': 'PawnWhite', 'f7': 'PawnBlack', 'f8': 'BishopBlack',
            'g1': 'KnightWhite', 'g2': 'PawnWhite', 'g7': 'PawnBlack', 'g8': 'KnightBlack',
            'h1': 'RookWhite',   'h2': 'PawnWhite', 'h7': 'PawnBlack', 'h8': 'RookBlack'
        },

        width: 8 * 50,

        height: 8 * 50,

        gridSize: 1
    }),

    initialize: function() {

        this.model = new joint.dia.Graph({}, { cellNamespace: shapes });

        joint.dia.Paper.prototype.initialize.apply(this, arguments);

        this.on('cell:pointerdown', function(cellView) {

            cellView.model.toFront();
            this._p0 = cellView.model.position();
            this.trigger('piece:touch', cellView.model, this._p2n(this._p0));
        });

        this.on('cell:pointerup', function(cellView) {

            var model = cellView.model;
            var pos = model.position();
            var p0 = this._p0;
            var p1 = g.Point(pos).snapToGrid(50).toJSON();

            model.set('position', p1);

            this.trigger('piece:drop', model, this._p2n(p0), this._p2n(p1), function() {
                model.set('position', p0);
            });
        });

        this.reset();
    },

    reset: function() {

        this.model.resetCells();

        joint.util.forIn(this.options.startup, this.addPiece.bind(this));
    },

    at: function(square) {

        return this.model.findElementsAtPoint(this._mid(this._n2p(square)));
    },

    addPiece: function(piece, square) {

        this.model.addCell(new this.options.namespace[piece]({ position: this._n2p(square) }));
    },

    movePiece: function(from, to, opts) {

        opts = opts || {};

        var pc = this.at(from);

        if (!this.options.animation || opts.animation === false) {

            joint.util.invoke(pc, 'set', 'position', this._n2p(to));

        } else {

            joint.util.invoke(pc, 'transition', 'position', this._n2p(to), {
                valueFunction: joint.util.interpolate.object
            });
        }
    },

    addPointer: function(from, to) {

        var pointer = new joint.shapes.standard.Link({
            source: this._mid(this._n2p(from)),
            target: this._mid(this._n2p(to)),
            z: -1,
            attrs: {
                root: {
                    opacity: .2
                },
                line: {
                    strokeWidth: 4,
                    stroke: 'black',
                    targetMarker: {
                        'type': 'circle',
                        'r': 10
                    }
                }
            }
        });
        pointer.addTo(this.model);
    },

    addPointers: function(from, toArray) {

        var p1 = this._n2p(from);
        var moves = toArray.map(this._n2p.bind(this));
        var groupedMoves = joint.util.groupBy(moves, function(p0) {
            return g.Point(p0).theta(p1);
        });
        joint.util.toArray(groupedMoves).map(function(group) {
            var distance = 0;
            var to = null;
            group.forEach(function(p0) {
                var currentDistance = g.Point(p1).distance(p0);
                if (currentDistance > distance) {
                    distance = currentDistance;
                    to = p0;
                }
            });
            return to;
        }).forEach(function(to) {
            this.addPointer(from, this._p2n(to));
        }, this);
    },

    removePointers: function() {

        joint.util.invoke(this.model.getLinks(), 'remove');
    },

    _p2n: function(p) {

        return this.options.letters[p.x / 50] + (8 - p.y / 50);
    },

    _n2p: function(n) {

        return {
            x: this.options.letters.indexOf(n[0]) * 50,
            y: (8 - n[1]) * 50
        };
    },

    _mid: function(p) {

        return { x: p.x + 25, y: p.y + 25 };
    }

});

// Garbochess integration

const Chessboard = Board.extend({

    playMove: function(transition, mv) {

        var from = window.FormatSquare(mv & 0xFF);
        var to = window.FormatSquare((mv >> 8) & 0xFF);
        var opts = { animation: transition };

        joint.util.invoke(this.at(to), 'remove');

        board.movePiece(from, to, opts);

        if (mv & window.moveflagPromotion) {

            var promote = (function(color) {

                joint.util.invoke(this.at(to), 'remove');
                this.addPiece('Queen' + color, to);

            }).bind(this, (window.g_toMove ? 'White' : 'Black'));

            if (transition) {
                this.listenToOnce(this.model, 'transition:end', promote);
            } else {
                promote();
            }

        } else if (mv & window.moveflagCastleQueen) {

            this.movePiece('a'+ to[1], 'd' + to[1], opts);

        } else if (mv & window.moveflagCastleKing) {

            this.movePiece('h'+ to[1], 'f' + to[1], opts);

        } else if (mv & window.moveflagEPC) {

            joint.util.invoke(this.at(to[0] + from[1]), 'remove');
        }

        var msg = ['message', window.g_moveCount, window.GetMoveSAN(mv), ''];

        window.MakeMove(mv);

        if (window.GenerateValidMoves().length == 0) {

            msg[3] = window.g_inCheck ? !window.g_toMove ? '1 : 0' : '0 : 1' : '½ : ½';

            this.isGameOver = true;
        }

        this.trigger.apply(this, msg);
    },

    getMove: function(from, to) {

        var s1 = from + to;
        var moves = window.GenerateValidMoves();
        while (moves.length > 0) {
            var move = moves.pop();
            var s2 = window.FormatMove(move);
            if (s2 == s1 || s2 == s1 + 'q') return move;
        }
        return null;
    },

    whereToGo: function(from) {

        return window.GenerateValidMoves()
            .map(window.FormatMove)
            .filter(function(move) {
                return !move.lastIndexOf(from);
            }).map(function(mv) {
                return mv.slice(2,4);
            });
    },

    findBestMove: function(callback) {

        window.Search(callback, 99, null);
    }
});

// User interaction

const board = new Chessboard({
    background: {
        image: './background.png',
        repeat: 'repeat'
    },
    el: document.getElementById('board'),
    animation: true
});

board.on('piece:touch', function(piece, from) {

    this.addPointers(from, this.whereToGo(from));
});

board.on('piece:drop', function(piece, from, to, undo) {

    this.removePointers();

    undo();

    var mv = this.getMove(from, to);

    if (mv) {
        this.playMove(false, mv);
        this.isGameOver || this.findBestMove(function(mv) {
            board.playMove(true, mv);
        });
    }
});

board.on('message', function(rnd, mov, res) {

    var text = (rnd % 2 ? '' : (1 + rnd / 2) + '. ') + mov + ' ' + res;
    document.getElementById('message').textContent += text;
});

window.ResetGame();
