/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleEvent } from './handle-paper-events';
import type { dia } from '@joint/core';
import type { PaperEvents, PaperEventType } from '../types/event.types';

describe('handle-paper-events', () => {
  let mockPaper: dia.Paper;
  let mockEvents: PaperEvents;

  beforeEach(() => {
    mockPaper = {} as dia.Paper;
    mockEvents = {};
  });

  const eventTestCases: Array<{
    type: PaperEventType | string;
    args: unknown[];
    handler: keyof PaperEvents;
    expected: Record<string, unknown>;
  }> = [
    // --- render ---
    {
      type: 'render:done',
      args: [{}, {}],
      handler: 'onRenderDone',
      expected: { stats: {}, opt: {} },
    },
    // --- pointer click ---
    {
      type: 'cell:pointerclick',
      args: [{}, {}, 10, 20],
      handler: 'onCellPointerClick',
      expected: { cellView: {}, event: {}, x: 10, y: 20 },
    },
    {
      type: 'element:pointerclick',
      args: [{}, {}, 15, 25],
      handler: 'onElementPointerClick',
      expected: { elementView: {}, event: {}, x: 15, y: 25 },
    },
    {
      type: 'link:pointerclick',
      args: [{}, {}, 30, 40],
      handler: 'onLinkPointerClick',
      expected: { linkView: {}, event: {}, x: 30, y: 40 },
    },
    {
      type: 'blank:pointerclick',
      args: [{}, 50, 60],
      handler: 'onBlankPointerClick',
      expected: { event: {}, x: 50, y: 60 },
    },
    // --- pointer double-click ---
    {
      type: 'cell:pointerdblclick',
      args: [{}, {}, 70, 80],
      handler: 'onCellPointerDblClick',
      expected: { cellView: {}, event: {}, x: 70, y: 80 },
    },
    {
      type: 'element:pointerdblclick',
      args: [{}, {}, 90, 100],
      handler: 'onElementPointerDblClick',
      expected: { elementView: {}, event: {}, x: 90, y: 100 },
    },
    {
      type: 'link:pointerdblclick',
      args: [{}, {}, 110, 120],
      handler: 'onLinkPointerDblClick',
      expected: { linkView: {}, event: {}, x: 110, y: 120 },
    },
    {
      type: 'blank:pointerdblclick',
      args: [{}, 130, 140],
      handler: 'onBlankPointerDblClick',
      expected: { event: {}, x: 130, y: 140 },
    },
    // --- context menu ---
    {
      type: 'cell:contextmenu',
      args: [{}, {}, 150, 160],
      handler: 'onCellContextMenu',
      expected: { cellView: {}, event: {}, x: 150, y: 160 },
    },
    {
      type: 'element:contextmenu',
      args: [{}, {}, 170, 180],
      handler: 'onElementContextMenu',
      expected: { elementView: {}, event: {}, x: 170, y: 180 },
    },
    {
      type: 'link:contextmenu',
      args: [{}, {}, 190, 200],
      handler: 'onLinkContextMenu',
      expected: { linkView: {}, event: {}, x: 190, y: 200 },
    },
    {
      type: 'blank:contextmenu',
      args: [{}, 210, 220],
      handler: 'onBlankContextMenu',
      expected: { event: {}, x: 210, y: 220 },
    },
    // --- pointer down ---
    {
      type: 'cell:pointerdown',
      args: [{}, {}, 1, 2],
      handler: 'onCellPointerDown',
      expected: { cellView: {}, event: {}, x: 1, y: 2 },
    },
    {
      type: 'element:pointerdown',
      args: [{}, {}, 3, 4],
      handler: 'onElementPointerDown',
      expected: { elementView: {}, event: {}, x: 3, y: 4 },
    },
    {
      type: 'link:pointerdown',
      args: [{}, {}, 5, 6],
      handler: 'onLinkPointerDown',
      expected: { linkView: {}, event: {}, x: 5, y: 6 },
    },
    {
      type: 'blank:pointerdown',
      args: [{}, 7, 8],
      handler: 'onBlankPointerDown',
      expected: { event: {}, x: 7, y: 8 },
    },
    // --- pointer move ---
    {
      type: 'cell:pointermove',
      args: [{}, {}, 9, 10],
      handler: 'onCellPointerMove',
      expected: { cellView: {}, event: {}, x: 9, y: 10 },
    },
    {
      type: 'element:pointermove',
      args: [{}, {}, 11, 12],
      handler: 'onElementPointerMove',
      expected: { elementView: {}, event: {}, x: 11, y: 12 },
    },
    {
      type: 'link:pointermove',
      args: [{}, {}, 13, 14],
      handler: 'onLinkPointerMove',
      expected: { linkView: {}, event: {}, x: 13, y: 14 },
    },
    {
      type: 'blank:pointermove',
      args: [{}, 15, 16],
      handler: 'onBlankPointerMove',
      expected: { event: {}, x: 15, y: 16 },
    },
    // --- pointer up ---
    {
      type: 'cell:pointerup',
      args: [{}, {}, 17, 18],
      handler: 'onCellPointerUp',
      expected: { cellView: {}, event: {}, x: 17, y: 18 },
    },
    {
      type: 'element:pointerup',
      args: [{}, {}, 19, 20],
      handler: 'onElementPointerUp',
      expected: { elementView: {}, event: {}, x: 19, y: 20 },
    },
    {
      type: 'link:pointerup',
      args: [{}, {}, 21, 22],
      handler: 'onLinkPointerUp',
      expected: { linkView: {}, event: {}, x: 21, y: 22 },
    },
    {
      type: 'blank:pointerup',
      args: [{}, 23, 24],
      handler: 'onBlankPointerUp',
      expected: { event: {}, x: 23, y: 24 },
    },
    // --- mouse over ---
    {
      type: 'cell:mouseover',
      args: [{}, {}],
      handler: 'onCellMouseOver',
      expected: { cellView: {}, event: {} },
    },
    {
      type: 'element:mouseover',
      args: [{}, {}],
      handler: 'onElementMouseOver',
      expected: { elementView: {}, event: {} },
    },
    {
      type: 'link:mouseover',
      args: [{}, {}],
      handler: 'onLinkMouseOver',
      expected: { linkView: {}, event: {} },
    },
    {
      type: 'blank:mouseover',
      args: [{}],
      handler: 'onBlankMouseOver',
      expected: { event: {} },
    },
    // --- mouse out ---
    {
      type: 'cell:mouseout',
      args: [{}, {}],
      handler: 'onCellMouseOut',
      expected: { cellView: {}, event: {} },
    },
    {
      type: 'element:mouseout',
      args: [{}, {}],
      handler: 'onElementMouseOut',
      expected: { elementView: {}, event: {} },
    },
    {
      type: 'link:mouseout',
      args: [{}, {}],
      handler: 'onLinkMouseOut',
      expected: { linkView: {}, event: {} },
    },
    {
      type: 'blank:mouseout',
      args: [{}],
      handler: 'onBlankMouseOut',
      expected: { event: {} },
    },
    // --- mouse enter/leave ---
    {
      type: 'cell:mouseenter',
      args: [{}, {}],
      handler: 'onCellMouseEnter',
      expected: { cellView: {}, event: {} },
    },
    {
      type: 'element:mouseenter',
      args: [{}, {}],
      handler: 'onElementMouseEnter',
      expected: { elementView: {}, event: {} },
    },
    {
      type: 'link:mouseenter',
      args: [{}, {}],
      handler: 'onLinkMouseEnter',
      expected: { linkView: {}, event: {} },
    },
    {
      type: 'blank:mouseenter',
      args: [{}],
      handler: 'onBlankMouseEnter',
      expected: { event: {} },
    },
    {
      type: 'cell:mouseleave',
      args: [{}, {}],
      handler: 'onCellMouseLeave',
      expected: { cellView: {}, event: {} },
    },
    {
      type: 'element:mouseleave',
      args: [{}, {}],
      handler: 'onElementMouseLeave',
      expected: { elementView: {}, event: {} },
    },
    {
      type: 'link:mouseleave',
      args: [{}, {}],
      handler: 'onLinkMouseLeave',
      expected: { linkView: {}, event: {} },
    },
    {
      type: 'blank:mouseleave',
      args: [{}],
      handler: 'onBlankMouseLeave',
      expected: { event: {} },
    },
    // --- mouse wheel ---
    {
      type: 'cell:mousewheel',
      args: [{}, {}, 1, 2, 3],
      handler: 'onCellMouseWheel',
      expected: { cellView: {}, event: {}, x: 1, y: 2, delta: 3 },
    },
    {
      type: 'element:mousewheel',
      args: [{}, {}, 4, 5, 6],
      handler: 'onElementMouseWheel',
      expected: { elementView: {}, event: {}, x: 4, y: 5, delta: 6 },
    },
    {
      type: 'link:mousewheel',
      args: [{}, {}, 7, 8, 9],
      handler: 'onLinkMouseWheel',
      expected: { linkView: {}, event: {}, x: 7, y: 8, delta: 9 },
    },
    {
      type: 'blank:mousewheel',
      args: [{}, 10, 11, 12],
      handler: 'onBlankMouseWheel',
      expected: { event: {}, x: 10, y: 11, delta: 12 },
    },
    // --- paper gestures ---
    {
      type: 'paper:pan',
      args: [{}, 13, 14],
      handler: 'onPan',
      expected: { event: {}, deltaX: 13, deltaY: 14 },
    },
    {
      type: 'paper:pinch',
      args: [{}, 15, 16, 1.5],
      handler: 'onPinch',
      expected: { event: {}, x: 15, y: 16, scale: 1.5 },
    },
    // --- paper mouse enter/leave ---
    {
      type: 'paper:mouseenter',
      args: [{}],
      handler: 'onPaperMouseEnter',
      expected: { event: {} },
    },
    {
      type: 'paper:mouseleave',
      args: [{}],
      handler: 'onPaperMouseLeave',
      expected: { event: {} },
    },
    // --- magnet events ---
    {
      type: 'element:magnet:pointerclick',
      args: [{}, {}, {}, 17, 18],
      handler: 'onElementMagnetPointerClick',
      expected: { elementView: {}, event: {}, magnetNode: {}, x: 17, y: 18 },
    },
    {
      type: 'element:magnet:pointerdblclick',
      args: [{}, {}, {}, 19, 20],
      handler: 'onElementMagnetPointerDblClick',
      expected: { elementView: {}, event: {}, magnetNode: {}, x: 19, y: 20 },
    },
    {
      type: 'element:magnet:contextmenu',
      args: [{}, {}, {}, 21, 22],
      handler: 'onElementMagnetContextMenu',
      expected: { elementView: {}, event: {}, magnetNode: {}, x: 21, y: 22 },
    },
    // --- highlight events ---
    {
      type: 'cell:highlight',
      args: [{}, {}, {}],
      handler: 'onCellHighlight',
      expected: { cellView: {}, node: {}, options: {} },
    },
    {
      type: 'cell:unhighlight',
      args: [{}, {}, {}],
      handler: 'onCellUnhighlight',
      expected: { cellView: {}, node: {}, options: {} },
    },
    {
      type: 'cell:highlight:invalid',
      args: [{}, 'highlighterId', {}],
      handler: 'onCellHighlightInvalid',
      expected: { cellView: {}, highlighterId: 'highlighterId', highlighter: {} },
    },
    // --- link connection events ---
    {
      type: 'link:connect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkConnect',
      expected: { linkView: {}, event: {}, newCellView: {}, newCellViewMagnet: {}, arrowhead: {} },
    },
    {
      type: 'link:disconnect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkDisconnect',
      expected: {
        linkView: {},
        event: {},
        previousCellView: {},
        previousCellViewMagnet: {},
        arrowhead: {},
      },
    },
    {
      type: 'link:snap:connect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkSnapConnect',
      expected: { linkView: {}, event: {}, newCellView: {}, newCellViewMagnet: {}, arrowhead: {} },
    },
    {
      type: 'link:snap:disconnect',
      args: [{}, {}, {}, {}, {}],
      handler: 'onLinkSnapDisconnect',
      expected: {
        linkView: {},
        event: {},
        previousCellView: {},
        previousCellViewMagnet: {},
        arrowhead: {},
      },
    },
    // --- transform events ---
    {
      type: 'translate',
      args: [1, 2, {}],
      handler: 'onTranslate',
      expected: { tx: 1, ty: 2, data: {} },
    },
    {
      type: 'scale',
      args: [1.1, 2.2, {}],
      handler: 'onScale',
      expected: { sx: 1.1, sy: 2.2, data: {} },
    },
    {
      type: 'resize',
      args: [100, 200, {}],
      handler: 'onResize',
      expected: { width: 100, height: 200, data: {} },
    },
    {
      type: 'transform',
      args: [{}, {}],
      handler: 'onTransform',
      expected: { matrix: {}, data: {} },
    },
    // --- catch-all custom event ---
    {
      type: 'custom:event',
      args: [{}, {}, {}],
      handler: 'onCustomEvent',
      expected: { eventName: 'custom:event', args: [{}, {}, {}] },
    },
    {
      type: 'something:else',
      args: [1, 2, 3],
      handler: 'onCustomEvent',
      expected: { eventName: 'something:else', args: [1, 2, 3] },
    },
  ];

  for (const { type, args, handler, expected } of eventTestCases) {
    it(`should call ${handler} for ${type}`, () => {
      const mockHandler = jest.fn();
      (mockEvents as any)[handler] = mockHandler;

      handleEvent(type as PaperEventType, mockEvents, mockPaper, ...args);

      expect(mockHandler).toHaveBeenCalledWith({ ...expected, paper: mockPaper });
    });
  }
});
