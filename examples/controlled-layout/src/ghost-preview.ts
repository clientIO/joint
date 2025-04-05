import { type dia, mvc } from '@joint/core';
import { runLayout } from './utils';

export function showGhostOnNextInteraction(paper: dia.Paper) {
    const listener = new mvc.Listener();
    listener.listenTo(paper, {
        'element:pointermove': (view: dia.ElementView, evt: dia.Event, x: number, _y: number) => {
            const data = evt.data;
            let ghostEl = data.ghost;
            if (!ghostEl) {
                ghostEl = createGhost(view);
                const position = view.model.position();
                paper.viewport.appendChild(ghostEl);
                evt.data.ghost = ghostEl;
                evt.data.dx = x - position.x;
                evt.data.initialY = position.y;
            }
            ghostEl.setAttribute('transform', `translate(${x - data.dx}, ${data.initialY})`)
        },
        'element:pointerup': (elementView: dia.ElementView, evt: dia.Event, x: number, _y: number) => {

            const movedElement = elementView.model;

            const data = evt.data;
            if (data.ghost) {
                paper.viewport.removeChild(data.ghost);
            }
            listener.stopListening();

            const bbox = movedElement.getBBox();
            bbox.x = x - data.dx;
            const [element] = paper.model.findElementsInArea(bbox).filter(el => el !== movedElement);

            if (!element || element === movedElement) return;

            // Swap positions
            const initialPosition = movedElement.position();
            const newPosition = element.position();
            element.position(initialPosition.x, initialPosition.y);
            movedElement.position(newPosition.x, newPosition.y);
            // Let the layout handle the rest
            runLayout(paper);
        }
    });
}

function createGhost(elementView: dia.ElementView) {
    const ghostEl = elementView.el.cloneNode(true) as SVGElement;
    ghostEl.style.pointerEvents = 'none';
    ghostEl.style.opacity = '0.4';
    return ghostEl;
}
