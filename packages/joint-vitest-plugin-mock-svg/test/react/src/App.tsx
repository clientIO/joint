import React, { useEffect, useRef } from 'react';
import { dia, shapes, elementTools, V } from '@joint/core';

function App() {

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canvas: any = useRef(null);

    useEffect(() => {

        const graph = new dia.Graph({}, { cellNamespace: shapes });

        const paper = new dia.Paper({
            model: graph,
            background: {
                color: '#F8F9FA',
            },
            sorting: dia.Paper.sorting.APPROX,
            cellViewNamespace: shapes
        });

        canvas.current.appendChild(paper.el);

        const rect = new shapes.standard.Rectangle({
            position: { x: 100, y: 100 },
            size: { width: 100, height: 50 },
            attrs: {
                label: {
                    text: 'Hello World',
                    textWrap: {
                        width: 'calc(w - 20)',
                        height: 'calc(h - 20)',
                        ellipsis: true,
                    }
                }
            }
        });

        graph.addCell(rect);

        const toolsView = new dia.ToolsView({
            tools: [
                new elementTools.Boundary({ padding: 10 }),
                new elementTools.Remove(),
            ]
        });
        const rectView = rect.findView(paper) as dia.ElementView;
        rectView.addTools(toolsView);
        rectView.vel.translateAndAutoOrient({ x: 10, y: 10, }, { x: 100, y: 100 }, paper.svg);
    (rectView.el as SVGGElement).getScreenCTM()!.inverse();

    // SVGElement.transform.baseVal.consolidate();
    rectView.vel.transform();
    V.transformStringToMatrix('matrix(1, 0, 0, 1, 10, 20)');

    return () => {
        paper.remove();
    };
    }, []);

    return (
        <div className="canvas" ref={canvas}/>
    );

}

export default App;
