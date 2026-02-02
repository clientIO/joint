import { dia, util, shapes as defaultShapes, highlighters, elementTools } from '@joint/core';
import './styles.css';
const shapes = { ...defaultShapes };

// Paper

const paperContainer = document.getElementById('paper-container');

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    width: '100%',
    height: '100%',
    async: true,
    sorting: dia.Paper.sorting.APPROX,
    background: { color: '#F3F7F6' },
    defaultConnectionPoint: {
        name: 'boundary'
    }
});

paperContainer.appendChild(paper.el);

function addImages(image, x = 0, y = 20) {
    const images = [
        image
            .clone()
            .resize(50, 50)
            .position(x + 50, y),
        image
            .clone()
            .resize(100, 100)
            .position(x + 25, y + 90),
        image
            .clone()
            .resize(150, 150)
            .position(x, y + 230)
    ];
    graph.addCells(images);
    return images;
}

// -------------------------------------------------------------------
// 1. Use the image as is with JointJS built-in image shape. The image
// scales with the model, you can control control the aspect ratio with the `preserveAspectRatio` attribute

// The image by Alpár-Etele Méder
const christmasTreeSVG = `<?xml version="1.0" ?>
    <svg id="Christmas_Tree" version="1.1" viewBox="0 0 24 24" xml:space="preserve"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink">
        <title/>
        <g>
            <polygon points="12,3.5 6.5,9.5 9.5,9.5 5,15 8,15 3.5,20.5 20.5,20.5 16,15 19,15 14.5,9.5 17.5,9.5  " style="fill:#0DB14B;"/>
            <polygon points="12,3.5 6.5,9.5 9.09,9.5  " style="opacity:0.2;fill:#FFFFFF;"/>
            <polygon points="17.5,9.5 12,3.5 14.91,9.5  " style="opacity:0.1;"/>
            <polygon points="8.29,15 10.68,9.5 9.5,9.5 5,15 8,15 3.5,20.5    7.5,20.5 9.88,15  " style="opacity:0.2;fill:#FFFFFF;"/>
            <polygon points="16,15 19,15 14.5,9.5 13.32,9.5 15.71,15 14.12,15 16.5,20.5    20.5,20.5  " style="opacity:0.1;"/>
            <g>
                <circle cx="11.5" cy="8" r="1" style="fill:#FFCF01;"/>
                <circle cx="14" cy="13" r="1" style="fill:#FFCF01;"/>
                <circle cx="10" cy="17" r="1" style="fill:#FFCF01;"/>
                <circle cx="15" cy="18" r="1" style="fill:#FFCF01;"/>
            </g>
            <path d="M10.44,20.5c-0.087,1.145-0.601,2.216-1.44,3h6c-0.839-0.784-1.353-1.855-1.44-3H10.44z   " id="_Path_" style="fill:#9D581F;"/>
            <path d="M10.44,20.5c-0.087,1.145-0.601,2.216-1.44,3h2   c0.312-0.97,0.474-1.981,0.48-3H10.44z" style="opacity:0.2;fill:#FFFFFF;"/>
            <path d="M13.56,20.5h-1c0.006,1.019,0.168,2.03,0.48,3h2   C14.186,22.722,13.657,21.651,13.56,20.5z" style="opacity:0.1;"/>
            <polygon points="12,0.5 12.8,2.13 14.71,2.53 13.3,3.65 13.6,5.44 12,4.59 10.4,5.44 10.7,3.65 9.29,2.53    11.2,2.13  " style="fill:#FFCF01;"/>
            <path d="M20.89,20.18l-3.83-4.68H19c0.276,0.003,0.503-0.218,0.506-0.494   c0.001-0.119-0.04-0.234-0.116-0.326L15.56,10h1.94c0.276,0.002,0.502-0.22,0.503-0.497c0.001-0.127-0.047-0.25-0.133-0.343L14,5   l-0.19-1.12L15,2.92c0.235-0.145,0.308-0.453,0.162-0.688C15.085,2.106,14.956,2.021,14.81,2l-1.67-0.36l-0.69-1.36   c-0.144-0.249-0.462-0.333-0.711-0.189c-0.079,0.046-0.144,0.111-0.189,0.189l-0.69,1.41L9.19,2   C8.917,2.04,8.728,2.294,8.768,2.568C8.79,2.713,8.875,2.842,9,2.92l1.18,0.93L10,5L6.13,9.16C5.942,9.362,5.954,9.679,6.157,9.867   C6.25,9.953,6.373,10.001,6.5,10h1.94l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C4.766,15.46,4.881,15.501,5,15.5h1.94   l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C3.266,20.96,3.381,21.001,3.5,21h6.33c-0.13,0.807-0.528,1.547-1.13,2.1   c-0.221,0.166-0.266,0.479-0.1,0.7C8.694,23.926,8.843,24,9,24h6c0.276,0,0.5-0.224,0.5-0.5c0-0.157-0.074-0.306-0.2-0.4   c-0.602-0.553-1-1.293-1.13-2.1h6.33c0.276,0.003,0.503-0.218,0.506-0.494C21.007,20.387,20.966,20.271,20.89,20.18z M11.3,2.61   c0.149-0.034,0.274-0.133,0.34-0.27L12,1.63l0.35,0.72c0.066,0.137,0.191,0.236,0.34,0.27l0.87,0.19L13,3.26   c-0.144,0.115-0.213,0.299-0.18,0.48l0.13,0.79l-0.71-0.37c-0.144-0.075-0.316-0.075-0.46,0l-0.71,0.37l0.13-0.79   c0.028-0.185-0.049-0.37-0.2-0.48L10.42,2.8L11.3,2.61z M13.89,23h-3.78c0.369-0.616,0.623-1.293,0.75-2h2.26   C13.253,21.708,13.514,22.386,13.89,23z M4.56,20l3.83-4.68c0.177-0.212,0.148-0.527-0.064-0.704C8.234,14.54,8.119,14.499,8,14.5   H6.06l3.83-4.68c0.177-0.212,0.148-0.527-0.064-0.704C9.734,9.04,9.619,8.999,9.5,9H7.64l2.83-3.09c0.053,0.009,0.107,0.009,0.16,0   L12,5.16l1.37,0.72c0.056,0.01,0.114,0.01,0.17,0L16.36,9H14.5c-0.276-0.003-0.503,0.218-0.506,0.494   c-0.001,0.119,0.04,0.234,0.116,0.326l3.83,4.68H16c-0.276-0.003-0.503,0.218-0.506,0.494c-0.001,0.119,0.04,0.234,0.116,0.326   L19.44,20H4.56z" style="fill:#303C42;"/>
            <linearGradient gradientTransform="matrix(1 0 0 -1 0 24)" gradientUnits="userSpaceOnUse" id="SVGID_1_" x1="5.4202" x2="22.4202" y1="14.3604" y2="6.4304">
                <stop offset="0" style="stop-color:#FFFFFF;stop-opacity:0.2"/>
                <stop offset="1" style="stop-color:#FFFFFF;stop-opacity:0"/>
            </linearGradient>
            <path d="M20.89,20.18l-3.83-4.68H19c0.276,0.003,0.503-0.218,0.506-0.494   c0.001-0.119-0.04-0.234-0.116-0.326L15.56,10h1.94c0.276,0.002,0.502-0.22,0.503-0.497c0.001-0.127-0.047-0.25-0.133-0.343L14,5   l-0.19-1.12L15,2.92c0.235-0.145,0.308-0.453,0.162-0.688C15.085,2.106,14.956,2.021,14.81,2l-1.67-0.36l-0.69-1.36   c-0.144-0.249-0.462-0.333-0.711-0.189c-0.079,0.046-0.144,0.111-0.189,0.189l-0.69,1.41L9.19,2   C8.917,2.04,8.728,2.294,8.768,2.568C8.79,2.713,8.875,2.842,9,2.92l1.18,0.93L10,5L6.13,9.16C5.942,9.362,5.954,9.679,6.157,9.867   C6.25,9.953,6.373,10.001,6.5,10h1.94l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C4.766,15.46,4.881,15.501,5,15.5h1.94   l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C3.266,20.96,3.381,21.001,3.5,21h6.33c-0.13,0.807-0.528,1.547-1.13,2.1   c-0.221,0.166-0.266,0.479-0.1,0.7C8.694,23.926,8.843,24,9,24h6c0.276,0,0.5-0.224,0.5-0.5c0-0.157-0.074-0.306-0.2-0.4   c-0.602-0.553-1-1.293-1.13-2.1h6.33c0.276,0.003,0.503-0.218,0.506-0.494C21.007,20.387,20.966,20.271,20.89,20.18z" style="fill:url(#SVGID_1_);"/>
        </g>
    </svg>
`;

