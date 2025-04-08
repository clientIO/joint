import React, { useEffect, useRef } from 'react';
import { dia, shapes, elementTools } from '@joint/core';

function App() {

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
    rect.findView(paper).addTools(toolsView);
    rect.findView(paper).vel.translateAndAutoOrient({ x: 10, y: 10, }, { x: 100, y: 100 }, paper.svg);
    (rect.findView(paper).el as SVGGElement).getScreenCTM()!.inverse();

    return () => {
      paper.remove();
    };
  }, []);

  return (
    <div className="canvas" ref={canvas}/>
  );

}

export default App;
