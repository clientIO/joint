import { dia, shapes } from "@joint/core";
import { layout, type Options, LayerDirectionEnum } from "@joint/layout-msagl";
import data from './data';

import '../css/styles.css';

const layoutDirectionSelect = document.querySelector('select#layout-direction') as HTMLSelectElement;
const layerSeparationRange = document.querySelector('input#layer-separation') as HTMLInputElement;
const nodeSeparationRange = document.querySelector('input#node-separation') as HTMLInputElement;

function runLayout() {
    paper.freeze();
    const options = getLayoutOptions();
    layout(graph, options);
    fitContent();
    paper.unfreeze();
}

function fitContent() {
    paper.transformToFitContent({
        padding: 50,
        verticalAlign: 'middle',
        horizontalAlign: 'middle',
        contentArea: graph.getBBox()
    });
}

function getLayoutOptions(): Options {

    return {
        layoutOptions: {
            layerDirection: Number(layoutDirectionSelect.value) as LayerDirectionEnum,
            layerSeparation: Number(layerSeparationRange.value),
            nodeSeparation: Number(nodeSeparationRange.value)
        },
        margins: {
            left: 30,
            right: 30,
            top: 30,
            bottom: 30
        },
        measureLinkLabel: (link: dia.Link, context: CanvasRenderingContext2D) => {
            const labelAttrs = link.label(0).attrs;

            const textWrap = labelAttrs.text.textWrap;

            if (textWrap) {
                return {
                    width: Number(textWrap.width),
                    height: Number(textWrap.height)
                }
            }

            const fontWeight = labelAttrs.text.fontWeight || 'normal';
            const fontSize = labelAttrs.text.fontSize || 14;
            const fontFamily = labelAttrs.text.fontFamily || 'Arial';
            const lineHeight = Number(labelAttrs.text.lineHeight) || 1.5;

            context.font = `${fontWeight} ${fontSize}px ${fontFamily}`;

            const rowHeight = fontSize * 1.2;
            const rowSpacing = fontSize * (lineHeight - 1);

            const lines = labelAttrs.text.text.split('\n');

            let width = 0;

            for (const line of lines) {
                const lineWidth = context.measureText(line).width;
                width = Math.max(width, lineWidth);
            }

            return {
                width,
                height: lines.length * rowHeight + (lines.length - 1) * rowSpacing
            };
        }
    }
}

const graph = new dia.Graph({}, { cellNamespace: shapes });
const paper = new dia.Paper({
    model: graph,
    cellViewNamespace: shapes,
    el: document.querySelector('#paper'),
    width: '100%',
    height: '100%',
    async: true,
    frozen: true,
    interactive: false
});

graph.fromJSON(data);
runLayout();

window.addEventListener('resize', fitContent);

[
    layoutDirectionSelect,
    layerSeparationRange,
    nodeSeparationRange
].forEach(el => el.addEventListener('change', runLayout));