const standardImage = new shapes.standard.Image({
    attrs: {
        image: {
            href: `data:image/svg+xml;utf8,${encodeURIComponent(christmasTreeSVG)}`
            // Alternatively convert the SVG to base64
            // href: `data:image/svg+xml;base64;utf8,${btoa(christmasTreeSVG)}`
        },
        label: {
            text: 'Christmas Tree',
            fontSize: 10
        }
    }
});

const [, si2, si3] = addImages(standardImage, 20);

// --------------------------------------------------------
// 2. Add placeholders to the original SVG image and replace
// them with the any color dynamically

// The original SVG image with $color placeholder
const templateChristmasTreeSVG = `<?xml version="1.0" ?>
<svg id="Christmas_Tree" version="1.1" viewBox="0 0 24 24" xml:space="preserve"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink">
    <title/>
    <g>
        <polygon points="12,3.5 6.5,9.5 9.5,9.5 5,15 8,15 3.5,20.5 20.5,20.5 16,15 19,15 14.5,9.5 17.5,9.5  " style="fill:#0DB14B;"/>
        <polygon points="12,3.5 6.5,9.5 9.09,9.5  " style="opacity:0.2;fill:#FFFFFF;"/>
        <polygon points="17.5,9.5 12,3.5 14.91,9.5  " style="opacity:0.1;"/>
        <polygon points="8.29,15 10.68,9.5 9.5,9.5 5,15 8,15 3.5,20.5    7.5,20.5 9.88,15  " style="opacity:0.2;fill:#FFFFFF;"/>
        <polygon points="16,15 19,15 14.5,9.5 13.32,9.5 15.71,15 14.12,15 16.5,20.5    20.5,20.5  " style="opacity:0.1;"/>
        <g>
            <circle cx="11.5" cy="8" r="1" fill="$color"/>
            <circle cx="14" cy="13" r="1" fill="$color"/>
            <circle cx="10" cy="17" r="1" fill="$color"/>
            <circle cx="15" cy="18" r="1" fill="$color"/>
        </g>
        <path d="M10.44,20.5c-0.087,1.145-0.601,2.216-1.44,3h6c-0.839-0.784-1.353-1.855-1.44-3H10.44z   " id="_Path_" style="fill:#9D581F;"/>
        <path d="M10.44,20.5c-0.087,1.145-0.601,2.216-1.44,3h2   c0.312-0.97,0.474-1.981,0.48-3H10.44z" style="opacity:0.2;fill:#FFFFFF;"/>
        <path d="M13.56,20.5h-1c0.006,1.019,0.168,2.03,0.48,3h2   C14.186,22.722,13.657,21.651,13.56,20.5z" style="opacity:0.1;"/>
        <polygon points="12,0.5 12.8,2.13 14.71,2.53 13.3,3.65 13.6,5.44 12,4.59 10.4,5.44 10.7,3.65 9.29,2.53    11.2,2.13  " style="fill:#FFCF01;"/>
        <path d="M20.89,20.18l-3.83-4.68H19c0.276,0.003,0.503-0.218,0.506-0.494   c0.001-0.119-0.04-0.234-0.116-0.326L15.56,10h1.94c0.276,0.002,0.502-0.22,0.503-0.497c0.001-0.127-0.047-0.25-0.133-0.343L14,5   l-0.19-1.12L15,2.92c0.235-0.145,0.308-0.453,0.162-0.688C15.085,2.106,14.956,2.021,14.81,2l-1.67-0.36l-0.69-1.36   c-0.144-0.249-0.462-0.333-0.711-0.189c-0.079,0.046-0.144,0.111-0.189,0.189l-0.69,1.41L9.19,2   C8.917,2.04,8.728,2.294,8.768,2.568C8.79,2.713,8.875,2.842,9,2.92l1.18,0.93L10,5L6.13,9.16C5.942,9.362,5.954,9.679,6.157,9.867   C6.25,9.953,6.373,10.001,6.5,10h1.94l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C4.766,15.46,4.881,15.501,5,15.5h1.94   l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C3.266,20.96,3.381,21.001,3.5,21h6.33c-0.13,0.807-0.528,1.547-1.13,2.1   c-0.221,0.166-0.266,0.479-0.1,0.7C8.694,23.926,8.843,24,9,24h6c0.276,0,0.5-0.224,0.5-0.5c0-0.157-0.074-0.306-0.2-0.4   c-0.602-0.553-1-1.293-1.13-2.1h6.33c0.276,0.003,0.503-0.218,0.506-0.494C21.007,20.387,20.966,20.271,20.89,20.18z M11.3,2.61   c0.149-0.034,0.274-0.133,0.34-0.27L12,1.63l0.35,0.72c0.066,0.137,0.191,0.236,0.34,0.27l0.87,0.19L13,3.26   c-0.144,0.115-0.213,0.299-0.18,0.48l0.13,0.79l-0.71-0.37c-0.144-0.075-0.316-0.075-0.46,0l-0.71,0.37l0.13-0.79   c0.028-0.185-0.049-0.37-0.2-0.48L10.42,2.8L11.3,2.61z M13.89,23h-3.78c0.369-0.616,0.623-1.293,0.75-2h2.26   C13.253,21.708,13.514,22.386,13.89,23z M4.56,20l3.83-4.68c0.177-0.212,0.148-0.527-0.064-0.704C8.234,14.54,8.119,14.499,8,14.5   H6.06l3.83-4.68c0.177-0.212,0.148-0.527-0.064-0.704C9.734,9.04,9.619,8.999,9.5,9H7.64l2.83-3.09c0.053,0.009,0.107,0.009,0.16,0   L12,5.16l1.37,0.72c0.056,0.01,0.114,0.01,0.17,0L16.36,9H14.5c-0.276-0.003-0.503,0.218-0.506,0.494   c-0.001,0.119,0.04,0.234,0.116,0.326l3.83,4.68H16c-0.276-0.003-0.503,0.218-0.506,0.494c-0.001,0.119,0.04,0.234,0.116,0.326   L19.44,20H4.56z" style="fill:#303C42;"/>
        <linearGradient gradientTransform="matrix(1 0 0 -1 0 24)" gradientUnits="userSpaceOnUse" id="SVGID_1_" x1="5.4202" x2="22.4202" y1="14.3604" y2="6.4304">
            <stop offset="0" style="stop-color:#FFFFFF;stop-opacity:0.2"/>
            <stop offset="1" style="stop-color:#FFFFFF;stop-opacity:0"/>
        </linearGradient>
        <path d="M20.89,20.18l-3.83-4.68H19c0.276,0.003,0.503-0.218,0.506-0.494   c0.001-0.119-0.04-0.234-0.116-0.326L15.56,10h1.94c0.276,0.002,0.502-0.22,0.503-0.497c0.001-0.127-0.047-0.25-0.133-0.343L14,5   l-0.19-1.12L15,2.92c0.235-0.145,0.308-0.453,0.162-0.688C15.085,2.106,14.956,2.021,14.81,2l-1.67-0.36l-0.69-1.36   c-0.144-0.249-0.462-0.333-0.711-0.189c-0.079,0.046-0.144,0.111-0.189,0.189l-0.69,1.41L9.19,2   C8.917,2.04,8.728,2.294,8.768,2.568C8.79,2.713,8.875,2.842,9,2.92l1.18,0.93L10,5L6.13,9.16C5.942,9.362,5.954,9.679,6.157,9.867   C6.25,9.953,6.373,10.001,6.5,10h1.94l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C4.766,15.46,4.881,15.501,5,15.5h1.94   l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C3.266,20.96,3.381,21.001,3.5,21h6.33c-0.13,0.807-0.528,1.547-1.13,2.1   c-0.221,0.166-0.266,0.479-0.1,0.7C8.694,23.926,8.843,24,9,24h6c0.276,0,0.5-0.224,0.5-0.5c0-0.157-0.074-0.306-0.2-0.4   c-0.602-0.553-1-1.293-1.13-2.1h6.33c0.276,0.003,0.503-0.218,0.506-0.494C21.007,20.387,20.966,20.271,20.89,20.18z" style="fill:url(#SVGID_1_);"/>
    </g>
</svg>
`;

