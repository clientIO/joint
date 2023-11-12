import { dia, mvc } from 'jointjs';
import React, { useRef, useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { GraphContext } from './GraphContext';
import { PaperContext } from './PaperContext';

export const PORTAL_READY_EVENT = 'portal:ready';

export function Paper({
    children,
    options,
    renderElement,
    onReady,
    onEvent,
    style,
    dataAttributes = ['data'],
    portalSelector = 'portal',
}) {
    const paperWrapperElRef = useRef(null);
    const paperRef = useRef(null);

    const [graph] = useContext(GraphContext);
    const [, setPaperContext] = useContext(PaperContext) ?? [];

    const [elements, setElements] = useState({});
    const setElement = (model, containerEl) => {
        setElements((prevState) => {
            const id = model.id;
            return {
                ...prevState,
                [id]: {
                    id,
                    data: model.get('data'),
                    containerEl: containerEl ?? prevState[id]?.containerEl,
                },
            };
        });
    };

    useEffect(() => {
        const paper = new dia.Paper({
            width: '100%',
            height: '100%',
            async: true,
            sorting: dia.Paper.sorting.APPROX,
            preventDefaultBlankAction: false,
            ...options,
            frozen: true,
            model: graph,
            elementView: dia.ElementView.extend({
                onRender() {
                    const [portalEl] = this.findBySelector('portal');
                    portalEl && this.notify(PORTAL_READY_EVENT, portalEl);
                },
            }),
        });

        paper.el.style.boxSizing = 'border-box';
        paperWrapperElRef.current.appendChild(paper.el);

        // Update the elements state when the graph data changes
        const graphListener = new mvc.View();
        const attributeChangeEvents = dataAttributes
            .map((attribute) => `change:${attribute}`)
            .join(' ');
        graphListener.listenTo(graph, attributeChangeEvents, (cell) =>
            setElement(cell)
        );

        paper.on(PORTAL_READY_EVENT, (elementView, portalEl) =>
            setElement(elementView.model, portalEl)
        );

        if (onReady) {
            onReady(paper);
        }

        if (onEvent) {
            paper.on('all', (...args) => onEvent(paper, ...args));
        }

        const resizeWrapper = () => {
            paperWrapperElRef.current.style.width = paper.el.style.width;
            paperWrapperElRef.current.style.height = paper.el.style.height;
        };

        paper.on('resize', () => resizeWrapper());
        resizeWrapper();

        paper.unfreeze();

        paperRef.current = paper;
        setPaperContext && setPaperContext(paper);

        return () => {
            paper.remove();
            graphListener.stopListening();
            setPaperContext && setPaperContext(null);
        };

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [graph, setPaperContext]); // options, onReady, onEvent, style

    let elementPortals = null;
    if (renderElement) {
        elementPortals = Object.values(elements).map(
            ({ id, containerEl, data = {} }) => {
                if (!containerEl) return null;
                const element = graph.getCell(id);
                if (!element) return null;
                return createPortal(renderElement(element), containerEl);
            }
        );
    }

    return (
        <div ref={paperWrapperElRef} style={style}>
            <PaperContext.Provider value={[paperRef.current, setPaperContext]}>
                {elementPortals}
                {children}
            </PaperContext.Provider>
        </div>
    );
}