class TemplateImage extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'TemplateImage',
            attrs: {
                image: {
                    width: 'calc(w)',
                    height: 'calc(h)'
                    // href: '[URL]'
                },
                label: {
                    textVerticalAnchor: 'top',
                    textAnchor: 'middle',
                    x: 'calc(w/2)',
                    y: 'calc(h + 10)',
                    fontSize: 10,
                    fill: '#333333'
                }
            }
        };
    }

    preinitialize() {
        this.dataURLPrefix = 'data:image/svg+xml;utf8,';
        this.markup = [
            {
                tagName: 'image',
                selector: 'image'
            },
            {
                tagName: 'text',
                selector: 'label'
            }
        ];
    }

    initialize(...args) {
        super.initialize(...args);
        this.on('change:color', this.setImageColor);
        this.setImageColor();
    }

    setImageColor() {
        const svg = this.get('svg') || '';
        const color = this.get('color') || 'black';
        this.attr(
            'image/href',
            this.dataURLPrefix + encodeURIComponent(svg.replace(/\$color/g, color))
        );
    }
}
shapes.TemplateImage = TemplateImage;

const templateImage = new TemplateImage({
    svg: templateChristmasTreeSVG,
    attrs: {
        label: {
            text: 'Template Christmas Tree',
            fontSize: 10
        }
    }
});

const [ti1, ti2, ti3] = addImages(templateImage, 220);
ti1.set('color', 'red');
ti2.set('color', 'purple');
ti3.set('color', 'orange');

// ----------------------------------------------
// 3. The original image is inserted directly into the markup and extended with selectors (and group-selectors)
// The size of the image SVG element is set to `calc(w)` and `calc(h)` so that it can be scaled with the element.
// The SVG image changes can be made via the `attr` method using the selectors.

// The string converted into JSON markup with the `util.svg` function.
const markupChristmasTree = util.svg`
    <svg @selector="image" version="1.1" viewBox="0 0 24 24" xml:space="preserve"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink">
        <g>
            <polygon points="12,3.5 6.5,9.5 9.5,9.5 5,15 8,15 3.5,20.5 20.5,20.5 16,15 19,15 14.5,9.5 17.5,9.5  " style="fill:#0DB14B;"/>
            <polygon points="12,3.5 6.5,9.5 9.09,9.5  " style="opacity:0.2;fill:#FFFFFF;"/>
            <polygon points="17.5,9.5 12,3.5 14.91,9.5  " style="opacity:0.1;"/>
            <polygon points="8.29,15 10.68,9.5 9.5,9.5 5,15 8,15 3.5,20.5    7.5,20.5 9.88,15  " style="opacity:0.2;fill:#FFFFFF;"/>
            <polygon points="16,15 19,15 14.5,9.5 13.32,9.5 15.71,15 14.12,15 16.5,20.5    20.5,20.5  " style="opacity:0.1;"/>
            <g>
                <circle @group-selector="balls" cx="11.5" cy="8" r="1"/>
                <circle @group-selector="balls" cx="14" cy="13" r="1"/>
                <circle @group-selector="balls" cx="10" cy="17" r="1"/>
                <circle @group-selector="balls" cx="15" cy="18" r="1"/>
            </g>
            <path d="M10.44,20.5c-0.087,1.145-0.601,2.216-1.44,3h6c-0.839-0.784-1.353-1.855-1.44-3H10.44z   " id="_Path_" style="fill:#9D581F;"/>
            <path d="M10.44,20.5c-0.087,1.145-0.601,2.216-1.44,3h2   c0.312-0.97,0.474-1.981,0.48-3H10.44z" style="opacity:0.2;fill:#FFFFFF;"/>
            <path d="M13.56,20.5h-1c0.006,1.019,0.168,2.03,0.48,3h2   C14.186,22.722,13.657,21.651,13.56,20.5z" style="opacity:0.1;"/>
            <polygon points="12,0.5 12.8,2.13 14.71,2.53 13.3,3.65 13.6,5.44 12,4.59 10.4,5.44 10.7,3.65 9.29,2.53    11.2,2.13  " style="fill:#FFCF01;"/>
            <path @selector="outline" d="M20.89,20.18l-3.83-4.68H19c0.276,0.003,0.503-0.218,0.506-0.494   c0.001-0.119-0.04-0.234-0.116-0.326L15.56,10h1.94c0.276,0.002,0.502-0.22,0.503-0.497c0.001-0.127-0.047-0.25-0.133-0.343L14,5   l-0.19-1.12L15,2.92c0.235-0.145,0.308-0.453,0.162-0.688C15.085,2.106,14.956,2.021,14.81,2l-1.67-0.36l-0.69-1.36   c-0.144-0.249-0.462-0.333-0.711-0.189c-0.079,0.046-0.144,0.111-0.189,0.189l-0.69,1.41L9.19,2   C8.917,2.04,8.728,2.294,8.768,2.568C8.79,2.713,8.875,2.842,9,2.92l1.18,0.93L10,5L6.13,9.16C5.942,9.362,5.954,9.679,6.157,9.867   C6.25,9.953,6.373,10.001,6.5,10h1.94l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C4.766,15.46,4.881,15.501,5,15.5h1.94   l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C3.266,20.96,3.381,21.001,3.5,21h6.33c-0.13,0.807-0.528,1.547-1.13,2.1   c-0.221,0.166-0.266,0.479-0.1,0.7C8.694,23.926,8.843,24,9,24h6c0.276,0,0.5-0.224,0.5-0.5c0-0.157-0.074-0.306-0.2-0.4   c-0.602-0.553-1-1.293-1.13-2.1h6.33c0.276,0.003,0.503-0.218,0.506-0.494C21.007,20.387,20.966,20.271,20.89,20.18z M11.3,2.61   c0.149-0.034,0.274-0.133,0.34-0.27L12,1.63l0.35,0.72c0.066,0.137,0.191,0.236,0.34,0.27l0.87,0.19L13,3.26   c-0.144,0.115-0.213,0.299-0.18,0.48l0.13,0.79l-0.71-0.37c-0.144-0.075-0.316-0.075-0.46,0l-0.71,0.37l0.13-0.79   c0.028-0.185-0.049-0.37-0.2-0.48L10.42,2.8L11.3,2.61z M13.89,23h-3.78c0.369-0.616,0.623-1.293,0.75-2h2.26   C13.253,21.708,13.514,22.386,13.89,23z M4.56,20l3.83-4.68c0.177-0.212,0.148-0.527-0.064-0.704C8.234,14.54,8.119,14.499,8,14.5   H6.06l3.83-4.68c0.177-0.212,0.148-0.527-0.064-0.704C9.734,9.04,9.619,8.999,9.5,9H7.64l2.83-3.09c0.053,0.009,0.107,0.009,0.16,0   L12,5.16l1.37,0.72c0.056,0.01,0.114,0.01,0.17,0L16.36,9H14.5c-0.276-0.003-0.503,0.218-0.506,0.494   c-0.001,0.119,0.04,0.234,0.116,0.326l3.83,4.68H16c-0.276-0.003-0.503,0.218-0.506,0.494c-0.001,0.119,0.04,0.234,0.116,0.326   L19.44,20H4.56z" style="fill:#303C42;"/>
            <linearGradient gradientTransform="matrix(1 0 0 -1 0 24)" gradientUnits="userSpaceOnUse" id="SVGID_1_" x1="5.4202" x2="22.4202" y1="14.3604" y2="6.4304">
                <stop offset="0" style="stop-color:#FFFFFF;stop-opacity:0.2"/>
                <stop offset="1" style="stop-color:#FFFFFF;stop-opacity:0"/>
            </linearGradient>
            <path d="M20.89,20.18l-3.83-4.68H19c0.276,0.003,0.503-0.218,0.506-0.494 c0.001-0.119-0.04-0.234-0.116-0.326L15.56,10h1.94c0.276,0.002,0.502-0.22,0.503-0.497c0.001-0.127-0.047-0.25-0.133-0.343L14,5   l-0.19-1.12L15,2.92c0.235-0.145,0.308-0.453,0.162-0.688C15.085,2.106,14.956,2.021,14.81,2l-1.67-0.36l-0.69-1.36   c-0.144-0.249-0.462-0.333-0.711-0.189c-0.079,0.046-0.144,0.111-0.189,0.189l-0.69,1.41L9.19,2   C8.917,2.04,8.728,2.294,8.768,2.568C8.79,2.713,8.875,2.842,9,2.92l1.18,0.93L10,5L6.13,9.16C5.942,9.362,5.954,9.679,6.157,9.867   C6.25,9.953,6.373,10.001,6.5,10h1.94l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C4.766,15.46,4.881,15.501,5,15.5h1.94   l-3.83,4.68c-0.177,0.212-0.148,0.527,0.064,0.704C3.266,20.96,3.381,21.001,3.5,21h6.33c-0.13,0.807-0.528,1.547-1.13,2.1   c-0.221,0.166-0.266,0.479-0.1,0.7C8.694,23.926,8.843,24,9,24h6c0.276,0,0.5-0.224,0.5-0.5c0-0.157-0.074-0.306-0.2-0.4   c-0.602-0.553-1-1.293-1.13-2.1h6.33c0.276,0.003,0.503-0.218,0.506-0.494C21.007,20.387,20.966,20.271,20.89,20.18z" style="fill:url(#SVGID_1_);"/>
        </g>
    </svg>
    <text @selector="label"></text>
`;

class MarkupImage extends dia.Element {
    defaults() {
        return {
            ...super.defaults,
            type: 'MarkupImage',
            attrs: {
                root: {
                    magnetSelector: 'outline'
                },
                image: {
                    width: 'calc(w)',
                    height: 'calc(h)'
                },
                label: {
                    fontSize: 10,
                    textVerticalAnchor: 'top',
                    textAnchor: 'middle',
                    x: 'calc(0.5*w)',
                    y: 'calc(h + 10)'
                }
            }
        };
    }

    preinitialize() {
        this.markup = markupChristmasTree;
    }
}
shapes.MarkupImage = MarkupImage;

const markupImage = new MarkupImage({
    attrs: {
        label: {
            text: 'Markup Christmas Tree'
        }
    }
});

const [mi1, mi2, mi3] = addImages(markupImage, 420);
mi1.attr('balls/fill', 'darkred');
mi2.attr('balls/fill', 'lightsalmon');
mi3.attr('balls/fill', 'white');

// -----------------------------
// Highlighters

// Use highlighter with the image element (notice a slight difference in the highlight for markup style).
highlighters.stroke.add(si2.findView(paper), 'image', 'h');
highlighters.stroke.add(ti2.findView(paper), 'image', 'h');
highlighters.stroke.add(mi2.findView(paper), 'image', 'h');

// Use highlighter with an image sub-element (3).
highlighters.stroke.add(mi3.findView(paper), 'outline', 'h', {
    useFirstSubpath: true
});

// -----------------------------
// Links
// JointJS can connect a link exactly to a sub-element (3).

const link1 = new shapes.standard.Link({
    source: { id: si3.id },
    target: { id: ti3.id }
});

const link2 = new shapes.standard.Link({
    source: { id: ti3.id },
    target: { id: mi3.id }
});

graph.addCells([link1, link2]);

// ----------------------------------------------
// Events
// The sub-element is not clickable. Everything inside the image is a black-box (1,2)

paper.on('element:mouseenter', (elementView) => {
    elementView.addTools(
        new dia.ToolsView({
            tools: [
                new elementTools.Boundary({
                    padding: 1,
                    useModelGeometry: true,
                    attributes: {
                        fill: '#4a7bcb',
                        'fill-opacity': 0.1,
                        stroke: '#4a7bcb',
                        'stroke-width': 2,
                        'stroke-dasharray': 'none',
                        'pointer-events': 'none',
                        rx: 2,
                        ry: 2
                    }
                })
            ],
            layer: dia.Paper.Layers.BACK
        })
    );
});

paper.on('element:mouseleave', (elementView) => {
    elementView.removeTools();
});

// ----------------------------------------------
// DOM
// A high number of DOM elements can negatively affect the performance (3).
